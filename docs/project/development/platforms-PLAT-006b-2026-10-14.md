# PLAT-006b — activation navigateur selon le compositeur

## Objectif

Sélectionner le mécanisme d'activation selon le serveur d'affichage. X11
continue d'utiliser `wmctrl`/`xdotool`; Wayland détermine ensuite le
compositeur à partir de l'environnement de session.

## Modification

Ajout d'un adaptateur Wayland pour Sway et Hyprland : il inspecte l'arbre des
fenêtres ou la liste des clients via leur IPC, puis active la fenêtre trouvée.
Mutter/GNOME et KWin/Plasma sont identifiés et suivent le repli existant tant
qu'aucune commande stable et non intrusive n'est disponible pour leur
activation. Le repli conserve aussi le comportement actuel pour les
compositeurs inconnus.

## Vérification

- `npm test -- --runInBand test/unit/wayland-window-focus.test.js test/unit/linux-app-resolution.test.js test/unit/action-routers.http.test.js` — 3 suites, 21 tests réussis.
- `git diff --check` — réussi.
