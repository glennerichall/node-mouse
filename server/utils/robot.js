export async function loadRobot() {
  try {
    const robotModule = await import('@hurdlegroup/robotjs');
    return robotModule.default || robotModule;
  } catch (error) {
    console.error('RobotJS n\'est pas disponible. Installez les dépendances natives puis relancez.');
    console.error(error.message);
    throw error;
  }
 
}
