# PLAT-006-006g — Diagnostics et intégrations desktop

Ce document regroupe les travaux de diagnostic et d’intégration des environnements desktop.

## PLAT-006a — n'afficher dans la télécommande navigateur

**État:** Terminé.

  navigateurs réellement installés sur l'hôte; vérifier l'application Flatpak
  associée lorsque la commande `flatpak` existe, et couvrir le cas où Brave est
  absent malgré la présence de Flatpak.

## PLAT-006b — séparer la gestion des fenêtres X11 et Wayland pour l'action

**État:** Terminé.

  navigateur; détecter le compositeur Wayland et utiliser son IPC lorsqu'il
  expose une activation ciblée, avec repli sur le mécanisme X11 existant.

## PLAT-006c — fournir une extension GNOME minimale exposant une méthode

**État:** Terminé.

  D-Bus ciblée pour rechercher et activer une fenêtre navigateur via Mutter;
  conserver l'installation explicite et le repli si l'extension n'est pas
  activée.

## PLAT-006d — vérifier dans GitHub Actions le bundle GNOME et l'exécution

**État:** Terminé.

  GJS de l'extension, avec un test de sélection et d'activation d'une fenêtre;
  ne pas présenter ce test comme une validation d'une session Mutter réelle.

## PLAT-006d1 — installer le paquet `gnome-shell` dans le job GNOME afin

**État:** Terminé.

  de fournir la commande `gnome-extensions` utilisée pour fabriquer le bundle.

## PLAT-006e — préserver le contexte du compositeur GNOME dans le service

**État:** Terminé.

  `systemd --user` après une mise à jour; conserver le repli documenté vers la
  commande du navigateur lorsque l'activation Wayland échoue, et couvrir la
  transmission des variables de session.

## PLAT-006f — réinstaller et réactiver l'extension GNOME de focus pendant

**État:** Terminé.

  le `postinstall` d'une mise à jour lancée par le daemon sous GNOME Wayland;
  conserver une migration non bloquante avec diagnostic et la réserver à ce
  contexte.

## PLAT-006g — exposer dans les informations serveur un diagnostic stable

**État:** Terminé.

  des intégrations VLC, navigateurs et Samsung TV : disponibilité VLC, liste
  des navigateurs détectés, activation de l'intégration Samsung et état de
  puissance lorsque la vérification réseau est possible; conserver les champs
  existants, ne pas divulguer de secret et représenter une intégration
  indisponible ou une erreur réseau par un état explicite sans faire échouer
  la collecte générale.
