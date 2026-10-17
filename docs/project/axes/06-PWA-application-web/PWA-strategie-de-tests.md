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
