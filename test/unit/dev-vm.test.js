import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '../..');
const vmCommand = path.join(repositoryRoot, 'dev/vm');

function runVm(...args) {
    return spawnSync('bash', [vmCommand, ...args], {
        cwd: repositoryRoot,
        encoding: 'utf8'
    });
}

describe('dev/vm', () => {
    test('documents the supported laboratory lifecycle', () => {
        const result = runVm('--help');

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('doctor');
        expect(result.stdout).toContain('create <machine>');
        expect(result.stdout).toContain('test <machine>');
        expect(result.stdout).toContain('destroy <machine>');
    });

    test('refuses destructive operations without an explicit machine', () => {
        const result = runVm('destroy');

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('destroy requires one machine name');
    });

    test('rejects unsafe machine names before invoking Vagrant', () => {
        const result = runVm('destroy', '../outside');

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('invalid machine name');
    });

    test('keeps local VM state and media out of Git', () => {
        const gitignore = fs.readFileSync(path.join(repositoryRoot, '.gitignore'), 'utf8');
        const npmignore = fs.readFileSync(path.join(repositoryRoot, '.npmignore'), 'utf8');

        expect(gitignore).toContain('dev/vagrant/.vagrant/');
        expect(gitignore).toContain('dev/vagrant/config.local.yml');
        expect(gitignore).toContain('dev/vagrant/images/');
        expect(gitignore).toContain('dev/vagrant/iso/');
        expect(gitignore).toContain('dev/vagrant/secrets/');
        expect(npmignore).toMatch(/^dev\/$/m);
    });

    test('verifies the official Vagrant package before installing it', () => {
        const installer = fs.readFileSync(
            path.join(repositoryRoot, 'dev/vagrant/install-host-ubuntu.sh'),
            'utf8'
        );

        expect(installer).toContain('releases.hashicorp.com/vagrant/');
        expect(installer).toContain('sha256sum --check --strict');
        expect(installer).toContain('vagrant plugin install vagrant-libvirt');
        expect(installer).not.toContain('sudo vagrant plugin install');
    });

    test('pins the Linux installation box and its libvirt profile', () => {
        const profiles = fs.readFileSync(
            path.join(repositoryRoot, 'dev/vagrant/profiles.yml'),
            'utf8'
        );

        expect(profiles).toContain('linux-install:');
        expect(profiles).toContain('box: cloud-image/ubuntu-24.04');
        expect(profiles).toMatch(/box_version: \d+\.\d+\.\d+/);
        expect(profiles).toContain('profile: linux-install');
    });

    test('does not pipe curl into grep -q in the guest integration test', () => {
        const guestTest = fs.readFileSync(
            path.join(repositoryRoot, 'dev/vagrant/guest-tests/linux-install-and-use.sh'),
            'utf8'
        );

        expect(guestTest).toContain('assert_http_contains()');
        expect(guestTest).toContain('body="$(curl --fail --silent --show-error "${url}")"');
        expect(guestTest).not.toMatch(/curl[^\n]*\|\s*grep\s+-[^\n]*q/);
    });
});
