# Plateformes — PLAT-004g — correctif booléens bridge — 2026-10-02
État: terminé

## Objectif et critères d'acceptation

Empêcher les clics et frappes uinput de terminer le serveur avec
`UINPUT_INVALID_ARGUMENT`.

- Convertir les états pressé/relâché en nombres `1/0` à la frontière Node-API.
- Vérifier par test que clics et touches transmettent exclusivement des nombres.
- Rejouer les tests ciblés et la suite complète.

## Décisions et raisons

Le contrôleur de bureau manipule correctement un état booléen, tandis que le
bridge C déclare une ABI numérique. La conversion appartient à l'adaptateur du
bridge dans `loadUInput.js`, et non aux contrôleurs métier ni au code natif.

## Modifications apportées

- `loadUInput()` convertit maintenant les états booléens de boutons et touches
  en valeurs numériques `1/0` avant l'appel Node-API.
- Le test de l'adaptateur exerce un clic droit et une touche Entrée et vérifie
  les arguments exacts transmis au bridge.

## Vérifications et résultats

- Le test anti-régression échouait avant correction avec `true/false` au lieu de
  `1/0`, reproduisant la cause de `UINPUT_INVALID_ARGUMENT`.
- Tests ciblés: 3 suites et 8 tests réussis.
- `npm test`: 80 suites et 281 tests réussis.

## Blocages / risques / suite

Aucun blocage identifié.
