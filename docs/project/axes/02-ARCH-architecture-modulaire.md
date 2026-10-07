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
- [x] ARCH-007 — clarifier LISTEN_HOST, PUBLIC_BASE_URL et proxies fiables.
- [x] ARCH-008 — uniformiser les routeurs API client avec des handlers nommés
  et exportés, en laissant au routeur uniquement la composition des chemins et
  verbes; préserver les contrats HTTP et couvrir chaque handler directement.
- [x] ARCH-009 — séparer le service d'overlay QR de ses implantations système :
  conserver dans `server/services/overlay` le contrat, l'état et l'orchestration
  indépendants de la plateforme; déplacer sous `server/os/linux/overlay` et
  `server/os/win32/overlay` la création des fenêtres, les processus natifs ou
  PowerShell et leurs protocoles; fournir l'adaptateur par le service OS sans
  appel direct à `os.platform()` depuis le service métier.
- [x] ARCH-010 — séparer la garde des actions administratives de la souscription
  des événements : le contexte d'autorisation est évalué au bootstrap Socket.IO,
  tandis que le registrar admin reçoit un canal et un émetteur de réponses.
- [x] ARCH-011 — formaliser le contrat de canal (`id`, `on`, `emit`) et exposer
  une orchestration nommée des souscriptions (`subscribeInput`,
  `subscribeBrowser`, etc.) sans dispatcher métier central.
- [x] ARCH-012 — externaliser les composants d'orchestration de
  `bootstrapSocket` et tester séparément les guards, notifications et
  souscriptions Socket.IO.
- [x] ARCH-013 — regrouper les composants Socket.IO et les souscriptions métier
  par responsabilité, avec un fichier par orchestration ou guard et des noms
  explicites; supprimer le module fourre-tout `socketBootstrapComponents`.
- [x] ARCH-014 — retirer l'orchestration `createEventSubscriptions` de
  `server/remotes` et la regrouper avec l'adaptation de canal Socket.IO.
- [x] ARCH-015 — transformer `createEventSubscriptions` en service d'orchestration
  réutilisable, construisant les subscribers une fois et exposant `subscribeAll`.
- [x] ARCH-016 — corriger le bootstrap Socket.IO pour consommer le service de
  souscriptions enregistré, sans importer un handler supprimé.
- [ ] Séparer configuration système et fonctionnelle; valider au démarrage.

Voir aussi l'[axe PWA](./06-PWA-application-web.md) pour les contrats de
transport et déploiement.
Chaque tâche doit préciser les modules concernés, la stratégie de compatibilité
et les tests avant son implémentation.

## ARCH-009 — Frontière du service d'overlay

**Dépendance:** l'implantation fonctionnelle de `PLAT-004l` sert de référence;
ce refactoring ne doit pas modifier son comportement ni réintroduire YAD.

**Modules concernés:**

- `server/services/overlay` pour le contrat applicatif commun;
- `server/services/os` pour la sélection et l'injection de l'adaptateur;
- `server/os/linux/overlay` pour le helper X11/XWayland;
- `server/os/win32/overlay` pour l'implantation PowerShell/WinForms;
- `native/wayland` pour le source C, dont l'emplacement reste inchangé.

**Critères d'acceptation:**

- `server/services/overlay` n'importe aucun module spécifique à Linux, Windows
  ou macOS et ne consulte pas directement `os.platform()`;
- le service commun possède l'état logique et les opérations `show`, `hide`,
  `toggle`, `update` et `close`, tandis que les adaptateurs possèdent les
  fenêtres, processus, protocoles et erreurs propres à leur OS;
- l'adaptateur est obtenu par la façade OS existante et un adaptateur nul garde
  le serveur opérationnel sur une plateforme non prise en charge;
- Linux conserve l'affichage et le survol natifs validés par `PLAT-004l`, et
  Windows conserve la géométrie ainsi que les commandes actuelles;
- des tests de contrat communs sont rejoués contre les adaptateurs simulés et
  les tests spécifiques Linux et Windows restent verts;
- aucun changement n'est apporté au protocole client, à la configuration
  persistée ou au cycle de jumelage QR.
