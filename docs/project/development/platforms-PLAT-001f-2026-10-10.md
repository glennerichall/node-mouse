# Plateformes — PLAT-001f — 2026-10-10

## Objectif

Améliorer la souplesse d'installation Linux en compilant les composants natifs
du projet manquants lorsque le paquet ne contient pas de prébuild adapté,
notamment pour une architecture non distribuée.

## Décisions

- Préférer un prébuild uniquement s'il existe sous le répertoire exact de
  l'architecture cible et si son en-tête ELF confirme cette architecture.
- En l'absence de prébuild compatible, réutiliser un build local compatible ou
  compiler les composants requis pour l'architecture native. Les binaires
  RobotJS/SQLite restent gérés par leurs dépendances npm respectives.
- Ne compiler ni le helper libei optionnel, ni les cibles x64/ARM64 croisées
  pendant l'installation. Les scripts natifs existants s'exécutent localement.
- Une erreur de compilateur, d'en-têtes ou d'architecture émet un avertissement
  par composant et ne fait pas échouer `npm install`. Un chargeur ne reçoit
  jamais un artefact ELF d'une autre architecture.

## Modifications

- Étendre `scripts/postinstall-linux.mjs` pour tenter la compilation des
  bridges uinput/XWayland et de l'overlay QR manquants, puis confirmer leur
  architecture avant de les considérer disponibles.
- Faire vérifier l'identifiant machine ELF par `nativeArtifactPaths.js` lors
  de la résolution des prébuilds et builds locaux. En cas d'absence ou
  d'incompatibilité, résoudre vers un chemin d'artefact absent plutôt que
  charger un binaire étranger à la cible.
- Exiger dans la validation du tarball les sources C, les scripts de build et
  le hook `postinstall` nécessaires au fallback.
- Documenter les prérequis de compilation locale dans le README et bumper le
  patch à `6.19.84`.

## Vérifications

- Tests ciblés : 3 suites et 20 tests réussis, couvrant prébuild compatible,
  compilation des artefacts manquants, compilation partielle, échec non bloquant,
  helper libei optionnel, détection ELF et rejet d'un binaire incompatible.
- `npm run check:version`: réussi.
- `npm run verify:native:prebuilds`: prébuilds x64/ARM64 présents et inclus.
- `npm run verify:package`: réussi; le tarball contient 380 fichiers, dont les
  sources et scripts du fallback, et s'installe dans un préfixe temporaire avec
  CLI et artefacts natifs x64 chargés.
- Pas de compilation de secours réelle dans un environnement d'installation
  isolé; le chemin de compilation et ses cas d'échec sont testés unitairement.

## Message de commit suggéré

`feat(PLAT-001f): compiler les composants natifs manquants à l'installation`
