# 05 — PLAT — Plateformes et intégrations système

## Résultat visé

Fournir une installation fiable et des capacités clairement détectées sur
Linux, Windows et à terme macOS, avec des intégrations système extensibles.

## Plan de travail

- [ ] PLAT-001 — consolider installation et service Linux; documenter X11/Wayland.
- [x] PLAT-001a — rendre l'installation uinput autonome et idempotente; migrer
  une installation existante sans remplacer sa configuration, ses secrets ni
  sa base de données.
- [x] PLAT-001b — rattacher la migration privilégiée uinput au `postinstall`
  déclenché par la mise à jour intégrée; demander l'autorisation locale via
  Polkit seulement lorsque la configuration système manque.
- [ ] PLAT-002 — tester installation, service, mise à jour et désinstallation Windows.
- [ ] PLAT-003 — créer l'installation macOS et guider les permissions Accessibilité.
- [ ] PLAT-004 — intégrer le contrôle et la capture Wayland selon le
  [plan dédié](./05-PLAT-004-wayland.md).
- [x] PLAT-004a — détecter la capture RobotJS indisponible sous Wayland et
  neutraliser la prévisualisation sans interrompre le serveur.
- [ ] PLAT-004g — utiliser un périphérique virtuel `uinput` comme stratégie
  d'entrée Wayland par défaut, conserver RemoteDesktop/libei comme stratégie
  optionnelle et limiter la permission système au seul `/dev/uinput`.
- [x] PLAT-004h — rendre l'overlay QR YAD utilisable sous Wayland en l'exécutant
  explicitement par XWayland lorsque le positionnement global est requis.
- [x] PLAT-004i — empêcher YAD de rogner le QR lorsque la fenêtre a exactement
  la taille configurée, en adaptant l'image à la zone intérieure du widget.
- [ ] PLAT-004j — rétablir sous Wayland/XWayland le masquage temporaire de
  l'overlay QR lorsque le pointeur le survole, puis son réaffichage après la
  sortie du pointeur, sans oscillation, perte permanente de la fenêtre ni
  régression du comportement X11; couvrir la logique de coordonnées par des
  tests et valider le résultat sur Ubuntu 26.04 Wayland réel.
- [ ] PLAT-004l — remplacer l’overlay QR YAD et les contournements de position
  globale par un helper natif X11/XWayland spécialisé, événementiel et isolé;
  conserver la génération du PNG dans Node.js, libérer la zone masquée pour les
  clics et valider affichage, survol et retour du QR sous X11 et GNOME Wayland.
- [ ] PLAT-004k — corriger la vitesse plus faible et l'accélération moins
  perceptible de la souris avec l'adaptateur Wayland uinput : comparer des
  séquences de mouvements identiques sous X11 et Wayland, localiser l'écart
  entre la sensibilité applicative, la conversion en événements relatifs et la
  courbe du compositeur, puis normaliser le comportement sans modifier la
  signification du réglage utilisateur `input.mouseSpeed`.
- [ ] Renforcer diagnostics VLC, navigateurs et Samsung TV.
- [ ] Définir un contrat d'adaptateur avant de multiplier les intégrations.

Pour chaque tâche, lister les versions OS testées, prérequis et limitations
observées; distinguer capacités simulées et vérifiées sur machine réelle.

## Compatibilité Linux transitoire

- Ubuntu 26.04 ne fournit plus de session Ubuntu/GNOME sur Xorg; XWayland ne
  donne pas à RobotJS le contrôle global ni la capture du bureau Wayland.
- Jusqu'à PLAT-004, le support complet reste assuré sous une vraie session X11.
  Sur Ubuntu 26.04, cela exige un environnement de bureau proposant encore une
  session Xorg, par exemple Xfce, MATE, KDE/X11 ou i3.
- Le bureau Ubuntu/GNOME Wayland reste utilisable sans prévisualisation, mais le
  contrôle souris/clavier n'est pas déclaré pris en charge avant PLAT-004.
