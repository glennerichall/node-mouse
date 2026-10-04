# Plateformes — PLAT-004l — 2026-10-03
État: en cours — implantation terminée, validation terrain requise

## Objectif et critères d'acceptation

Remplacer l'overlay QR YAD par un helper X11/XWayland isolé qui possède sa
fenêtre et ses événements de survol, sans dépendre d'une position globale du
pointeur. La zone doit redevenir cliquable pendant le masquage et l'échec du
helper ne doit pas arrêter le serveur.

## Décisions et raisons

Le survol appartient au processus qui possède la fenêtre. Le helper reçoit le
PNG généré par Node et les commandes minimales `SHOW`, `HIDE`, `UPDATE` et
`CLOSE`. Lors d'une entrée du pointeur, il retire sa fenêtre; après le délai
configuré, il la remappe brièvement et transparente afin d'interroger seulement
ses coordonnées locales. Il reste retiré si le pointeur occupe encore la zone,
sinon il réaffiche le QR.

Cette sonde évite le suivi global du pointeur, les deltas reconstruits depuis
uinput et la boucle YAD de destruction/recréation. L'interception potentielle
est limitée à la durée d'un remappage synchronisé, puis la fenêtre est aussitôt
retirée lorsque le pointeur demeure dans la zone.

## Modifications apportées

- Ajout du helper C `remote-mouse-xwayland-overlay`, fondé sur Xlib et libpng.
- Ajout d'un client Node qui supervise le processus et son protocole texte.
- Remplacement de YAD par le helper natif pour tous les environnements Linux.
- Désactivation du polling de survol applicatif lorsque le helper possède les
  événements locaux.
- Suppression du code YAD, du contrôleur de visibilité XWayland devenu mort et
  de la dépendance système YAD.
- Compilation automatique au `postinstall` lorsque les en-têtes sont présents;
  diagnostic actionnable dans le cas contraire.
- Correction de la dépendance Debian/Ubuntu de `libpng++-dev` vers
  `libpng-dev` et passage de version mineure de `6.17.4` à `6.18.0`.

## Vérifications et résultats

- Compilation C réussie avec `-Wall -Wextra -Werror` contre Xlib et libpng.
- Tests ciblés du protocole, de la délégation du survol, de la géométrie et de
  l'installateur: 4 suites et 16 tests réussis.
- Suite complète finale: 88 suites et 316 tests réussis.
- Le paquet npm à sec contient le source natif, le script de compilation et les
  nouveaux modules serveur.
- Validation opérateur réussie sous Ubuntu 26.04 Wayland/XWayland: l'overlay QR
  s'affiche et son comportement de survol fonctionne avec le helper natif.

## Blocages / risques / suite

La session d'exécution des outils ne transmet pas de `DISPLAY` X11/XWayland;
son lancement direct s'arrête donc proprement avec `Cannot open X11/XWayland
display`. La validation réelle Wayland/XWayland a ensuite été confirmée par
l'opérateur. Il reste à rejouer le parcours sous une vraie session X11 avant de
clôturer l'itération et de cocher `PLAT-004l`.
