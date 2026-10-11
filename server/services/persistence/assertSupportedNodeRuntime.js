export const MINIMUM_NODE_VERSION = '22.14.0';

export function isSupportedNodeVersion(version) {
    const match = String(version).replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!match) return false;

    const [, majorText, minorText, patchText] = match;
    const [major, minor, patch] = [majorText, minorText, patchText].map(Number);
    return major > 22 || (major === 22 && (minor > 14 || (minor === 14 && patch >= 0)));
}

export function assertSupportedNodeRuntime(version = process.versions.node) {
    if (!isSupportedNodeVersion(version)) {
        throw new Error(
            `Node.js ${MINIMUM_NODE_VERSION} or newer is required by better-sqlite3 13 (Node-API 10); detected Node.js ${version}.`,
        );
    }
}
