# Plateformes — PLAT-001c x64 et compilation croisée ARM64 — 2026-10-09

État: en cours

## Objectif

Produire sur l'hôte Linux x86-64 les composants natifs propres au projet pour
le paquet npm et vérifier leur sélection, leur chargement et leur présence dans
le tarball. PLAT-001c demeure ouverte jusqu'à la validation ARM64 et au contrôle
du paquet installable sur les architectures visées.

## Modifications et résultats

- `npm run build:native:prebuild` a produit les trois composants requis sous
  `prebuilds/linux-x64/`: bridge uinput, bridge XWayland et overlay QR.
- `file` confirme des binaires ELF x86-64; les deux bridges Node-API se
  chargent dans Node.js 22.12.0. `ldd` montre seulement libc pour les bridges;
  l'overlay requiert également X11 et libpng au runtime.
- `npm pack --dry-run --json --ignore-scripts` inclut les trois prébuilds x64.
  Le contrôle global `npm run verify:native:prebuilds` reste en échec tant que
  les trois fichiers `prebuilds/linux-arm64/` ne sont pas générés.
- Les paquets npm amont installés contiennent des binaires Linux x64 et ARM64
  pour RobotJS et better-sqlite3; aucun binaire amont n'est copié dans les
  prébuilds du projet. RobotJS se charge et expose `moveMouse` sur l'hôte x64.
- Les tests ciblés de résolution et de paquet natifs passent : 4 suites,
  15 tests; `npm run check:version` passe également.
- Le générateur accepte maintenant `--arch arm64`, choisit
  `aarch64-linux-gnu-gcc` par défaut depuis un hôte x64, transmet `CC` et
  `SYSROOT` aux compilateurs et contrôle l'en-tête ELF avant de classer/copier
  un artefact. Le vérificateur de tarball contrôle aussi l'architecture réelle.
- La compilation x64 a été rejouée avec succès après ce changement : les trois
  fichiers ont `Machine: Advanced Micro Devices X86-64`, et les deux bridges
  Node-API se chargent. Les tests dédiés passent : 3 suites, 17 tests.
- Version patch portée à 6.19.79.

## Blocages et suite

- L'outil `aarch64-linux-gnu-gcc` et les bibliothèques cibles ne sont pas
  installés sur l'hôte courant : l'essai ARM64 s'arrête proprement avant toute
  compilation et ne produit pas d'artefact. Installer le toolchain et les
  bibliothèques documentés, produire les prébuilds ARM64, puis relancer le
  vérificateur global et valider le tarball sur une cible ARM64.
- SQLite fonctionne dans l'application; le segfault observé par un test isolé
  n'est pas reproduit en usage normal et ne constitue pas un blocage de cette
  itération.
- Les répertoires `prebuilds/` sont ignorés par Git; ces fichiers locaux ne
  constituent pas encore un artefact versionné ou publiable.
