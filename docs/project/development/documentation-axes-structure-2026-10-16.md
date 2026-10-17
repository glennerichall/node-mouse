# Documentation — structure uniforme des axes — 2026-10-16

## Décision

Chaque axe possède maintenant un répertoire `<ordinal>-<code>-<nom>/` et un
`index.md`. L'index contient le résultat visé, le plan de travail court et les
cases à cocher. Les explications longues sont placées dans des fichiers nommés
par identifiant directement dans le répertoire de l'axe.

Le plan principal `PLAT` et le plan Wayland ne sont plus deux pages concurrentes:
le second est devenu `05-PLAT-plateformes/PLAT-wayland-capture-et-overlay.md`.
Le laboratoire et les validations historiquement identifiés `PLAT-005*` restent
dans `QUA-007`, qui en est désormais le propriétaire documentaire.

## Vérifications

- les dix axes ont un `index.md`;
- les anciennes pages d'axes ont été réparties entre les index et les fichiers
  de tâche, sans cases à cocher dupliquées;
- les états des tâches ont été reportés dans les index;
- les liens Markdown locaux et `git diff --check` passent;
- aucune version, code ou workflow VM n'a été modifié.
