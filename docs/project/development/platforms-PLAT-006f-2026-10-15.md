# Plateformes — PLAT-006f — 2026-10-15

## Objectif

Réactiver automatiquement l'extension GNOME de focus après une mise à jour de
Remote Mouse, même si elle est déjà installée mais désactivée.

## Correction

Le `postinstall` Linux déclenche désormais une migration uniquement lorsque
l'installation est lancée par le daemon (`REMOTE_MOUSE_DAEMON=1`) dans une
session GNOME Wayland. La migration fabrique et installe le bundle courant,
vérifie son enregistrement, puis appelle `gnome-extensions enable`. Une
impossibilité est journalisée et ne bloque pas l'installation du paquet.

Le parcours `remote-mouse setup` reste inchangé.

## Vérifications

- Tests ciblés — 4 suites, 18 tests réussis;
- `node --check scripts/configure-gnome-focus-after-update.mjs` — réussi;
- `node --check scripts/postinstall-linux.mjs` — réussi;
- `git diff --check` — réussi.

