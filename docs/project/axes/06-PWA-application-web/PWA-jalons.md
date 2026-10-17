## Jalons

### Jalon 0 — Preuve de faisabilité réseau

**Objectif :** valider la connexion directe avant toute refonte importante.

- **À faire —** PWA-027 — Servir une page de test depuis une origine HTTPS publique.
- **À faire —** PWA-028 — Générer un QR d'association sur le serveur on-premise.
- **À faire —** PWA-029 — Établir un DataChannel direct entre un navigateur mobile et Node.js sur le
  même LAN.
- **À faire —** PWA-030 — Tester sans STUN et sans TURN.
- **À faire —** PWA-031 — Vérifier dans les statistiques ICE que la paire sélectionnée est locale
  et qu'aucun relais n'est utilisé.
- **À faire —** PWA-032 — Envoyer des mouvements rapides, clics et messages fiables.
- **À faire —** PWA-033 — Tester Android/Chrome et iOS/Safari réels, pas uniquement une émulation.
- **À faire —** PWA-034 — Mesurer latence, pertes, reprise après veille et consommation CPU.
- **À faire —** PWA-035 — Comparer au moins deux bibliothèques WebRTC serveur si elles satisfont les
  exigences minimales.

**Critère de sortie :** un prototype reproductible prouve qu'aucune donnée de
commande ne traverse le serveur tiers.

**Estimation :** 3 à 5 jours.

### Jalon 1 — Durcissement de la sécurité existante

**Objectif :** corriger les vulnérabilités indépendamment du futur transport.

- **Terminé —** PWA-036 — Corriger l'identification de l'adresse cliente.
- **Terminé —** PWA-037 — Générer un secret de cookie fort pendant l'installation.
- **Terminé —** PWA-038 — Introduire des sessions propres à chaque appareil.
- **Terminé —** PWA-039 — Permettre à un appareil de révoquer sa session courante.
- **À faire —** PWA-040 — Ajouter la révocation administrative d'un autre appareil ou de toutes les
  sessions.
- **Terminé —** PWA-041 — Ajouter les rôles et autorisations administratives pour HTTP et Socket.IO.
- **Terminé —** PWA-042 — Mettre à jour les dépendances et traiter les alertes élevées de sécurité.
- **Terminé —** PWA-043 — Ajouter les tests de non-régression associés.

**Estimation :** 3 à 5 jours.

### Jalon 2 — Séparation de la PWA et du backend

**Objectif :** rendre le frontend déployable comme site statique certifié.

- **À faire —** PWA-044 — Produire un artefact frontend indépendant du serveur on-premise.
- **À faire —** PWA-045 — Déplacer les pages d'administration nécessaires dans cet artefact.
- **À faire —** PWA-046 — Introduire le contrat de transport côté client.
- **À faire —** PWA-047 — Adapter le frontend existant à `SocketIoTransport` sans changer son
  comportement.
- **À faire —** PWA-048 — Extraire les actions serveur dans un dispatcher partagé.
- **À faire —** PWA-049 — Versionner le protocole client/serveur.
- **À faire —** PWA-050 — Ajouter les tests de contrat du transport.

**Estimation :** 4 à 7 jours.

### Jalon 3 — Transport WebRTC optionnel

**Objectif :** ajouter WebRTC sans remplacer Socket.IO ni dupliquer la logique
métier.

- **À faire —** PWA-051 — Intégrer la bibliothèque retenue à la suite du prototype.
- **À faire —** PWA-052 — Créer les canaux fiable et temps réel.
- **À faire —** PWA-053 — Mapper les messages WebRTC vers le dispatcher partagé.
- **À faire —** PWA-054 — Implémenter backpressure, limites de taille et quotas de messages.
- **À faire —** PWA-055 — Ajouter heartbeat, reconnexion et renégociation.
- **À faire —** PWA-056 — Rejeter toute paire ICE de type `relay` en profil « LAN uniquement ».
- **À faire —** PWA-057 — Autoriser TURN uniquement dans un profil explicitement configuré.
- **À faire —** PWA-058 — Exposer clairement la paire ICE sélectionnée dans les diagnostics locaux.
- **À faire —** PWA-059 — Maintenir `SocketIoTransport` pour les modes local, proxy VPN et
  certificat local reconnu.

**Estimation :** 5 à 10 jours.

### Jalon 4 — Association et signalisation confidentielles

**Objectif :** permettre l'établissement WebRTC sans exposer le contenu de la
signalisation au serveur tiers.

- **À faire —** PWA-060 — Générer localement les clés et identifiants d'association.
- **À faire —** PWA-061 — Chiffrer les offres, réponses et candidats avant envoi.
- **À faire —** PWA-062 — Authentifier le serveur on-premise à partir des informations du QR.
- **À faire —** PWA-063 — Créer un service de rendez-vous sans base de données persistante.
- **À faire —** PWA-064 — Appliquer TTL court, usage unique et suppression immédiate.
- **À faire —** PWA-065 — Désactiver les logs de payload et filtrer les secrets dans les erreurs.
- **À faire —** PWA-066 — Ajouter rate limiting et protection contre l'énumération des sessions.
- **À faire —** PWA-067 — Publier une description précise des métadonnées visibles par le service.
- **À faire —** PWA-068 — Vérifier que la perte du service de signalisation n'affecte pas une
  session WebRTC déjà établie.

**Estimation :** 3 à 5 jours.

### Jalon 5 — Déploiement de la PWA publique

**Objectif :** héberger uniquement les ressources publiques et le rendez-vous
de signalisation sur le serveur tiers.

- **À faire —** PWA-069 — Configurer le domaine, HTTPS automatique et HSTS.
- **À faire —** PWA-070 — Déployer les fichiers statiques versionnés de la PWA.
- **À faire —** PWA-071 — Déployer le service minimal de signalisation chiffrée.
- **À faire —** PWA-072 — Vérifier qu'aucun endpoint ne peut relayer une commande applicative.
- **À faire —** PWA-073 — Interdire tout proxy générique vers une adresse on-premise.
- **À faire —** PWA-074 — Mettre en place une politique de journaux minimaux et une rétention courte.
- **À faire —** PWA-075 — Ajouter un test réseau garantissant qu'aucun flux applicatif ne rejoint le
  serveur tiers en profil WebRTC « LAN uniquement ».

**Estimation :** 2 à 4 jours.

### Jalon 6 — PWA installable et maintenable

**Objectif :** offrir une installation fiable sur Android, iOS et ordinateur.

- **À faire —** PWA-076 — Ajouter un bouton « Installer l'application » avec
  `beforeinstallprompt` lorsque disponible.
- **À faire —** PWA-077 — Afficher des instructions dédiées à Safari/iOS.
- **À faire —** PWA-078 — Ajouter un écran hors ligne explicite.
- **À faire —** PWA-079 — Distinguer serveur local introuvable, association expirée, permission LAN
  refusée et négociation WebRTC échouée.
- **À faire —** PWA-080 — Générer la version du cache lors de chaque release.
- **À faire —** PWA-081 — Informer l'utilisateur lorsqu'une nouvelle version est prête.
- **À faire —** PWA-082 — Ajouter des captures d'écran et raccourcis au manifest.
- **À faire —** PWA-083 — Vérifier les icônes `maskable`.
- **À faire —** PWA-084 — Tester installation, mise à jour et reprise après veille.

**Estimation :** 2 à 4 jours.

### Jalon 7 — Mode HTTPS/WSS local administré

**Objectif :** proposer une alternative sans signalisation Internet aux
environnements capables de gérer DNS et certificats.

- **À faire —** PWA-085 — Concevoir l'émission ACME DNS-01 par installation.
- **À faire —** PWA-086 — Garder la clé privée exclusivement sur le serveur on-premise.
- **À faire —** PWA-087 — Utiliser une délégation `_acme-challenge` ou des permissions DNS limitées.
- **À faire —** PWA-088 — Automatiser le renouvellement et surveiller l'expiration.
- **À faire —** PWA-089 — Documenter la résolution DNS locale et les protections DNS-rebinding.
- **À faire —** PWA-090 — Configurer CORS et Socket.IO pour la seule origine PWA autorisée.
- **À faire —** PWA-091 — Tester Android, iOS, Safari et Chromium sur plusieurs routeurs.

**Estimation :** 5 à 8 jours.

### Jalon 8 — Déploiement VPS avec proxy VPN

**Objectif :** fournir un exemple auto-hébergeable conservant Socket.IO.

- **À faire —** PWA-092 — Fournir une configuration Caddy ou équivalente.
- **À faire —** PWA-093 — Fournir un exemple WireGuard et documenter l'alternative Tailscale.
- **À faire —** PWA-094 — Ajouter `PUBLIC_BASE_URL`, `TRUSTED_PROXY` et l'hôte d'écoute.
- **À faire —** PWA-095 — Garantir les cookies `Secure` derrière terminaison TLS.
- **À faire —** PWA-096 — Tester HTTP, API, SSE et WebSocket à travers le proxy.
- **À faire —** PWA-097 — Documenter clairement que les données transitent par le VPS personnel.
- **À faire —** PWA-098 — Ne jamais activer ce chemin comme fallback implicite de WebRTC.

**Estimation :** 2 à 4 jours.

### Jalon 9 — Relais custom par reverse WebSocket

**Objectif :** fournir une alternative auto-hébergeable sans pile VPN.

- **À faire —** PWA-099 — Prototyper le tunnel sortant avec HTTP simple et WebSocket bidirectionnel.
- **À faire —** PWA-100 — Définir et versionner le protocole de multiplexage.
- **À faire —** PWA-101 — Ajouter authentification du serveur, rotation et révocation des accès.
- **À faire —** PWA-102 — Implémenter streaming, SSE, backpressure, annulation et timeouts.
- **À faire —** PWA-103 — Isoler strictement plusieurs serveurs connectés au même relais.
- **À faire —** PWA-104 — Empêcher SSRF, confusion de tenant et ouverture de destinations arbitraires.
- **À faire —** PWA-105 — Définir le comportement des requêtes actives lors d'une reconnexion.
- **À faire —** PWA-106 — Tester Socket.IO, téléchargements, erreurs et connexions longues.
- **À faire —** PWA-107 — Publier le relais et l'agent tunnel comme composants optionnels.
- **À faire —** PWA-108 — Documenter le transit des données en clair au point de terminaison TLS du
  VPS et les responsabilités de son administrateur.

**Recommandation :** adopter comme option avancée après un prototype de charge
et de sécurité. Cette solution réduit la pile d'infrastructure, mais son
protocole custom augmente la surface de code critique à maintenir.

**Estimation :** 5 à 8 jours.

### Jalon 10 — Industrialisation

**Objectif :** rendre les releases reproductibles et l'exploitation prévisible.

- **À faire —** PWA-109 — Ajouter une CI exécutant tests unitaires et Playwright.
- **À faire —** PWA-110 — Ajouter des tests WebRTC sur réseau local simulé et appareils réels.
- **À faire —** PWA-111 — Fixer les versions de Node.js officiellement prises en charge.
- **À faire —** PWA-112 — Ajouter un contrôle automatisé des dépendances vulnérables.
- **À faire —** PWA-113 — Tester les installateurs Linux et Windows.
- **À faire —** PWA-114 — Ajouter des diagnostics ICE, DataChannel, certificat et permission LAN à
  la CLI.
- **À faire —** PWA-115 — Documenter déploiement, mise à jour et retour arrière.

**Estimation :** 3 à 5 jours.
