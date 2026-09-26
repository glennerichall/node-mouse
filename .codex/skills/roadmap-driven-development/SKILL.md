---
name: roadmap-driven-development
description: Pilote toute implémentation, correction ou refactorisation du projet à partir de la vision, de la roadmap globale et du plan/journal de l'axe; conserve les décisions et l'historique d'itération.
---

# Développement piloté par la roadmap

Utiliser ce skill avant tout changement de code dans ce dépôt, y compris bugfix,
refactorisation, sécurité, API, interface, tests et intégration système.

## Sources canoniques

- Vision/intention: `docs/project/VISION.md`
- Priorités et Definition of Done: `docs/project/ROADMAP.md`
- Périmètre, tâches et critères: `docs/project/axes/<axe>.md`
- Décisions et historique: `docs/project/development/README.md` et le dernier
  journal de l'axe

## Séquence obligatoire

1. Lire ces sources et examiner l'état Git ainsi que le code concerné.
2. Rattacher le travail à un identifiant d'axe et des critères testables.
   Si aucun item adapté n'existe, l'ajouter au document d'axe avant le code.
   Quand l'utilisateur a demandé l'implémentation, planification et code peuvent
   être livrés dans le même changement, mais la planification doit précéder la
   modification du code.
3. Vérifier dépendances, ordre des tâches et décisions déjà consignées. Demander
   une décision utilisateur si le changement contredit la vision ou impose une
   réorientation importante.
4. Implémenter et vérifier les critères d'acceptation; ne pas cocher une tâche
   avant que les vérifications correspondantes aient réussi.
5. Mettre à jour la roadmap de l'axe et créer un nouveau journal daté avec
   objectif, décisions et raisons, modifications, tests/résultats, blocages et
   suite. Garder intact tout journal clôturé.

## Préservation de l'historique

Les journaux sont append-only après clôture. Une nouvelle itération, phase ou
orientation d'un axe utilise un nouveau fichier selon la convention décrite dans
`docs/project/development/README.md`; ne pas recycler le journal précédent.
Consigner aussi les tâches abandonnées et leur raison. Ne pas inventer de
rétro-historique pour une période non documentée.
