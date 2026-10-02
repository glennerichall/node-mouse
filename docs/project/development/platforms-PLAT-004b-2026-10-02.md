# Plateformes — PLAT-004b — 2026-10-02

État: en cours

## Objectif et critères d'acceptation

Commencer l'extraction des accès au bureau derrière un contrat indépendant de
RobotJS, sans régression sur les plateformes actuellement prises en charge.

- Les services métier obtiennent le bureau par `getDesktopController()`.
- Le nom `loadRobotJS()` est réservé au chargement dynamique de la bibliothèque
  RobotJS.
- RobotJS est encapsulé par un adaptateur explicite et n'est plus exposé par le
  conteneur sous le nom `getRobot()`.
- La suite de tests existante reste verte.

## Décisions et raisons

Le nom historique `getRobot()` ne doit pas changer silencieusement de
sémantique lorsque Wayland sera ajouté. `DesktopController` devient la frontière
stable; les chargeurs `loadRobotJS()` et, ultérieurement, `loadWayland()` restent
des détails de sélection de plateforme.

Les bibliothèques natives ne seront pas toutes chargées au démarrage. Le
chargeur du contrôleur choisira un seul adaptateur, puis importera uniquement
son implémentation. Pour l'instant, RobotJS demeure le seul adaptateur concret;
aucun faux adaptateur Wayland n'est ajouté avant le spike `PLAT-004c`.

## Modifications apportées

- Ajout de `loadRobotJS()`, `loadDesktopController()` et de l'adaptateur
  `createRobotJSDesktopController()`.
- Remplacement de `getRobot()` par `getDesktopController()` dans les entrées,
  les informations d'écran, la prévisualisation et l'observateur du QR.
- Migration des doubles de tests vers la nouvelle façade.
- Renommage des variables métier `robot` en `desktopController`; le nom RobotJS
  ne subsiste que dans l'adaptateur et son chargeur.
- Ajout d'un test de contrat vérifiant le chargement et la délégation RobotJS.

## Vérifications et résultats

- Tests ciblés: 6 suites et 22 tests réussis.
- `npm test`: 74 suites et 259 tests réussis.

## Blocages / risques / suite

`PLAT-004b` n'est pas terminé. Il reste à stabiliser un contrat exprimé en
capacités, sélectionner l'adaptateur selon la session graphique et ajouter les
tests de contrat simulant les capacités disponibles. `loadWayland()` sera créé
avec l'adaptateur réel afin de ne pas introduire un chargeur inutilisable.
