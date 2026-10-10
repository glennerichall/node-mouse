export async function loadRobotJS() {
    const robotJSModule = await import('robotjs');
    return robotJSModule.default || robotJSModule;
}
