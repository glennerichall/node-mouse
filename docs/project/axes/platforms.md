# Axe — Plateformes et intégrations système

## Résultat visé

Fournir une installation fiable et des capacités clairement détectées sur
Linux, Windows et à terme macOS, avec des intégrations système extensibles.

## Plan de travail

- [ ] PLAT-001 — consolider installation et service Linux; documenter X11/Wayland.
- [ ] PLAT-002 — tester installation, service, mise à jour et désinstallation Windows.
- [ ] PLAT-003 — créer l'installation macOS et guider les permissions Accessibilité.
- [ ] PLAT-004 — intégrer le contrôle et la capture Wayland selon le
  [plan dédié](./wayland.md).
- [x] PLAT-004a — détecter la capture RobotJS indisponible sous Wayland et
  neutraliser la prévisualisation sans interrompre le serveur.
- [ ] PLAT-004g — utiliser un périphérique virtuel `uinput` comme stratégie
  d'entrée Wayland par défaut, conserver RemoteDesktop/libei comme stratégie
  optionnelle et limiter la permission système au seul `/dev/uinput`.
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
