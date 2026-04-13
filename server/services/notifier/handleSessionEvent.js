import { notify } from './mapper/notify.js';
import {
  NOTIFIER_LEVEL_INFO,
  NOTIFIER_TARGET_ALL,
} from './createNotifierComposite.js';
import { PUBSUB_EVENT_SESSION_CREATED } from '../pubsub/serviceEventConstants.js';
import { NOTIFICATION_ID_SESSION_CREATED } from '../../../utils/notificationSettings.js';

export function handleSessionEvent(notifier, event) {
  if (event.type !== PUBSUB_EVENT_SESSION_CREATED) {
    return;
  }

  notify(notifier, NOTIFIER_TARGET_ALL, {
    notificationId: NOTIFICATION_ID_SESSION_CREATED,
    level: NOTIFIER_LEVEL_INFO,
    titleKey: 'notification.sessionCreated.title',
    messageKey: 'notification.sessionCreated.message',
    params: {
      address: event.payload?.address || 'unknown',
    },
    ttlMs: 2800,
  });
}
