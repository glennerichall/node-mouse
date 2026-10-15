# Plateformes — PLAT-004g — 2026-10-15
État: terminé

## Objet de cette clôture

Réconcilier l’axe avec l’implémentation uinput déjà livrée et vérifier ses
critères sans refaire une modification fonctionnelle.

## Vérifications

- `loadWayland()` sélectionne uinput par défaut et conserve `portal` comme
  stratégie explicite.
- Le bridge couvre mouvement relatif, boutons, molette et clavier, avec des
  périphériques virtuels souris et clavier séparés par PLAT-004g2.
- Le bridge Node-API est chargé paresseusement et les erreurs d’absence ou de
  permission sont converties en capacités indisponibles actionnables.
- La configuration documentée limite l’accès au device `/dev/uinput` via le
  groupe dédié.
- `npm run build:uinput` réussit.
- Tests ciblés: 4 suites et 14 tests réussis.
- Suite complète: 136 suites, 523 tests réussis et 1 test ignoré.
- `npm run check:version` réussit.

La validation avec un device `/dev/uinput` réel reste hors de l’environnement
actuel, conformément au journal initial. Aucun workflow de machine virtuelle
n’a été exécuté.

## Version et commit

Aucun fichier du paquet n’a été modifié pendant cette réconciliation; la
version reste `6.20.2`, conformément à la politique SemVer pour une clôture
documentaire.

Message de commit suggéré:

`docs(roadmap): close PLAT-004g uinput support`
