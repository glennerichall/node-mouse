# Plateformes — PLAT-006e — 2026-10-15

## Objectif

Rétablir l'activation d'une fenêtre Chrome existante sous Ubuntu 26.04 GNOME
Wayland après `remote-mouse update`, sans ouvrir une seconde fenêtre.

## Cause

Le service `systemd --user` ne transmettait pas explicitement les variables
qui permettent d'identifier le type de session et Mutter après son
redémarrage. Lorsque le compositeur était donc classé `unknown`, l'extension
GNOME n'était pas appelée. Le repli Wayland relançait ensuite la commande
Chrome alors que le processus existait déjà.

## Correction

- transmettre `XDG_SESSION_TYPE`, `XDG_CURRENT_DESKTOP` et `DESKTOP_SESSION` à
  l'unité utilisateur, en plus des variables d'affichage et D-Bus;
- conserver le repli existant vers la commande du navigateur lorsque son
  adaptateur de fenêtre n'a pas pu l'activer;
- couvrir la génération de l'unité et ce repli documenté par des tests
  unitaires.

## Vérifications

- `npm test -- --runInBand test/unit/linux-daemon-service.test.js test/unit/linux-app-resolution.test.js test/unit/wayland-window-focus.test.js` — 3 suites, 19 tests réussis;
- `git diff --check` — réussi;
- validation réelle de la session Mutter non exécutée dans cet environnement.
