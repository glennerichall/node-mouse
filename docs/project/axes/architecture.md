# Axe — Architecture modulaire

## Résultat visé

Partager les services métier entre API, Socket.IO et futurs transports; garder
les détails de RobotJS et des intégrations externes hors des contrôleurs.

## Plan de travail

- [ ] ARCH-001 — définir un dispatcher de commandes partagé.
- [ ] ARCH-002 — extraire la logique métier des handlers Socket.IO.
- [ ] ARCH-003 — définir et versionner le protocole client/serveur.
- [ ] ARCH-004 — introduire un contrat de transport client.
- [ ] ARCH-005 — adapter Socket.IO sans régression.
- [ ] ARCH-006 — tests de contrat pour chaque transport.
- [ ] ARCH-007 — clarifier LISTEN_HOST, PUBLIC_BASE_URL et proxies fiables.
- [ ] Séparer configuration système et fonctionnelle; valider au démarrage.

Voir aussi l'[axe PWA](./pwa.md) pour les contrats de transport et déploiement.
Chaque tâche doit préciser les modules concernés, la stratégie de compatibilité
et les tests avant son implémentation.
