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
