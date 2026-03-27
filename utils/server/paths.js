import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, '../..');
export const publicDir = path.join(projectRoot, 'public');
export const clientDir = path.join(projectRoot, 'client');
export const sharedUtilsDir = path.join(projectRoot, 'utils', 'shared');
export const clientUtilsDir = path.join(projectRoot, 'utils', 'client');
