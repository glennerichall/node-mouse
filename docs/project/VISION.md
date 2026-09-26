# Vision et intention — Remote Mouse

Faire de Remote Mouse une télécommande web simple à installer et utiliser
depuis un téléphone, une tablette ou un navigateur, fluide et fiable sur réseau
local ou à distance, utilisable avec ou sans PWA, et sécurisée avant toute
exposition à Internet.

Le produit doit rester facile à configurer, mettre à jour, sauvegarder et
dépanner; prendre en charge à terme Linux, Windows et macOS; et évoluer sans
dupliquer la logique métier entre API, Socket.IO et les futurs transports.

## Principes directeurs

1. Préserver le fonctionnement local sans dépendance Internet.
2. Rendre PWA, TLS, WebRTC, proxy VPN et intégrations optionnels.
3. Séparer métier et transport.
4. Préférer des adaptateurs configurables aux conditions dispersées.
5. Sécuriser avant toute exposition; l'accès local n'implique pas confiance.
6. Mesurer avant d'optimiser et tester sur les plateformes réellement visées.

## Contexte de déploiement actuel

Le scénario courant est un serveur LAN dont le QR est affiché sur place à un
petit groupe d'utilisateurs physiquement présents. Cela réduit le besoin d'une
gestion lourde de comptes, sans protéger contre un client hostile du LAN ni une
exposition accidentelle à Internet. Les modes distants sont des évolutions
distinctes qui doivent être décidées, sécurisées et documentées.

La vision est durable; les choix d'architecture, priorités, tâches et décisions
datées sont suivis dans la [roadmap](./ROADMAP.md) et les [journaux](./development/README.md).
