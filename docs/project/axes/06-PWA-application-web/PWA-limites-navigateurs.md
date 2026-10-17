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
