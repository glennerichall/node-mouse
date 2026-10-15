---
name: roadmap-driven-development
description: Pilote toute implémentation, correction ou refactorisation du projet à partir de l'axe propriétaire et de ses critères; conserve les décisions utiles à l'historique.
---

# Développement piloté par la roadmap

Utiliser ce skill avant tout changement de code dans ce dépôt. Suivre aussi
[`AGENTS.md`](../../../AGENTS.md) et [`docs/AGENTS.md`](../../../docs/AGENTS.md)
pour le routage et le chargement progressif.

## Sources canoniques

- `docs/project/axes/`: tâches actuelles et critères; toujours lire l'axe
  propriétaire du changement.
- `docs/project/ROADMAP.md`: ordre global des axes; lire pour choisir ou
  reprioriser une itération, pas pour un changement local déjà cadré.
- `docs/project/VISION.md`: intention durable; lire si la tâche peut la
  modifier ou semble la contredire.
- `docs/project/development/`: décisions réalisées; rechercher l'identifiant
  ou le sujet touché et lire uniquement les résultats pertinents.
- `docs/project/VERSIONING.md`: niveau SemVer lors d'une préparation de
  publication ou d'une itération livrant du code; aucun bump pour une
  itération documentaire, de tests seuls ou d'outillage interne sans effet sur
  le paquet.

## Workflow

1. Examiner `git status`, le code concerné et les instructions applicables.
2. Si l'axe ne contient pas la tâche, ajouter avant l'implémentation un item
   avec identifiant, périmètre et critères vérifiables. Ne pas dupliquer les
   cases dans la roadmap globale ou un journal.
3. Vérifier les précédents pertinents et les dépendances; demander une décision
   si le travail exige un changement important de direction.
4. Implémenter et lancer les vérifications liées aux critères. Ne cocher
   terminé qu'après réussite; signaler les contrôles impossibles.
5. À la clôture, créer un journal daté selon la convention de
   `docs/project/development/README.md`. Les journaux terminés sont immuables.
   Modifier la roadmap globale uniquement si l'ordre ou l'état d'un axe change.
6. Pour toute itération qui modifie le paquet livré, incrémenter la version
   `PATCH` par défaut et synchroniser `package.json` et `package-lock.json`.
   Utiliser `MINOR` ou `MAJOR` seulement si la nature du changement l'impose
   ou si l'utilisateur le demande explicitement. Une itération documentaire,
   de tests seuls ou d'outillage interne conserve la version et doit le dire
   explicitement dans le journal.
7. Avant la réponse finale, lancer `npm run check:version` dès qu'un bump est
   requis, puis fournir obligatoirement un message de commit court et précis.
   Ne jamais créer le commit sans demande explicite de l'utilisateur.
