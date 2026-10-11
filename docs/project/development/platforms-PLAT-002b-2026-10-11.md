# Plateformes — PLAT-002b — 2026-10-11

État: terminé

## Objectif et critères d'acceptation

Rendre l'installation npm automatique indépendante de la syntaxe POSIX tout en
préservant le marqueur `REMOTE_MOUSE_DAEMON=1`, les commandes personnalisées et
les diagnostics de mise à jour.

## Décisions et raisons

- Représenter l'update par un exécutable, des arguments et un environnement
  séparés; réserver l'exécution shell aux commandes personnalisées explicites.
- Sous Windows, lancer `cmd.exe` directement avec le shim npm comme commande
  batch. Le nom du paquet est limité aux caractères valides d'un identifiant npm
  afin qu'il ne puisse pas injecter de syntaxe de commande dans l'argument `/c`.
- Garder le rendu diagnostique distinct de l'invocation réelle et ne jamais
  inclure le marqueur d'environnement comme syntaxe POSIX à exécuter sous
  Windows.
- Le patch est passé à `6.19.88`.

## Modifications apportées

- Remplacer la chaîne automatique POSIX par une invocation structurée et
  transmettre `REMOTE_MOUSE_DAEMON=1` dans l'environnement enfant.
- Utiliser `npm` directement sous Linux et `cmd.exe /d /s /c` sous Windows,
  sans activer le shell implicite de Node.
- Conserver `installCommand` personnalisé sur son chemin `execShell` historique.
- Ajouter des tests couvrant les invocations Linux/Windows, l'injection
  d'environnement, la commande personnalisée, le rejet de noms invalides et
  les erreurs d'exécution.

## Vérifications et résultats

- `NODE_OPTIONS=--experimental-vm-modules npx jest test/unit/update-manager.test.js --runInBand`:
  14 tests réussis.
- `npm run test:install`: 2 suites et 17 tests réussis.
- `npm run check:version` et `git diff --check`: réussis.

## Blocages / risques / suite

- La commande Windows est testée par simulation depuis Linux; il faut encore
  confirmer le démarrage réel de `npm.cmd` par `cmd.exe` sur un hôte Windows
  pour clore la validation système PLAT-002.

## Message de commit suggéré

`fix(PLAT-002b): make npm updates platform independent`
