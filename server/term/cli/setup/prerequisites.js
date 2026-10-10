export function validateSetupPrerequisites({platform, nodeVersion, strategy}) {
    const major = Number.parseInt(String(nodeVersion).replace(/^v/, '').split('.')[0], 10);
    if (!Number.isFinite(major) || major < 20) {
        return `Node.js 20 or newer is required (detected version: ${nodeVersion}).`;
    }
    if (!strategy) {
        return `Setup currently supports Linux and Windows, not ${platform}.`;
    }
    return '';
}
