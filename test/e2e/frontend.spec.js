import {expect, test} from '@playwright/test';

test('main remote page loads and connects to the websocket', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/');

  await expect(page).toHaveTitle(/Remote Mouse/i);
  await expect(page.locator('#browser-shortcuts .remote-panel-title')).toContainText(/Navigateur|Browser/i);
  await expect(page.locator('#touchpad')).toBeVisible();
  await expect(page.locator('#connection-overlay')).toHaveClass(/hidden/);
});

test('main remote accordion expands one visible panel at a time', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/');

  const browserToggle = page.locator('#browser-shortcuts .remote-panel-toggle');
  const browserContent = page.locator('#browser-shortcuts .remote-panel-content');
  const systemToggle = page.locator('#system-controls .remote-panel-toggle');
  const systemContent = page.locator('#system-controls .remote-panel-content');

  await expect(browserToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(systemToggle).toHaveAttribute('aria-expanded', 'false');

  await systemToggle.click();

  await expect(browserToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(browserContent).toHaveClass(/is-collapsed/);
  await expect(systemToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(systemContent).not.toHaveClass(/is-collapsed/);

  await systemToggle.click();

  await expect(systemToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(systemContent).toHaveClass(/is-collapsed/);
});

test('preferences page renders app state driven controls', async ({page}) => {
  await page.goto('/ui/admin/preferences');

  await expect(page.getByRole('heading', {name: /Preferences locales|Local preferences/i})).toBeVisible();
  await expect(page.locator('[data-theme-switcher]')).toBeVisible();
  await expect(page.locator('[data-language-switcher]')).toBeVisible();
  await expect(page.locator('#preferences-remotes')).toContainText(/Navigateur|Browser/);
  await expect(page.locator('#preferences-remotes')).toContainText(/Clavier|Keyboard/);
});

test('preferences persist theme and locale through AppState', async ({page}) => {
  await page.goto('/ui/admin/preferences');

  await page.locator('[data-theme-select]').selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('remote-mouse.theme'))).toBe('light');

  await page.locator('[data-language-select]').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', {name: 'Local preferences'})).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('remote-mouse.locale'))).toBe('en');

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', {name: 'Local preferences'})).toBeVisible();
});

test('local remote visibility preference affects the main page', async ({page}) => {
  await page.goto('/ui/admin/preferences');

  const browserRow = page.locator('#preferences-remotes .preferences-remote-row').filter({
    hasText: /Navigateur|Browser/,
  });
  await browserRow.locator('select').selectOption('false');
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('remote-mouse.remote-visibility') || '{}').browser)).toBe(false);

  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/');

  await expect(page.locator('#browser-shortcuts')).toBeHidden();
  await expect(page.locator('#touchpad')).toBeVisible();
});

test('admin config page renders editable server configuration', async ({page}) => {
  await page.goto('/ui/admin/config');

  await expect(page.getByRole('heading', {name: /Configuration persistante|Persistent configuration/i})).toBeVisible();
  await expect(page.locator('#config-status')).toContainText(/Configuration chargee|Configuration loaded/i);
  await expect(page.locator('#config-form')).toContainText('input.mouseSpeed');
  await expect(page.locator('#config-form')).toContainText('browser.enabled');
});

test('admin config sections can be expanded and collapsed', async ({page}) => {
  await page.goto('/ui/admin/config');

  const inputSection = page.locator('#config-form .config-section').filter({
    hasText: 'input.mouseSpeed',
  });
  const toggle = inputSection.locator('.section-toggle');
  const firstFieldPath = inputSection.locator('.field-path').first();

  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(firstFieldPath).toBeHidden();

  await toggle.click();

  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(firstFieldPath).toBeVisible();

  await toggle.click();

  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(firstFieldPath).toBeHidden();
});

test('admin config updates automatically when server config changes', async ({page}) => {
  const subscriptionResponse = page.waitForResponse((response) => (
    response.url().includes('/api/admin/subs/configs') && response.request().method() === 'POST'
  ));
  await page.goto('/ui/admin/config');
  await subscriptionResponse;
  await expect(page.locator('#config-status')).toContainText(/Configuration chargee|Configuration loaded/i);

  const inputSection = page.locator('#config-form .config-section').filter({
    hasText: 'input.mouseSpeed',
  });
  const toggle = inputSection.locator('.section-toggle');
  const mouseSpeedInput = page.locator('input[name="input.mouseSpeed"]');
  const currentResponse = await page.request.get('/api/admin/configs/input.mouseSpeed');
  const currentPayload = await currentResponse.json();
  const previousValue = Number(currentPayload.config?.value);
  const nextValue = previousValue === 1.7 ? 1.3 : 1.7;

  if (await toggle.getAttribute('aria-expanded') === 'false') {
    await toggle.click();
  }
  await expect(mouseSpeedInput).toBeVisible();
  await expect(mouseSpeedInput).toHaveValue(String(previousValue));

  const patchResponse = await page.request.patch('/api/admin/configs/input.mouseSpeed', {
    data: {value: nextValue},
  });
  expect(patchResponse.ok()).toBe(true);

  await expect(mouseSpeedInput).toHaveValue(String(nextValue));

  const restoreResponse = await page.request.patch('/api/admin/configs/input.mouseSpeed', {
    data: {value: previousValue},
  });
  expect(restoreResponse.ok()).toBe(true);
});

test('server info page renders capabilities, applications and remotes', async ({page}) => {
  await page.goto('/ui/admin/server-info');

  await expect(page.getByRole('heading', {name: /Server Info|Infos serveur|Info serveur/i})).toBeVisible();
  await expect(page.locator('#version')).toContainText(/Version:/);
  await expect(page.locator('#capabilities')).toContainText(/Applications/);
  await expect(page.locator('#capabilities')).toContainText(/Remotes disponibles|Available remotes/);
  await expect(page.locator('#capabilities')).toContainText(/Toutes les remotes|All remotes/);
});
