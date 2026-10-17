# ARCH — Transport et protocole

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## ARCH-003 — spécifier et versionner explicitement le protocole

**État:** À faire.

  client/serveur `route:request` (forme, règles de validation, compatibilité et
  stratégie de version); le nom d'événement et le payload actuels ne suffisent
  pas à établir une version de protocole.

## ARCH-004 — définir un contrat de transport client indépendant

**État:** À faire.

  Socket.IO et vérifier qu'au moins un second transport concret peut
  l'implémenter; le service client actuel reste spécifique à Socket.IO.

## ARCH-005 — adapter Socket.IO au protocole `route:request` sans régression

**État:** Terminé.

  connue; couvrir le transport client, la réception serveur et le routage par
  les tests ciblés.

## ARCH-006 — établir des tests de contrat réutilisables et les exécuter

**État:** À faire.

  pour chaque transport concret; les tests Express actuels valident le montage
  des routeurs, mais ne remplacent pas les tests d'un second transport.

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
- tests unitaires des factories, du protocole et du montage HTTP Express des
  routeurs d'actions.

**Critères d'acceptation:**

- aucun subscriber ne s'enregistre plus avec `channel.on(event, ...)`;
- chaque subscriber routeur exporte directement une instance `*.router.js`
  montée sur le routeur global;
- les commandes client passent exclusivement par `route:request`;
- le serveur reçoit `route:request` avec `{path, method, body}` et transmet la
  requête au routeur;
- les routeurs d'actions restent montables dans une application Express et
  leurs domaines, méthodes et statuts sont vérifiés par transport HTTP;
- les guards de transport conservent validation de timestamp, taille et
  limitation des routes administratives;
- la suite complète reste verte et la version patch est incrémentée.
