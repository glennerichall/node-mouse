# 02 — ARCH — Architecture modulaire

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
- [x] ARCH-008 — uniformiser les routeurs API client avec des handlers nommés
  et exportés, en laissant au routeur uniquement la composition des chemins et
  verbes; préserver les contrats HTTP et couvrir chaque handler directement.
- [ ] Séparer configuration système et fonctionnelle; valider au démarrage.

Voir aussi l'[axe PWA](./06-PWA-application-web.md) pour les contrats de
transport et déploiement.
Chaque tâche doit préciser les modules concernés, la stratégie de compatibilité
et les tests avant son implémentation.
