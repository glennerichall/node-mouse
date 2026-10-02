# Plateformes — PLAT-004g — 2026-10-02
État: en cours

## Objectif et critères d'acceptation

Implanter `uinput` comme stratégie d'entrée Wayland par défaut sans supprimer
le travail RemoteDesktop/libei existant.

- Le chargement Wayland sélectionne `uinput` par défaut et `portal` sur demande.
- Le bridge uinput couvre mouvement relatif, boutons, molette et clavier.
- Le bridge C Node-API est chargé paresseusement dans le processus Node.js.
- L'installation n'accorde que `/dev/uinput` à un groupe dédié, jamais le
  groupe général `input` ni les périphériques physiques.
- Les erreurs de compilation, d'absence de périphérique et de permission sont
  actionnables.
- Les tests unitaires et la suite complète restent verts.

## Décisions et raisons

Le portail RemoteDesktop/EIS varie selon le backend du bureau. `uinput` fournit
une entrée virtuelle au niveau du noyau et couvre donc davantage de
compositeurs. En contrepartie, il contourne le consentement Wayland et exige une
autorisation système persistante. Cette autorisation sera limitée au seul
device node `/dev/uinput`; le contrôle d'accès applicatif demeure obligatoire.

L'adaptateur portal/libei est conservé comme stratégie optionnelle pour les
installations qui privilégient le consentement géré par le compositeur.

La frontière architecturale place le contrat et la sélection dans
`server/services/desktop`, mais le chargeur du bridge, les clients de processus
natifs, les chemins de binaires et la supervision Linux dans
`server/os/linux/wayland`.

Après revue, uinput utilise un addon Node-API plutôt qu'un child process: son
API est petite, synchrone et ne requiert aucune boucle d'événements. Le risque
de crash natif est accepté et réduit par la validation des arguments. Le
processus séparé demeure la frontière pour portal/libei et la future capture
PipeWire, qui ont un cycle de vie externe plus complexe.

## Modifications apportées

- Ajout d'un bridge C Node-API uinput couvrant mouvement relatif avec
  conservation des fractions, boutons, défilement et clavier.
- Ajout de `loadUInput()` et du chargeur natif; `loadWayland()` sélectionne
  désormais `uinput` par défaut ou `portal` avec
  `REMOTE_MOUSE_WAYLAND_INPUT=portal`.
- Extraction de l'ancien chargement dans `loadWaylandPortal()` sans supprimer
  le helper RemoteDesktop/libei existant.
- Placement du chargeur Node-API et du client du helper portal dans
  `server/os/linux/wayland`; la sélection et les adaptateurs du contrat restent
  dans `server/services/desktop/wayland`.
- Ajout des scripts de compilation et de configuration udev, d'un groupe dédié
  et des diagnostics `permission-denied`/`uinput-unavailable`.
- Mise à jour de l'installateur, de l'exemple de configuration et du README.
  Les dépendances libei/liboeffis ne sont demandées que pour la stratégie
  portal.
- Version mineure passée de `6.11.0` à `6.12.0` pour ce nouvel adaptateur.

## Vérifications et résultats

- Compilation `npm run build:uinput`: réussie avec `-Werror`.
- Tests ciblés initiaux: 35 tests réussis.
- Suite `npm test`: 80 suites et 280 tests réussis.
- Tests ciblés finaux après documentation/installateur: 5 suites et 14 tests
  réussis.
- Après séparation OS/services: 5 suites ciblées et 11 tests réussis, puis
  nouvelle exécution complète de 80 suites et 280 tests réussis.
- Bridge Node-API compilé en `.node`, chargé réellement par Node 22 et erreur
  d'absence de `/dev/uinput` convertie en capacité indisponible sans crash.
- Après remplacement du child process uinput: 7 suites ciblées et 31 tests,
  puis 80 suites complètes et 281 tests réussis.
- Sans device système, le helper retourne correctement
  `uinput-unavailable` avec une action corrective.

## Blocages / risques / suite

- La prévisualisation Wayland reste un chantier PipeWire distinct.
- L'appartenance au nouveau groupe peut nécessiter une nouvelle session après
  l'installation.
- La validation matérielle reste à effectuer: `/dev/uinput` est absent sur la
  machine courante et la tentative de configuration a été arrêtée parce que
  `sudo` exige un terminal d'authentification.
