## Risques à traiter en priorité

### P0 — Bloquants avant exposition réseau

- PWA-010 — Corriger la confiance accordée à `X-Forwarded-For`. Le code ne doit
  jamais interpréter directement cet en-tête pour accorder un accès local.
- PWA-011 — Encadrer le contournement sans session au loopback réellement local; les
  clients directs ne peuvent pas l'usurper avec un en-tête.
- PWA-012 — Refuser le démarrage en production avec
  `SESSION_COOKIE_SECRET=change-me`.
- PWA-013 — Traiter les vulnérabilités élevées des dépendances de production relevées
  par l'audit, notamment dans Engine.IO, Socket.IO parser et WebSocket.
- PWA-014 — Séparer le jeton temporaire d'association de la session persistante d'un
  appareil.
- PWA-015 — Créer des rôles distincts `controller` et `admin` (jumelage en
  `controller`, accès loopback en `admin`).
- PWA-016 — Protéger les actions administratives via HTTP et Socket.IO avec un
  service d'autorisation partagé.
- PWA-017 — Limiter la taille et le rythme des messages entrants.
- PWA-018 — Filtrer jetons, cookies et secrets des journaux structurés.
- PWA-019 — Ne jamais écrire les offres WebRTC ni candidats ICE dans les journaux
  lorsque la signalisation sera ajoutée.
- PWA-020 — Valider Origin et protéger les écritures HTTP contre les requêtes CSRF.

### P1 — Cohérence et fiabilité

- PWA-021 — Aligner à 120 minutes la durée de grâce documentée, les modèles
  d'installation et le défaut du code pour les anciens jetons.
- PWA-022 — Séparer le frontend statique des routes dynamiques du serveur on-premise.
- PWA-023 — Supprimer les hypothèses d'API same-origin dans le frontend.
- PWA-024 — Définir un protocole versionné entre PWA et serveur on-premise.
- PWA-025 — Ajouter un vrai hôte d'écoute configurable au serveur Node.
- PWA-026 — Gérer proprement les erreurs d'écoute et d'initialisation WebRTC.
