# Plateformes — PLAT-004a — 2026-10-02

État: terminé.

## Objectif et critères d'acceptation

- Sous Linux Wayland, `preview:start` ne doit jamais appeler la capture native
  X11 de RobotJS ni interrompre le serveur avec une erreur `X_GetImage`.
- La prévisualisation est annoncée indisponible au client et dans les capacités
  système lorsque la session graphique est Wayland.
- X11, Windows et macOS conservent le comportement existant.
- Un test anti-régression reproduit un environnement avec
  `XDG_SESSION_TYPE=wayland`, `WAYLAND_DISPLAY` et `DISPLAY` simultanément.

## Décisions et raisons

- RobotJS capture l'écran Linux via X11. Sous Wayland, la présence de `DISPLAY`
  signale seulement XWayland et ne garantit pas l'accès au contenu complet du
  bureau; l'appel `X_GetImage` peut terminer le processus au niveau natif.
- Un `try/catch` JavaScript ne suffit donc pas. La capacité doit être refusée
  avant tout appel à `robot.screen.capture`.
- Le vrai support Wayland reste une évolution distincte de PLAT-004, fondée sur
  le portail ScreenCast/PipeWire et son modèle de consentement.

## Modifications apportées

- Ajouté une détection explicite de la capacité de capture selon la plateforme,
  `XDG_SESSION_TYPE`, `WAYLAND_DISPLAY` et `DISPLAY`.
- Refusé `preview:start` avant toute planification ou capture native lorsque la
  session Linux est Wayland, y compris en présence de `DISPLAY=:0` via XWayland.
- Exposé la prévisualisation comme indisponible dans la configuration cliente
  et dans les capacités système; les autres remotes restent fonctionnelles.
- Conservé la capture existante pour X11, Windows et macOS.

## Vérifications et résultats

- Le test anti-régression échoue avant correction car le streamer ne possède
  aucune détection de capacité; après correction, aucun appel natif ni timer de
  capture n'est créé sous Wayland.
- Tests unitaires complets: 258 réussis sur 258, 73 suites sur 73.
- Tests navigateur sur l'environnement Wayland courant: 22 réussis sur 22.
- `npm run check:version` et `git diff --check`: réussis.

## Blocages / risques / suite

- La prévisualisation restera indisponible sous Wayland jusqu'à l'intégration
  d'un adaptateur compatible avec le portail du bureau.
