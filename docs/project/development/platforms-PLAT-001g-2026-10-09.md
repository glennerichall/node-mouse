# Plateformes — PLAT-001g — 2026-10-09

## Objectif

Rendre le parcours de publication npm naturel et reproductible : la préparation
du paquet se lance automatiquement avant `npm publish`, sans commande de
publication personnalisée.

## Décisions

- Utiliser le hook `prepublishOnly`; ne pas utiliser l'ancien hook `prepublish`,
  qui est également déclenché pendant l'installation d'un paquet.
- Ne pas ajouter de commande npm nommée `publish`. Après le hook, npm reste
  responsable de la création et de la publication du tarball.
- Limiter la préparation des prébuilds x64 et ARM64 à un hôte Linux x64 équipé
  du toolchain natif et de compilation croisée. Toute erreur arrête la chaîne
  avant l'étape de publication.
- Laisser les commandes npm internes à `verify:package` désactiver leur propre
  hook de publication; supprimer l'héritage de `npm_config_dry_run` afin que le
  test `npm publish --dry-run` puisse quand même créer puis installer son
  tarball temporaire.

## Modifications

- Ajouter `scripts/prepare-npm-publish.mjs`, exécuté par `prepublishOnly`, pour
  vérifier la cohérence des versions, générer les prébuilds x64/ARM64, valider
  leurs architectures et le contenu du paquet, puis tester une installation
  globale temporaire.
- Retirer le wrapper de publication personnalisé et ses tests; ajouter des
  tests sur l'ordre des étapes, la plateforme requise et l'arrêt à la première
  erreur.
- Corriger le vérificateur de tarball : initialiser le préfixe npm global
  temporaire et empêcher le dry-run de la publication parente d'inhiber la
  création du tarball ou son installation.
- Documenter la publication (`npm publish`) et son essai sans téléversement
  (`npm publish --dry-run`) dans le README.
- Bumper le patch à `6.19.83`.

## Vérifications

- Trois suites ciblées : 3 suites et 8 tests réussis.
- `npm publish --dry-run` : réussi de bout en bout. Le hook a compilé et vérifié
  les trois composants natifs pour Linux x64 et ARM64; la validation a empaqueté
  380 fichiers, installé le tarball globalement dans un préfixe temporaire,
  confirmé `remote-mouse --version` à `6.19.83` et chargé les artefacts natifs
  x64. npm a ensuite terminé explicitement en mode dry-run sans téléverser le
  paquet.

## Message de commit suggéré

`feat(PLAT-001g): automatiser la préparation avant publication npm`
