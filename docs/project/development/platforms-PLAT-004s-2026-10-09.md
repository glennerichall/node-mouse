# Plateformes — PLAT-004s — 2026-10-09

État: implantation en attente de validation native

## Objectif

Empêcher le helper QR X11/XWayland de masquer l'overlay lors d'un mouvement
qui ne survole pas réellement la fenêtre QR.

## Diagnostic et décision

Le helper masquait l'overlay pour chaque `EnterNotify` admissible, sans vérifier
la position effective du pointeur. Il vérifie maintenant que le pointeur est
dans les limites de la fenêtre avant d'interpréter l'événement comme un
survol. Les événements parasites hors fenêtre ne devraient ainsi plus faire
disparaître le QR.

## Modifications

- `native/wayland/remote-mouse-xwayland-overlay.c`: vérification de la position
  réelle avant le masquage sur `EnterNotify`.
- `test/unit/xwayland-overlay-ipc.test.js`: test ciblé protégeant cette
  condition.
- Version du paquet portée à `6.19.74`.

## Vérifications

- Test ciblé: 3 tests réussis; le test d'intégration Xvfb est sauté car
  `xvfb-run` n'est pas disponible.
- `npm run check:style`: réussi.
- Compilation native non vérifiable dans cet environnement: les en-têtes de
  développement X11 (`X11/Xatom.h`) sont absents.

## Suite

L'itération reste ouverte jusqu'à compilation du helper et validation sur le
bureau concerné, en vérifiant que le QR reste visible lorsque le pointeur se
déplace hors de sa zone et qu'il ne se masque que lors d'un survol réel.
