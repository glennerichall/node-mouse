# Plateformes — PLAT-001i — 2026-10-12

## Problème et cause

Le helper QR local avait été recompilé avec le protocole IPC à quatre
arguments, mais le résolveur choisissait d'abord un ancien prébuild x64 du
checkout. Celui-ci attendait encore six arguments (`SHOW_DELAY_MS` et
`AUTO_HIDE`) et quittait immédiatement au lancement; aucun overlay ne pouvait
donc apparaître.

## Modifications

- `npm run dev` utilise maintenant un point d'entrée qui demande explicitement
  au résolveur les artefacts natifs compilés depuis le checkout.
- Le résolveur continue de préférer le prébuild compatible par défaut, pour ne
  pas changer le comportement des installations et des publications.
- Ajout d'un test couvrant le cas où un prébuild et un build local existent en
  même temps, ainsi que la commande de développement.

## Vérifications

- `npm run build:xwayland-overlay` : réussi.
- Résolveur en mode développement : pointe vers
  `build/wayland/remote-mouse-xwayland-overlay`.
- Le prébuild stale local confirme l'ancien protocole à six arguments.
- Tests ciblés : 5 suites réussies, 25 tests réussis, 1 test ignoré faute de
  serveur X virtuel.
- `git diff --check` : réussi.

## Limite

La visibilité finale doit encore être confirmée en lançant `npm run dev` dans
la session graphique concernée. Cette correction vise le décalage entre le
helper compilé et le helper effectivement lancé; elle n'ajoute pas un overlay
Wayland natif.
