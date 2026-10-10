# Plateformes — PLAT-005g — 2026-10-09

État: en cours

## Objectif

Faire du setup Linux du dépôt le parcours complet de préparation des
prébuilds natifs x64 et ARM64, sans demander au développeur de retrouver et
d'exécuter séparément les commandes APT du toolchain croisé.

## Modifications

- `dev/setup-linux.sh` détecte l'hôte amd64, l'architecture étrangère ARM64,
  les paquets `crossbuild-essential-arm64`, `libx11-dev:arm64` et
  `libpng-dev:arm64`, ainsi que les deux jeux de prébuilds requis.
- Après confirmation, le script active ARM64 dans dpkg, actualise APT, installe
  les paquets manquants, exécute les builds locaux, puis génère les prébuilds
  Linux x64 et ARM64.
- Sur Ubuntu, il ajoute une source Ports ARM64 dédiée et signée par le trousseau
  officiel uniquement si aucune source Ports n'est déjà déclarée. Il refuse
  d'écraser une source existante non gérée par le projet et peut actualiser sa
  propre source lors d'un changement de version Ubuntu.
- `--check` indique les paquets, l'architecture dpkg, la source APT et les
  fichiers d'artefacts manquants sans appeler sudo ni modifier l'hôte.
- La documentation de développement indique maintenant que le setup prépare
  les deux cibles sur amd64.

## Vérifications

- Suite `test/unit/dev-setup-linux.test.js` : 6 tests réussis, dont les appels
  simulés d'activation ARM64, d'installation APT et de génération des prébuilds.
- `bash -n dev/setup-linux.sh` et `npm run check:version` réussis.
- `npm run setup:dev:linux -- --check` indique correctement que ce poste ne
  possède pas encore le toolchain, les paquets ARM64 ni les prébuilds ARM64;
  il n'a exécuté aucune commande privilégiée.
- Version patch portée à 6.19.80.

## Reste à valider

Le parcours APT réel et la compilation croisée n'ont pas été exécutés dans
cette passe. La tâche reste ouverte jusqu'à ce que le développeur relance
`npm run setup:dev:linux`, vérifie les paquets et artefacts générés avec
`npm run setup:dev:linux -- --check`, puis valide le tarball et son exécution
sur une cible ARM64.
