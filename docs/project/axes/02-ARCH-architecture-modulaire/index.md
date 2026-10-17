# 02 — ARCH — Architecture modulaire

## Résultat visé

Partager les services métier entre API, Socket.IO et futurs transports; garder
les détails de RobotJS et des intégrations externes hors des contrôleurs.

## Plan de travail

- [x] ARCH-002 — extraire la logique métier des handlers Socket.IO dans des routeurs par domaine.
- [ ] ARCH-003 — spécifier et versionner explicitement le protocole client/serveur `route:request`.
- [ ] ARCH-004 — définir un contrat de transport client indépendant de Socket.IO et vérifier qu'au.
- [x] ARCH-005 — adapter Socket.IO au protocole `route:request` sans régression connue.
- [ ] ARCH-006 — établir des tests de contrat réutilisables et les exécuter pour chaque transport.
- [x] ARCH-007 — clarifier LISTEN_HOST, PUBLIC_BASE_URL et proxies fiables.
- [x] ARCH-008 — uniformiser les routeurs API client avec des handlers nommés et exportés, en.
- [x] ARCH-009 — séparer le service d'overlay QR de ses implantations système.
- [x] ARCH-010 — séparer la garde des actions administratives de la souscription des événements.
- [x] ARCH-011 — formaliser le contrat de canal et exposer une orchestration nommée des souscriptions.
- [x] ARCH-012 — externaliser les composants d'orchestration de `bootstrapSocket` et tester séparément les guards, notifications.
- [x] ARCH-013 — regrouper les composants Socket.IO et les souscriptions métier par responsabilité.
- [x] ARCH-014 — retirer l'orchestration `createEventSubscriptions` de `server/remotes` et la regrouper avec l'adaptation de canal.
- [x] ARCH-015 — transformer `createEventSubscriptions` en service d'orchestration réutilisable, construisant les subscribers une fois.
- [x] ARCH-016 — corriger le bootstrap Socket.IO pour consommer le service de souscriptions enregistré.
- [x] ARCH-017 — aligner le nom et l'injection du service de souscriptions, supprimer les derniers.
- [x] ARCH-018 — séparer les snapshots et la journalisation de configuration système et fonctionnelle.
- [x] ARCH-019 — valider la configuration système au démarrage avec Joi et protéger les écritures.
- [x] ARCH-020 — extraire les guards de validation de configuration dans des middlewares autonomes, testés.
- [x] ARCH-021 — extraire le contexte de configuration géré dans un module testable indépendamment.
- [x] ARCH-022 — extraire les handlers de configuration administrateur et réduire le routeur.
- [x] ARCH-023 — extraire les handlers d'actions administrateur et réduire le routeur à la composition.
- [x] ARCH-024 — extraire les handlers du catalogue des remotes et réduire le routeur.
- [x] ARCH-025 — extraire les handlers d'authentification administrateur et réduire le routeur au rate limiter.
- [x] ARCH-026 — extraire les handlers des informations serveur et réduire le routeur.
- [x] ARCH-027 — découpler le catalogue des remotes du routeur administrateur et le monter sous.
- [x] ARCH-028 — organiser `connection/api` par responsabilité et harmoniser les suffixes de fichiers.
- [x] ARCH-029 — extraire les derniers handlers inline des routeurs HTTP et réduire les routeurs.
- [x] ARCH-030 — regrouper les montages HTTP publics et protégés dans quelques routeurs de frontière.
- [x] ARCH-031 — verrouiller les frontières de montage HTTP par des tests de composition.
- [x] ARCH-032 — formaliser le contrat du canal d'événements entre transport et subscribers, sans introduire.
- [x] ARCH-033 — supprimer les alias et références legacy des événements et actions QR avant.
- [x] ARCH-034 — adapter les transports vers un canal subscriber Express-like avec payload, réponse.
- [x] ARCH-035 — extraire le chaînage de callbacks dans un composant neutre réutilisable.
- [x] ARCH-046 — faire de `route:request` le protocole générique des messages d'actions et vérifier.
