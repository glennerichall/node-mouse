# Plateformes — PLAT-005f — 2026-10-09

État: terminé

## Objectif et critères d'acceptation

Préparer de manière reproductible un poste de développement Ubuntu/Debian,
distinct des machines cibles de `dev/deploy/` et de l'installation destinée aux
utilisateurs. Le script doit vérifier Node.js, installer les outils de build
requis, installer les dépendances npm et compiler les helpers Linux du projet;
il doit pouvoir être relancé sans opération manuelle destructive.

## Décisions et raisons

- Le périmètre initial est Linux Ubuntu/Debian, cohérent avec les hôtes Linux
  documentés et les dépendances APT déjà recensées.
- Le script exige Node.js 22 ou plus récent et indique comment l'installer si
  absent; il ne choisit pas ni ne modifie la gestion Node du développeur.
- Les paquets système sont installés par APT avec confirmation préalable; les
  opérations privilégiées passent par `sudo`, tandis que npm et les builds
  locaux s'exécutent sous le compte du développeur.
- libei/RemoteDesktop reste optionnel. Les permissions uinput et la création de
  VM ne font pas partie de la préparation du poste.

## Modifications apportées

- Ajout de `dev/setup-linux.sh` avec `--check`, confirmation APT, installation
  de `npm ci` et construction des bridges uinput/XWayland et de l'overlay QR.
- Ajout de `npm run setup:dev:linux`, de la documentation dans `dev/README.md`
  et de tests sur les prérequis, le refus d'une ancienne version Node et les
  commandes de préparation.
- Correction de la virgule finale invalide dans `package.json`, synchronisation
  de `package-lock.json` (dont le verrouillage exact de `proxy-addr` à 2.0.8),
  et passage de version patch de 6.19.77 à 6.19.78.

## Vérifications et résultats

- `bash -n dev/setup-linux.sh` et `npm run setup:dev:linux -- --help` : réussis.
- `npm run check:version` : réussi.
- Suites Jest ciblées installation et artefacts natifs : 3 suites, 19 tests
  réussis.
- `npm ci --dry-run --ignore-scripts --no-audit --no-fund` : réussi après
  synchronisation du lockfile.
- `git diff --check` : réussi.
- L'installateur a été exécuté avec succès par le développeur sur Ubuntu/Debian
  x86_64; `npm run setup:dev:linux -- --check` confirme les paquets, npm et les
  trois helpers natifs prêts. `file` confirme que les deux bridges sont des
  bibliothèques partagées ELF x86-64 et que l'overlay est un exécutable ELF
  x86-64.
- La vérification a d'abord cherché le bridge uinput sous `build/wayland/`;
  le contrôle a révélé que le script de build le produit sous `build/uinput/`.
  Le chemin de contrôle a été corrigé puis revérifié avec succès.
- Les parcours APT ont également été testés avec des commandes simulées.

## Blocages / risques / suite

Le helper libei facultatif n'est pas installé ni compilé par ce parcours.
PLAT-001c doit maintenant générer et valider les prébuilds sur x64 et ARM64.
