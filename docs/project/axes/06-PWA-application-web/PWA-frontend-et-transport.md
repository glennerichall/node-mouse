# PWA — Frontend et transport local

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## PWA-026 — Gérer proprement les erreurs d'écoute et d'initialisation WebRTC

**État:** À faire.

### Jalon 0 — Preuve de faisabilité réseau
**Objectif :** valider la connexion directe avant toute refonte importante.

## PWA-029 — Établir un DataChannel direct entre un navigateur mobile et Node.js

**État:** À faire.

  même LAN.

## PWA-031 — Vérifier dans les statistiques ICE que la paire sélectionnée est locale

**État:** À faire.

  et qu'aucun relais n'est utilisé.

## PWA-035 — Comparer au moins deux bibliothèques WebRTC serveur si elles satisfont

**État:** À faire.

  exigences minimales.
**Critère de sortie :** un prototype reproductible prouve qu'aucune donnée de
commande ne traverse le serveur tiers.
**Estimation :** 3 à 5 jours.
### Jalon 1 — Durcissement de la sécurité existante
**Objectif :** corriger les vulnérabilités indépendamment du futur transport.

## PWA-047 — Adapter le frontend existant à `SocketIoTransport` sans changer son

**État:** À faire.

  comportement.

## PWA-050 — Ajouter les tests de contrat du transport

**État:** À faire.

**Estimation :** 4 à 7 jours.
### Jalon 3 — Transport WebRTC optionnel
**Objectif :** ajouter WebRTC sans remplacer Socket.IO ni dupliquer la logique
métier.

## PWA-059 — Maintenir `SocketIoTransport` pour les modes local, proxy VPN

**État:** À faire.

  certificat local reconnu.
**Estimation :** 5 à 10 jours.
### Jalon 4 — Association et signalisation confidentielles
**Objectif :** permettre l'établissement WebRTC sans exposer le contenu de la
signalisation au serveur tiers.
