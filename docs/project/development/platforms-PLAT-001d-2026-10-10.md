# Plateformes — PLAT-001d — 2026-10-10

## Objectif

Simplifier l'installation publique : npm installe le paquet, puis une commande
locale configure l'application et son service sur Linux ou Windows.

## Décisions

- Le setup n'installe pas Node.js et ne lance pas npm : ces prérequis sont
  distincts de la configuration de l'application.
- Créer ou compléter `.env` dans le répertoire de configuration par défaut
  (Linux : `~/.config/remote-mouse`; Windows : `%APPDATA%/remote-mouse`), sans
  remplacer les valeurs, le secret ou la base existants.
- Demander confirmation pour installer/démarrer le service. L'accès système à
  `/dev/uinput` sous Wayland nécessite un opt-in distinct; `--yes` seul ne
  l'autorise pas.
- Transmettre explicitement le chemin de configuration au processus qui
  installe le service et au service persistant afin que le nouveau processus
  recharge les mêmes réglages.

## Modifications

- Ajouter `remote-mouse setup` avec validation Node.js 20+, configuration
  idempotente, secret aléatoire de 64 caractères, permissions de fichier
  restreintes sous Linux, choix du port et du répertoire, installation locale du
  service et option explicite de permission uinput.
- Rendre le répertoire de configuration par défaut cohérent avec `%APPDATA%`
  sous Windows et faire persister les chemins `CONFIG_DIR` et `ENV_FILE_PATH`
  dans les services systemd utilisateur et la tâche planifiée Windows.
- Remplacer les consignes d'installation autonomes par `npm install -g`, puis
  `remote-mouse setup`; adapter les scripts de déploiement/tests qui utilisaient
  les anciens installateurs.
- Supprimer `scripts/install-linux.sh`, `scripts/install-windows.ps1` et les
  tests qui leur étaient propres. Conserver le helper uinput, nécessaire au
  setup explicitement autorisé.
- Bumper le patch à `6.19.85`.

## Vérifications

- `npm run test:install`: 8 tests réussis.
- Tests CLI/setup/déploiement ciblés : 3 suites et 21 tests réussis.
- `bash -n dev/deploy/provision-linux.sh`, `npm run check:version` et
  `git diff --check`: réussis.
- `npm run verify:package`: réussi; `npm pack` et l'installation temporaire du
  tarball vérifient le paquet après retrait des installateurs.
- La suite complète `npm test -- --runInBand` s'arrête avec le code 139
  (`Segmentation fault`) après plusieurs suites; la source du crash n'a pas été
  isolée dans cette itération.
- Aucun test sur un hôte Windows réel n'a été exécuté; le parcours Windows est
  couvert ici au niveau du setup et de la construction de configuration/service.

## Message de commit suggéré

`feat(PLAT-001d): remplacer les installateurs par remote-mouse setup`
