# 05 — PLAT-004 — Plan d'implantation Wayland

**Axe propriétaire:** plateformes — `PLAT-004`  
**État:** en cours; `PLAT-004a` est terminé et `PLAT-004b` a commencé par
l'extraction du contrôleur de bureau RobotJS.

**Avancement au 2026-10-02:** la sélection d'adaptateur et l'entrée Wayland
RemoteDesktop/libei sont implantées. Le helper atteint l'état `ready` sous
Ubuntu 26.04 GNOME et un mouvement réel a été validé. `PLAT-004c` reste en
cours pour la keymap et la restauration; `PLAT-004d` (preview PipeWire) n'est
pas encore implanté. `PLAT-004g` introduit maintenant `uinput` comme stratégie
d'entrée par défaut afin de couvrir les compositeurs sans portail
RemoteDesktop; l'adaptateur portal/libei est conservé comme option.

## Contexte et cible

Ubuntu 26.04 utilise exclusivement Wayland pour la session Ubuntu/GNOME. Les
applications X11 peuvent encore fonctionner dans XWayland, mais RobotJS ne peut
pas y contrôler globalement le pointeur/clavier ni capturer le bureau Wayland.

La cible est Ubuntu 26.04 GNOME Wayland, sans privilèges root, avec consentement
explicite de l'utilisateur. X11 reste un adaptateur supporté et un repli pour les
environnements de bureau qui proposent encore une vraie session Xorg.

## Architecture visée

```text
Commandes applicatives partagées
        │
        ▼
Contrat DesktopController
├── RobotJsX11Adapter (existant)
└── WaylandAdapter
    ├── UInputAdapter (entrée par défaut)
    └── WaylandPortalAdapter (optionnel)
        ├── RemoteDesktop portal (permission et cycle de session)
        ├── libei / EIS (souris, boutons, défilement, clavier)
        └── ScreenCast portal + PipeWire (capture et prévisualisation)
```

Le contrat doit exposer des capacités et non supposer que toutes les fonctions
sont présentes : mouvement relatif/absolu, boutons, défilement, clavier,
position du curseur, écrans et capture. Les contrôleurs métier et Socket.IO ne
doivent connaître ni RobotJS, ni D-Bus, ni PipeWire.

L'entrée uinput, petite et synchrone, est intégrée par un bridge C Node-API
chargé dans Node.js. Les intégrations à cycle de vie complexe restent isolées
dans un helper supervisé: portal/libei aujourd'hui, puis ScreenCast/PipeWire.
Cette frontière permet de redémarrer les sessions externes sans perdre les
sessions web et limite la surface native directement chargée dans le serveur.

## Découpage des itérations

### PLAT-004b — Contrat et détection de capacités

- Extraire derrière `DesktopController` les opérations RobotJS actuellement
  utilisées par souris, clavier, écrans et prévisualisation.
- Exposer cette abstraction par `getDesktopController()`; réserver
  `loadRobotJS()` au chargement dynamique de l'adaptateur historique et prévoir
  un `loadWayland()` équivalent lorsque l'adaptateur Wayland sera implanté.
- Ne charger au démarrage que l'adaptateur sélectionné; RobotJS et les
  bibliothèques Wayland ne doivent jamais être chargés simultanément par défaut.
- Implémenter `RobotJsX11Adapter` sans modifier le protocole client.
- Sélectionner l'adaptateur à partir de la session graphique et publier les
  capacités avec une raison d'indisponibilité actionnable.
- Ajouter des tests de contrat exécutables contre les adaptateurs simulés.

**Sortie:** aucune logique métier n'appelle RobotJS directement; le mode X11
reste sans régression.

### PLAT-004c — Spike RemoteDesktop et entrée Wayland

- Créer une session `org.freedesktop.portal.RemoteDesktop` sur le bus de session.
- Demander pointeur et clavier via `SelectDevices`, puis obtenir l'autorisation
  locale avec `Start`.
- Utiliser `ConnectToEIS` et libei en priorité; évaluer les méthodes D-Bus
  `Notify*` seulement comme solution de compatibilité.
- Couvrir mouvement relatif, clics, maintien/glisser, molette, touches et texte;
  respecter la keymap fournie par le compositeur.
- Conserver et renouveler le `restore_token` lorsque le portail l'autorise,
  sans contourner une révocation de permission.

**Sortie:** une télécommande de test contrôle souris et clavier sous GNOME
Wayland après consentement, sans root ni accès direct à `/dev/input`.

### PLAT-004d — Capture PipeWire et prévisualisation

- Associer la session RemoteDesktop au portail ScreenCast.
- Ouvrir le flux avec `OpenPipeWireRemote` et négocier un format vidéo brut.
- Mapper coordonnées logiques, échelle HiDPI, écran sélectionné et région libei.
- Adapter le flux à la prévisualisation existante : recadrage autour du curseur,
  conversion RGBA, fréquence bornée, abandon des frames obsolètes et arrêt
  lorsqu'aucun client n'affiche la prévisualisation.
- Isoler crash, perte du flux, verrouillage d'écran et changement d'affichage.

**Sortie:** la prévisualisation fonctionne sous Wayland sans `X_GetImage`, avec
latence et consommation mesurées.

### PLAT-004e — Cycle de vie, UX et exploitation

- Déclencher la demande de permission uniquement depuis une action locale/admin
  explicite; un contrôleur QR ne doit pas pouvoir provoquer un dialogue système.
- Afficher les états `permission-required`, `denied`, `revoked`, `portal-missing`,
  `pipewire-unavailable` et `ready`.
- Restaurer la session après reconnexion lorsque permis; revenir proprement en
  capacité réduite après refus ou révocation.
- Intégrer le helper au service `systemd --user`, avec limites de redémarrage,
  logs expurgés, diagnostic CLI et dépendances vérifiées à l'installation.

**Sortie:** installation et dépannage documentés, aucun fallback silencieux et
aucune boucle de dialogues de permission.

### PLAT-004f — Validation et bascule du support

- Tester Ubuntu 26.04 GNOME Wayland sur matériel réel, écran simple et HiDPI,
  veille/reprise, verrouillage, changement d'écran et redémarrage du service.
- Tester au moins un second compositeur portail (KDE Plasma Wayland).
- Rejouer les tests de contrat sous X11 et Wayland.
- Mesurer latence mouvement/clic/frappe, FPS, CPU, mémoire et perte de frames;
  fixer les seuils de sortie à partir de la baseline X11.
- Retirer la mention « Wayland non pris en charge » seulement après validation.

### PLAT-004g — Entrée Wayland portable avec uinput

- Ajouter un bridge C Node-API créant une souris et un clavier virtuels par
  `/dev/uinput`, sans lire les périphériques physiques `/dev/input/event*`.
- Charger cette stratégie paresseusement et par défaut dans une session
  Wayland; permettre de sélectionner explicitement la stratégie portal/libei.
- Conserver le contrat `DesktopController` et le protocole de commandes déjà
  utilisés afin de ne pas dupliquer la logique métier.
- Garder l'isolation par processus pour portal/libei et la future capture
  PipeWire; le bridge uinput, petit et synchrone, reste dans le processus Node.
- Ajouter à l'installation Linux un groupe dédié `remote-mouse-uinput` et une
  règle udev limitée à `/dev/uinput`; ne jamais ajouter l'utilisateur au groupe
  général `input`.
- Exposer une erreur actionnable lorsque le helper, le module ou la permission
  manque, et couvrir la sélection ainsi que le protocole par des tests.

**Sortie:** souris, boutons, défilement et clavier fonctionnent par défaut sous
Wayland indépendamment du backend portal, tandis que `portal` reste une
stratégie configurable et non supprimée.

### PLAT-004j — Masquage au survol de l'overlay QR

- Reproduire la perte du masquage au survol lorsque YAD est exécuté par
  XWayland dans une session Wayland.
- Vérifier que la position du pointeur et la géométrie de la fenêtre sont
  comparées dans le même référentiel de coordonnées, y compris avec mise à
  l'échelle et plusieurs écrans.
- Masquer temporairement l'overlay tant que le pointeur occupe sa zone, puis le
  réafficher après sa sortie sans boucle de masquage/réaffichage ni perte du
  processus YAD.
- Ajouter des tests anti-régression de la décision de survol et conserver le
  comportement actuel sous une vraie session X11.
- Valider le parcours sur Ubuntu 26.04 Wayland avec l'overlay positionné dans
  plusieurs coins de l'écran.

**Sortie:** le QR ne bloque pas la zone située sous l'overlay lors du survol,
et revient automatiquement lorsque le pointeur quitte cette zone sous Wayland
comme sous X11.

### PLAT-004l — Helper natif d’overlay QR X11/XWayland

- Remplacer YAD par un petit processus natif consacré à l’overlay; ne pas
  charger sa boucle graphique ni son cycle de vie dans le processus Node.js.
- Conserver la génération du QR en PNG avec le module Node.js existant; le
  helper reçoit le chemin de l’image, la géométrie et les commandes
  `show`, `hide`, `update` et `close` par un protocole IPC minimal.
- Couvrir X11 et GNOME Wayland avec un même adaptateur X11/XWayland capable de
  positionner la fenêtre, afficher le PNG et traiter directement les événements
  locaux `EnterNotify` et `LeaveNotify`.
- Lorsque le contenu est masqué, sonder la présence du pointeur par remappage
  transparent et borné de la fenêtre, sans dépendre d’une position globale
  Wayland ni conserver une surface plein écran qui intercepte le bureau.
- Garantir que la zone située sous le QR redevient cliquable pendant le
  masquage; mesurer et borner toute interception transitoire causée par une
  sonde de présence.
- Supprimer de ce parcours YAD, `wmctrl`, le polling `XQueryPointer` global, le
  worker de position et le suivi hybride des deltas `uinput`; conserver ces
  dépendances seulement si un autre usage documenté les exige encore.
- Charger et superviser le helper paresseusement, publier une erreur
  actionnable lorsqu’il manque et laisser le serveur fonctionner sans overlay
  en cas de panne ou de plateforme non prise en charge.
- Tester le protocole, les transitions d’état, les redémarrages et les courses
  de mapping; valider sur une vraie session X11 et sur Ubuntu 26.04 GNOME
  Wayland/XWayland, avec souris distante et souris physique.
- Traiter un futur overlay Wayland réellement natif comme un adaptateur séparé
  par famille de compositeurs; ne pas présenter ce helper XWayland comme une
  solution Wayland universelle.

**Sortie:** l’overlay QR ne dépend plus de YAD ni d’une lecture globale du
pointeur; il se masque et revient sans oscillation sous X11 et XWayland, libère
la zone sous-jacente et reste isolé du serveur principal.

### PLAT-004k — Vitesse et accélération de la souris uinput

- Établir une référence X11 avec des gestes lents, moyens et rapides, à valeur
  `input.mouseSpeed` identique, puis rejouer les mêmes deltas sous Wayland.
- Mesurer séparément les deltas produits par le client, le multiplicateur du
  contrôleur d'entrée, les valeurs envoyées au bridge uinput et le déplacement
  observé à l'écran.
- Vérifier l'effet de l'accumulation des fractions dans le bridge natif et de la
  courbe d'accélération appliquée par le compositeur au périphérique virtuel.
- Déterminer si la normalisation appartient à l'adaptateur uinput ou à une
  configuration de périphérique; ne pas introduire un coefficient Wayland
  arbitraire dans la logique métier partagée.
- Préserver la précision des petits mouvements tout en rapprochant la distance
  et l'accélération des gestes rapides de la référence X11.
- Ajouter des tests de transformation des deltas et valider plusieurs valeurs
  de `input.mouseSpeed` sur Ubuntu 26.04 Wayland réel.

**Sortie:** à réglage identique, la souris Wayland offre une vitesse et une
progression d'accélération comparables à X11, sans saut sur les petits gestes ni
régression de la molette ou du glisser-déposer.

## Sécurité et contraintes

- Pour la stratégie portal, le portail et le compositeur restent l'autorité sur
  les permissions locales.
- Pour la stratégie uinput, l'installation privilégiée accorde seulement
  l'écriture à `/dev/uinput` à un groupe dédié. Elle ne donne aucun accès aux
  événements des claviers et souris physiques.
- Le consentement Wayland est contourné par nature avec uinput; le contrôle
  d'accès de Remote Mouse devient donc l'autorité avant toute injection.
- Les descripteurs PipeWire/EIS, tokens de restauration et métadonnées d'écran
  ne doivent jamais être exposés à l'API web ni aux logs.
- La fermeture de la session, la révocation et le verrouillage doivent stopper
  immédiatement entrée et capture.

## Dépendances et risques

- Disponibilité et versions de `xdg-desktop-portal`, du backend GNOME/KDE,
  PipeWire et libei sur les distributions ciblées.
- Consentement interactif incompatible avec un démarrage totalement headless.
- Différences de capacités, de restauration et de keymap entre compositeurs.
- Coût de maintenance d'un helper natif et de ses paquets multi-architecture.
- Position du curseur et capture multi-écrans potentiellement découplées; les
  coordonnées devront provenir des régions accordées par le portail/libei.

## Definition of Done PLAT-004

- Souris, clic, glisser, défilement et clavier passent par l'adaptateur Wayland.
- La prévisualisation PipeWire fonctionne sans appel X11 natif.
- Permission, refus, révocation, reconnexion et arrêt sont testés.
- Aucun contrôleur distant ne peut ouvrir une permission système.
- Les tests X11 existants restent verts et le fallback est explicite.
- Ubuntu 26.04 GNOME Wayland est validé sur machine réelle et documenté comme
  plateforme supportée.
