/**
 * Canal minimal utilisé par les souscriptions d'événements.
 *
 * Un adaptateur Socket.IO, WebRTC ou HTTP doit fournir ces trois opérations;
 * les guards et l'authentification restent dans la couche du transport.
 *
 * @typedef {Object} ClientChannel
 * @property {string} id Identifiant stable du client connecté.
 * @property {(eventName: string, callback: Function, ...callbacks: Function[]) => ClientChannel} on
 * @property {(eventName: string, payload: unknown) => ClientChannel} emit
 */

export function getClientId(channel) {
  return String(channel?.id ?? 'unknown');
}

export function getClientLabel(channel) {
  return getClientId(channel).slice(0, 8);
}
