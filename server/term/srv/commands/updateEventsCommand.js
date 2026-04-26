export async function executeUpdateEventsCommand(services) {
  return {
    ok: true,
    message: 'Evenements update-manager.',
    data: services.getPersistence().updateEventLogDao.listRecentEvents(50),
  };
}
