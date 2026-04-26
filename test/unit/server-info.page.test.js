import fs from 'node:fs';
import path from 'node:path';

describe('server-info page', () => {
  it('uses polling without config SSE subscriptions', () => {
    const html = fs.readFileSync(path.resolve('public/server-info.html'), 'utf8');

    expect(html).toContain('setInterval(refresh, 2000);');
    expect(html).not.toContain('new EventSource(');
    expect(html).not.toContain('/api/admin/subs/configs');
    expect(html).not.toContain('unsubscribeFromConfigEvents');
  });
});
