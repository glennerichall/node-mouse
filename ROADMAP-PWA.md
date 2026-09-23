# Roadmap PWA de Remote Mouse

> Feuille de route spécialisée pour distribuer et installer Remote Mouse comme
> Progressive Web App, avec plusieurs modes de connexion interchangeables.

La vision générale, les fonctionnalités et les autres axes du projet sont
suivis dans [ROADMAP.md](./ROADMAP.md).

## Vision

Faire de Remote Mouse une télécommande web :

- simple à installer sur mobile comme Progressive Web App (PWA) ;
- fluide et fiable sur un réseau local ou à distance ;
- accessible exclusivement en HTTPS/WSS lorsqu'elle est installée comme PWA ;
- sécurisée avant toute exposition à Internet ;
- facile à installer, mettre à jour, superviser et dépanner ;
- compatible à terme avec Linux, Windows et macOS.

L'installation PWA est une capacité optionnelle. Le fonctionnement historique
du serveur local en HTTP ou HTTPS doit rester disponible sans dépendre d'un
service Internet.

## Limites actuelles des navigateurs et de TLS

Ces limites expliquent pourquoi plusieurs modes de déploiement sont nécessaires :

1. une PWA et son service worker doivent être servis depuis un contexte HTTPS
   reconnu, hors exception de développement pour `localhost` ;
2. le certificat TLS du serveur public ne couvre pas le serveur on-premise ;
3. une page HTTPS ne peut généralement pas ouvrir un WebSocket `ws://` non
   sécurisé ;
4. un WebSocket `wss://` ou une API HTTPS locale sont refusés si le certificat
   du serveur local n'est pas reconnu ou ne correspond pas à son nom ;
5. les permissions Local Network Access et le traitement du contenu mixte ne
   sont pas encore uniformes entre Chromium, Safari et Firefox ;
6. WebRTC fournit un transport pair-à-pair chiffré, mais nécessite une étape de
   signalisation et peut nécessiter STUN/TURN selon la topologie ;
7. un proxy TLS sur VPS résout la compatibilité navigateur, mais fait transiter
   le trafic applicatif par ce VPS ;
8. aucun mode ne doit être activé implicitement : l'utilisateur choisit son
   compromis entre simplicité, confidentialité, coût et accessibilité distante.

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
- 196 tests unitaires et 18 tests navigateur fonctionnels au moment de cette
  analyse.

La couverture actuelle est d'environ 60 % pour les lignes et 45 % pour les
branches.

## Le problème à résoudre

Une PWA chargée depuis `https://app.example.com` est exécutée dans un contexte
sécurisé. Le certificat de cette origine ne rend pas automatiquement fiable le
serveur on-premise.

Les connexions directes suivantes posent donc problème :

| Tentative | Résultat attendu |
| --- | --- |
| `ws://192.168.x.x:3000` | Refusée comme contenu mixte depuis une page HTTPS |
| `wss://192.168.x.x:3000` avec certificat autosigné | Refusée tant que le certificat n'est pas reconnu |
| `http://192.168.x.x:3000` | Non portable : contenu mixte et permissions d'accès au réseau local selon le navigateur |
| `https://192.168.x.x:3000` avec certificat autosigné | Avertissement ou refus, particulièrement problématique pour une PWA installée |

Le mécanisme Local Network Access de Chromium peut autoriser certains accès
HTTP locaux après une permission explicite. Il ne constitue cependant pas une
base suffisamment interopérable pour Android, iOS, Safari et les autres
navigateurs.

La solution doit donc proposer plusieurs stratégies activables selon le mode
d'installation, plutôt que figer un unique chemin réseau.

## Modes de déploiement compatibles

### Mode 0 — Serveur local autonome, sans PWA publique

```text
Téléphone ──HTTP/HTTPS + Socket.IO──► serveur on-premise
```

Ce mode conserve le fonctionnement actuel. Il ne dépend d'aucun service
Internet et laisse l'utilisateur choisir HTTP, HTTPS autosigné ou un
certificat qu'il gère lui-même. L'installation PWA n'est pas garantie, mais la
télécommande reste utilisable dans le navigateur.

### Mode 1 — Service PWA public gratuit et WebRTC local

```text
                    Internet

Téléphone ──HTTPS──► Service Remote Mouse certifié
   │                 - fichiers statiques PWA
   │                 - versions et manifest
   │                 - signalisation éphémère chiffrée
   │
   │  WebRTC DataChannel / DTLS
   │  connexion directe sur le LAN
   ▼
Serveur Remote Mouse on-premise
```

Le projet fournit gratuitement la PWA publique. Après la signalisation, les
données passent directement entre le mobile et le serveur on-premise par un
`RTCDataChannel` chiffré. Ce mode vise l'installation la plus simple sans
imposer à l'utilisateur son propre domaine ou VPS.

La signalisation doit être éphémère, chiffrée côté client, à usage unique et
supprimée après l'association. La politique STUN/TURN doit être explicite : un
mode « LAN uniquement » interdit TURN, tandis qu'un mode distant peut
l'autoriser en informant clairement l'utilisateur que le relais transporte ses
données chiffrées.

### Mode 2 — PWA et signalisation WebRTC auto-hébergées

```text
Téléphone ──HTTPS──► VPS de l'utilisateur : PWA + signalisation
   │
   │  WebRTC direct lorsque la topologie le permet
   ▼
Serveur Remote Mouse on-premise
```

L'utilisateur déploie les mêmes composants publics sur son propre VPS et son
propre domaine. Les données applicatives utilisent WebRTC ; le VPS héberge les
ressources PWA et la signalisation, ainsi qu'un éventuel TURN choisi et assumé
par l'utilisateur.

### Mode 3 — PWA auto-hébergée et proxy TLS à travers un VPN

```text
Téléphone ──HTTPS/WSS──► VPS de l'utilisateur
                            │ Caddy / reverse proxy
                            │
                            ▼
                       Tunnel VPN
                            │
                            ▼
                    serveur on-premise
```

Cette stratégie réutilise HTTP, SSE et Socket.IO avec peu de changements. Le
VPS termine TLS puis joint le serveur on-premise à travers WireGuard, Tailscale
ou un VPN équivalent. Elle est valide lorsque l'utilisateur accepte que son
trafic applicatif transite par son propre VPS.

### Mode 4 — VPS avec relais applicatif par reverse WebSocket

```text
                               connexion WSS sortante persistante
serveur on-premise ───────────────────────────────────────────► VPS
                                                                ▲
                                                                │
Téléphone / PWA ───────────── HTTPS + WSS ──────────────────────┘
```

Le serveur on-premise initie une connexion WebSocket sécurisée persistante vers
le VPS. Cette connexion joue le rôle d'un reverse tunnel applicatif :

1. le mobile appelle le VPS en HTTPS ou WSS comme s'il appelait directement le
   serveur on-premise ;
2. le relais associe la requête au serveur enregistré ;
3. il multiplexe la requête, les en-têtes et le corps dans le WebSocket sortant ;
4. le serveur on-premise traite la requête avec l'application existante ;
5. réponse HTTP, SSE ou flux WebSocket revient par le même tunnel.

Cette solution évite d'installer et d'administrer un VPN, ses routes et son
pare-feu sur les deux machines. Elle demande toutefois davantage de code dans
Remote Mouse : protocole de multiplexage, flux bidirectionnels, backpressure,
reconnexion, isolation des serveurs et traduction HTTP/WebSocket.

Le relais est une option auto-hébergée. Comme le proxy VPN, il fait transiter
les données applicatives par le VPS de l'utilisateur et termine TLS sur ce VPS.
Il ne doit pas être confondu avec le service PWA gratuit orienté WebRTC local.

Exigences minimales du relais :

- authentification forte du serveur on-premise et rotation des identifiants ;
- identifiant opaque par serveur et isolation stricte entre installations ;
- multiplexage de plusieurs requêtes avec `streamId` non réutilisable ;
- prise en charge HTTP, corps en streaming, SSE et WebSocket bidirectionnel ;
- limites de taille, quotas, timeouts, backpressure et annulation ;
- reprise contrôlée après coupure sans rejouer une écriture non idempotente ;
- transmission fiable de l'IP et du protocole d'origine sans faire confiance à
  des en-têtes fournis directement par le client ;
- interdiction d'utiliser le tunnel comme proxy vers une destination arbitraire ;
- journaux expurgés des cookies, jetons, frappes et corps de requêtes.

### Mode 5 — PWA publique et HTTPS/WSS local certifié

```text
Téléphone ──HTTPS──► PWA statique certifiée
   │
   │  HTTPS/WSS direct avec certificat distinct
   ▼
device-id.devices.example.com ──DNS local/privé──► serveur on-premise
```

Le serveur local possède un certificat publiquement reconnu, par exemple obtenu
avec ACME DNS-01. Ce mode conserve Socket.IO et évite un relais applicatif, mais
nécessite une gestion de certificat, de DNS local et des protections
DNS-rebinding.

## Exigences communes de signalisation WebRTC

WebRTC nécessite un échange initial d'offres, de réponses et de candidats ICE.
La signalisation constitue une métadonnée réseau, même lorsqu'elle ne transporte
pas les commandes applicatives.

La conception retenue doit donc appliquer les règles suivantes :

- QR code contenant un identifiant d'association à usage unique, une clé
  éphémère et l'empreinte attendue du serveur on-premise ;
- offre, réponse et candidats ICE chiffrés côté client avant leur envoi ;
- stockage en mémoire uniquement sur le serveur de signalisation ;
- expiration en quelques minutes et suppression dès l'association terminée ;
- aucune journalisation du contenu, du QR, des candidats ou des jetons ;
- politique STUN/TURN configurable et visible ;
- aucun basculement silencieux vers TURN ;
- indication du chemin réellement sélectionné : LAN, direct distant ou relayé.

## Arbitrage technique

| Mode | PWA installable | Transit applicatif | Infrastructure utilisateur | Statut |
| --- | --- | --- | --- | --- |
| Local HTTP/HTTPS | Selon le certificat | LAN uniquement | PC seulement | À conserver |
| Service gratuit + WebRTC | Oui | Direct ou TURN explicitement choisi | Aucune | À développer |
| VPS personnel + WebRTC | Oui | Direct ou VPS si TURN activé | VPS + domaine | À supporter |
| VPS personnel + proxy VPN | Oui | VPS de l'utilisateur | VPS + VPN + domaine | À supporter |
| VPS personnel + reverse WebSocket | Oui | VPS de l'utilisateur | VPS + domaine | À prototyper puis supporter |
| HTTPS/WSS local certifié | Oui | LAN uniquement | DNS + certificat | À supporter |

Ces modes sont complémentaires. Le code ne doit pas en désigner un comme
universellement supérieur : le bon choix dépend du niveau d'autonomie, de la
confidentialité attendue et de la topologie réseau.

### Dépendance WebRTC côté serveur

Node.js ne fournit pas actuellement l'équivalent serveur complet de
`RTCPeerConnection`. Une bibliothèque sera donc probablement nécessaire.

Avant son adoption, un prototype doit comparer les implémentations disponibles
selon les critères suivants :

- maintenance active et compatibilité avec la version Node.js supportée ;
- prise en charge de DataChannel, ICE local, DTLS et mDNS ;
- présence ou absence de modules natifs ;
- disponibilité de binaires Linux, Windows et macOS ;
- comportement après veille et changement d'interface réseau ;
- limites de taille, backpressure et stabilité mémoire ;
- facilité des tests automatisés ;
- surface de dépendances et historique de sécurité.

**Décision : différer le choix de bibliothèque jusqu'au prototype.** Aucune
dépendance WebRTC ne doit être ajoutée uniquement sur la base de sa popularité.

## Évolution d'architecture applicative

Le frontend dépend actuellement de Socket.IO et de routes servies par le même
serveur. Pour permettre une PWA statique publique et un transport WebRTC local,
la logique doit être séparée en couches.

### Contrat de transport client

Créer une abstraction minimale commune :

```text
Transport
├── connect(pairing)
├── disconnect()
├── send(event, payload)
├── request(action, payload)
├── subscribe(event, listener)
└── connectionState
```

Implémentations envisagées :

- `SocketIoTransport` pour le mode local, le proxy VPN et HTTPS/WSS local ;
- `WebRtcTransport` pour le service PWA gratuit ou auto-hébergé.

La sélection doit venir de la configuration ou des capacités annoncées pendant
l'association, sans condition dispersée dans l'interface.

### Contrat de déploiement public

Les composants publics doivent également être découplés :

- artefact PWA statique ;
- service de signalisation WebRTC optionnel ;
- configuration STUN/TURN optionnelle ;
- exemple de reverse proxy VPN optionnel ;
- service de relais WebSocket et agent de reverse tunnel optionnels ;
- manifeste de capacités permettant au client de choisir le transport.

Le service public gratuit et les déploiements sur VPS personnel doivent
réutiliser les mêmes artefacts et formats de configuration. Le relais custom ne
doit pas introduire une deuxième implémentation de la logique métier : il
transporte les échanges vers le serveur HTTP/Socket.IO existant.

### Contrat du reverse tunnel applicatif

Le protocole du relais doit rester indépendant des commandes Remote Mouse et
modéliser des flux génériques :

```text
TunnelMessage
├── open(streamId, method, path, headers)
├── data(streamId, binaryChunk)
├── end(streamId)
├── cancel(streamId, reason)
├── response(streamId, status, headers)
└── windowUpdate(streamId, availableBytes)
```

Un adaptateur VPS convertit HTTPS/WSS vers ces messages. Un adaptateur
on-premise les convertit vers le serveur Express/Socket.IO local. Le protocole
doit être versionné et testé indépendamment des deux adaptateurs.

### Partage de la logique serveur

Les actions souris, clavier, navigateur, VLC, TV et administration ne doivent
pas être réécrites dans le gateway WebRTC. Les handlers Socket.IO actuels
doivent appeler des services ou un dispatcher de commandes partagé par les
deux transports.

### Canaux WebRTC

Un prototype doit évaluer au minimum deux canaux :

- canal fiable et ordonné pour clics, clavier, configuration et administration ;
- canal non ordonné, à retransmission limitée, pour mouvements de souris et
  données rapidement périmées.

La prévisualisation doit être testée séparément afin de choisir entre
DataChannel, piste vidéo WebRTC ou désactivation lorsque la bande passante est
insuffisante.

## Risques à traiter en priorité

### P0 — Bloquants avant exposition réseau

- [ ] Corriger la confiance accordée à `X-Forwarded-For`. Le code ne doit
  jamais interpréter directement cet en-tête pour accorder un accès local.
- [ ] Supprimer ou fortement encadrer le contournement d'authentification fondé
  sur l'adresse `127.0.0.1`.
- [ ] Refuser le démarrage en production avec
  `SESSION_COOKIE_SECRET=change-me`.
- [ ] Mettre à jour les dépendances de production. L'audit initial a détecté
  huit alertes, dont trois élevées dans la chaîne Engine.IO, Socket.IO parser et
  WebSocket.
- [ ] Séparer le jeton temporaire d'association de la session persistante d'un
  appareil.
- [ ] Créer des rôles distincts `controller` et `admin`.
- [ ] Protéger les actions administratives quel que soit le transport utilisé.
- [ ] Limiter la taille et le rythme des messages entrants.
- [ ] Ne jamais écrire les offres WebRTC, candidats ICE, jetons, cookies ou
  secrets dans les journaux.

### P1 — Cohérence et fiabilité

- [ ] Aligner la durée de grâce documentée des anciens jetons avec le défaut du
  code. La documentation indique actuellement 120 minutes tandis que le code
  utilise une semaine.
- [ ] Séparer le frontend statique des routes dynamiques du serveur on-premise.
- [ ] Supprimer les hypothèses d'API same-origin dans le frontend.
- [ ] Définir un protocole versionné entre PWA et serveur on-premise.
- [ ] Ajouter un vrai hôte d'écoute configurable au serveur Node.
- [ ] Gérer proprement les erreurs d'écoute et d'initialisation WebRTC.

## Jalons

### Jalon 0 — Preuve de faisabilité réseau

**Objectif :** valider la connexion directe avant toute refonte importante.

- [ ] Servir une page de test depuis une origine HTTPS publique.
- [ ] Générer un QR d'association sur le serveur on-premise.
- [ ] Établir un DataChannel direct entre un navigateur mobile et Node.js sur le
  même LAN.
- [ ] Tester sans STUN et sans TURN.
- [ ] Vérifier dans les statistiques ICE que la paire sélectionnée est locale
  et qu'aucun relais n'est utilisé.
- [ ] Envoyer des mouvements rapides, clics et messages fiables.
- [ ] Tester Android/Chrome et iOS/Safari réels, pas uniquement une émulation.
- [ ] Mesurer latence, pertes, reprise après veille et consommation CPU.
- [ ] Comparer au moins deux bibliothèques WebRTC serveur si elles satisfont les
  exigences minimales.

**Critère de sortie :** un prototype reproductible prouve qu'aucune donnée de
commande ne traverse le serveur tiers.

**Estimation :** 3 à 5 jours.

### Jalon 1 — Durcissement de la sécurité existante

**Objectif :** corriger les vulnérabilités indépendamment du futur transport.

- [ ] Corriger l'identification de l'adresse cliente.
- [ ] Générer un secret de cookie fort pendant l'installation.
- [ ] Introduire des sessions propres à chaque appareil.
- [ ] Ajouter la révocation d'une session ou de tous les appareils.
- [ ] Ajouter les rôles et autorisations administratives.
- [ ] Mettre à jour les dépendances et traiter les alertes de sécurité.
- [ ] Ajouter les tests de non-régression associés.

**Estimation :** 3 à 5 jours.

### Jalon 2 — Séparation de la PWA et du backend

**Objectif :** rendre le frontend déployable comme site statique certifié.

- [ ] Produire un artefact frontend indépendant du serveur on-premise.
- [ ] Déplacer les pages d'administration nécessaires dans cet artefact.
- [ ] Introduire le contrat de transport côté client.
- [ ] Adapter le frontend existant à `SocketIoTransport` sans changer son
  comportement.
- [ ] Extraire les actions serveur dans un dispatcher partagé.
- [ ] Versionner le protocole client/serveur.
- [ ] Ajouter les tests de contrat du transport.

**Estimation :** 4 à 7 jours.

### Jalon 3 — Transport WebRTC optionnel

**Objectif :** ajouter WebRTC sans remplacer Socket.IO ni dupliquer la logique
métier.

- [ ] Intégrer la bibliothèque retenue à la suite du prototype.
- [ ] Créer les canaux fiable et temps réel.
- [ ] Mapper les messages WebRTC vers le dispatcher partagé.
- [ ] Implémenter backpressure, limites de taille et quotas de messages.
- [ ] Ajouter heartbeat, reconnexion et renégociation.
- [ ] Rejeter toute paire ICE de type `relay` en profil « LAN uniquement ».
- [ ] Autoriser TURN uniquement dans un profil explicitement configuré.
- [ ] Exposer clairement la paire ICE sélectionnée dans les diagnostics locaux.
- [ ] Maintenir `SocketIoTransport` pour les modes local, proxy VPN et
  certificat local reconnu.

**Estimation :** 5 à 10 jours.

### Jalon 4 — Association et signalisation confidentielles

**Objectif :** permettre l'établissement WebRTC sans exposer le contenu de la
signalisation au serveur tiers.

- [ ] Générer localement les clés et identifiants d'association.
- [ ] Chiffrer les offres, réponses et candidats avant envoi.
- [ ] Authentifier le serveur on-premise à partir des informations du QR.
- [ ] Créer un service de rendez-vous sans base de données persistante.
- [ ] Appliquer TTL court, usage unique et suppression immédiate.
- [ ] Désactiver les logs de payload et filtrer les secrets dans les erreurs.
- [ ] Ajouter rate limiting et protection contre l'énumération des sessions.
- [ ] Publier une description précise des métadonnées visibles par le service.
- [ ] Vérifier que la perte du service de signalisation n'affecte pas une
  session WebRTC déjà établie.

**Estimation :** 3 à 5 jours.

### Jalon 5 — Déploiement de la PWA publique

**Objectif :** héberger uniquement les ressources publiques et le rendez-vous
de signalisation sur le serveur tiers.

- [ ] Configurer le domaine, HTTPS automatique et HSTS.
- [ ] Déployer les fichiers statiques versionnés de la PWA.
- [ ] Déployer le service minimal de signalisation chiffrée.
- [ ] Vérifier qu'aucun endpoint ne peut relayer une commande applicative.
- [ ] Interdire tout proxy générique vers une adresse on-premise.
- [ ] Mettre en place une politique de journaux minimaux et une rétention courte.
- [ ] Ajouter un test réseau garantissant qu'aucun flux applicatif ne rejoint le
  serveur tiers en profil WebRTC « LAN uniquement ».

**Estimation :** 2 à 4 jours.

### Jalon 6 — PWA installable et maintenable

**Objectif :** offrir une installation fiable sur Android, iOS et ordinateur.

- [ ] Ajouter un bouton « Installer l'application » avec
  `beforeinstallprompt` lorsque disponible.
- [ ] Afficher des instructions dédiées à Safari/iOS.
- [ ] Ajouter un écran hors ligne explicite.
- [ ] Distinguer serveur local introuvable, association expirée, permission LAN
  refusée et négociation WebRTC échouée.
- [ ] Générer la version du cache lors de chaque release.
- [ ] Informer l'utilisateur lorsqu'une nouvelle version est prête.
- [ ] Ajouter des captures d'écran et raccourcis au manifest.
- [ ] Vérifier les icônes `maskable`.
- [ ] Tester installation, mise à jour et reprise après veille.

**Estimation :** 2 à 4 jours.

### Jalon 7 — Mode HTTPS/WSS local administré

**Objectif :** proposer une alternative sans signalisation Internet aux
environnements capables de gérer DNS et certificats.

- [ ] Concevoir l'émission ACME DNS-01 par installation.
- [ ] Garder la clé privée exclusivement sur le serveur on-premise.
- [ ] Utiliser une délégation `_acme-challenge` ou des permissions DNS limitées.
- [ ] Automatiser le renouvellement et surveiller l'expiration.
- [ ] Documenter la résolution DNS locale et les protections DNS-rebinding.
- [ ] Configurer CORS et Socket.IO pour la seule origine PWA autorisée.
- [ ] Tester Android, iOS, Safari et Chromium sur plusieurs routeurs.

**Estimation :** 5 à 8 jours.

### Jalon 8 — Déploiement VPS avec proxy VPN

**Objectif :** fournir un exemple auto-hébergeable conservant Socket.IO.

- [ ] Fournir une configuration Caddy ou équivalente.
- [ ] Fournir un exemple WireGuard et documenter l'alternative Tailscale.
- [ ] Ajouter `PUBLIC_BASE_URL`, `TRUSTED_PROXY` et l'hôte d'écoute.
- [ ] Garantir les cookies `Secure` derrière terminaison TLS.
- [ ] Tester HTTP, API, SSE et WebSocket à travers le proxy.
- [ ] Documenter clairement que les données transitent par le VPS personnel.
- [ ] Ne jamais activer ce chemin comme fallback implicite de WebRTC.

**Estimation :** 2 à 4 jours.

### Jalon 9 — Relais custom par reverse WebSocket

**Objectif :** fournir une alternative auto-hébergeable sans pile VPN.

- [ ] Prototyper le tunnel sortant avec HTTP simple et WebSocket bidirectionnel.
- [ ] Définir et versionner le protocole de multiplexage.
- [ ] Ajouter authentification du serveur, rotation et révocation des accès.
- [ ] Implémenter streaming, SSE, backpressure, annulation et timeouts.
- [ ] Isoler strictement plusieurs serveurs connectés au même relais.
- [ ] Empêcher SSRF, confusion de tenant et ouverture de destinations arbitraires.
- [ ] Définir le comportement des requêtes actives lors d'une reconnexion.
- [ ] Tester Socket.IO, téléchargements, erreurs et connexions longues.
- [ ] Publier le relais et l'agent tunnel comme composants optionnels.
- [ ] Documenter le transit des données en clair au point de terminaison TLS du
  VPS et les responsabilités de son administrateur.

**Recommandation :** adopter comme option avancée après un prototype de charge
et de sécurité. Cette solution réduit la pile d'infrastructure, mais son
protocole custom augmente la surface de code critique à maintenir.

**Estimation :** 5 à 8 jours.

### Jalon 10 — Industrialisation

**Objectif :** rendre les releases reproductibles et l'exploitation prévisible.

- [ ] Ajouter une CI exécutant tests unitaires et Playwright.
- [ ] Ajouter des tests WebRTC sur réseau local simulé et appareils réels.
- [ ] Fixer les versions de Node.js officiellement prises en charge.
- [ ] Ajouter un contrôle automatisé des dépendances vulnérables.
- [ ] Tester les installateurs Linux et Windows.
- [ ] Ajouter une procédure de sauvegarde et de restauration SQLite.
- [ ] Ajouter des diagnostics ICE, DataChannel, certificat et permission LAN à
  la CLI.
- [ ] Documenter déploiement, mise à jour et retour arrière.

**Estimation :** 3 à 5 jours.

## Backlog fonctionnel

### Priorité haute

- [ ] **Appareils associés** — nom, rôle, dernière activité et révocation.
- [ ] **État de connexion détaillé** — serveur local introuvable, négociation
  échouée, session expirée ou permission LAN refusée.
- [ ] **Multi-écrans** — sélection de l'écran et déplacement entre moniteurs.
- [ ] **Retour haptique** — vibration configurable sur les commandes tactiles.
- [ ] **Profils de contrôle** — présentation, multimédia, navigation et TV.

### Priorité moyenne

- [ ] **Presse-papiers bidirectionnel** avec consentement explicite.
- [ ] **Macros sécurisées** limitées à une liste d'actions autorisées.
- [ ] **Personnalisation des commandes** et de leur disposition.
- [ ] **Prévisualisation adaptative** selon la bande passante et la latence.
- [ ] **Wake-on-LAN du PC** lorsqu'un composant local peut émettre le paquet.

### Compatibilité et accessibilité

- [ ] Étudier un contrôle natif sous Wayland ou via les portails desktop.
- [ ] Ajouter un installateur et un service macOS.
- [ ] Tester les lecteurs d'écran et la navigation au clavier.
- [ ] Ajouter des tailles de contrôle et contrastes configurables.
- [ ] Réduire les mouvements selon les préférences système.

## Stratégie de tests

### Tests unitaires

- sérialisation, validation et version du protocole ;
- routage identique des commandes Socket.IO et WebRTC ;
- chiffrement et expiration de la signalisation ;
- association, expiration et révocation des appareils ;
- autorisations `controller`/`admin` ;
- backpressure, taille et rythme des messages ;
- refus explicite des candidats relayés.

### Tests d'intégration

- établissement direct sur un LAN sans STUN/TURN ;
- vérification de la paire ICE sélectionnée ;
- absence de trafic applicatif vers le serveur tiers ;
- perte du service de signalisation après connexion ;
- veille et reprise du mobile ;
- changement d'adresse locale du serveur ;
- coexistence de WebRTC et Socket.IO certifié ;
- renouvellement du certificat dans le mode HTTPS/WSS administré ;
- multiplexage simultané de HTTP, SSE et WebSocket dans le reverse tunnel ;
- coupure et reconnexion du tunnel sans rejeu des requêtes d'écriture ;
- isolation entre deux serveurs on-premise connectés au même relais ;
- limites de mémoire et backpressure sous charge.

### Tests navigateur et appareils réels

- Android/Chrome et iOS/Safari ;
- permission d'accès au réseau local acceptée et refusée ;
- installation et démarrage depuis l'icône PWA ;
- mise à jour du service worker ;
- session persistante après fermeture ;
- révocation immédiate d'un appareil ;
- comportement hors ligne ;
- routeurs avec protection DNS-rebinding pour le mode HTTPS/WSS local.

## Critères de confidentialité vérifiables par profil

- [ ] Le mode actif et son chemin réseau sont visibles par l'utilisateur.
- [ ] Le service PWA gratuit ne possède aucun endpoint de proxy pour les
  commandes.
- [ ] Le profil WebRTC « LAN uniquement » n'utilise aucun serveur TURN.
- [ ] Dans ce profil, les statistiques ICE montrent une connexion directe et
  jamais `relay`.
- [ ] Une capture réseau confirme que les commandes restent sur le LAN dans les
  modes local, WebRTC LAN et HTTPS/WSS local certifié.
- [ ] La signalisation est chiffrée avant de quitter le mobile ou le PC.
- [ ] La signalisation expire et est supprimée après usage.
- [ ] Les journaux du serveur tiers ne contiennent aucun payload de
  signalisation ni secret d'association.
- [ ] Une session établie continue à fonctionner si Internet ou le serveur de
  signalisation devient indisponible.
- [ ] L'interface demande ou respecte une configuration explicite avant de
  basculer vers TURN ou un proxy.
- [ ] Le mode proxy VPN précise que le trafic traverse le VPS de l'utilisateur.
- [ ] Le mode reverse WebSocket précise que le trafic traverse et est terminé
  sur le VPS de l'utilisateur.
- [ ] Le relais refuse toute destination autre que l'instance on-premise
  authentifiée et associée.

## Critères de livraison de la première version PWA

- [ ] La PWA est servie depuis une origine HTTPS reconnue et s'installe.
- [ ] Le QR associe le mobile au bon serveur on-premise.
- [ ] Socket.IO local, à travers un proxy VPN et à travers le relais custom reste
  fonctionnel.
- [ ] Le canal WebRTC fonctionne sur Android et iOS réels.
- [ ] Les commandes temps réel et fiables utilisent les canaux appropriés.
- [ ] Un appareil révoqué perd immédiatement l'accès.
- [ ] Un contrôleur ordinaire ne peut exécuter aucune action administrative.
- [ ] Les tests unitaires, d'intégration et navigateur passent dans la CI.
- [ ] Aucune vulnérabilité élevée connue ne subsiste dans les dépendances de
  production.
- [ ] Les critères de confidentialité ci-dessus sont démontrés par des tests.

## Ordre de réalisation conseillé

```text
Socle local HTTP/HTTPS et Socket.IO préservé
        ↓
Correctifs de sécurité existants
        ↓
Séparation PWA / backend / logique métier
        ↓
Abstraction de transport
        ↓
WebRTC optionnel + signalisation
        ↓
Service PWA gratuit
        ↓
Paquet auto-hébergeable WebRTC
        ↓
Proxy VPN auto-hébergeable
        ↓
Relais WebSocket auto-hébergeable
        ↓
Mode HTTPS/WSS local administré
        ↓
Tests de chaque profil
        ↓
Nouvelles fonctionnalités
```

## Documentation de référence

- [MDN — sécurité des WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications#security_considerations)
- [MDN — WebRTC DataChannel](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)
- [MDN — signalisation WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)
- [Chrome — Local Network Access](https://developer.chrome.com/blog/local-network-access)
- [Let's Encrypt — challenge DNS-01](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge)
- [MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web.dev — critères d'installation d'une PWA](https://web.dev/articles/install-criteria)

---

Cette roadmap est un document vivant. Une case ne doit être cochée qu'après un
changement vérifié. Chaque mode doit annoncer honnêtement son chemin réseau et
ne jamais basculer silencieusement vers un mode moins privé.
