# Plateformes — PLAT-006g — 2026-10-16

## Objectif

Renforcer les informations de diagnostic des intégrations VLC, navigateurs et
Samsung TV exposées par la page d'information serveur.

## Modifications

- conserver les champs `browsers` et `vlc.available` existants;
- ajouter `vlc.status` et `integrations.vlc.status` avec les états
  `available` ou `unavailable`;
- ajouter `integrations.browsers` avec l'état `available` ou `none-detected` et
  la liste réduite des navigateurs détectés;
- ajouter `integrations.samsungTv` avec l'activation et l'état `disabled`,
  `unavailable`, `on`, `off` ou `unknown`;
- absorber les erreurs de vérification Samsung afin que le rapport complet
  reste disponible.

La liste de diagnostic ne contient que les identifiants et noms de navigateurs;
aucun secret, hôte ou adresse MAC Samsung n'est ajouté au rapport.

## Vérifications

- test ciblé `test/unit/system.service.test.js` : 3 tests réussis;
- suite complète `npm test` : 136 suites, 524 tests réussis et 2 tests ignorés;
- `npm run check:version` réussi;
- `git diff --check` réussi.

## Version et suite

La version corrective passe de `6.20.2` à `6.20.3`. Les validations réelles
avec VLC et une TV Samsung restent dépendantes des équipements disponibles;
les états réseau non concluants sont explicitement représentés par
`unavailable` ou `unknown`.

Message de commit suggéré:

`feat(plat): expose integration diagnostics`
