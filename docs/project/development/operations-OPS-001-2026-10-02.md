# Exploitation — OPS-001 — 2026-10-02
État: terminé

## Objectif et critères d'acceptation

- `remote-mouse version` affiche exactement la version du paquet installé.
- La commande fonctionne lorsque le daemon est arrêté ou inaccessible.
- Le parseur, l'aide CLI et le README exposent la commande.
- Un test vérifie la lecture de la version sans serveur et une vérification
  d'intégration exécute réellement le binaire.

## Décisions et raisons

La version décrit le paquet CLI installé, pas nécessairement un daemon déjà en
cours d'exécution. La commande est donc traitée localement avant toute tentative
de connexion au socket CLI.

## Modifications apportées

- Ajout de la commande `version` au parseur et aux deux aides CLI.
- Traitement de `version` directement dans le binaire avant le chargement du
  serveur ou la connexion au socket du daemon.
- Lecture de la valeur depuis le `package.json` du paquet réellement installé.
- Documentation dans le README et passage de version mineure à `6.15.0`.

## Vérifications et résultats

- `node bin/remote-mouse.js version` affiche uniquement `6.15.0`.
- Tests ciblés CLI: 27 réussis sur 27.
- `npm test`: 83 suites et 294 tests réussis.

## Blocages / risques / suite

Aucun blocage identifié.
