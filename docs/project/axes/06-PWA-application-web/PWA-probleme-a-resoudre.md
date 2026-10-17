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
