---
name: socketio-integration
description: Concevoir ou refactorer une intégration Socket.IO dans une application Express/JavaScript en partageant la logique métier avec l’API REST, sans duplication ni couplage excessif.
---

# Objectif
Utiliser Socket.IO proprement dans un projet déjà structuré autour d’Express.

# Principes
- La logique métier ne doit pas vivre uniquement dans les handlers socket.
- Une capacité métier exposée en REST et en socket doit idéalement partager le même service.
- Les handlers socket doivent rester minces.
- Les événements doivent être nommés par domaine métier, pas par implémentation technique.

# Procédure
1. Identifier les flux déjà couverts par HTTP.
2. Déterminer ce qui doit être temps réel et ce qui doit rester REST.
3. Mutualiser la logique métier dans des services partagés.
4. Garder dans la couche socket :
    - auth socket
    - rooms / namespaces
    - abonnements
    - émission d’événements
5. Éviter les duplications de validation, d’accès aux données et de règles métier.

# Sortie attendue
Toujours préciser :
- quels services sont partagés entre REST et Socket.IO ;
- quels handlers socket sont introduits ;
- quels événements sont exposés ;
- quelle duplication a été évitée.