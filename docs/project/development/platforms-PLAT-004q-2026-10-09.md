# Plateformes — PLAT-004q — 2026-10-09

## Objectif

Ne plus considérer un simple `stdin.write()` comme la preuve que le helper QR
a appliqué une commande; stabiliser également un `SHOW` lorsque le pointeur se
trouve déjà sous la fenêtre qui vient d'être remappée.

## Diagnostic et décision

Le client XWayland confirmait jusque-là `SHOW` dès que Node avait accepté la
commande dans son pipe. La fermeture du helper, une erreur X11 ou une
commande non traitée pouvaient donc laisser le service croire que le QR était
visible. Le test d'intégration était sauté dans l'environnement courant, ce
qui rendait les précédents tests insuffisants pour vérifier l'exécution native.

Le protocole IPC inclut maintenant un identifiant par commande et un ACK du
helper après exécution; l'absence d'ACK a un délai borné et ferme/remplace le
helper. Pour les événements X11, un `SHOW` qui mappe la fenêtre sous le pointeur
ignore l'événement d'entrée généré par ce mapping et reste visible jusqu'à la
sortie réelle du pointeur; une entrée ultérieure masquera de nouveau le QR.

## Modifications

- `native/wayland/remote-mouse-xwayland-overlay.c`: protocole de commandes
  numérotées/ACK, confirmation de `SHOW`, `HIDE`, `UPDATE`, `CLOSE` et
  protection de la transition de mapping contre l'auto-hide immédiat.
- `server/os/linux/overlay/createXWaylandOverlayClient.js`: attente des ACK,
  corrélation par identifiant, temporisation et fermeture si l'ACK manque.
- `server/os/linux/overlay/createLinuxQrOverlayAdapter.js` et
  `server/services/overlay/createQrOverlay.js`: attente des transitions
  acquittées avant de conclure l'opération.
- Tests du client IPC, des transitions overlay et test d'intégration sous
  `xvfb-run` conditionnel.
- Version du paquet portée à `6.19.72`.

## Vérifications

- `npm test -- --coverage=false`: 118 suites réussies, 414 tests réussis,
  1 test d'intégration XWayland sauté car `xvfb-run` n'est pas installé.
- Les tests ciblés couvrent ACK reçu, ACK perdu, timeout, refus et ordre des
  transitions.
- `npm run check:style`, `npm run check:version` et `git diff --check` passent.
- `npm run build:xwayland-overlay` échoue avant compilation parce que
  `X11/Xatom.h` manque dans l'environnement.

## État

Le protocole et sa logique JavaScript sont couverts, mais l'implémentation C et
le comportement visuel ne sont pas confirmés ici. PLAT-004q reste ouverte
jusqu'au test avec les dépendances X11/libpng sur Xvfb ou sur un bureau réel.
