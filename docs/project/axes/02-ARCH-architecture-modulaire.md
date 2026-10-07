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
- [x] ARCH-017 — aligner le nom et l'injection du service de souscriptions,
  supprimer les derniers anciens points d'entrée et vérifier les imports de
  production.
- [x] ARCH-018 — séparer les snapshots et la journalisation de configuration
  système et fonctionnelle; conserver des contrats distincts pour les
  préférences persistées et les paramètres techniques validés au démarrage.
- [x] ARCH-019 — valider la configuration système au démarrage avec Joi et
  protéger les écritures de configuration de l'API par des guards Joi.
- [x] ARCH-020 — extraire les guards de validation de configuration dans des
  middlewares autonomes, testés séparément et montés explicitement sur les
  routes d'écriture.
- [x] ARCH-021 — extraire le contexte de configuration géré dans un module
  testable indépendamment des routeurs Express.
- [x] ARCH-022 — extraire les handlers de configuration administrateur et
  réduire le routeur à la composition HTTP, guards et handlers.
- [x] ARCH-023 — extraire les handlers d'actions administrateur et réduire le
  routeur à la composition HTTP.
- [x] ARCH-024 — extraire les handlers du catalogue des remotes et réduire le
  routeur à la composition HTTP.
- [x] ARCH-025 — extraire les handlers d'authentification administrateur et
  réduire le routeur au rate limiter et aux routes.
- [x] ARCH-026 — extraire les handlers des informations serveur et réduire le
  routeur à la composition HTTP.

Voir aussi l'[axe PWA](./06-PWA-application-web.md) pour les contrats de
transport et déploiement.
Chaque tâche doit préciser les modules concernés, la stratégie de compatibilité
et les tests avant son implémentation.

## ARCH-018 — Contrats de configuration système et fonctionnelle

**Modules concernés:**

- `server/connection/api/server-info.router.js` pour les snapshots exposés à
  l'interface d'administration;
- `server/services/config/logConfig.js` pour les journaux de démarrage;
- les tests unitaires des snapshots et de la journalisation.

**Critères d'acceptation:**

- le snapshot `config` contient uniquement la configuration fonctionnelle
  persistée, notamment `updateCheck.enabled` et `updateCheck.intervalMin`;
- le snapshot `sysConfig` contient uniquement les paramètres système validés
  au démarrage, notamment les commandes, délais et métadonnées techniques de
  mise à jour;
- les journaux de démarrage nomment séparément les deux espaces de
  configuration et ne fusionnent plus leurs champs homonymes;
- les contrats existants des services de mise à jour et de tâche restent
  compatibles;
- les tests unitaires couvrent l'absence de mélange et la suite complète reste
  verte.

## ARCH-019 — Validation Joi des frontières de configuration

**Modules concernés:**

- `server/services/config/systemConfigSchema.js` et le chargement système au
  démarrage;
- `server/connection/api/configs.js` et le routeur administrateur pour les
  valeurs persistées;
- tests de démarrage et de contrat des écritures API.

**Critères d'acceptation:**

- la configuration système complète est validée par un schéma Joi strict avant
  que le serveur poursuive son démarrage;
- les erreurs de configuration système agrègent les chemins invalides sans
  exposer de secret;
- le payload des écritures de configuration n'accepte aucun champ inconnu;
- chaque valeur persistée est validée par son type, ses bornes et ses options
  avant `setConfig`;
- les valeurs valides continuent d'être converties et les valeurs `null`
  conservent le contrat de réinitialisation;
- la suite complète reste verte.

## ARCH-023 — Handlers d'actions administrateur

**Modules concernés:**

- `server/connection/api/admin-action.handlers.js` pour les actions métier;
- `server/connection/api/admin-actions.router.js` pour la composition des
  routes;
- tests unitaires des handlers avec les intégrations Samsung et service
  simulées.

**Critères d'acceptation:**

- la découverte Samsung et le redémarrage du service sont exportés comme
  handlers autonomes;
- le routeur ne contient plus de logique métier ou de mapping de réponse;
- les erreurs et codes HTTP existants sont conservés;
- chaque handler est testé indépendamment et la suite complète reste verte.

## ARCH-022 — Handlers de configuration administrateur

**Modules concernés:**

- `server/connection/api/admin-config.handlers.js` pour les opérations HTTP;
- `server/connection/api/admin-configs.router.js` pour la composition des
  routes et du middleware;
- tests unitaires des handlers avec services simulés.

**Critères d'acceptation:**

- les quatre opérations de configuration sont exportées comme handlers
  autonomes;
- le routeur ne contient plus de logique de réponse ou de persistance;
- les guards restent montés explicitement sur les routes d'écriture;
- les réponses et codes HTTP existants sont conservés;
- chaque handler est testé sans démarrer Express et la suite complète reste
  verte.

## ARCH-021 — Contexte de configuration testable

**Modules concernés:**

- `server/connection/api/getManagedConfigContext.js` pour la construction du
  contexte géré;
- `server/connection/api/admin-configs.router.js` pour la composition des
  routes;
- test unitaire du contexte avec services simulés.

**Critères d'acceptation:**

- `getManagedConfigContext` est exportée depuis son propre module;
- la disponibilité VLC et la projection des valeurs fonctionnelles sont
  testées sans démarrer Express;
- le routeur ne contient plus l'assemblage du contexte;
- la lecture de configuration est effectuée une seule fois par construction;
- la suite complète reste verte.

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

## ARCH-024 — Handlers du catalogue des remotes

**Modules concernés:**

- `server/connection/api/admin-remotes.handlers.js` pour le catalogue métier;
- `server/connection/api/admin-remotes.router.js` pour la composition HTTP;
- tests unitaires des catalogues navigateur et remotes.

**Critères d'acceptation:**

- `listBrowsers`, `listRemotes` et `isBrowserEnabled` sont exportés hors du
  routeur;
- le routeur ne contient plus de construction de réponse;
- le routeur est exporté directement sous `adminRemotesRouter`, sans alias;
- la disponibilité VLC et les préférences d'activation sont conservées;
- les handlers sont testés indépendamment et la suite complète reste verte.

## ARCH-026 — Handlers des informations serveur

**Modules concernés:**

- `server/connection/api/server-info.handlers.js` pour la collecte et la
  projection des données;
- `server/connection/api/server-info.router.js` pour la composition HTTP;
- tests unitaires du handler page et du handler data.

**Critères d'acceptation:**

- les handlers page et données sont exportés hors du routeur;
- les fonctions de masquage, snapshots et tokens restent testables;
- le contrat JSON de `/data` est conservé;
- le routeur ne contient plus de collecte de services;
- la suite complète reste verte.

## ARCH-025 — Handlers d'authentification administrateur

**Modules concernés:**

- `server/connection/api/admin-auth.handlers.js` pour l'élévation et la
  révocation;
- `server/connection/api/admin-auth.router.js` pour le rate limiter et les
  routes;
- tests unitaires des handlers cryptographiques et de session.

**Critères d'acceptation:**

- la comparaison du mot de passe et les opérations de session sont hors du
  routeur;
- le rate limiter reste monté au niveau de la route;
- les exports de handlers nécessaires restent compatibles;
- les cas de succès, refus et déconnexion de sockets sont testés;
- la suite complète reste verte.

## ARCH-020 — Guards de validation autonomes

**Modules concernés:**

- `server/connection/api/config-validation.middleware.js` pour les guards
  Joi autonomes;
- `server/connection/api/admin-configs.router.js` pour leur montage explicite;
- tests unitaires du middleware et des helpers de configuration.

**Critères d'acceptation:**

- le routeur ne contient plus la logique de validation Joi;
- le middleware valide chemin, payload, conversion, bornes et réinitialisation;
- les valeurs validées sont transmises au handler via un contrat de requête
  explicite;
- les cas valides, invalides, champs inconnus et `null` sont testés directement;
- la suite complète reste verte.
