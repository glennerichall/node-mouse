# ARCH-008-022-031 — API HTTP et routeurs

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## ARCH-008 — uniformiser les routeurs API client avec des handlers nommés

  et exportés, en laissant au routeur uniquement la composition des chemins et
  verbes; préserver les contrats HTTP et couvrir chaque handler directement.

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
