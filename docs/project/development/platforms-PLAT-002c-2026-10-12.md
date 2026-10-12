# Plateformes — PLAT-002c — 2026-10-12

État: implémenté; validation Windows GitHub Actions à rejouer.

## Cause

Le script npm `test:install` préfixait Jest par `NODE_OPTIONS=...`, syntaxe
acceptée par les shells POSIX mais interprétée comme une commande inconnue par
`cmd.exe` sur le runner Windows.

## Décision

L’option ESM est désormais passée directement à Node, qui lance le binaire Jest.
La commande ne dépend donc plus d’une syntaxe d’environnement propre au shell.
Un test de scripts npm protège la commande contre le retour d’une affectation
`NODE_OPTIONS` en tête.

## Vérification

- `npm run test:install`: 24 tests réussis.
- `jest test/unit/npm-scripts.test.js --runInBand`: 2 tests réussis.
- La validation Windows complète doit être confirmée par le workflow Actions.
