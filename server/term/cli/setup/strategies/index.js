export async function createSetupStrategy(platform, options) {
    if (platform === 'linux') {
        const {createLinuxSetupStrategy} = await import('./linux.js');
        return createLinuxSetupStrategy(options);
    }
    if (platform === 'win32') {
        const {createWindowsSetupStrategy} = await import('./windows.js');
        return createWindowsSetupStrategy(options);
    }
    return null;
}
