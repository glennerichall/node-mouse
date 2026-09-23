# Roadmap de Remote Mouse

> Feuille de route technique et fonctionnelle pour sécuriser, déployer et faire évoluer Remote Mouse.

## Vision

Faire de Remote Mouse une télécommande web :

- simple à installer sur mobile comme Progressive Web App (PWA) ;
- fluide et fiable sur un réseau local ou à distance ;
- accessible exclusivement en HTTPS/WSS ;
- sécurisée avant toute exposition à Internet ;
- facile à installer, mettre à jour, superviser et dépanner ;
- compatible à terme avec Linux, Windows et macOS.

## État actuel

Le projet possède déjà une base solide :

- interface mobile de contrôle de la souris et du clavier ;
- commandes navigateur, VLC, système et téléviseur Samsung ;
- API Express et communication temps réel Socket.IO ;
- accès initial par QR code et jeton ;
- persistance SQLite ;
- manifest PWA, icônes et service worker ;
- prise en charge directe de HTTPS avec une clé et un certificat fournis ;
- installateurs Linux et Windows ;
- reconnexion Socket.IO après la mise en veille du mobile ;
- 196 tests unitaires et 18 tests navigateur fonctionnels au moment de cette analyse.

La couverture actuelle est d'environ 60 % pour les lignes et 45 % pour les branches.

## Principes directeurs

1. La sécurité précède l'exposition à Internet.
2. Le service qui contrôle la souris, le clavier et les applications reste sur le PC contrôlé.
3. Le serveur tiers ne sert que de point d'entrée TLS et de relais sécurisé.
4. Le client HTTP, l'API, les flux SSE et Socket.IO utilisent une origine HTTPS unique.
5. Les fonctions administratives sont séparées des fonctions ordinaires de télécommande.
6. Toute évolution importante est accompagnée de tests et d'une documentation d'exploitation.

## Architecture cible

### Option recommandée avec serveur tiers

```text
Téléphone / PWA
  HTTPS + WSS
       │
       ▼
Serveur tiers / VPS
  Caddy :443
  Certificat TLS automatique
       │
       ▼
Tunnel WireGuard privé
       │
       ▼
PC contrôlé
  Remote Mouse :3000
  RobotJS / VLC / navigateurs
```

Le navigateur accède à une adresse stable telle que
`https://mouse.example.com`. Caddy termine la connexion TLS et transmet les
requêtes HTTP, SSE et WebSocket au PC à travers WireGuard.

Cette architecture permet de :

- conserver toutes les intégrations système sur le PC contrôlé ;
- ne publier aucun port Remote Mouse directement sur Internet ;
- automatiser l'émission et le renouvellement du certificat TLS ;
- chiffrer également le trajet entre le VPS et le PC ;
- rendre la PWA installable depuis une origine sécurisée reconnue ;
- conserver Socket.IO sur la même origine, en `wss://`.

### Alternative privée simplifiée

Pour un usage strictement personnel, **Tailscale Serve** constitue une solution
plus simple : HTTPS automatique, accès limité aux appareils du tailnet et proxy
local vers Remote Mouse, sans point d'entrée publiquement accessible.

Cette option est à privilégier si l'installation de Tailscale sur chaque mobile
est acceptable. L'option VPS + Caddy + WireGuard reste préférable lorsqu'un nom
de domaine public et un accès sans client VPN sont nécessaires.

## Risques à traiter en priorité

### P0 — Bloquants avant exposition réseau

- [ ] Corriger la confiance accordée à `X-Forwarded-For`.
  Le code ne doit jamais interpréter directement cet en-tête pour autoriser un
  accès local. Seuls les proxies explicitement approuvés doivent être reconnus.
- [ ] Supprimer ou fortement encadrer le contournement d'authentification fondé
  sur l'adresse `127.0.0.1`.
- [ ] Refuser le démarrage en production lorsque
  `SESSION_COOKIE_SECRET=change-me`.
- [ ] Mettre à jour les dépendances de production. L'audit initial a détecté
  huit alertes, dont trois élevées dans la chaîne Engine.IO, Socket.IO parser et
  WebSocket.
- [ ] Séparer le jeton temporaire du QR code de la session persistante créée
  pour un appareil.
- [ ] Créer des rôles distincts `controller` et `admin`.
- [ ] Protéger les routes HTTP d'administration au même niveau que les actions
  administratives Socket.IO.
- [ ] Ajouter une validation stricte de l'origine, une protection CSRF pour les
  écritures et une limitation de débit.
- [ ] Limiter la taille des corps HTTP et des messages Socket.IO.
- [ ] Ne jamais écrire les jetons, cookies ou secrets dans les journaux.

### P1 — Cohérence et fiabilité

- [ ] Aligner la durée de grâce documentée des anciens jetons avec le défaut du
  code. La documentation indique actuellement 120 minutes tandis que le code
  utilise une semaine.
- [ ] Ajouter un véritable hôte d'écoute au serveur Node. `SERVER_HOST` ne
  détermine actuellement que l'adresse affichée dans les URL.
- [ ] Distinguer l'adresse d'écoute, l'adresse du backend et l'URL publique.
- [ ] Ajouter un endpoint de santé interne utilisable par le proxy sans exposer
  les informations d'administration.
- [ ] Gérer proprement les erreurs d'écoute du serveur, par exemple un port déjà
  occupé ou interdit.

## Jalons

### Jalon 0 — Décisions d'architecture

**Objectif :** figer le mode d'accès et les responsabilités de chaque composant.

- [ ] Choisir entre VPS + Caddy + WireGuard et Tailscale Serve.
- [ ] Choisir et réserver le nom de domaine public.
- [ ] Choisir un VPS proche des utilisateurs afin de limiter la latence.
- [ ] Définir si l'accès distant doit être public, privé ou limité à certains
  comptes.
- [ ] Rédiger une courte décision d'architecture documentant les compromis.

**Estimation :** 0,5 à 1 jour.

### Jalon 1 — Durcissement de la sécurité

**Objectif :** rendre l'application suffisamment sûre pour être placée derrière
un proxy accessible depuis Internet.

- [ ] Corriger l'identification de l'adresse cliente derrière un proxy.
- [ ] Introduire une liste explicite de proxies autorisés.
- [ ] Générer un secret de cookie fort pendant l'installation.
- [ ] Introduire des sessions propres à chaque appareil.
- [ ] Ajouter la révocation d'une session ou de tous les appareils.
- [ ] Ajouter les rôles et autorisations administratives.
- [ ] Ajouter les protections CSRF, Origin et rate limiting.
- [ ] Ajouter les en-têtes CSP, HSTS, `X-Content-Type-Options` et une politique
  de permissions minimale.
- [ ] Mettre à jour les dépendances et traiter les alertes de sécurité.
- [ ] Ajouter les tests de non-régression associés à chaque correctif.

**Estimation :** 3 à 5 jours.

### Jalon 2 — Compatibilité reverse proxy

**Objectif :** rendre l'application indépendante de l'endroit où TLS est
terminé.

Variables de configuration proposées :

```dotenv
LISTEN_HOST=10.60.0.2
PORT=3000
PUBLIC_BASE_URL=https://mouse.example.com
TRUSTED_PROXY=10.60.0.1
EXTERNAL_HTTPS=true
```

- [ ] Utiliser `LISTEN_HOST` lors de l'appel à `server.listen`.
- [ ] Utiliser `PUBLIC_BASE_URL` pour le QR code et tous les liens publics.
- [ ] Marquer les cookies `Secure` lorsque l'origine publique est en HTTPS,
  même si le backend Node reçoit du HTTP dans le tunnel.
- [ ] Valider l'en-tête `Host` et l'origine Socket.IO attendue.
- [ ] Conserver HTTP, API, SSE et Socket.IO sur la même origine.
- [ ] Tester le comportement avec des en-têtes proxy légitimes et falsifiés.
- [ ] Tester les cookies et la reconnexion WebSocket derrière Caddy.

**Estimation :** 2 à 3 jours.

### Jalon 3 — Déploiement TLS sur serveur tiers

**Objectif :** fournir une URL HTTPS stable et renouvelée automatiquement.

#### Serveur tiers

- [ ] Configurer le DNS de `mouse.example.com` vers le VPS.
- [ ] Installer Caddy comme service système.
- [ ] Autoriser uniquement les ports publics 80 et 443 ainsi que le port
  WireGuard choisi.
- [ ] Configurer le certificat TLS automatique et la redirection HTTP vers
  HTTPS.
- [ ] Configurer le reverse proxy vers l'adresse WireGuard du PC.
- [ ] Vérifier le passage des connexions WebSocket sans configuration spéciale
  ou contournement de sécurité.
- [ ] Activer des journaux structurés avec une durée de rétention limitée.
- [ ] Superviser Caddy, le tunnel et la disponibilité du backend.

Exemple minimal de principe :

```caddyfile
mouse.example.com {
    encode zstd gzip
    reverse_proxy 10.60.0.2:3000
}
```

La configuration de production devra aussi inclure la politique d'en-têtes,
les journaux, les délais adaptés aux connexions longues et les contrôles de
santé.

#### PC contrôlé

- [ ] Configurer WireGuard pour initier ou maintenir le tunnel vers le VPS.
- [ ] Faire écouter Remote Mouse uniquement sur l'interface WireGuard.
- [ ] Refuser le port applicatif depuis les autres interfaces réseau.
- [ ] Démarrer Remote Mouse avec la session graphique appropriée.
- [ ] Sauvegarder le fichier SQLite et la configuration.
- [ ] Documenter la rotation des clés WireGuard et des secrets applicatifs.

**Estimation :** 2 à 4 jours.

### Jalon 4 — PWA installable et maintenable

**Objectif :** offrir une installation fiable sur Android, iOS et ordinateur.

Le manifest, les icônes et le service worker existent déjà. Ils seront
conservés et renforcés.

- [ ] Ajouter un bouton « Installer l'application » avec
  `beforeinstallprompt` lorsque le navigateur le permet.
- [ ] Afficher des instructions dédiées à Safari/iOS.
- [ ] Ajouter un écran hors ligne explicite.
- [ ] Ne pas laisser croire que les commandes sont utilisables lorsque le
  serveur est déconnecté.
- [ ] Générer la version du cache lors de chaque release.
- [ ] Informer l'utilisateur lorsqu'une nouvelle version est prête.
- [ ] Ajouter des captures d'écran et des raccourcis au manifest.
- [ ] Vérifier la zone sûre des icônes `maskable`.
- [ ] Tester l'installation, la mise à jour, la désinstallation et la
  reconnexion après mise en veille.
- [ ] Valider Android/Chrome, iOS/Safari et Chromium desktop.

Les service workers requièrent une origine sécurisée en dehors de `localhost`.
Le certificat TLS reconnu est donc une condition de cette étape, et pas
seulement une amélioration facultative.

**Estimation :** 2 à 4 jours.

### Jalon 5 — Industrialisation

**Objectif :** rendre les releases reproductibles et l'exploitation prévisible.

- [ ] Ajouter une CI exécutant les tests unitaires et Playwright.
- [ ] Ajouter des tests d'intégration HTTPS/WSS derrière un vrai proxy Caddy.
- [ ] Fixer les versions de Node.js officiellement prises en charge.
- [ ] Ajouter un contrôle automatisé des dépendances vulnérables.
- [ ] Tester l'installation et les services sur Linux et Windows.
- [ ] Ajouter une procédure de sauvegarde et de restauration SQLite.
- [ ] Ajouter des diagnostics de tunnel, DNS, certificat et WebSocket à la CLI.
- [ ] Documenter le déploiement, la mise à jour et le retour arrière.
- [ ] Définir des objectifs de disponibilité et de latence.

**Estimation :** 3 à 5 jours.

## Backlog fonctionnel

### Priorité haute

- [ ] **Appareils associés** — nom, rôle, dernière activité et révocation.
- [ ] **État de connexion détaillé** — serveur indisponible, tunnel interrompu,
  session expirée ou mise à jour en cours.
- [ ] **Multi-écrans** — sélection de l'écran et déplacement entre moniteurs.
- [ ] **Retour haptique** — vibration configurable sur les commandes tactiles.
- [ ] **Profils de contrôle** — présentation, multimédia, navigation et TV.

### Priorité moyenne

- [ ] **Presse-papiers bidirectionnel** avec consentement explicite.
- [ ] **Macros sécurisées** limitées à une liste d'actions autorisées.
- [ ] **Personnalisation des commandes** et de leur disposition.
- [ ] **Optimisation adaptative de la prévisualisation** selon la bande passante
  et la latence.
- [ ] **Wake-on-LAN du PC** lorsque l'architecture réseau le permet.

### Compatibilité et accessibilité

- [ ] Étudier un contrôle natif sous Wayland ou via les portails desktop.
- [ ] Ajouter un installateur et un service macOS.
- [ ] Tester les lecteurs d'écran et la navigation au clavier.
- [ ] Ajouter des tailles de contrôle et contrastes configurables.
- [ ] Réduire les mouvements et animations selon les préférences système.

## Stratégie de tests

Chaque jalon doit conserver ou améliorer les garanties existantes.

### Tests unitaires

- configuration publique et hôte d'écoute ;
- proxies autorisés et adresses clientes falsifiées ;
- création, expiration et révocation des sessions ;
- autorisation `controller`/`admin` ;
- cookies derrière TLS direct et TLS terminé par proxy ;
- validation Origin/CSRF et limites de taille.

### Tests d'intégration

- Caddy vers Remote Mouse à travers le tunnel ;
- HTTP redirigé vers HTTPS ;
- API, SSE et Socket.IO via la même origine ;
- renouvellement ou remplacement du certificat ;
- perte et reprise du tunnel WireGuard ;
- redémarrage du backend avec reconnexion du client.

### Tests navigateur

- installation PWA ;
- démarrage depuis l'icône installée ;
- mise à jour du service worker ;
- session persistante après fermeture ;
- révocation immédiate d'un appareil ;
- mise en veille et reprise sur mobile ;
- affichage cohérent en mode hors ligne.

## Critères de livraison de la première version distante

- [ ] Un en-tête `X-Forwarded-For: 127.0.0.1` falsifié ne donne aucun accès.
- [ ] Le port Node n'est pas accessible depuis Internet.
- [ ] Le QR code ouvre l'URL HTTPS publique attendue.
- [ ] Les cookies utilisent `Secure`, `HttpOnly` et une politique `SameSite`
  documentée.
- [ ] HTTP, API, SSE et Socket.IO fonctionnent derrière Caddy.
- [ ] La PWA s'installe et se reconnecte après une mise en veille.
- [ ] Un appareil révoqué perd immédiatement l'accès.
- [ ] Un contrôleur ordinaire ne peut exécuter aucune action administrative.
- [ ] Le certificat TLS est renouvelé automatiquement.
- [ ] Les sauvegardes et la restauration ont été testées.
- [ ] Les tests unitaires, d'intégration et navigateur passent dans la CI.
- [ ] Aucune vulnérabilité élevée connue ne subsiste dans les dépendances de
  production.

## Ordre de réalisation conseillé

```text
Décision d'architecture
        ↓
Correctifs de sécurité
        ↓
Support du reverse proxy
        ↓
Tunnel + Caddy + certificat TLS
        ↓
Parcours d'installation PWA
        ↓
CI, supervision et sauvegardes
        ↓
Nouvelles fonctionnalités
```

## Documentation de référence

- [Caddy — HTTPS automatique](https://caddyserver.com/docs/automatic-https)
- [Caddy — reverse proxy et WebSocket](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve)
- [MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web.dev — critères d'installation d'une PWA](https://web.dev/articles/install-criteria)

---

Cette roadmap est un document vivant. Les cases doivent être cochées à partir
de changements vérifiés et livrés, et non uniquement à partir d'une
implémentation locale non testée.
