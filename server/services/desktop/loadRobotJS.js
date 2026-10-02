export async function loadRobotJS() {
    const robotJSModule = await import('@hurdlegroup/robotjs');
    return robotJSModule.default || robotJSModule;
}
