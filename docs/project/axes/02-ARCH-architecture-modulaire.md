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
- [x] ARCH-027 — découpler le catalogue des remotes du routeur administrateur
  et le monter sous un nom de transport neutre.
- [x] ARCH-028 — organiser `connection/api` par responsabilité (`routers`,
  `handlers`, `guards`, `middlewares`) et harmoniser les suffixes de fichiers.
- [x] ARCH-029 — extraire les derniers handlers inline des routeurs HTTP et
  réduire les routeurs à la composition Express.
- [x] ARCH-030 — regrouper les montages HTTP publics et protégés dans quelques
  routeurs de frontière, sans fusionner les handlers métier.
- [x] ARCH-031 — verrouiller les frontières de montage HTTP par des tests de
  composition et clôturer la consolidation du routage.
- [x] ARCH-032 — formaliser le contrat du canal d'événements entre transport et
  subscribers, sans introduire de dispatcher central.
- [x] ARCH-033 — supprimer les alias et références legacy des événements et
  actions QR avant toute validation locale des payloads.
- [x] ARCH-034 — adapter les transports vers un canal subscriber Express-like
  avec payload, réponse et chaîne de callbacks.
- [x] ARCH-035 — extraire le chaînage de callbacks dans un composant neutre
  réutilisable par les adapters Socket.IO et WebRTC.

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

## ARCH-027 — Routeur neutre du catalogue des remotes

**Modules concernés:**

- `server/connection/api/remotes-catalog.router.js` pour le routeur partagé;
- `server/init/routers/createAdminApiRouter.js` et
  `server/connection/api/client-api.router.js` pour les montages;
- tests de composition client et administrateur.

**Critères d'acceptation:**

- le catalogue est exporté sous un nom neutre, sans référence au rôle admin;
- les API client et admin montent la même instance de routeur;
- l'ancien fichier et les alias historiques ne sont plus importés;
- les contrats JSON existants sont conservés et la suite complète reste verte.

## ARCH-028 — Organisation des composants HTTP par responsabilité

**Modules concernés:**

- `server/connection/api/routers/` pour la composition des routes Express;
- `server/connection/api/handlers/` pour les traitements de requêtes et
  projections de réponse;
- `server/connection/api/guards/` pour les contrôles d'accès et validations;
- `server/connection/api/middlewares/` pour les middlewares transversaux;
- les points de bootstrap et les tests unitaires qui importent ces composants.

**Critères d'acceptation:**

- les routeurs, handlers, guards et middlewares sont regroupés dans leurs
  répertoires dédiés;
- les noms de fichiers suivent les suffixes `.router.js`, `.handler(s).js`,
  `.guard.js` et `.middleware.js` selon le contrat exposé;
- les imports de production et de tests utilisent les nouveaux chemins, sans
  fichier d'API déplacé laissé à la racine;
- le comportement HTTP, les exports publics et les contrats JSON sont
  conservés;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-029 — Routeurs HTTP réduits à la composition

**Modules concernés:**

- `server/connection/api/handlers/` pour les sessions, souscriptions, remotes
  et API client;
- `server/connection/api/routers/` pour les montages Express;
- tests unitaires directs des nouveaux handlers.

**Critères d'acceptation:**

- les routeurs sessions, souscriptions, remotes et client ne contiennent plus
  de traitement de requête inline;
- chaque traitement est importé depuis un handler testable indépendamment;
- les chemins, statuts et payloads HTTP restent inchangés;
- les tests ciblés et la suite complète restent verts;
- la version patch est incrémentée.

## ARCH-030 — Frontières de montage HTTP regroupées

**Modules concernés:**

- `server/connection/api/routers/admin.router.js` pour la composition de toute
  l'API administrateur;
- `server/connection/api/routers/client.router.js` pour les surfaces statiques,
  client et remotes;
- `server/init/routers/public.router.js` et `protected.router.js` pour les
  frontières d'ordre des middlewares;
- `server/init/bootstrapApi.js` et `server/init/handlers/health.handler.js`.

**Critères d'acceptation:**

- les petits fichiers de composition de `connection/api/routers` sont regroupés
  dans `admin.router.js` et `client.router.js`;
- `bootstrapApi` monte quelques routeurs de frontière au lieu de déclarer tous
  les préfixes individuellement;
- l'ordre reste inchangé : entrée publique avant le guard de session, routes
  protégées après `securityRouter`, puis gestionnaire d'erreurs;
- les handlers métier et les routeurs de domaine restent séparés;
- les contrats `/health`, `/qr`, sessions, client, remotes et administration
  sont conservés;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-031 — Contrats des frontières de montage HTTP

**Modules concernés:**

- `server/init/routers/public.router.js` et `protected.router.js`;
- `server/init/bootstrapApi.js` pour l'ordre des montages;
- tests de composition des préfixes publics et protégés.

**Critères d'acceptation:**

- les préfixes `/api/sessions`, `/api/client`, `/api/remotes`,
  `/api/admin-auth`, `/api/admin`, `/ui/admin`, `/qr` et `/health` sont
  vérifiés par des tests de composition;
- les frontières publiques et protégées restent distinctes;
- aucun changement de handler métier ou de payload HTTP n'est introduit;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-032 — Contrat transport-subscriber

**Modules concernés:**

- `server/services/transport/event-channel.js` pour le contrat `on`/`emit`;
- `server/services/transport/createEventSubscriptionService.js` pour la
  validation à la frontière transport;
- tests du service de souscriptions et des adapters de canal.

**Critères d'acceptation:**

- le service de souscriptions valide qu'un canal expose `on` et `emit`;
- les subscribers restent responsables du routage vers leurs outils métier;
- aucun dispatcher métier central n'est ajouté;
- plusieurs transports peuvent satisfaire le même contrat sans modifier les
  subscribers;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-033 — Retrait des alias legacy des actions QR

**Modules concernés:**

- `server/remotes/admin/subscriber.js`;
- `server/services/transport/createEventSubscriptionService.js`;
- tests du subscriber administrateur et recherche des références obsolètes.

**Critères d'acceptation:**

- le subscriber admin reçoit `qrActions` sous son nom fonctionnel;
- aucun alias `legacyQrActions` ne subsiste dans le code ou les tests;
- les événements QR continuent d'utiliser les mêmes actions partagées;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-034 — Adapter de canal transport pour les subscribers

**Modules concernés:**

- `server/connection/socket/createSocketChannelAdapter.js` pour l'adaptation
  Socket.IO;
- `server/services/transport/event-channel.js` pour le contrat commun;
- `server/init/bootstrapSocket.js` et les tests du bootstrap;
- tests de chaîne de callbacks et de réponse d'événement.

**Critères d'acceptation:**

- le canal expose `id`, `on(event, callback, ...callbacks)` et `emit`;
- les callbacks reçoivent `(payload, response?, next?)`;
- `next()` enchaîne les callbacks comme un middleware Express;
- le service de souscriptions reçoit un adapter et non le socket brut;
- les guards peuvent être ajoutés à la chaîne sans modifier les subscribers;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-035 — Chaînage de callbacks indépendant du transport

**Modules concernés:**

- `server/services/transport/createEventCallbackChain.js` pour la sémantique
  Express-like commune;
- `server/connection/socket/createSocketChannelAdapter.js` pour l'adaptation
  Socket.IO;
- tests du chaînage et des erreurs de callback.

**Critères d'acceptation:**

- le chaînage `(payload, response?, next?)` ne dépend d'aucun transport;
- Socket.IO conserve la traduction de son acknowledgement vers `response`;
- les erreurs sont déléguées à l'adapter qui choisit sa réponse transport;
- un futur adapter WebRTC peut réutiliser le même composant;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-036 — Subscribers regroupés par responsabilité de connexion

**Modules concernés:**

- `../../../server/connection/actions` pour l'ensemble des adapters de souscription
  aux événements de transport;
- `server/services/transport/createEventSubscriptionService.js` pour la
  composition des subscribers;
- tests unitaires des subscribers et du service de souscriptions.

**Critères d'acceptation:**

- les subscribers d'entrée, de remotes et de connexion sont regroupés sous
  `../../../server/connection/actions`;
- les actions métier restent dans `server/remotes/` et ne sont pas déplacées
  dans cette consolidation;
- les imports du service et des tests utilisent les nouveaux chemins sans
  alias de compatibilité obsolète;
- chaque subscriber conserve son contrat de canal et son routage vers l'outil
  métier correspondant;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-037 — Réponse administrateur portée par le canal

**Modules concernés:**

- `../../../server/connection/actions` pour la réponse des
  actions administrateur;
- tests unitaires du subscriber administrateur.

**Critères d'acceptation:**

- le subscriber admin utilise le paramètre `response` fourni au callback du
  canal;
- aucune dépendance à `createSocketActionResponder` ne subsiste dans ce
  subscriber;
- le payload de réponse conserve les champs `action`, `ok`, `message` et
  `openUrl`;
- l'absence de callback de réponse reste tolérée;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-038 — Guards et réponses regroupés avec les subscribers

**Modules concernés:**

- `../../../server/connection/actions` et
  `../../../server/connection/actions` pour le montage local
  des guards administrateur;
- `server/services/transport/sendActionResponse.js` pour la forme commune des
  réponses d'action;
- `../../../server/connection/actions` et l'adapter Socket.IO;
- tests des guards, subscribers et du bootstrap Socket.IO.

**Critères d'acceptation:**

- le guard administrateur est monté uniquement sur les événements `admin:*`;
- aucun guard administrateur métier n'est enregistré comme middleware global
  Socket.IO;
- les subscribers admin et QR utilisent la même abstraction de réponse;
- le payload de réponse est uniforme (`action`, `ok`, `message`, `openUrl`);
- le contexte de sécurité est disponible sur le channel adapté;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-039 — Canal fluent et réponse implicite

**Modules concernés:**

- `server/connection/socket/createSocketChannelAdapter.js` pour la
  normalisation du payload et le chaînage fluent;
- `../../../server/connection/actions` pour la composition
  directe des appels `channel.on`;
- subscribers d'entrée, navigateur et VLC pour la suppression des valeurs par
  défaut transport-spécifiques;
- tests du channel adapter et des subscribers.

**Critères d'acceptation:**

- chaque appel `channel.on(...)` retourne le channel et peut être chaîné;
- l'adapter transforme un payload absent en objet avant d'appeler le callback;
- les callbacks n'initialisent plus eux-mêmes `payload = {}`;
- les réponses sont envoyées directement via le callback `response`;
- aucune abstraction `sendActionResponse` n'est nécessaire dans les
  subscribers;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-040 — Navigation client et réponses minimales

**Modules concernés:**

- `client/ui/main/bindings/bindAdminRemoteButtons.js` pour la navigation
  locale des pages QR et informations serveur;
- actions administrateur de navigation et subscribers admin/QR;
- `client/services/notifications/createNotificationService.js` pour le retrait
  de l'ancien événement de résultat;
- tests unitaires des actions et réponses.

**Critères d'acceptation:**

- le client ouvre directement `/qr` et `/ui/admin/server-info`;
- les actions serveur de navigation ne renvoient plus `openUrl`;
- les réponses d'action contiennent uniquement `ok` et `message`;
- le champ `action` et le topic client `admin.result.received` sont supprimés;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-041 — Subscriber QR conforme au channel fluent

**Modules concernés:**

- `../../../server/connection/actions`;
- test du subscriber QR et contrat fluent du channel.

**Critères d'acceptation:**

- les quatre événements QR sont enregistrés par chaînage de `channel.on`;
- le subscriber ne normalise pas lui-même le payload;
- la réponse est transmise directement par `response` avec `{ok, message}`;
- l'adapter reste responsable du payload absent et du chaînage;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-042 — Callbacks QR explicites

**Modules concernés:**

- `../../../server/connection/actions`;
- test du subscriber QR.

**Critères d'acceptation:**

- aucun helper intermédiaire ne masque les callbacks QR;
- chaque événement est visible directement dans la chaîne `channel.on`;
- chaque callback utilise le payload fourni et la réponse du channel;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-043 — Routage commun des événements par `pillarjs/router`

**Modules concernés:**

- `server/connection/socket/createSocketChannelAdapter.js` pour le pont
  Socket.IO vers une instance de routeur middleware;
- `utils/remoteCommands.js` et les événements de prévisualisation pour la
  convention de chemins (`admin/update-check`, `mouse/move`, etc.);
- tests unitaires du channel et du bootstrap Socket.IO;
- dépendances npm et documentation d'architecture.

**Critères d'acceptation:**

- l'adaptateur retourne directement une instance fonctionnelle de
  `pillarjs/router`, enrichie du contrat `id`, `securityContext`, `on` et
  `emit`;
- chaque abonnement `channel.on(event, ...callbacks)` devient une route
  middleware, avec prise en charge des guards et du chaînage `next`;
- le middleware `socket.use` transforme les paquets Socket.IO en requêtes
  synthétiques envoyées au routeur, puis relaie les erreurs à `next`;
- les événements de transport utilisent une notation par chemin séparé par
  `/`, sans modifier les permissions ou les topics internes du serveur;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-044 — Adaptateur routeur isolé et migration progressive

**Modules concernés:**

- `server/services/transport/createRouterChannelAdapter.js` pour l'adaptateur
  indépendant du transport;
- `server/connection/socket/createSocketChannelAdapter.js` pour conserver le
  comportement Socket.IO éprouvé pendant la migration;
- tests unitaires du nouvel adaptateur et de son contrat middleware.

**Critères d'acceptation:**

- le nouvel adaptateur est testable sans Socket.IO et retourne une instance
  `pillarjs/router` enrichie du contrat de channel;
- son entrée `dispatch` transforme un événement en requête synthétique et
  permet d'utiliser `channel.use` pour les guards;
- l'adaptateur Socket.IO existant reste inchangé pendant cette phase;
- aucun subscriber n'est basculé implicitement: les migrations seront faites
  une par une après validation de cet adaptateur;
- les tests ciblés et la suite complète restent verts, avec bump patch.

## ARCH-045 — Routeur Socket.IO global et factories de routes

**Modules concernés:**

- `server/init/bootstrapSocket.js` pour le routeur partagé et le pont
  `socket.use`;
- `server/services/transport/createEventSubscriptionService.js` pour séparer
  l'enregistrement des routes des abonnements Socket.IO historiques;
- `../../../server/connection/actions` comme première factory de
  routes migrée;
- tests du bootstrap, du registre d'événements et de la factory QR.

**Critères d'acceptation:**

- un seul routeur est créé au bootstrap et toutes les routes migrées y sont
  enregistrées avant les connexions;
- `socket.use(([event, ...args], next) => ...)` construit une requête avec le
  socket, le payload et la réponse, puis appelle le routeur global;
- la factory QR utilise directement `router.post` et le contexte de
  `request.socket`;
- les subscribers non migrés continuent d'utiliser l'adaptateur Socket.IO
  existant sans régression;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-046 — Protocole `route:request` et migration complète des subscribers

**Modules concernés:**

- `server/init/bootstrapSocket.js` pour le routeur global par connexion et le
  listener Socket.IO `route:request`;
- tous les fichiers `../../../server/connection/actions` pour les
  factories `router.post`;
- `client/core/socket-emit.js` et le transport Socket.IO pour le nouveau
  paquet `{path, method, body}`;
- guards de timestamp et de taille/rate-limit pour lire le chemin encapsulé;
- tests unitaires des factories et du protocole.

**Critères d'acceptation:**

- aucun subscriber ne s'enregistre plus avec `channel.on(event, ...)`;
- chaque subscriber routeur exporte directement une instance `*.router.js`
  montée sur le routeur global;
- les commandes client passent exclusivement par `route:request`;
- le serveur reçoit `route:request` avec `{path, method, body}` et transmet la
  requête au routeur;
- les guards de transport conservent validation de timestamp, taille et
  limitation des routes administratives;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-047 — Domaines de routes et statuts HTTP cohérents

**Modules concernés:**

- `server/connection/actions/*.router.js` pour les chemins de ressources et
  les méthodes HTTP par domaine;
- `utils/remoteCommands.js` et les émetteurs clients pour aligner le protocole
  `route:request` sur les chemins structurés;
- `server/connection/socket/socket-response.adapter.js` et les handlers pour
  les statuts `200`, `201`, `204` et les réponses sans contenu;
- tests unitaires et intégrés des routeurs et de l'adaptateur de réponse.

**Critères d'acceptation:**

- chaque route est rattachée à un domaine de ressource explicite et n'emploie
  pas un verbe d'action comme nom de ressource;
- les opérations de création, modification et suppression utilisent les
  méthodes HTTP et chemins de ressources appropriés;
- les réponses de création utilisent `201`, les suppressions sans contenu
  utilisent `204` et les lectures ou mutations retournant un corps utilisent
  un statut explicite cohérent;
- l'adaptateur Socket.IO expose et respecte `status`, `send`, `end` et
  `sendStatus` sans double réponse;
- le protocole client et les tests couvrent les nouveaux chemins sans alias
  d'action;
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
