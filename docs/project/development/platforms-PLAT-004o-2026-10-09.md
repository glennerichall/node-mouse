# Plateformes — PLAT-004o — 2026-10-09

## Objectif

Rendre fiable le réaffichage du QR lorsqu'il est temporairement masqué au
survol, et préserver l'ordre des commandes pendant une mise à jour de l'overlay.

## Diagnostic et décision

Le service conservait `visible = true` lorsque le helper XWayland signalait
`hover-hidden`. Une bascule pouvait donc envoyer `HIDE` au lieu de réafficher
le QR. Par ailleurs, `show()` attendait la génération du QR dans la file
d'opérations, mais envoyait `SHOW` après être sorti de cette file; un masquage
concurrent pouvait alors être envoyé avant ce `SHOW` et finir par laisser
l'overlay visible au lieu de le cacher.

La bascule consulte maintenant l'état de survol de l'adaptateur et force le
réaffichage si le QR est temporairement masqué. Les opérations `show`, `hide`
et `toggle` sont entièrement sérialisées, commandes d'adaptateur incluses.

## Modifications

- `server/services/overlay/createQrOverlay.js`: sérialisation complète des
  transitions et bascule informée de `hover-hidden`.
- `server/services/overlay/createNoopOverlay.js`: méthode `hide` asynchrone
  alignée sur le contrat du service.
- `test/unit/qr-overlay-adapters.test.js`: tests du réaffichage après survol et
  du masquage concurrent avec un rafraîchissement QR en cours.
- `client/i18n/locales/` et `public/index.html`: libellé « Basculer le QR » et
  traductions du libellé et de l'intitulé accessible dans les neuf langues.
- Version du paquet portée à `6.19.70`.

## Vérifications

- Les deux tests de régression échouaient avant la correction et passent après.
- `npm test -- --coverage=false`: 118 suites réussies, 409 tests réussis,
  1 test d'intégration XWayland sauté faute de `xvfb-run`.
- Les contrôles de style, de version et `git diff --check` passent.

## Suite

Le test visuel du helper XWayland sur un bureau réel reste requis pour clôturer
PLAT-004n; cette itération valide la logique de bascule et l'ordre des
transitions dans le service.
