# Documentation de pilotage du projet

- [Vision et intention](./VISION.md)
- [Roadmap globale](./ROADMAP.md)
- [Politique de versionnement SemVer](./VERSIONING.md)
- [Journal et méthode de développement](./development/README.md)

Les feuilles de route détaillées sont dans [`axes/`](./axes/). Chaque axe
possède un répertoire dont le fichier `index.md` est la source de suivi; les
fichiers nommés par identifiant dans le même répertoire portent le contexte,
les critères détaillés et les décisions qui seraient trop longues pour l'index.
Chaque changement de code
doit être rattaché à une tâche et des critères d'acceptation d'un axe avant son
implémentation.

Les répertoires d'axes suivent la convention `<ordinal>-<code>-<nom>/`. Leur
ordinal est structurel et stable; leur priorité courante est définie dans la
roadmap globale. Seuls les `index.md` d'axes portent des cases à cocher. Chaque
entrée actionnable cochée ou à réaliser dans un axe reçoit un identifiant stable
du type `<CODE>-NNN`; les étapes qui ne sont que des détails d'acceptation
restent rattachées à l'identifiant de leur tâche. Les idées du backlog
transversal ne sont pas des tâches codifiées tant qu'elles ne sont pas promues
dans leur axe propriétaire.
