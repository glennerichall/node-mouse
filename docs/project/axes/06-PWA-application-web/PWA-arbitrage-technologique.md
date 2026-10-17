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
