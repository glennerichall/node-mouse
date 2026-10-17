# PWA-010-043-150 — Sécurité, sessions et autorisations

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## PWA-010 — Corriger la confiance accordée à `X-Forwarded-For`. Le code ne doit

**État:** Terminé.

  jamais interpréter directement cet en-tête pour accorder un accès local.

## PWA-011 — Encadrer le contournement sans session au loopback réellement local

**État:** Terminé.

  clients directs ne peuvent pas l'usurper avec un en-tête.

## PWA-012 — Refuser le démarrage en production

**État:** Terminé.

  `SESSION_COOKIE_SECRET=change-me`.

## PWA-013 — Traiter les vulnérabilités élevées des dépendances de production relevées

**État:** Terminé.

  par l'audit, notamment dans Engine.IO, Socket.IO parser et WebSocket.

## PWA-014 — Séparer le jeton temporaire d'association de la session persistante d'un

**État:** Terminé.

  appareil.

## PWA-015 — Créer des rôles distincts `controller` et `admin` (jumelage

**État:** Terminé.

  `controller`, accès loopback en `admin`).

## PWA-016 — Protéger les actions administratives via HTTP et Socket.IO

**État:** Terminé.

  service d'autorisation partagé.

## PWA-019 — Ne jamais écrire les offres WebRTC ni candidats ICE dans les journaux

**État:** À faire.

  lorsque la signalisation sera ajoutée.

## PWA-020 — Valider Origin et protéger les écritures HTTP contre les requêtes CSRF

**État:** Terminé.

### P1 — Cohérence et fiabilité

## PWA-021 — Aligner à 120 minutes la durée de grâce documentée, les modèles

**État:** Terminé.

  d'installation et le défaut du code pour les anciens jetons.

## PWA-040 — Ajouter la révocation administrative d'un autre appareil ou de toutes

**État:** À faire.

  sessions.

## PWA-043 — Ajouter les tests de non-régression associés

**État:** Terminé.

**Estimation :** 3 à 5 jours.
### Jalon 2 — Séparation de la PWA et du backend
**Objectif :** rendre le frontend déployable comme site statique certifié.
