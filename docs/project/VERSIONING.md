# Politique de versionnement

Le versionnement SemVer s'applique au paquet livré. Toute itération qui modifie
le comportement ou le contenu livré doit laisser une décision de version
visible; les corrections compatibles utilisent `PATCH` par défaut.

## Quand ne pas changer la version

Ne pas modifier `package.json` ni `package-lock.json` pour une passe qui ne
change pas le paquet livré, notamment : documentation, roadmap, journaux,
consignes d'agent, tests seuls ou outillage interne/CI sans effet sur le
contenu ou le comportement du paquet publié. Le journal doit alors indiquer
explicitement qu'aucun bump n'est requis.

## Quand et comment choisir le bump

Changer la version pour toute itération qui modifie le paquet livré. Choisir le
niveau selon l'ensemble des changements livrés depuis la dernière version, avec
`PATCH` comme niveau par défaut pour une correction compatible :

- **PATCH** (`x.y.Z`) : correction compatible d'un défaut ou durcissement sans
  changement de contrat public.
- **MINOR** (`x.Y.0`) : fonctionnalité nouvelle rétrocompatible ou extension
  compatible d'une interface/configuration publique.
- **MAJOR** (`X.0.0`) : rupture de compatibilité d'une interface, configuration,
  protocole ou comportement public.

Une modification d'implémentation seule, sans effet observable ni changement
du paquet livré, ne justifie pas un bump. Si une tâche mêle documentation et
code, évaluer le code livré selon les règles ci-dessus; la documentation seule
ne fait pas monter le niveau SemVer.

Lors d'un bump, synchroniser `package.json` et `package-lock.json`, puis lancer
`npm run check:version`. Chaque journal d'itération livrant du code doit
indiquer la version avant/après et le message de commit suggéré.
