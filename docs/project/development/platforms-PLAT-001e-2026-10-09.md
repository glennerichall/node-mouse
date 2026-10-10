# Plateformes — PLAT-001e — 2026-10-09

État: terminé

## Objectif

Valider le contenu réellement distribué par npm, la publication en mode
simulation et l'installation/exécution du paquet depuis son tarball, en
couvrant les prébuilds Linux x64 et ARM64.

## Décisions et modifications

- Définir un allowlist `files` dans `package.json` pour limiter le tarball aux
  points d'entrée et fichiers runtime; retirer les captures, le build local,
  la roadmap interne et les configurations/tests de développement.
- Ajouter `scripts/verify-npm-package.mjs` et `npm run verify:package`. Le
  vérificateur contrôle les métadonnées, la CLI, les dépendances npm amont, les
  fichiers runtime, les six artefacts natifs et les exclusions; exécute
  `npm publish --dry-run`; empaquette puis installe le tarball dans un préfixe
  global temporaire; vérifie `remote-mouse --version`, charge les deux addons
  Node-API compatibles avec l'hôte et exécute l'overlay en mode diagnostic sans
  ouvrir d'affichage.
- Ajouter la prise en charge des options CLI conventionnelles `--version` et
  `-V`, sans connexion au service.
- Porter les exclusions npm sur les artefacts locaux, l'historique de projet,
  les tests, les configurations de développement et les scripts de validation.
- Incrémenter la version patch à `6.19.82`.

## Vérifications et résultats

- Tests ciblés `npm-package-validation`, `native-prebuild-install` et
  `cli-version`: 3 suites, 12 tests réussis.
- `npm run verify:native:prebuilds`: réussi; les six ELF x64/ARM64 sont présents
  et leurs architectures vérifiées dans le tarball.
- `npm run verify:package`: réussi; `npm publish --dry-run` ne publie rien et
  ne requiert pas de jeton; le tarball `velor-remote-mouse-6.19.82.tgz` contient
  380 fichiers; l'installation temporaire rapporte `6.19.82` et charge les
  addons natifs Linux x64.
- Le tarball est passé d'environ 2,48 Mo à 377 Ko en excluant les fichiers de
  développement non requis.
- `npm run check:version`, `node --check` et `git diff --check`: réussis.
- La suite complète `npm test` s'est arrêtée avec un segfault (code 139), sans
  trace d'assertion. Cette panne de test n'est pas attribuée au
  changement de packaging; les vérifications ciblées et le test d'installation
  isolée réussissent.

## Limites restantes

- L'installation réelle et le chargement des addons ont été exécutés sur Linux
  x64. La présence et l'architecture ELF ARM64 sont validées dans le tarball,
  mais l'exécution sur une cible ARM64 réelle reste à faire.
- L'installation de secours par compilation au `postinstall` est suivie
  séparément dans PLAT-001f.
