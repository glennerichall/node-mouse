# Plateformes — PLAT-004p — 2026-10-09

## Objectif

Récupérer le réaffichage quand le processus helper existe encore dans le
service, mais que son canal de commandes est déjà fermé ou refuse une écriture.

## Diagnostic et décision

Le client XWayland renvoyait `false` si stdin n'était plus inscriptible, sans
passer son état à `closed`. L'adaptateur conservait donc le handle et ignorait
également un refus de `UPDATE`. Enfin, le service QR ignorait la valeur de
retour de `SHOW` et annonçait le QR visible même si l'envoi avait échoué.

La réparation détecte le canal non inscriptible comme fermé. Un refus de mise à
jour remplace le helper et un refus de `SHOW` déclenche un redémarrage suivi
d'une nouvelle tentative. Si cette seconde tentative échoue, le service ne
prétend plus que l'overlay est visible.

## Modifications

- `server/os/linux/overlay/createXWaylandOverlayClient.js`: transition à l'état
  fermé et arrêt du processus lorsque stdin n'est plus inscriptible.
- `server/os/linux/overlay/createLinuxQrOverlayAdapter.js`: remplacement d'un
  handle dont `UPDATE` est refusé.
- `server/services/overlay/createQrOverlay.js`: redémarrage et nouvelle
  tentative si `SHOW` est refusé.
- `test/unit/xwayland-overlay-client.test.js` et
  `test/unit/qr-overlay-adapters.test.js`: couverture des refus d'écriture et
  du redémarrage automatique.
- Version du paquet portée à `6.19.71`.

## Vérifications

- Les nouveaux tests ciblés échouaient avant le correctif puis passent.
- `npm test -- --coverage=false`: 118 suites réussies, 412 tests réussis,
  1 test d'intégration XWayland sauté faute de `xvfb-run`.
- `npm run check:style`, `npm run check:version` et `git diff --check` passent.

## Limitation

Le cycle doit encore être vérifié sur le poste où le problème est observé. Le
helper natif n'a pas pu être compilé ici, faute des en-têtes de développement
X11; PLAT-004n reste ouverte pour la validation système.
