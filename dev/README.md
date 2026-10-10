# Outils de développement

Après un clone du dépôt sur Ubuntu ou Debian, préparer le poste de
développement avec :

```bash
npm run setup:dev:linux
```

Le script vérifie Node.js 22 ou plus récent, demande confirmation avant
d'installer les paquets système de compilation X11/libpng, exécute `npm ci`,
puis compile les bridges uinput/XWayland et l'overlay QR. Sur un hôte amd64, il
active aussi les paquets ARM64 requis, installe le toolchain croisé et génère
les prébuilds Linux x64 et ARM64. Sous Ubuntu, il ajoute une source officielle
Ports dédiée au projet seulement si aucune source Ports n'existe déjà; il
préserve toute source APT préexistante non gérée par le projet. `--check`
signale les toolchains, bibliothèques ou artefacts manquants sans installer ni
modifier quoi que ce soit. Le script ne configure pas les permissions système
uinput, n'installe pas les dépendances facultatives libei/RemoteDesktop, et ne
prépare ni ne gère de VM.
Pour vérifier l'état sans rien installer :

```bash
npm run setup:dev:linux -- --check
```

Les machines de test sont fournies et administrées par le développeur. Le
projet ne crée ni ne détruit de VM et ne dépend plus de Vagrant, libvirt ou
Packer.

```bash
export REMOTE_MOUSE_TEST_HOST=192.0.2.20
export REMOTE_MOUSE_TEST_USER=developer
export REMOTE_MOUSE_TEST_KEY="$HOME/.ssh/id_ed25519"
npm run deploy:linux:x11
npm run test:remote:x11
```

Les scripts de `dev/deploy/` copient le dépôt par SSH/rsync, installent les
prérequis et exécutent le bootstrap Linux sur la machine cible. Les images,
hyperviseurs, licences et états des VM restent hors du dépôt.
