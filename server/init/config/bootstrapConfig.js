import {
    loadEnvFile,
    readString,
    resolveConfigDir,
    resolveEnvFilePath
} from "../../utils/env.js";

import {fileURLToPath} from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const projectRoot = path.join(__dirname, '../..');
export const packageJsonPath = path.join(projectRoot, 'package.json');

export const bootstrapConfigDir = resolveConfigDir(process.env.CONFIG_DIR || '');

export const envFilePath = resolveEnvFilePath({
    appRoot: projectRoot,
    configDir: bootstrapConfigDir,
    explicitEnvFilePath: process.env.ENV_FILE_PATH || '',
});

loadEnvFile(envFilePath);

export const CONFIG_DIR = resolveConfigDir(readString('CONFIG_DIR', bootstrapConfigDir));

export function readPackageJson() {
    try {
        const raw = fs.readFileSync(packageJsonPath, 'utf8');
        return JSON.parse(raw);
    } catch (_error) {
        return {};
    }
}

export const packageJson = readPackageJson();
