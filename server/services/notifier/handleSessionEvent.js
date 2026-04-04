import { notify } from './mapper/notify.js';
import {
  NOTIFIER_LEVEL_INFO,
  NOTIFIER_TARGET_ALL,
} from './createNotifierComposite.js';
import { PUBSUB_EVENT_SESSION_CREATED } from '../pubsub/serviceEventConstants.js';
import { NOTIFICATION_ID_SESSION_CREATED } from '../../../utils/shared/notificationSettings.js';
import { NOTIFICATION_TITLE_SESSION_CREATED } from './notificationTitles.js';

export function handleSessionEvent(notifier, event) {
  if (event.type !== PUBSUB_EVENT_SESSION_CREATED) {
    return;
  }

  notify(notifier, NOTIFIER_TARGET_ALL, {
    notificationId: NOTIFICATION_ID_SESSION_CREATED,
    level: NOTIFIER_LEVEL_INFO,
    title: NOTIFICATION_TITLE_SESSION_CREATED,
    titleKey: 'notification.sessionCreated.title',
    message: `Nouvelle connexion via jeton depuis ${event.payload?.address || 'adresse inconnue'}.`,
    messageKey: 'notification.sessionCreated.message',
    params: {
      address: event.payload?.address || 'unknown',
    },
    ttlMs: 2800,
  });
}
