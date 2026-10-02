# Plateformes — PLAT-004c — 2026-10-02

État: en cours

## Objectif et critères d'acceptation

Implanter le premier adaptateur Wayland fonctionnel pour la souris et le
clavier, sans charger RobotJS dans une session Wayland et sans privilège root.

- Sélectionner `loadWayland()` sous Linux lorsque `XDG_SESSION_TYPE=wayland`.
- Créer une session XDG RemoteDesktop après consentement local explicite.
- Connecter libei au descripteur EIS fourni par le portail.
- Couvrir mouvement relatif, boutons, molette et touches prises en charge.
- Isoler le code natif du serveur Node.js dans un processus helper.
- Préserver X11, Windows et macOS via l'adaptateur RobotJS.

## Décisions et raisons

Le helper est écrit en C et utilise les bibliothèques système `liboeffis` et
`libei`. Cette solution suit directement les API Freedesktop disponibles dans
Ubuntu 26.04 et évite d'ajouter un runtime ou un binding Node natif dans le
processus HTTP.

Le protocole helper reste privé, sur stdin/stdout, avec commandes textuelles et
états JSON par ligne. Un crash natif ne peut donc pas terminer directement le
serveur. Seul l'adaptateur sélectionné est chargé.

Le dialogue système n'est pas ouvert par une commande distante. La commande
locale `remote-mouse wayland authorize` constitue l'action explicite qui lance
la session du portail.

## Modifications apportées

- Helper C RemoteDesktop/liboeffis/libei et script de compilation.
- Client Node supervisant le helper et adaptateur `WaylandDesktopController`.
- Sélection automatique Wayland/RobotJS au démarrage.
- Mouvement relatif sans dépendance à une position globale X11.
- Traduction initiale des boutons et touches autorisées vers les codes evdev.
- Commandes CLI `wayland status`, `wayland authorize` et `wayland stop`.
- Fermeture du helper pendant l'arrêt gracieux du serveur.
- Détection des dépendances Wayland dans l'installateur Linux et compilation
  opportuniste pendant `postinstall`.
- Documentation des prérequis et passage SemVer de 6.10.0 à 6.11.0.

## Vérifications et résultats

- Compilation C stricte réussie avec `-Wall -Wextra -Werror` contre les API
  libei/liboeffis 1.5.0 d'Ubuntu 26.04.
- Validation réelle GNOME Wayland: consentement affiché, état EIS `ready`, puis
  commande de mouvement relatif acceptée avant arrêt propre.
- Tests ciblés du contrôleur, de la sélection, du mouvement relatif et de la
  CLI réussis.
- `npm test`: 76 suites et 270 tests réussis.

## Blocages / risques / suite

- La keymap EIS doit encore être interprétée plutôt que supposer une disposition
  evdev de type US pour la saisie directe.
- Le `restore_token` et la reprise après révocation ne sont pas encore gérés.
- La prévisualisation demeure volontairement indisponible sous Wayland. La
  prochaine tranche `PLAT-004d` doit remplacer liboeffis par une coordination
  explicite RemoteDesktop/ScreenCast ou étendre le helper afin d'associer le
  flux PipeWire à la même session du portail.
- La validation KDE, HiDPI, veille/reprise et packaging multiarchitecture reste
  à réaliser avant de déclarer `PLAT-004` terminé.
