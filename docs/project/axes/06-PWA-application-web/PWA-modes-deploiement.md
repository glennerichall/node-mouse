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
