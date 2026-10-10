# Plateformes — PLAT-004r — 2026-10-09

## Objectif

Éviter une boucle CPU active du helper QR lorsque le pointeur reste sur la
zone masquée, et empêcher l'attente de son ACK initial de retarder la mise en
service HTTP.

## Diagnostic et décision

Après le délai de masquage, `probe_hover()` remappait temporairement l'overlay
et le trouvait encore sous le pointeur. Il le démapait sans réinitialiser
`hidden_at_ms`; la prochaine échéance de `poll()` restait donc à zéro et la
boucle reprobe pouvait monopoliser un cœur continuellement. Le délai est
maintenant relancé quand le pointeur est toujours présent et l'attente est
bornée à 100 ms, y compris avec un délai configuré à zéro.

Le serveur attendait aussi `qrOverlay.show()` avant de démarrer ses autres
services de démarrage. Depuis l'ajout des ACK, cela rendait l'overlay non
essentiel critique pour la durée du démarrage. Sa promesse est maintenant
suivie en arrière-plan; l'arrêt propre l'attend avant de fermer l'overlay.

## Modifications

- `native/wayland/remote-mouse-xwayland-overlay.c`: relance du délai après un
  probe qui trouve encore le pointeur dans la fenêtre et attente périodique
  bornée plutôt qu'un `poll(..., 0)` permanent.
- `server/application/start.js` et `server/application/state.js`: attente ACK
  du démarrage QR en arrière-plan, erreur journalisée sans bloquer le serveur.
- `server/application/shutdown.js`: attente de la tentative de démarrage avant
  la fermeture de l'overlay.
- `test/unit/xwayland-overlay-ipc.test.js` et
  `test/unit/server-startup-token.test.js`: assertions sur le backoff et le
  démarrage HTTP non bloquant.
- Version du paquet portée à `6.19.73`.

## Vérifications

- Les nouveaux tests échouaient avant la correction et passent après.
- `npm test -- --coverage=false`: 118 suites réussies, 415 tests réussis,
  1 test d'intégration XWayland sauté.
- Contrôles de style et de version réussis.

## Limitation

Le test XWayland reste sauté faute de `xvfb-run`; le helper natif ne compile pas
dans l'environnement faute de `X11/Xatom.h`. La réduction de charge doit être
confirmée sur le poste concerné après compilation/déploiement de `6.19.73`.
