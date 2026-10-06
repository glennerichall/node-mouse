# Outils de développement

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
