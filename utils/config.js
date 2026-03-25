export const PORT = Number(process.env.PORT) || 3000;
export const MOUSE_SPEED = Number(process.env.MOUSE_SPEED) || 1.3;
export const SCROLL_SPEED = Number(process.env.SCROLL_SPEED) || 0.25;
export const HTTPS_ENABLED = String(process.env.HTTPS || '').toLowerCase() === 'true';
export const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '';
export const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '';
