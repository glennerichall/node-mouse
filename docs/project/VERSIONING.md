# Politique de versionnement

Le versionnement SemVer s'applique aux versions publiées du paquet, pas aux
itérations de développement. Une tâche terminée ne déclenche donc pas à elle
seule un changement de version.

## Quand ne pas changer la version

Ne pas modifier `package.json` ni `package-lock.json` pour une passe qui ne
change pas le paquet livré, notamment : documentation, roadmap, journaux,
consignes d'agent, tests seuls ou outillage interne/CI sans effet sur le
contenu ou le comportement du paquet publié.

## Quand et comment choisir le bump

Changer la version lors de la préparation d'une publication ou lorsqu'une
demande explicite exige de préparer une version. Choisir le niveau selon
l'ensemble des changements livrés depuis la dernière version :

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
`npm run check:version`. Ne jamais incrémenter automatiquement PATCH par défaut
ni choisir un niveau SemVer uniquement parce qu'une itération roadmap est
clôturée.
