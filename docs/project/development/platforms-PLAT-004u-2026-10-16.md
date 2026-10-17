# Plateformes — PLAT-004u — 2026-10-16

## Objectif

Définir le contrat de capture et de streaming avant d'implémenter la capture
PipeWire ou de choisir un transport vidéo.

## Contrat retenu

Une source de capture est indépendante du réseau. Elle démarre avec une région
et une cadence, publie des états (`starting`, `ready`, `permission-required`,
`denied`, `revoked`, `lost`, `stopped`) et retourne une fonction d'arrêt
idempotente. Elle ne conserve qu'une frame utile et abandonne les frames
dépassées lorsque le consommateur est plus lent.

Chaque frame contient une séquence, un horodatage monotone, largeur, hauteur,
format de pixels, origine de la région, position du curseur et données binaires.
Les descripteurs PipeWire, tokens de restauration, identifiants de session et
autres métadonnées sensibles restent confinés à la source.

Un canal expose `open`, `send` et `close`. `send` indique l'acceptation de la
frame; le canal peut refuser ou remplacer une frame périmée. La sélection du
canal dépend des capacités annoncées et de la configuration.

Socket.IO reste le canal de la prévisualisation légère actuelle. Un futur
streaming d'écran pourra choisir entre DataChannel, piste vidéo WebRTC ou une
désactivation explicite selon le prototype PWA; aucun choix de bibliothèque ni
aucune dépendance native WebRTC ne sont ajoutés dans cette itération.

## Vérifications

- contrat aligné avec le contrat de transport de l'axe PWA;
- limites Wayland et transport Socket.IO existant conservés;
- aucun backend PipeWire ni transport WebRTC ajouté;
- aucun workflow VM exécuté;
- `git diff --check` réussi.

## Version et suite

Itération documentaire : la version reste `6.20.3`. Le contrat est maintenant
complété par la décision d'isoler ScreenCast/PipeWire dans `PLAT-004v`.
`PLAT-004d` reste ouverte jusqu'à l'implantation du helper et au choix du
transport de prévisualisation issu du prototype PWA correspondant.

Message de commit suggéré:

`docs(plat): define capture streaming contract`
