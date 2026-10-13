import fs from 'node:fs';
import path from 'node:path';

describe('mouse tuning page', () => {
  it('exposes three distances with slow and fast measurements', () => {
    const html = fs.readFileSync(path.resolve('public/mouse-tuning.html'), 'utf8');
    expect(html).toContain('mouse-tuning-track-long');
    expect(html).toContain('mouse-tuning-track-medium');
    expect(html).toContain('mouse-tuning-track-short');
    expect((html.match(/data-distance="/g) || []).length).toBe(3);
    expect((html.match(/data-result-slow/g) || []).length).toBe(3);
    expect((html.match(/data-result-fast/g) || []).length).toBe(3);
    expect(html).toContain('/client/ui/mouse-tuning/page.js');
  });

  it('is reachable from the admin UI router', () => {
    const source = fs.readFileSync(path.resolve('server/init/routers/createAdminUiRouter.js'), 'utf8');
    expect(source).toContain(".get('/mouse-tuning'");
    expect(source).toContain("path.join(publicDir, 'mouse-tuning.html')");
  });

  it('is opened by the host action from the remote UI', () => {
    const preferences = fs.readFileSync(path.resolve('public/preferences.html'), 'utf8');
    const page = fs.readFileSync(path.resolve('client/ui/preferences/page.js'), 'utf8');
    expect(preferences).toContain('pointer-tuning-host');
    expect(page).toContain("fetch('/api/client/mouse-tuning/browser'");
    expect(fs.readFileSync(path.resolve('public/index.html'), 'utf8')).not.toContain('btn-open-mouse-tuning-browser-server');
  });

  it('keeps slow and fast preference controls independent', () => {
    const source = fs.readFileSync(path.resolve('client/ui/preferences/page.js'), 'utf8');
    expect(source).not.toContain('Math.max(slowSpeed, pointerState.get(APP_STATE_POINTER_FAST_SPEED))');
    expect(source).not.toContain('pointerState.set(APP_STATE_POINTER_FAST_SPEED, pointerSlowSpeed.value)');
    expect(source).not.toContain('pointerState.set(APP_STATE_POINTER_SLOW_SPEED, pointerFastSpeed.value)');
  });
});
