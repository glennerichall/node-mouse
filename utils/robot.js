export async function loadRobot() {
  const robotModule = await import('@hurdlegroup/robotjs');
  return robotModule.default || robotModule;
}
