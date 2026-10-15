# PLAT-006a — activation navigateur sous Wayland

## Objectif

Éviter qu'un navigateur déjà lancé sous Wayland soit signalé comme non
activable uniquement parce que sa fenêtre native n'est pas visible par
`wmctrl`/`xdotool`.

## Décision

Lorsque le processus du navigateur est déjà actif, qu'aucune fenêtre n'est
trouvée et que la session est Wayland, le serveur réexécute la commande du
navigateur avec ses arguments normaux. Les navigateurs à instance unique
redirigent cette demande vers leur instance existante, qui peut demander
l'activation de sa fenêtre via le compositeur. Sous X11, le comportement reste
la détection et l'activation par identifiant de fenêtre; si elle échoue, aucun
second navigateur n'est lancé.

## Vérification

- `npm test -- --runInBand test/unit/linux-app-resolution.test.js test/unit/action-routers.http.test.js` — 2 suites, 18 tests réussis.
- Le test Wayland vérifie que la commande existante est relayée lorsque la
  fenêtre native n'est pas détectable.

Cette solution dépend du comportement à instance unique du navigateur; une
activation générique de fenêtre native Wayland n'est pas disponible via
`wmctrl` ou `xdotool`.
