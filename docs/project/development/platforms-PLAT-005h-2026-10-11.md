# Plateformes — PLAT-005h — 2026-10-11

État: terminé

## Objectif

Enregistrer la décision de suspendre tout travail lié aux machines virtuelles
jusqu'à indication contraire de l'utilisateur et retirer ces travaux de
l'ordre de livraison actif.

## Décisions

- La suspension couvre la création, le provisionnement, le démarrage, le
  déploiement dans une VM et la validation nécessitant une VM.
- Les tâches historiques et futures du laboratoire restent documentées, mais
  ne sont ni supprimées ni considérées comme actives.
- Les scripts de VM existants sont préservés et ne sont pas exécutés dans cette
  itération. Leur suppression n'est pas autorisée par cette décision.
- Les travaux plateforme qui ne nécessitent pas de VM restent planifiables.

## Modifications

- Ajout d'une contrainte de portée dans `AGENTS.md`.
- Mise à jour de la roadmap globale : volet VM explicitement suspendu, ordre
  actif corrigé et état CODE actualisé à CODE-009.
- Mise à jour de l'axe PLAT et de sa section laboratoire pour distinguer les
  travaux reportés des travaux actifs.
- Aucun changement de version : cette itération ne modifie que la documentation.

## Vérifications

- Les liens Markdown relatifs des documents modifiés sont valides.
- `git diff --check` et `npm run check:version` réussissent.
- Aucun script, environnement ou processus de VM n'a été touché.

## Suite

Ne reprendre aucune tâche de VM avant une indication contraire explicite de
l'utilisateur.
