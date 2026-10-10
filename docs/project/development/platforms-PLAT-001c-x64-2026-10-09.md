# Plateformes — PLAT-001c x64 et compilation croisée ARM64 — 2026-10-09

État: terminé

## Objectif

Produire sur l'hôte Linux x86-64 les composants natifs propres au projet pour
le paquet npm et vérifier leur sélection, leur chargement et leur présence dans
le tarball. PLAT-001c est clôturée après la génération et la vérification des
prébuilds x64 et ARM64; les essais d'installation tarball relèvent de PLAT-001e.

## Modifications et résultats

- `npm run build:native:prebuild` a produit les trois composants requis sous
  `prebuilds/linux-x64/`: bridge uinput, bridge XWayland et overlay QR.
- `file` confirme des binaires ELF x86-64; les deux bridges Node-API se
  chargent dans Node.js 22.12.0. `ldd` montre seulement libc pour les bridges;
  l'overlay requiert également X11 et libpng au runtime.
- `npm pack --dry-run --json --ignore-scripts` incluait les prébuilds x64.
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
- Après installation du toolchain par `dev/setup-linux.sh`,
  `npm run build:native:prebuild -- --arch arm64` génère les trois artefacts;
  `readelf` confirme `ELF64` et `AArch64` pour chacun.
- L'overlay ARM64 déclare au runtime `libX11.so.6`, `libpng16.so.16` et
  `libc.so.6`, conformément aux dépendances documentées.
- `npm run verify:native:prebuilds` réussit et confirme que les six fichiers
  x64/ARM64 sont inclus dans le tarball.
- `npm run setup:dev:linux -- --check` confirme toolchain, source APT,
  bibliothèques et artefacts prêts sur l'hôte.
- Version patch de clôture portée à 6.19.81.

## Blocages et suite

- SQLite fonctionne dans l'application; le segfault observé par un test isolé
  n'est pas reproduit en usage normal et ne constitue pas un blocage de cette
  itération.
- Les répertoires `prebuilds/` sont ignorés par Git; le setup les régénère avant
  la préparation du tarball. Le chargement/exécution des binaires dans un
  environnement ARM64 reste à valider dans PLAT-001e.
