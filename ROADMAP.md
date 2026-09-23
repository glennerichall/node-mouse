# Roadmap globale de Remote Mouse

> Feuille de route générale du projet. Les détails propres à l'installation PWA,
> TLS et aux transports réseau se trouvent dans
> [ROADMAP-PWA.md](./ROADMAP-PWA.md).

Le suivi des tâches en cours et de leur Definition of Done se trouve dans
[DEVELOPMENT.md](./DEVELOPMENT.md).

## Vision

Faire de Remote Mouse une télécommande web :

- simple à installer et à utiliser depuis un téléphone, une tablette ou un
  navigateur ;
- fluide et fiable sur un réseau local ou à distance ;
- utilisable avec ou sans installation PWA ;
- compatible avec plusieurs stratégies HTTP, HTTPS, Socket.IO et WebRTC ;
- sécurisée avant toute exposition à Internet ;
- facile à configurer, mettre à jour, sauvegarder et dépanner ;
- compatible à terme avec Linux, Windows et macOS ;
- extensible sans dupliquer la logique métier entre API, Socket.IO et les futurs
  transports.

## Principes directeurs

1. **Préserver le fonctionnement local.** Aucun service Internet ne doit être
   requis pour utiliser Remote Mouse sur le LAN.
2. **Rendre les fonctions optionnelles.** PWA, TLS, WebRTC, proxy VPN, VLC et TV
   doivent pouvoir être activés selon les besoins.
3. **Séparer métier et transport.** Une commande ne doit pas être réimplémentée
   pour HTTP, Socket.IO ou WebRTC.
4. **Préférer les composants interchangeables.** Les stratégies de transport,
   d'authentification, de découverte et de déploiement doivent être des
   adaptateurs configurables.
5. **Sécuriser avant d'exposer.** Une option d'accès distant ne doit jamais
   affaiblir silencieusement le mode local.
6. **Mesurer avant d'optimiser.** Latence, pertes, CPU et stabilité doivent être
   observés sur des appareils réels.
7. **Tester les plateformes réellement supportées.** L'émulation navigateur ne
   remplace pas les tests Android, iOS, Linux, Windows et macOS.

## État du projet

Le projet propose déjà :

- contrôle de la souris, du clavier et des fenêtres ;
- raccourcis de navigateurs ;
- commandes VLC et téléviseur Samsung ;
- prévisualisation autour du curseur ;
- interface mobile et préférences locales ;
- API Express, Socket.IO et SSE ;
- QR code et jetons d'entrée ;
- configuration et journaux persistés dans SQLite ;
- administration, diagnostic et commandes CLI ;
- installation Linux et Windows ;
- manifest, icônes et service worker PWA ;
- HTTP ou HTTPS configurables ;
- 196 tests unitaires et 18 tests navigateur fonctionnels au moment de cette
  analyse.

La couverture actuelle est d'environ 60 % pour les lignes et 45 % pour les
branches.

## Priorités générales

| Priorité | Axe | Résultat attendu |
| --- | --- | --- |
| P0 | Sécurité | Corriger les contournements et vulnérabilités avant exposition réseau |
| P0 | Stabilité | Préserver les commandes fondamentales sur toutes les plateformes supportées |
| P1 | Architecture | Découpler logique métier, protocoles et déploiements |
| P1 | Installation | Rendre Linux/Windows fiables et ajouter macOS |
| P1 | Qualité | CI, tests réseau, couverture ciblée et releases reproductibles |
| P2 | Expérience | Appareils associés, diagnostics, profils et multi-écrans |
| P2 | PWA | Offrir plusieurs modes TLS/transport installables en drop-in |
| P3 | Extensions | Presse-papiers, macros, Wayland et prévisualisation avancée |

## Axe 1 — Sécurité et contrôle d'accès

### Correctifs immédiats

- [ ] Ne plus interpréter directement `X-Forwarded-For` pour accorder un accès
  local.
- [ ] Configurer explicitement les proxies de confiance.
- [ ] Supprimer ou encadrer strictement le bypass d'authentification localhost.
- [ ] Refuser `SESSION_COOKIE_SECRET=change-me` en production.
- [ ] Mettre à jour les dépendances présentant des vulnérabilités connues,
  notamment la chaîne Socket.IO/Engine.IO/WebSocket.
- [ ] Limiter la taille et la fréquence des requêtes et messages temps réel.
- [ ] Filtrer jetons, cookies et secrets dans tous les journaux.
- [ ] Corriger l'écart entre la durée de grâce documentée et configurée des
  jetons d'entrée.

### Sessions et autorisations

- [ ] Séparer le jeton d'association temporaire de la session d'un appareil.
- [ ] Ajouter une liste des appareils associés.
- [ ] Permettre la révocation d'un appareil ou de toutes les sessions.
- [ ] Séparer les rôles `controller` et `admin`.
- [ ] Appliquer les mêmes autorisations à HTTP, Socket.IO et WebRTC.
- [ ] Protéger les écritures HTTP avec vérification Origin et CSRF adaptée.
- [ ] Ajouter un historique local des associations et révocations.

### Critères de sortie

- aucun en-tête client forgé ne permet un accès local privilégié ;
- un contrôleur ne peut appeler aucune action administrative ;
- un appareil révoqué perd immédiatement son accès ;
- aucune vulnérabilité élevée connue ne subsiste en production.

## Axe 2 — Architecture modulaire

### Logique métier partagée

- [ ] Extraire des handlers réseau un dispatcher de commandes ou des services
  applicatifs communs.
- [ ] Faire utiliser les mêmes services par les routes, Socket.IO et les futurs
  transports.
- [ ] Définir un format commun de succès, d'erreur et d'accusé de réception.
- [ ] Versionner le protocole client/serveur.
- [ ] Éviter que les contrôleurs HTTP et sockets connaissent les détails de
  RobotJS ou des intégrations externes.

### Adaptateurs configurables

```text
Interface utilisateur
        │
        ▼
Contrat de transport
├── Socket.IO local
├── Socket.IO derrière proxy
└── WebRTC DataChannel
        │
        ▼
Dispatcher de commandes
├── Souris / clavier
├── Fenêtres / navigateurs
├── VLC / TV
└── Administration
```

- [ ] Introduire un contrat de transport client minimal.
- [ ] Sélectionner le transport à partir de la configuration et des capacités.
- [ ] Introduire un registre d'adaptateurs de déploiement sans conditions
  dispersées.
- [ ] Conserver la compatibilité avec Socket.IO pendant la migration.
- [ ] Ajouter des tests de contrat exécutables contre chaque transport.

### Configuration système

- [ ] Distinguer `LISTEN_HOST`, `PORT`, `PUBLIC_BASE_URL` et les proxies fiables.
- [ ] Séparer clairement configuration système et configuration fonctionnelle.
- [ ] Valider la configuration au démarrage avec des erreurs actionnables.
- [ ] Permettre l'export/import de la configuration non secrète.
- [ ] Ajouter une commande CLI de diagnostic de configuration.

## Axe 3 — Fiabilité et performance

### Temps réel

- [ ] Mesurer la latence des mouvements, clics et frappes.
- [ ] Regrouper ou abandonner les mouvements devenus obsolètes sous charge.
- [ ] Gérer explicitement la backpressure.
- [ ] Améliorer les reconnexions après veille, changement Wi-Fi et redémarrage
  du serveur.
- [ ] Rendre les délais et heartbeats configurables par transport.
- [ ] Ajouter un état de connexion détaillé dans l'interface.

### Prévisualisation

- [ ] Adapter résolution, fréquence et compression à la bande passante.
- [ ] Mesurer séparément capture, conversion, transport et rendu.
- [ ] Suspendre la capture lorsqu'aucun client ne l'affiche.
- [ ] Prévenir l'accumulation de frames périmées.
- [ ] Étudier une piste vidéo WebRTC sans l'imposer aux autres modes.

### Cycle de vie

- [ ] Tester arrêt gracieux et destruction des connexions.
- [ ] Traiter proprement les erreurs de port occupé ou interdit.
- [ ] Améliorer la reprise après crash du service.
- [ ] Ajouter des contrôles de santé internes et externes distincts.
- [ ] Tester les migrations et corruptions SQLite.

## Axe 4 — Expérience utilisateur

### Appareils et connexion

- [ ] Afficher les appareils associés, leur rôle et leur dernière activité.
- [ ] Nommer un appareil pendant l'association.
- [ ] Expliquer précisément les erreurs : serveur absent, session expirée,
  certificat refusé, permission LAN refusée ou transport indisponible.
- [ ] Afficher le mode de transport et le chemin réseau actifs.
- [ ] Fournir une action simple pour réassocier ou révoquer un appareil.

### Contrôle

- [ ] Ajouter le retour haptique configurable.
- [ ] Créer des profils : général, présentation, multimédia, navigateur et TV.
- [ ] Permettre de réordonner ou masquer les commandes.
- [ ] Améliorer la précision du glisser-déposer et du défilement.
- [ ] Ajouter la gestion de plusieurs écrans.
- [ ] Ajouter des réglages distincts par appareil client.

### Accessibilité et internationalisation

- [ ] Tester la navigation clavier et les lecteurs d'écran.
- [ ] Garantir des zones tactiles et contrastes suffisants.
- [ ] Respecter `prefers-reduced-motion`.
- [ ] Vérifier la cohérence des traductions existantes.
- [ ] Prévoir une stratégie de fallback pour les traductions incomplètes.

## Axe 5 — Plateformes et intégrations système

### Linux

- [ ] Consolider l'installation et le service `systemd --user`.
- [ ] Documenter X11, DISPLAY, XAUTHORITY et la session graphique.
- [ ] Étudier Wayland via les portails desktop ou des adaptateurs dédiés.
- [ ] Détecter clairement les capacités indisponibles.

### Windows

- [ ] Tester l'installation sur versions Windows prises en charge.
- [ ] Fiabiliser le service, PowerShell et les dépendances natives.
- [ ] Vérifier mise à jour et désinstallation sans résidus.
- [ ] Signaler les restrictions de session interactive.

### macOS

- [ ] Créer un installateur macOS.
- [ ] Gérer le lancement automatique dans la session utilisateur.
- [ ] Guider l'autorisation Accessibilité requise pour le contrôle.
- [ ] Tester AppleScript, fenêtres et navigateurs.

### Intégrations

- [ ] Renforcer la détection et les erreurs VLC.
- [ ] Rendre les commandes navigateurs déclaratives et extensibles.
- [ ] Améliorer la découverte et l'association Samsung TV.
- [ ] Prévoir un contrat de plugin ou d'adaptateur avant d'ajouter de nouvelles
  télécommandes.

## Axe 6 — PWA, TLS et modes de déploiement

Cet axe est détaillé dans [ROADMAP-PWA.md](./ROADMAP-PWA.md).

Les modes à préserver ou développer sont :

1. serveur local autonome en HTTP ou HTTPS, sans PWA publique ;
2. service PWA gratuit avec connexion WebRTC au serveur on-premise ;
3. PWA et signalisation WebRTC sur le VPS de l'utilisateur ;
4. PWA sur VPS avec reverse proxy vers le serveur à travers un VPN ;
5. PWA sur VPS avec relais applicatif par reverse WebSocket initié par le
   serveur on-premise ;
6. PWA publique avec HTTPS/WSS direct vers un serveur local certifié.

### Socle commun attendu

- [ ] Produire la PWA comme artefact statique indépendant.
- [ ] Conserver le serveur local et Socket.IO fonctionnels.
- [ ] Ajouter WebRTC comme adaptateur optionnel.
- [ ] Publier les composants auto-hébergeables.
- [ ] Publier le relais WebSocket custom comme composant optionnel indépendant
  du proxy VPN.
- [ ] Ne jamais changer automatiquement de chemin réseau sans l'indiquer.
- [ ] Tester l'installation Android, iOS et desktop.
- [ ] Fournir des diagnostics TLS, permission LAN, ICE et proxy.

## Axe 7 — Installation, mises à jour et exploitation

### Installation

- [ ] Rendre les scripts idempotents.
- [ ] Séparer clairement dépendances système, installation npm, configuration
  et service.
- [ ] Générer les secrets pendant l'installation.
- [ ] Ajouter un mode non interactif documenté.
- [ ] Vérifier les prérequis et afficher les actions correctives.

### Mise à jour

- [ ] Signer ou vérifier l'origine des artefacts de release.
- [ ] Séparer vérification, téléchargement, installation et redémarrage.
- [ ] Prévoir un retour arrière après échec.
- [ ] Conserver la configuration et la base pendant une mise à jour.
- [ ] Afficher un historique local des mises à jour.

### Sauvegarde et diagnostic

- [ ] Ajouter export, sauvegarde et restauration SQLite.
- [ ] Fournir une archive de diagnostic expurgée des secrets.
- [ ] Ajouter rotation et rétention des journaux.
- [ ] Exposer version, transport, capacités et santé dans la CLI.
- [ ] Documenter récupération après base corrompue ou secret perdu.

## Axe 8 — Qualité et livraison

### Tests

- [ ] Ajouter une CI pour tests unitaires et Playwright.
- [ ] Augmenter d'abord la couverture des zones critiques plutôt qu'un objectif
  global artificiel.
- [ ] Ajouter des tests de sécurité pour sessions, rôles et proxies.
- [ ] Ajouter des tests de contrat pour les transports.
- [ ] Ajouter des tests d'installation Linux, Windows et macOS.
- [ ] Tester sur de vrais appareils Android et iOS avant une release PWA.

### Outillage et releases

- [ ] Déclarer les versions Node.js prises en charge.
- [ ] Ajouter formatage et lint automatiques si leur coût reste raisonnable.
- [ ] Automatiser l'audit des dépendances.
- [ ] Générer changelog, artefacts et checksums.
- [ ] Définir les canaux stable et préversion.
- [ ] Documenter la compatibilité client/serveur entre versions.

## Backlog fonctionnel

### Prochaines fonctions

- [ ] Multi-écrans.
- [ ] Profils de commandes.
- [ ] Appareils associés et révocation.
- [ ] Retour haptique.
- [ ] Presse-papiers bidirectionnel avec consentement explicite.
- [ ] Macros limitées à des actions autorisées.
- [ ] Wake-on-LAN lorsqu'un agent local peut émettre le paquet.
- [ ] Personnalisation de l'interface par appareil.

### Explorations

- [ ] API de plugins pour de nouvelles télécommandes.
- [ ] Prévisualisation par piste vidéo WebRTC.
- [ ] Découverte locale mDNS lorsque les navigateurs le permettent.
- [ ] Gestion centralisée optionnelle de plusieurs serveurs on-premise.
- [ ] Paquets natifs ou signatures pour simplifier les permissions système.

## Jalons proposés

### Jalon A — Stabilisation et sécurité

- correctifs P0 ;
- dépendances mises à jour ;
- sessions et rôles séparés ;
- tests de sécurité anti-régression.

### Jalon B — Socle modulaire

- dispatcher métier partagé ;
- contrat de transport ;
- protocole versionné ;
- configuration d'écoute et d'URL clarifiée.

### Jalon C — Expérience et plateformes

- appareils associés ;
- diagnostics de connexion ;
- installation Linux/Windows consolidée ;
- première prise en charge macOS et étude Wayland.

### Jalon D — PWA multi-déploiement

- artefact PWA public ;
- service gratuit WebRTC ;
- paquet WebRTC auto-hébergeable ;
- exemple proxy VPN ;
- relais reverse WebSocket auto-hébergeable ;
- mode HTTPS/WSS local documenté.

### Jalon E — Fonctions avancées

- multi-écrans ;
- profils ;
- presse-papiers ;
- prévisualisation adaptative ;
- architecture de plugins.

## Definition of Done d'une évolution

Une évolution est terminée lorsque :

- la logique métier n'est pas dupliquée entre transports ;
- les erreurs et limites sont documentées ;
- les secrets ne sont ni persistés ni journalisés inutilement ;
- les tests unitaires et d'intégration pertinents passent ;
- les modes existants restent compatibles ou la rupture est explicitement
  versionnée ;
- les scripts d'installation et la documentation sont mis à jour si nécessaire ;
- le comportement a été vérifié sur les plateformes concernées.

---

Cette roadmap est un document vivant. Les priorités doivent être réévaluées à
partir des retours utilisateurs, des mesures de stabilité et des contraintes
réelles des plateformes.
