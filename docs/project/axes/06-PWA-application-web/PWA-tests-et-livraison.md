# PWA — Tests, diagnostics et livraison

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## PWA-114 — Ajouter des diagnostics ICE, DataChannel, certificat et permission LAN

**État:** À faire.

  la CLI.

## PWA-115 — Documenter déploiement, mise à jour et retour arrière

**État:** À faire.

**Estimation :** 3 à 5 jours.
### Priorité haute

## PWA-152 — Aucune vulnérabilité élevée connue ne subsiste dans les dépendances

**État:** À faire.

  production.

## PWA-153 — Les critères de confidentialité ci-dessus sont démontrés par des tests

**État:** À faire.

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
