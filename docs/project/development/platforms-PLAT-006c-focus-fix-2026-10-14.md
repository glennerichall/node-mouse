# PLAT-006c — correction de la focalisation GNOME

## Problème

Sous Wayland, le serveur pouvait rester en mode de détection inconnu lorsque
`XDG_SESSION_TYPE` n'était pas transmis au processus. De plus, la passerelle
GNOME ne demandait à l'extension de chercher que les classes de fenêtres.

## Correction

La détection reconnaît maintenant `WAYLAND_DISPLAY` et conserve `DISPLAY` comme
fallback X11. L'extension GNOME compare la classe, l'instance et le titre de la
fenêtre; le serveur envoie donc aussi les noms de fenêtres configurés pour le
navigateur.

## Vérification

- `npm test -- --runInBand test/unit/wayland-window-focus.test.js test/unit/linux-app-resolution.test.js` — 11 tests réussis.
- `git diff --check` — réussi.
