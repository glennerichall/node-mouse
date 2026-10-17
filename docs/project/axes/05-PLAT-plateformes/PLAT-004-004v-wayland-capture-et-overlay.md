# PLAT-004-004v — Wayland, capture et overlay

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## 05 — PLAT-004 — Plan d'implantation Wayland

**Axe propriétaire:** plateformes — `PLAT-004`  
**État:** en cours; `PLAT-004a` est terminé et `PLAT-004b` a commencé par
l'extraction du contrôleur de bureau RobotJS.

**Avancement au 2026-10-02:** la sélection d'adaptateur et l'entrée Wayland
RemoteDesktop/libei sont implantées. Le helper atteint l'état `ready` sous
Ubuntu 26.04 GNOME et un mouvement réel a été validé. `PLAT-004c` reste une
stratégie optionnelle, incomplète pour la keymap et la restauration, et ne
bloque pas uinput. `PLAT-004d` (preview PipeWire) n'est pas encore implanté.
Le contrat transversal est défini par `PLAT-004u` et son backend natif isolé
est planifié dans `PLAT-004v`. `PLAT-004g` introduit maintenant `uinput` comme stratégie
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
    ├── WaylandPortalAdapter (entrée optionnelle)
    │   ├── RemoteDesktop portal (permission et cycle de session)
    │   └── libei / EIS (souris, boutons, défilement, clavier)
    └── WaylandCaptureHelper (processus natif)
        ├── ScreenCast portal (permission et sélection de source)
        ├── PipeWire (réception et cycle du flux)
        └── conversion de frames (contrat PLAT-004u)
```

Le contrat doit exposer des capacités et non supposer que toutes les fonctions
sont présentes : mouvement relatif/absolu, boutons, défilement, clavier,
position du curseur, écrans et capture. Les contrôleurs métier et Socket.IO ne
doivent connaître ni RobotJS, ni D-Bus, ni PipeWire.

L'entrée uinput, petite et synchrone, est intégrée par un bridge C Node-API
chargé dans Node.js. La capture Wayland est séparée dans un seul helper natif
supervisé qui possède à la fois le portail ScreenCast, PipeWire et la conversion
des frames. Cette frontière permet de redémarrer la session de capture sans
perdre les sessions web et limite la surface native directement chargée dans le
serveur. Le transport réseau reste dans le processus Node.js.

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

### PLAT-004d — Capture PipeWire et prévisualisation — dépend de PLAT-004v

Cette itération ne sera pas développée comme une fonctionnalité Wayland isolée.
La prévisualisation actuelle reste disponible sous X11 via son transport
Socket.IO binaire; sous Wayland, son état reste explicitement indisponible.
Toute capture PipeWire devra alimenter un contrat de streaming commun aux
plateformes. Son implantation dépend de `PLAT-004u`, de la décision de
transport de l'axe PWA et du helper décrit dans `PLAT-004v`.

Le contrat défini par `PLAT-004u` et la façade `PLAT-007` est le suivant :

- une source de capture expose `start({region, fps, onFrame, onStatus})` et
  retourne `stop()`; elle publie un état explicite et ne conserve pas de frame
  obsolète;
- une frame contient une séquence, un horodatage monotone, sa taille, son
  format de pixels, son origine écran, la position du curseur et son payload
  binaire;
- un canal de streaming expose `open`, `send` et `close`; `send` retourne si la
  frame a été acceptée et le canal abandonne les frames périmées sous pression;
- les descripteurs de portail, tokens, adresses de session et métadonnées
  sensibles restent dans l'adaptateur de capture et ne passent jamais dans la
  frame ou les logs;
- Socket.IO reste l'adaptateur du flux léger actuel; un futur transport vidéo
  est sélectionné par capacités et configuration, jamais implicitement.
- la capacité de capture est indépendante de la capacité d'entrée : uinput
  peut être `ready` alors que la capture est `unavailable`, et un backend
  portal/libei ne devient pas une dépendance de la capture.

- Le helper de `PLAT-004v` associe la sélection ScreenCast, `OpenPipeWireRemote`
  et la négociation du format vidéo brut dans un même cycle de capture.
- Mapper coordonnées logiques, échelle HiDPI, écran sélectionné et région
  capturée; l'entrée uinput reste indépendante de cette région.
- Adapter le flux à la prévisualisation existante : recadrage autour du curseur,
  conversion RGBA, fréquence bornée, abandon des frames obsolètes et arrêt
  lorsqu'aucun client n'affiche la prévisualisation.
- Isoler crash, perte du flux, verrouillage d'écran et changement d'affichage.

**Sortie:** la prévisualisation fonctionne sous Wayland sans `X_GetImage`, avec
latence et consommation mesurées.

### PLAT-004v — Helper natif de capture Wayland

- Créer un exécutable natif dédié, supervisé par le processus Node.js et
  distinct du bridge uinput et du helper d'overlay QR.
- Lui confier le portail `org.freedesktop.portal.ScreenCast`, le descripteur
  PipeWire, la boucle de réception, la négociation des formats et la conversion
  vers le format binaire du contrat `PLAT-004u`.
- Définir un IPC privé borné pour démarrer/arrêter une capture, transmettre les
  frames et remonter les états `permission-required`, `denied`, `revoked`,
  `pipewire-unavailable`, `lost` et `ready`.
- Fermer et recréer le flux après verrouillage, changement d'écran, révocation
  ou perte de PipeWire; ne jamais bloquer l'API HTTP sur l'initialisation du
  helper.
- Fournir les artefacts x64/ARM64 et les diagnostics de dépendances sans
  imposer libei à la capture; le backend d'entrée reste sélectionnable séparément.

**Sortie:** le serveur Node.js consomme une source de capture conforme à
`PLAT-004u`, tandis que les détails du portail et de PipeWire restent confinés
à un seul processus natif remplaçable.

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
- Garder l'isolation par processus pour le helper de capture PipeWire et
  l'adaptateur portal/libei optionnel; le bridge uinput, petit et synchrone,
  reste dans le processus Node.
- Ajouter à l'installation Linux un groupe dédié `remote-mouse-uinput` et une
  règle udev limitée à `/dev/uinput`; ne jamais ajouter l'utilisateur au groupe
  général `input`.
- Exposer une erreur actionnable lorsque le helper, le module ou la permission
  manque, et couvrir la sélection ainsi que le protocole par des tests.

**Sortie:** souris, boutons, défilement et clavier fonctionnent par défaut sous
Wayland indépendamment du backend portal, tandis que `portal` reste une
stratégie configurable et non supprimée.

### PLAT-004g2 — Classification des périphériques uinput

- Créer deux périphériques virtuels distincts : une souris limitée aux axes
  relatifs et boutons, et un clavier limité aux codes clavier.
- Acheminer mouvement, défilement et boutons vers la souris, et les frappes vers
  le clavier, sans changer le contrat `DesktopController`.
- Conserver strictement l'accès existant à `/dev/uinput`; ne modifier ni règle
  udev, ni groupe, ni cycle Polkit pour influencer la sensation du pointeur.
- Retirer du chargement uinput le lecteur de position globale XWayland devenu
  inutile avec l'overlay natif et conserver la position synthétique interne.
- Compiler le bridge avec les avertissements traités comme erreurs et couvrir
  la séparation des capacités ainsi que le routage Node-API par des tests.

**Sortie:** Linux reçoit une souris et un clavier virtuels correctement séparés,
sans élargissement des privilèges ni prétention de corriger la vitesse perçue.

### PLAT-004j — Retrait du masquage automatique du QR

- Retirer l'observateur de survol et le suivi du pointeur utilisés uniquement
  pour masquer/réafficher automatiquement l'overlay QR.
- Retirer aussi le masquage au survol du helper natif X11/XWayland; le QR reste
  affiché jusqu'à l'action explicite Toggle QR ou sa désactivation de
  configuration.
- Conserver le placement de l'overlay et les opérations explicites `show`,
  `hide`, `update` et `close` sur Linux et Windows.
- Supprimer les paramètres d'auto-hide devenus sans effet dans le schéma,
  l'interface de configuration et les adaptateurs.
- Tester que le survol ne change jamais la visibilité et que Toggle QR
  continue d'alterner correctement l'affichage sur toutes les plateformes.

**Sortie:** l'overlay QR n'observe plus le pointeur et ne se masque jamais
automatiquement; son bouton Toggle reste l'autorité de visibilité.

### PLAT-004l — Helper natif d’overlay QR X11/XWayland

- Remplacer YAD par un petit processus natif consacré à l’overlay; ne pas
  charger sa boucle graphique ni son cycle de vie dans le processus Node.js.
- Conserver la génération du QR en PNG avec le module Node.js existant; le
  helper reçoit le chemin de l’image, la géométrie et les commandes
  `show`, `hide`, `update` et `close` par un protocole IPC minimal.
- Utiliser l'adaptateur X11/XWayland pour positionner la fenêtre et afficher le
  PNG; ne pas traiter d'événements de survol ni sonder la position du pointeur.
- Laisser le helper mappé tant que le QR est visible; une commande explicite
  `hide` démonte la fenêtre et libère la zone sous-jacente.
- Supprimer de ce parcours YAD et `wmctrl`; le helper ne dépend d'aucune
  position globale du pointeur, de worker XWayland ni des deltas uinput.
- Charger et superviser le helper paresseusement, publier une erreur
  actionnable lorsqu’il manque et laisser le serveur fonctionner sans overlay
  en cas de panne ou de plateforme non prise en charge.
- Tester le protocole, les transitions d’état, les redémarrages et les courses
  de mapping; valider sur une vraie session X11 et sur Ubuntu 26.04 GNOME
  Wayland/XWayland.
- Traiter un futur overlay Wayland réellement natif comme un adaptateur séparé
  par famille de compositeurs; ne pas présenter ce helper XWayland comme une
  solution Wayland universelle.

**Sortie:** l’overlay QR ne dépend plus de YAD ni d’une lecture globale du
pointeur; sa visibilité est contrôlée uniquement par les commandes explicites
et le helper reste isolé du serveur principal.

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
- La prévisualisation PipeWire fonctionne sans appel X11 natif, après décision
  du contrat de streaming transversal et validation des backends supportés.
- Permission, refus, révocation, reconnexion et arrêt sont testés.
- Aucun contrôleur distant ne peut ouvrir une permission système.
- Les tests X11 existants restent verts et le fallback est explicite.
- Ubuntu 26.04 GNOME Wayland est validé sur machine réelle et documenté comme
  plateforme supportée.

## PLAT-004a — détecter la capture RobotJS indisponible sous Wayland

**État:** Terminé.

  neutraliser la prévisualisation sans interrompre le serveur.

## PLAT-004g — utiliser un périphérique virtuel `uinput` comme stratégie

**État:** Terminé.

  d'entrée Wayland par défaut, conserver RemoteDesktop/libei comme stratégie
  optionnelle et limiter la permission système au seul `/dev/uinput`.

## PLAT-004h — rendre l'overlay QR YAD utilisable sous Wayland en l'exécutant

**État:** Terminé.

  explicitement par XWayland lorsque le positionnement global est requis.

## PLAT-004i — empêcher YAD de rogner le QR lorsque la fenêtre a exactement

**État:** Terminé.

  la taille configurée, en adaptant l'image à la zone intérieure du widget.

## PLAT-004j — retirer le suivi de souris utilisé par le masquage

**État:** Terminé.

  automatique du QR sous toutes les plateformes; conserver sa visibilité
  jusqu'à Toggle QR ou désactivation de configuration, et vérifier que le
  survol ne modifie jamais l'état.

## PLAT-004l — remplacer l’overlay QR YAD par un helper natif X11/XWayland

**État:** Terminé.

  spécialisé et isolé; conserver la génération du PNG dans Node.js et valider
  ses commandes explicites d'affichage, masquage et fermeture.

## PLAT-004m — absorber `EPIPE` et les erreurs de stdin du helper

**État:** Terminé.

  XWayland lors de sa fermeture concurrente, afin que l'arrêt normal du service
  après une mise à jour ne fasse pas planter le processus Node.js; couvrir le
  scénario de pipe cassé par un test unitaire.

## PLAT-004n — garantir le traitement ordonné de commandes IPC rapprochées

**État:** Terminé.

  du helper QR XWayland (notamment masquer puis réafficher), sans perte de
  commande liée à la lecture tamponnée de stdin; couvrir le cycle par un test
  d'intégration avec un serveur X virtuel lorsque disponible.

## PLAT-004o — rendre atomiques les opérations de visibilité de l'overlay

**État:** Terminé.

  QR et faire qu'une commande de bascule réaffiche aussi un overlay masqué
  temporairement par le survol; tester les transitions concurrentes et
  l'état `hover-hidden`.

## PLAT-004p — détecter les écritures refusées par le canal du helper QR,

**État:** Terminé.

  remplacer son handle périmé et réessayer l'affichage; tester le refus d'une
  commande `SHOW` après un rafraîchissement pourtant accepté.

## PLAT-004q — rendre les commandes du helper QR acquittées

**État:** Terminé.

  identifiant de requête et un délai borné; ne confirmer une transition au
  service qu'après son accusé de réception; vérifier que les commandes
  explicites `SHOW` et `HIDE` ne dépendent pas de l'état du pointeur.

## PLAT-004r — ne pas retarder l'initialisation HTTP par l'attente de l'ACK

**État:** Terminé.

  initial du helper QR; tester le démarrage du serveur lorsque cet ACK tarde.

## PLAT-004s — ne masquer l'overlay QR que si la position réelle du pointeur

**État:** Terminé.

  est dans ses limites lors d'un `EnterNotify`; ignorer les événements d'entrée
  parasites déclenchés par les remappages X11/XWayland et ajouter un test de
  régression pour un mouvement du pointeur hors de la zone QR.

## PLAT-004t — éviter l'accumulation des bascules QR en attente en coalesçant

**État:** Terminé.

  les demandes successives, annuler les opérations QR lors de la fermeture et
  terminer immédiatement le helper natif pendant SIGINT/SIGTERM; couvrir les
  bascules concurrentes et l'arrêt pendant une commande sans ACK.

## PLAT-004u — définir le contrat de capture et de streaming transversal

**État:** Terminé.

  avant d'implémenter un backend PipeWire : séparer source de frames, cadence,
  métadonnées, annulation et transport réseau; réutiliser le transport actuel
  pour la prévisualisation légère et réserver un transport vidéo moderne à un
  besoin de streaming d'écran confirmé, en coordination avec l'axe PWA.

## PLAT-004v — définir puis implanter un helper natif Wayland dédié

**État:** À faire.

  capture : le même exécutable possède le cycle de vie ScreenCast portal,
  l'ouverture PipeWire, la conversion des frames et la reprise après perte du
  flux. Le helper est supervisé par Node.js et expose uniquement le contrat de
  capture de `PLAT-004u`; il ne mélange ni l'injection uinput, ni le transport
  Socket.IO/WebRTC, ni l'overlay QR. Prévoir le packaging multi-architecture,
  les diagnostics et l'arrêt propre avant de faire dépendre `PLAT-004d` de ce
  backend.

## PLAT-004 — Plan détaillé Wayland

## 05 — PLAT-004 — Plan d'implantation Wayland

**Axe propriétaire:** plateformes — `PLAT-004`  
**État:** en cours; `PLAT-004a` est terminé et `PLAT-004b` a commencé par
l'extraction du contrôleur de bureau RobotJS.

**Avancement au 2026-10-02:** la sélection d'adaptateur et l'entrée Wayland
RemoteDesktop/libei sont implantées. Le helper atteint l'état `ready` sous
Ubuntu 26.04 GNOME et un mouvement réel a été validé. `PLAT-004c` reste une
stratégie optionnelle, incomplète pour la keymap et la restauration, et ne
bloque pas uinput. `PLAT-004d` (preview PipeWire) n'est pas encore implanté.
Le contrat transversal est défini par `PLAT-004u` et son backend natif isolé
est planifié dans `PLAT-004v`. `PLAT-004g` introduit maintenant `uinput` comme stratégie
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
    ├── WaylandPortalAdapter (entrée optionnelle)
    │   ├── RemoteDesktop portal (permission et cycle de session)
    │   └── libei / EIS (souris, boutons, défilement, clavier)
    └── WaylandCaptureHelper (processus natif)
        ├── ScreenCast portal (permission et sélection de source)
        ├── PipeWire (réception et cycle du flux)
        └── conversion de frames (contrat PLAT-004u)
```

Le contrat doit exposer des capacités et non supposer que toutes les fonctions
sont présentes : mouvement relatif/absolu, boutons, défilement, clavier,
position du curseur, écrans et capture. Les contrôleurs métier et Socket.IO ne
doivent connaître ni RobotJS, ni D-Bus, ni PipeWire.

L'entrée uinput, petite et synchrone, est intégrée par un bridge C Node-API
chargé dans Node.js. La capture Wayland est séparée dans un seul helper natif
supervisé qui possède à la fois le portail ScreenCast, PipeWire et la conversion
des frames. Cette frontière permet de redémarrer la session de capture sans
perdre les sessions web et limite la surface native directement chargée dans le
serveur. Le transport réseau reste dans le processus Node.js.

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

### PLAT-004d — Capture PipeWire et prévisualisation — dépend de PLAT-004v

Cette itération ne sera pas développée comme une fonctionnalité Wayland isolée.
La prévisualisation actuelle reste disponible sous X11 via son transport
Socket.IO binaire; sous Wayland, son état reste explicitement indisponible.
Toute capture PipeWire devra alimenter un contrat de streaming commun aux
plateformes. Son implantation dépend de `PLAT-004u`, de la décision de
transport de l'axe PWA et du helper décrit dans `PLAT-004v`.

Le contrat défini par `PLAT-004u` et la façade `PLAT-007` est le suivant :

- une source de capture expose `start({region, fps, onFrame, onStatus})` et
  retourne `stop()`; elle publie un état explicite et ne conserve pas de frame
  obsolète;
- une frame contient une séquence, un horodatage monotone, sa taille, son
  format de pixels, son origine écran, la position du curseur et son payload
  binaire;
- un canal de streaming expose `open`, `send` et `close`; `send` retourne si la
  frame a été acceptée et le canal abandonne les frames périmées sous pression;
- les descripteurs de portail, tokens, adresses de session et métadonnées
  sensibles restent dans l'adaptateur de capture et ne passent jamais dans la
  frame ou les logs;
- Socket.IO reste l'adaptateur du flux léger actuel; un futur transport vidéo
  est sélectionné par capacités et configuration, jamais implicitement.
- la capacité de capture est indépendante de la capacité d'entrée : uinput
  peut être `ready` alors que la capture est `unavailable`, et un backend
  portal/libei ne devient pas une dépendance de la capture.

- Le helper de `PLAT-004v` associe la sélection ScreenCast, `OpenPipeWireRemote`
  et la négociation du format vidéo brut dans un même cycle de capture.
- Mapper coordonnées logiques, échelle HiDPI, écran sélectionné et région
  capturée; l'entrée uinput reste indépendante de cette région.
- Adapter le flux à la prévisualisation existante : recadrage autour du curseur,
  conversion RGBA, fréquence bornée, abandon des frames obsolètes et arrêt
  lorsqu'aucun client n'affiche la prévisualisation.
- Isoler crash, perte du flux, verrouillage d'écran et changement d'affichage.

**Sortie:** la prévisualisation fonctionne sous Wayland sans `X_GetImage`, avec
latence et consommation mesurées.

### PLAT-004v — Helper natif de capture Wayland

- Créer un exécutable natif dédié, supervisé par le processus Node.js et
  distinct du bridge uinput et du helper d'overlay QR.
- Lui confier le portail `org.freedesktop.portal.ScreenCast`, le descripteur
  PipeWire, la boucle de réception, la négociation des formats et la conversion
  vers le format binaire du contrat `PLAT-004u`.
- Définir un IPC privé borné pour démarrer/arrêter une capture, transmettre les
  frames et remonter les états `permission-required`, `denied`, `revoked`,
  `pipewire-unavailable`, `lost` et `ready`.
- Fermer et recréer le flux après verrouillage, changement d'écran, révocation
  ou perte de PipeWire; ne jamais bloquer l'API HTTP sur l'initialisation du
  helper.
- Fournir les artefacts x64/ARM64 et les diagnostics de dépendances sans
  imposer libei à la capture; le backend d'entrée reste sélectionnable séparément.

**Sortie:** le serveur Node.js consomme une source de capture conforme à
`PLAT-004u`, tandis que les détails du portail et de PipeWire restent confinés
à un seul processus natif remplaçable.

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
- Garder l'isolation par processus pour le helper de capture PipeWire et
  l'adaptateur portal/libei optionnel; le bridge uinput, petit et synchrone,
  reste dans le processus Node.
- Ajouter à l'installation Linux un groupe dédié `remote-mouse-uinput` et une
  règle udev limitée à `/dev/uinput`; ne jamais ajouter l'utilisateur au groupe
  général `input`.
- Exposer une erreur actionnable lorsque le helper, le module ou la permission
  manque, et couvrir la sélection ainsi que le protocole par des tests.

**Sortie:** souris, boutons, défilement et clavier fonctionnent par défaut sous
Wayland indépendamment du backend portal, tandis que `portal` reste une
stratégie configurable et non supprimée.

### PLAT-004g2 — Classification des périphériques uinput

- Créer deux périphériques virtuels distincts : une souris limitée aux axes
  relatifs et boutons, et un clavier limité aux codes clavier.
- Acheminer mouvement, défilement et boutons vers la souris, et les frappes vers
  le clavier, sans changer le contrat `DesktopController`.
- Conserver strictement l'accès existant à `/dev/uinput`; ne modifier ni règle
  udev, ni groupe, ni cycle Polkit pour influencer la sensation du pointeur.
- Retirer du chargement uinput le lecteur de position globale XWayland devenu
  inutile avec l'overlay natif et conserver la position synthétique interne.
- Compiler le bridge avec les avertissements traités comme erreurs et couvrir
  la séparation des capacités ainsi que le routage Node-API par des tests.

**Sortie:** Linux reçoit une souris et un clavier virtuels correctement séparés,
sans élargissement des privilèges ni prétention de corriger la vitesse perçue.

### PLAT-004j — Retrait du masquage automatique du QR

- Retirer l'observateur de survol et le suivi du pointeur utilisés uniquement
  pour masquer/réafficher automatiquement l'overlay QR.
- Retirer aussi le masquage au survol du helper natif X11/XWayland; le QR reste
  affiché jusqu'à l'action explicite Toggle QR ou sa désactivation de
  configuration.
- Conserver le placement de l'overlay et les opérations explicites `show`,
  `hide`, `update` et `close` sur Linux et Windows.
- Supprimer les paramètres d'auto-hide devenus sans effet dans le schéma,
  l'interface de configuration et les adaptateurs.
- Tester que le survol ne change jamais la visibilité et que Toggle QR
  continue d'alterner correctement l'affichage sur toutes les plateformes.

**Sortie:** l'overlay QR n'observe plus le pointeur et ne se masque jamais
automatiquement; son bouton Toggle reste l'autorité de visibilité.

### PLAT-004l — Helper natif d’overlay QR X11/XWayland

- Remplacer YAD par un petit processus natif consacré à l’overlay; ne pas
  charger sa boucle graphique ni son cycle de vie dans le processus Node.js.
- Conserver la génération du QR en PNG avec le module Node.js existant; le
  helper reçoit le chemin de l’image, la géométrie et les commandes
  `show`, `hide`, `update` et `close` par un protocole IPC minimal.
- Utiliser l'adaptateur X11/XWayland pour positionner la fenêtre et afficher le
  PNG; ne pas traiter d'événements de survol ni sonder la position du pointeur.
- Laisser le helper mappé tant que le QR est visible; une commande explicite
  `hide` démonte la fenêtre et libère la zone sous-jacente.
- Supprimer de ce parcours YAD et `wmctrl`; le helper ne dépend d'aucune
  position globale du pointeur, de worker XWayland ni des deltas uinput.
- Charger et superviser le helper paresseusement, publier une erreur
  actionnable lorsqu’il manque et laisser le serveur fonctionner sans overlay
  en cas de panne ou de plateforme non prise en charge.
- Tester le protocole, les transitions d’état, les redémarrages et les courses
  de mapping; valider sur une vraie session X11 et sur Ubuntu 26.04 GNOME
  Wayland/XWayland.
- Traiter un futur overlay Wayland réellement natif comme un adaptateur séparé
  par famille de compositeurs; ne pas présenter ce helper XWayland comme une
  solution Wayland universelle.

**Sortie:** l’overlay QR ne dépend plus de YAD ni d’une lecture globale du
pointeur; sa visibilité est contrôlée uniquement par les commandes explicites
et le helper reste isolé du serveur principal.

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
- La prévisualisation PipeWire fonctionne sans appel X11 natif, après décision
  du contrat de streaming transversal et validation des backends supportés.
- Permission, refus, révocation, reconnexion et arrêt sont testés.
- Aucun contrôleur distant ne peut ouvrir une permission système.
- Les tests X11 existants restent verts et le fallback est explicite.
- Ubuntu 26.04 GNOME Wayland est validé sur machine réelle et documenté comme
  plateforme supportée.
