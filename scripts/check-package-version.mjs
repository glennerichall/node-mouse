import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'));
}

const packageVersion = String(readJson('package.json').version || '');
const lockfile = readJson('package-lock.json');
const lockVersion = String(lockfile.version || '');
const rootPackageVersion = String(lockfile.packages?.['']?.version || '');

if (!packageVersion || packageVersion !== lockVersion || packageVersion !== rootPackageVersion) {
  console.error([
    'Versions npm désynchronisées.',
    `package.json: ${packageVersion || '(absente)'}`,
    `package-lock.json: ${lockVersion || '(absente)'}`,
    `package-lock.json packages[""]: ${rootPackageVersion || '(absente)'}`,
    'Appliquez la version avec npm version <major|minor|patch> --no-git-tag-version.',
  ].join('\n'));
  process.exitCode = 1;
}
