# Plateformes — PLAT-005e — 2026-10-06

État: clôturée

## Objectif

Supprimer l'orchestration Vagrant/Packer des machines de développement et
exécuter les déploiements et tests sur des VM fournies par le développeur.

## Décisions

- les VM, hyperviseurs, images et licences restent hors du dépôt;
- `dev/deploy/deploy-linux.sh` utilise SSH/rsync vers une cible explicite;
- `DesktopProbe` utilise le même transport SSH pour les tests intégrés;
- les captures dépendantes de `virsh` ne sont plus une exigence du test distant.

## Modifications et vérifications

- suppression du répertoire `dev/vagrant/` et des commandes npm associées;
- ajout du bootstrap `dev/deploy/` et de `test/integration/run-remote.mjs`;
- adaptation des tests intégrés et ajout du test de contrat des scripts;
- `npm test -- --runInBand`: 334 tests réussis;
- vérifications `bash -n`, `node --check`, XML/diff: réussies.

## Suite

Le développeur fournit une VM Linux accessible en SSH et définit
`REMOTE_MOUSE_TEST_HOST`, `REMOTE_MOUSE_TEST_USER` et éventuellement
`REMOTE_MOUSE_TEST_KEY` avant `npm run deploy:linux:*` et
`npm run test:remote:*`.
