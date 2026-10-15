# PLAT-006c — extension GNOME pour l'activation des fenêtres

## Objectif

Permettre l'activation d'une fenêtre native Wayland sous GNOME, lorsque
`wmctrl` et `xdotool` ne peuvent pas l'énumérer.

## Modification

Ajout de l'extension `remote-mouse-focus@velor`. Elle exporte sur le bus de
session `com.velor.RemoteMouseFocus.ActivateByClass`, parcourt les fenêtres
Mutter, active l'espace de travail de la fenêtre correspondante et appelle
`Meta.Window.activate()`. Le serveur invoque cette méthode uniquement après
avoir identifié Mutter comme compositeur Wayland.

L'installation est lancée automatiquement par `remote-mouse setup` en session
GNOME Wayland lorsque `--yes` est utilisé; en mode interactif, le setup demande
confirmation. La commande `npm run install:gnome-focus` reste disponible pour
réparer ou réactiver l'installation séparément.
L'absence de l'extension conserve le repli existant.

## Vérification

- `npm test -- --runInBand test/unit/wayland-window-focus.test.js` — 4 tests
  réussis.
- `git diff --check` — réussi.
