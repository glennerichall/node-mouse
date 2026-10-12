# Plateformes — PLAT-004j — 2026-10-11

## Objectif

Corriger le réaffichage de l'overlay QR après que le pointeur a quitté sa zone
sous Wayland/XWayland.

## Diagnostic et décision

Les essais utilisateur ont montré que la sonde du helper ne réaffichait pas le
QR après la sortie du pointeur. Une première comparaison en coordonnées racine
a aussi retardé le masquage et n'a pas corrigé le retour. Sous Wayland, le
helper XWayland ne peut pas rester la source de vérité après démontage de sa
fenêtre. Le survol est donc confié à l'observateur existant: le contrôleur
initialise la position avec le bridge XWayland puis suit les mouvements uinput
reçus pendant le masquage. Le helper natif ne fait qu'afficher/masquer l'image.

Le démarrage de développement compilera automatiquement les composants Linux
natifs requis, notamment le helper d'overlay et le bridge de position utilisé
pour initialiser le suivi.

## Modifications

- `server/os/linux/overlay/createLinuxQrOverlayAdapter.js` et
  `server/services/overlay/createQrOverlay.js`: désactivation de l'auto-hide
  natif et réaffichage explicite lorsque l'observateur lève la suppression.
- `server/services/desktop/wayland/loadUInput.js`: chargement du bridge de
  position initiale pour le suivi applicatif.
- `scripts/build-dev-native.mjs` et `package.json`: compilation des natifs
  Linux avant `npm run dev`.
- Tests ciblés de la transition hover, du bridge et du cycle npm `predev`.

## Vérifications

- 6 suites ciblées: 29 tests réussis; le test d'intégration Xvfb est sauté.
- `npm run predev`: compilation réussie de uinput, du bridge de position
  XWayland et du helper d'overlay.
- `git diff --check`: réussi.

## Limitation

Xvfb n'est pas disponible dans l'environnement de travail et le nouveau cycle
doit être confirmé sur une session Wayland réelle. PLAT-004j reste ouverte
jusqu'à cette validation utilisateur.
