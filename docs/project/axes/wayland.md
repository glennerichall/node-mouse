# Plan d'implantation — Wayland

**Axe propriétaire:** plateformes — `PLAT-004`  
**État:** en cours; `PLAT-004a` est terminé et `PLAT-004b` a commencé par
l'extraction du contrôleur de bureau RobotJS.

**Avancement au 2026-10-02:** la sélection d'adaptateur et l'entrée Wayland
RemoteDesktop/libei sont implantées. Le helper atteint l'état `ready` sous
Ubuntu 26.04 GNOME et un mouvement réel a été validé. `PLAT-004c` reste en
cours pour la keymap et la restauration; `PLAT-004d` (preview PipeWire) n'est
pas encore implanté.

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
└── WaylandPortalAdapter
    ├── RemoteDesktop portal (permission et cycle de session)
    ├── libei / EIS (souris, boutons, défilement, clavier)
    └── ScreenCast portal + PipeWire (capture et prévisualisation)
```

Le contrat doit exposer des capacités et non supposer que toutes les fonctions
sont présentes : mouvement relatif/absolu, boutons, défilement, clavier,
position du curseur, écrans et capture. Les contrôleurs métier et Socket.IO ne
doivent connaître ni RobotJS, ni D-Bus, ni PipeWire.

L'intégration native sera isolée dans un helper local supervisé, communiquant
avec Node.js par socket Unix et messages versionnés. Cela évite qu'une erreur de
bibliothèque native termine le serveur HTTP et permet de redémarrer l'adaptateur
sans perdre les sessions web. Le choix d'implémentation du helper (C/libei ou
Rust avec bibliothèques portails/PipeWire maintenues) sera tranché par le spike,
sur preuves de maintenance, packaging Ubuntu et gestion des descripteurs de
fichiers D-Bus/PipeWire.

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

## Sécurité et contraintes

- Le portail et le compositeur restent l'autorité sur les permissions locales.
- Aucun accès root, `uinput` global ou contournement du portail n'est retenu par
  défaut; une telle option demanderait une décision de sécurité distincte.
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
