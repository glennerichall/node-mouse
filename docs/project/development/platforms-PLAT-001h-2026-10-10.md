# Plateformes — PLAT-001h — 2026-10-10

État: terminé

## Objectif et critères d'acceptation

Refactorer `remote-mouse setup` pour séparer l'orchestration commune des
opérations propres au système hôte. Les stratégies Linux et Windows doivent
fournir leurs chemins et valeurs de configuration, permissions, modifications
système et installation du service.

## Décisions et raisons

- L'algorithme commun contrôle la validation, le port, la configuration
  persistante, les confirmations et le résultat du parcours.
- La stratégie est sélectionnée par plateforme et chargée à la demande : le
  parcours Windows ne charge pas l'implantation Linux, et réciproquement.
- La stratégie Linux possède la permission facultative uinput et les modes
  d'accès aux fichiers; la stratégie Windows possède le chemin `%APPDATA%` et
  les valeurs de tâche planifiée.
- Le service est lancé dans un processus CLI séparé afin que son chargeur lise
  le fichier `.env` qui vient d'être créé; le sous-système de service existant
  sélectionne ensuite systemd ou Task Scheduler selon l'hôte.
- Le patch est passé à `6.19.86`.

## Modifications apportées

- Réduire `setupCommand.js` à l'orchestration du parcours partagé.
- Extraire la configuration persistante, les prompts, la validation des
  prérequis et le lancement du service dans des modules dédiés.
- Ajouter les stratégies Linux et Windows et leur sélection dynamique.
- Tester les différences de configuration entre stratégies et le parcours
  commun au moyen d'une stratégie simulée.

## Vérifications et résultats

- `npm run test:install`: 10 tests réussis.
- `npm run check:version`: réussi.

## Blocages / risques / suite

- L'installation système réelle reste à valider sur les hôtes Linux et Windows;
  les tests de cette itération couvrent l'orchestration et les contrats des
  stratégies sans effectuer d'opérations système réelles.

## Message de commit suggéré

`refactor(PLAT-001h): add host installation strategies to setup`
