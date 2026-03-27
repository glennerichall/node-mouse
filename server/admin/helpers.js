export { commandExists, execShell } from '../../utils/server/process.js';

export function truncateText(value, max = 220) {
  const text = String(value || '').trim();
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
}
