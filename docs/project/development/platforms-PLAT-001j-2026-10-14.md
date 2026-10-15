# Plateformes — PLAT-001j — 2026-10-14

## Objectif

Garantir que les prébuilds Linux générés pendant `prepublishOnly` restent
présents dans le tarball npm, même s'ils sont ignorés par Git dans le checkout.

## Modifications

- Ajouter des exceptions explicites à `.npmignore` pour les répertoires x64 et
  ARM64 de `prebuilds/`.
- Ajouter les quatre fichiers générés aux exceptions de `.gitignore`, car
  certaines versions npm consultent aussi l'état d'ignorance Git pour les
  fichiers non suivis.
- Déclarer chaque fichier natif dans l'allowlist `files` de `package.json`, afin
  que l'inclusion ne dépende pas d'une règle de répertoire ignoré.
- Séparer la vérification des artéfacts natifs de celle du tarball : le premier
  contrôle uniquement la présence et l'architecture ELF; `verify:package`
  contrôle le contenu npm et l'installation du tarball.
- Isoler complètement les sous-commandes npm de `verify:package` en supprimant
  les options `npm_config_*` héritées du `publish` parent; conserver seulement
  un cache temporaire et `dry_run=false`.
- Bumper la version patch à `6.19.90` pour préparer une nouvelle publication
  après la version déjà publiée `6.19.89`.

## Vérifications

- `npm pack --dry-run --json` liste les quatre prébuilds Linux générés.
- Les suites ciblées `native-prebuild-package`, `npm-package-validation` et
  `npm-publish-preparation` réussissent : 3 suites, 12 tests.
- La vérification native lancée via `npm run` ne peut pas terminer son appel
  npm imbriqué dans cet environnement géré : le processus enfant reçoit
  `EPERM`. La même commande `npm pack --dry-run --json` exécutée directement
  produit un JSON valide contenant les quatre fichiers attendus.
