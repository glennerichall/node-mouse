---
name: roadmap-driven-development
description: Pilote toute implémentation, correction ou refactorisation du projet à partir de la vision, de la roadmap globale et de l'axe propriétaire; conserve les décisions et l'historique des itérations réalisées.
---

# Développement piloté par la roadmap

Utiliser ce skill avant tout changement de code dans ce dépôt, y compris bugfix,
refactorisation, sécurité, API, interface, tests et intégration système.

## Sources canoniques

- Vision/intention: `docs/project/VISION.md`
- Ordre des axes et Definition of Done commune: `docs/project/ROADMAP.md`
- Périmètre, tâches, cases à cocher et critères:
  `docs/project/axes/<ordinal>-<code>-<nom>.md`
- Décisions et historique des travaux réalisés:
  `docs/project/development/README.md` et les journaux clôturés de l'axe

## Séquence obligatoire

1. Lire ces sources et examiner l'état Git ainsi que le code concerné.
2. Rattacher le travail à un identifiant et à des critères testables dans l'axe
   propriétaire. Si aucun item adapté n'existe, l'ajouter au document d'axe
   avant le code. Les cases à cocher n'apparaissent que dans les axes; ne pas
   recopier la tâche dans la roadmap globale ou dans un journal planifié.
   Quand l'utilisateur a demandé l'implémentation, planification et code peuvent
   être livrés dans le même changement, mais la planification doit précéder la
   modification du code.
3. Vérifier dépendances, ordre des tâches et décisions déjà consignées. Demander
   une décision utilisateur si le changement contredit la vision ou impose une
   réorientation importante.
4. Implémenter et vérifier les critères d'acceptation; ne pas cocher une tâche
   avant que les vérifications correspondantes aient réussi.
5. Cocher la tâche dans l'axe seulement après vérification, puis créer un journal
   daté avec objectif, décisions et raisons, modifications, tests/résultats,
   blocages et suite. Mettre à jour la roadmap globale uniquement si l'ordre ou
   l'état global d'un axe change. Garder intact tout journal clôturé.

## Préservation de l'historique

Un journal est créé lorsque l'itération a été réalisée, puis devient append-only
après clôture. Une nouvelle itération, phase ou orientation d'un axe utilise un
nouveau fichier selon la convention décrite dans
`docs/project/development/README.md`; ne pas recycler le journal précédent. Les
tâches abandonnées sont clôturées dans leur axe et leur raison est consignée
dans un journal. Ne pas inventer de rétro-historique pour une période non
documentée.
