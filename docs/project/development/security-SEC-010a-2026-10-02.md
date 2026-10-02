# Sécurité — SEC-010a — 2026-10-02
État: terminé

## Objectif et critères d'acceptation

- `ADMIN_PASSWORD_MIN_LENGTH` configure le seuil d'activation du mot de passe.
- La valeur par défaut est 8; les valeurs configurées sont bornées entre 4 et
  128 caractères.
- L'API de déverrouillage et l'état client utilisent une politique commune.
- Les modèles `.env` Linux, Windows et générique documentent la variable.

## Décisions et raisons

Le seuil de 12 caractères était codé à deux endroits et trop rigide pour le
scénario LAN actuel. Une fonction de politique commune empêche que le formulaire
soit affiché alors que le serveur refuserait le même mot de passe.

## Modifications apportées

- Ajout de `ADMIN_PASSWORD_MIN_LENGTH` à la configuration système et aux modèles
  `.env` générique, Linux et Windows.
- Ajout d'une politique commune normalisant le seuil entre 4 et 128, avec 8 par
  défaut.
- Réutilisation de cette politique par la route de déverrouillage et la réponse
  de configuration cliente.
- Mise à jour du README et passage de version mineure à `6.16.0`.

## Vérifications et résultats

- Test d'un mot de passe de six caractères accepté avec un seuil de six.
- Tests des valeurs par défaut et des bornes de la politique.
- Tests ciblés: 21 réussis sur 21.
- `npm test`: 84 suites et 297 tests réussis.

## Blocages / risques / suite

Une borne minimale de 4 est conservée afin d'éviter une désactivation implicite
de toute exigence de longueur.
