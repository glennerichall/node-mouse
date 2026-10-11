# Journaux de développement

Les journaux datés conservent les décisions et résultats des itérations
terminées. Ils sont append-only après clôture; ne pas les réécrire ni les
charger tous pour commencer une tâche.

## Trouver le contexte utile

- L'identifiant (`ARCH-046`, `PLAT-001h`, etc.) permet de retrouver l'axe et
  les journaux associés avec `rg --files docs/project` puis `rg "IDENTIFIANT"`.
- Sans identifiant, rechercher dans les noms et le contenu les mots-clés du
  changement. Lire seulement les journaux qui documentent une décision ou un
  composant touché; le journal le plus récent d'un autre axe n'est pas requis.
- Les tâches et critères actuels sont dans les axes, pas dans les journaux.
  La roadmap globale sert à comprendre l'ordre des axes, pas à recopier leur
  plan de travail.

## Clôturer une itération

Créer après vérification un journal nommé
`<axe>-<identifiant>-<YYYY-MM-DD>.md` (par exemple
`code-CODE-009-2026-10-11.md`). Résumer l'objectif, les décisions, les
modifications importantes, les tests et résultats, les blocages et la suite.
Cocher l'itération dans son axe seulement après validation. Une nouvelle phase
reçoit un nouveau journal; aucun historique antérieur ne doit être inventé.
