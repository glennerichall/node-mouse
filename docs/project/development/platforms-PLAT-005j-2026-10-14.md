# Plateformes — PLAT-005j — 2026-10-14

## Objectif

Préparer automatiquement l'accès uinput requis par le serveur de
développement lorsqu'il est lancé depuis une session Wayland.

## Décision et modifications

- `dev/setup-linux.sh` détecte `XDG_SESSION_TYPE=wayland`.
- Lorsque la règle udev, l'appartenance au groupe dédié ou `/dev/uinput` manque,
  le script appelle `scripts/configure-uinput-access.sh` avec l'utilisateur
  courant via `sudo`.
- Une session X11 ne déclenche aucune configuration uinput privilégiée.
- Le mode `--check` signale l'état uinput et échoue si l'accès Wayland n'est pas
  prêt.
- Le README précise la reconnexion nécessaire après la création du groupe.

## Vérifications

- `bash -n dev/setup-linux.sh` : réussi.
- Tests ciblés : 4 suites réussies, 21 tests réussis.
- `git diff --check` : réussi.

## Limite

Après la première configuration, l'utilisateur doit fermer puis rouvrir sa
session graphique pour que l'appartenance au groupe `remote-mouse-uinput` soit
prise en compte par `npm run dev`.
