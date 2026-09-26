# Journal de développement

Ce répertoire conserve les décisions et l'historique du développement par axe.
La [roadmap globale](../ROADMAP.md) ordonne les axes; les [documents d'axes](../README.md)
portent le périmètre et les tâches planifiées.

## Règles de suivi

1. Avant de modifier le code, lire la vision, la roadmap globale, l'axe concerné
   et son journal le plus récent.
2. Si le travail n'est pas planifié, ajouter d'abord une tâche avec identifiant,
   périmètre, dépendances et critères d'acceptation. Une demande explicite de
   l'utilisateur permet de faire cette planification dans le même changement.
3. Pendant l'itération, noter décisions et blocages. À la fin, mettre à jour
   l'état de l'axe et ajouter un journal daté décrivant l'objectif, changements,
   fichiers importants, tests, résultat et travail restant.
4. Ne jamais effacer/réécrire un journal clôturé. Une nouvelle phase ou
   réorientation d'axe reçoit un nouveau fichier; l'ancien reste archivé.
5. Ne cocher que ce qui a été vérifié. Si bloqué, noter la cause et la décision
   ou information nécessaire pour reprendre.

## Convention de nommage

`<axe>-<iteration>-<YYYY-MM-DD>.md`, par exemple
`security-SEC-008-2026-10-01.md`. Les fichiers sont append-only après clôture.

## Historique existant

- [Sécurité — lot A, SEC-001 à SEC-007](./security-lot-a.md): historique
  existant conservé lors de la réorganisation; SEC-008 est encore planifié.
- Aucun journal d'implémentation PWA distinct n'existait. Les décisions
  historiques restent dans [l'axe PWA](../axes/pwa.md); le journal PWA commence
  avec la première itération réelle, sans rétro-construire d'historique.

## Modèle d'une nouvelle itération

Copier cette structure dans un nouveau fichier:

```markdown
# <Axe> — <ID> — <date>
État: planifié | en cours | terminé | bloqué

## Objectif et critères d'acceptation
## Décisions et raisons
## Modifications apportées
## Vérifications et résultats
## Blocages / risques / suite
```
