# Plateformes — PLAT-004n — 2026-10-09

## Objectif

Permettre de masquer puis de réafficher le QR X11/XWayland avec la commande
d'administration, sans redémarrer le service.

## Diagnostic et décision

Le helper natif attend `poll()` sur stdin puis lit la commande avec `getline()`.
La bibliothèque stdio peut lire à l'avance plusieurs lignes dans son tampon;
après le traitement de la première, `poll()` ne détecte pas la seconde, qui
reste alors dans le tampon utilisateur. Une paire rapide `HIDE`/`SHOW` ou
`UPDATE`/`SHOW` peut donc laisser l'overlay masqué malgré la commande suivante.

Le helper garde maintenant stdin non tamponné avec `setvbuf(..., _IONBF, ...)`.
Cela conserve `poll()` comme mécanisme d'attente sans laisser de commande
supplémentaire cachée dans le tampon stdio.

## Modifications

- `native/wayland/remote-mouse-xwayland-overlay.c`: désactivation du read-ahead
  stdio avant l'utilisation de `poll()` et `getline()`.
- `test/unit/xwayland-overlay-ipc.test.js`: test anti-régression du contrat
  non tamponné et test d'intégration du cycle `HIDE`/`SHOW` sous `xvfb-run`
  lorsque l'environnement le permet.
- Version du paquet portée de `6.19.68` à `6.19.69`.

## Vérifications

- Le test anti-régression a été exécuté sans la correction et a échoué, puis a
  réussi après son rétablissement.
- `npm test -- --coverage=false`: 118 suites réussies, 407 tests réussis,
  1 test d'intégration sauté.
- `npm run check:style`, `npm run check:version` et `git diff --check` passent.
- Le test d'intégration XWayland a été sauté car `xvfb-run` n'est pas installé.
- `npm run build:xwayland-overlay` ne peut pas compiler dans cet environnement:
  l'en-tête `X11/Xatom.h` manque. La compilation et le cycle visuel doivent être
  validés sur un hôte avec les dépendances X11/libpng.

## État et suite

Le correctif est implanté et les tests JavaScript sont verts. PLAT-004n reste
ouverte jusqu'à l'exécution du test d'intégration et à la validation du helper
sur un environnement disposant de Xvfb et des en-têtes natifs requis.
