# Plateformes — PLAT-004t — 2026-10-09

État: terminé

## Objectif

Empêcher la file de bascules QR de croître pendant qu'une transition attend
l'ACK du helper, et rendre la fermeture du helper indépendante de cette file.

## Diagnostic et décision

Le service sérialisait chaque `toggle` comme une opération distincte. Lorsque
le helper répondait lentement, les requêtes s'accumulaient puis s'exécutaient
une à une. Les bascules en attente sont maintenant coalescées par parité
pendant une transition: seule la visibilité finale demandée est appliquée.

L'arrêt attendait aussi la promesse de démarrage du QR et le client natif
attendait un ACK `CLOSE` avant d'envoyer SIGTERM. L'arrêt ne dépend plus de la
promesse de démarrage et ferme immédiatement le helper, ce qui résout aussi
les commandes en attente d'un ACK.

## Modifications

- `server/services/overlay/createQrOverlay.js`: coalescence des bascules en
  attente et neutralisation des opérations après fermeture.
- `server/os/linux/overlay/createXWaylandOverlayClient.js`: fermeture
  immédiate par SIGTERM, sans attendre l'ACK IPC.
- `server/application/shutdown.js`: fermeture QR immédiate sans attendre
  `startupQrOverlayPromise`.
- Tests anti-régression dans `qr-overlay-adapters.test.js`,
  `xwayland-overlay-client.test.js` et `server-shutdown.test.js`.
- Version du paquet portée à `6.19.75`.

## Vérifications

- 4 suites ciblées: 19 tests réussis; le test d'intégration Xvfb est sauté
  faute de `xvfb-run`.
- `npm run check:style`, `npm run check:version` et `git diff --check` réussis.

## Limitation

La cause du masquage QR lors d'un mouvement hors de la zone n'est pas encore
validée sur le poste concerné. La compilation du helper natif est bloquée ici
par l'absence de `X11/Xatom.h`; PLAT-004s reste ouverte jusqu'à compilation et
validation sur le bureau réel.
