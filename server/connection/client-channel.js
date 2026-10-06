/**
 * Canal minimal utilisé par les souscriptions d'événements.
 *
 * Un adaptateur Socket.IO, WebRTC ou HTTP doit fournir ces trois opérations;
 * les guards et l'authentification restent dans la couche du transport.
 *
 * @typedef {Object} ClientChannel
 * @property {string} id Identifiant stable du client connecté.
 * @property {(eventName: string, handler: Function) => void} on
 * @property {(eventName: string, payload: unknown) => void} emit
 */

export function getClientId(channel) {
  return String(channel?.id ?? 'unknown');
}

export function getClientLabel(channel) {
  return getClientId(channel).slice(0, 8);
}
