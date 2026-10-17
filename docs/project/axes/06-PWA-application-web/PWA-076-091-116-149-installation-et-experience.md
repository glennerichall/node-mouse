# PWA-076-091-116-149 — Installation et expérience utilisateur

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## PWA-076 — Ajouter un bouton « Installer l'application »

**État:** À faire.

  `beforeinstallprompt` lorsque disponible.

## PWA-079 — Distinguer serveur local introuvable, association expirée, permission LAN

**État:** À faire.

  refusée et négociation WebRTC échouée.

## PWA-084 — Tester installation, mise à jour et reprise après veille

**État:** À faire.

**Estimation :** 2 à 4 jours.
### Jalon 7 — Mode HTTPS/WSS local administré
**Objectif :** proposer une alternative sans signalisation Internet aux
environnements capables de gérer DNS et certificats.

## PWA-091 — Tester Android, iOS, Safari et Chromium sur plusieurs routeurs

**État:** À faire.

**Estimation :** 5 à 8 jours.
### Jalon 8 — Déploiement VPS avec proxy VPN
**Objectif :** fournir un exemple auto-hébergeable conservant Socket.IO.

## PWA-117 — État de connexion détaillé — serveur local introuvable, négociation

**État:** À faire.

  échouée, session expirée ou permission LAN refusée.

## PWA-120 — Profils de contrôle — présentation, multimédia, navigation et TV

**État:** À faire.

### Priorité moyenne

## PWA-125 — Wake-on-LAN du PC lorsqu'un composant local peut émettre le paquet

**État:** À faire.

### Compatibilité et accessibilité

## PWA-130 — Réduire les mouvements selon les préférences système

**État:** À faire.

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

## PWA-146 — Socket.IO local, à travers un proxy VPN et à travers le relais custom reste

**État:** À faire.

  fonctionnel.
