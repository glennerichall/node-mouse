# Plateformes — PLAT-002a — 2026-10-10

État: terminé

## Objectif et critères d'acceptation

Ajouter des tests automatisés pour le setup Windows et son adaptateur de tâches
planifiées, en simulant `schtasks` et sans revendiquer une validation sur un
hôte Windows réel.

## Décisions et raisons

- Garder la tâche planifiée existante sur `ONLOGON` et vérifier qu'une
  réinstallation la remplace via `/Create /F` avant de la lancer.
- Vérifier que la tâche conserve les chemins `CONFIG_DIR` et `ENV_FILE_PATH`
  de l'installation afin qu'elle recharge la configuration attendue.
- Conserver une distinction claire entre tests unitaires simulés et validation
  système réelle sous Windows.
- Traduire en anglais les messages retournés par l'adaptateur Windows.
- Le patch est passé à `6.19.87`.

## Modifications apportées

- Ajouter une suite de tests isolée pour l'adaptateur Windows simulant
  `execFileAsync` et couvrant création/remplacement, lancement, désactivation,
  suppression et échecs du planificateur.
- Vérifier que plusieurs exécutions du setup Windows préservent le secret et
  les réglages utilisateur tout en transmettant les mêmes chemins au service.
- Ajouter les tests Windows au script `npm run test:install`.

## Vérifications et résultats

- `npm run test:install`: 2 suites et 17 tests réussis.

## Blocages / risques / suite

- Aucun hôte Windows réel n'a été utilisé. Les chemins PowerShell et le
  comportement effectif du planificateur doivent encore être validés dans
  PLAT-002 sur un système Windows.

## Message de commit suggéré

`test(PLAT-002a): cover Windows setup and scheduled tasks`
