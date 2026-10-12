# Plateformes — PLAT-004j — 2026-10-12

## Objectif

Retirer le suivi de la souris servant au masquage automatique du QR sur les
plateformes prises en charge, tout en conservant son contrôle explicite Toggle.

## Décisions et modifications

- Le QR ne se masque plus au survol et reste affiché jusqu'à `hide`, Toggle QR
  ou désactivation de configuration.
- Retrait de l'observateur Node de survol, des transitions hover dans le helper
  natif X11/XWayland et des options d'auto-hide dans la configuration et l'UI.
- Retrait du lecteur de position XWayland qui avait été introduit pour suivre
  le pointeur physique; uinput conserve uniquement sa position synthétique,
  calculée depuis les commandes reçues par Remote Mouse.
- Suppression du bridge natif de position XWayland de la compilation de
  développement, de l'installation et des artefacts npm.
- Conservation des API de position RobotJS utilisées par le contrôle et les
  aperçus existants sous X11/Windows; elles ne pilotent plus la visibilité QR.

## Vérifications

- Tests ciblés : 12 suites réussies, 60 tests réussis, un test Xvfb sauté car le
  serveur X virtuel n'est pas disponible.
- `npm run predev` : compilation uinput et helper X11/XWayland réussie; aucun
  bridge de suivi XWayland n'est compilé.
- Toutes les suites unitaires : 126 suites réussies, 482 tests réussis; cinq
  suites DAO n'ont pas démarré car l'environnement fournit Node 22.12.0 alors
  que le projet requiert Node 22.14.0.
- `git diff --check` : réussi.

## Limites

La validation d'affichage reste automatisée côté contrat et compilation; aucune
session X11, Wayland ou Windows interactive n'a été exercée dans cette passe.
Le helper X11/XWayland reste un overlay qui intercepte sa propre zone visible;
le bouton Toggle permet de le masquer explicitement.
