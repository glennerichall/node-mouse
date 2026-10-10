# Plateformes — PLAT-005f — 2026-10-09

État: implanté; validation complète sur un hôte préparé en attente

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
- Le mode `--check` a identifié `libxtst-dev` et le bridge uinput comme absents
  sur l'hôte courant, sans modifier le système. Les parcours APT ont été testés
  avec des commandes simulées; aucun paquet système n'a été installé et les
  compilations natives réelles restent à valider sur un hôte préparé.

## Blocages / risques / suite

Le test d'installation complet des paquets et la compilation effective des
helpers doivent être confirmés après lancement de `npm run setup:dev:linux` sur
un poste Ubuntu/Debian. Le helper libei facultatif n'est pas installé ni compilé
par ce parcours.
