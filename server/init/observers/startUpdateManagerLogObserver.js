import {PUBSUB_SERVICE_UPDATE_MANAGER} from '../../services/pubsub/serviceEventConstants.js';

export function startUpdateManagerLogObserver(services) {
  return services.getPubSub().subscribe((event) => {
    services.getPersistence().updateEventLogDao.createEvent(event);
  }, {
    service: PUBSUB_SERVICE_UPDATE_MANAGER,
  });
}
