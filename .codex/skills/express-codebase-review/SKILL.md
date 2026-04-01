---
name: express-rest-resource
description: Concevoir ou refactorer une ressource REST dans une application Express de manière professionnelle, en respectant les conventions REST, le chaînage middleware, la séparation route/controller/service et la réutilisation de l’existant.
---

# Objectif
Cette skill sert à créer ou refactorer une ressource REST dans le projet.

# Workflow obligatoire

## Étape 1 — inspection de l’existant
Avant toute écriture :
- localiser les routes similaires ;
- identifier les conventions de nommage, validation, erreurs et pagination ;
- repérer les services et middlewares réutilisables ;
- chercher si la ressource existe déjà partiellement sous une autre forme.

## Étape 2 — modélisation REST
Déterminer :
- nom de la ressource ;
- endpoints collection et item ;
- verbes HTTP corrects ;
- format des payloads ;
- codes HTTP attendus ;
- règles d’idempotence ;
- pagination, filtrage, tri si le projet le fait déjà.

## Étape 3 — architecture
Distribuer la responsabilité :
- routes : composition du pipeline ;
- middlewares : auth, permissions, validation ;
- controller : adaptation HTTP uniquement ;
- service : logique métier ;
- repository/data access : persistance.

## Étape 4 — anti-duplication
Avant de créer un module :
- vérifier si un service proche existe ;
- vérifier si un validateur proche existe ;
- vérifier si un middleware d’erreur ou d’auth existe ;
- préférer extension/factorisation à copie.

## Étape 5 — sortie
Toujours fournir :
1. le mapping ressource -> endpoints ;
2. les fichiers à créer ou modifier ;
3. les éléments réutilisés ;
4. les duplications évitées ;
5. les tests à écrire ou mettre à jour.

# Règles
- Éviter les endpoints RPC si une modélisation ressource est possible.
- Éviter la logique métier dans le routeur.
- Éviter la validation inline si une couche dédiée existe.
- Préférer PATCH à PUT pour mises à jour partielles.
- Réutiliser les conventions de réponse existantes.