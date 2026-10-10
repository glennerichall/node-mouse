# Plateformes — PLAT-001c — 2026-10-09

État: en cours

## Objectif et critères d'acceptation

Distribuer les composants natifs Linux précompilés et faire en sorte que
l'installation npm cible ne dépende ni d'un compilateur ni d'en-têtes de
développement. Couvrir x64 et ARM64, vérifier les dépendances natives npm, le
contenu du paquet publié et les bibliothèques partagées runtime.

## Décisions et raisons

- `postinstall` ne compile plus aucun composant. La compilation est une action
  explicite de préparation de la publication; un paquet incomplet émet un
  avertissement au lieu de démarrer une compilation fragile sur l'hôte.
- Les bridges uinput/XWayland et l'overlay QR sont résolus depuis
  `prebuilds/linux-${arch}` lorsqu'ils sont présents, avec conservation du
  chemin `build/` pour les environnements de développement.
- RobotJS et `better-sqlite3` restent des dépendances npm. Leur compatibilité
  cible repose sur les versions et artefacts publiés par leurs projets amont;
  leurs fichiers ne sont ni copiés ni maintenus dans ce dépôt.
- Le helper libei reste optionnel et peut être inclus explicitement dans une
  construction d'artefacts.

## Modifications apportées

- Ajout des commandes `build:native:prebuild` et `verify:native:prebuilds`.
- Ajout du résolveur central des chemins des composants natifs Linux.
- Adaptation de l'installateur Linux aux bibliothèques runtime plutôt qu'aux
  toolchains et en-têtes de compilation.
- Documentation du flux de construction séparé x64/ARM64 et mise à jour de
  l'inventaire des composants npm natifs.
- Les artefacts générés demeurent ignorés par Git.

## Vérifications et résultats

- Tests unitaires ajoutés pour la résolution, le postinstall sans compilation
  et la vérification du contenu des artefacts propres au projet.
- La complétude réelle du tarball reste à vérifier après génération des
  composants natifs projet sur des hôtes Linux x64 et ARM64.

## Blocages / risques / suite

- Aucun artefact natif propre au projet n'est encore présent dans
  `prebuilds/`; les en-têtes X11/libpng et le compilateur manquent sur cet hôte.
- Il faut exécuter `npm run build:native:prebuild` sur un hôte x64 et un hôte
  ARM64, réunir les deux répertoires, puis valider le paquet npm et un test
  d'installation propre sans toolchain.
- Le niveau minimal de glibc pour les binaires publiés reste à fixer.
