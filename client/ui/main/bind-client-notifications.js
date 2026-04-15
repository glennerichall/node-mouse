export function bindClientNotifications(services, dom) {
  services.getNotifications().bindRoot(dom.notificationsRoot);
}
