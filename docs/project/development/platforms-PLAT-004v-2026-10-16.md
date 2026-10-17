# Plateformes — PLAT-004v — 2026-10-16

## Décision

La capture Wayland sera portée par un seul helper natif dédié. Il regroupera le
cycle de vie du portail ScreenCast, l'ouverture et la surveillance de PipeWire,
la conversion des frames et la reprise après perte du flux. Node.js le
supervisera et exposera ses frames via le contrat `PLAT-004u`.

Le helper de capture restera séparé de l'entrée uinput, du backend
RemoteDesktop/libei optionnel, de l'overlay QR et du transport réseau. Cette
séparation évite de faire dépendre le preview d'une stratégie d'injection ou
d'une bibliothèque WebRTC particulière.

## État

Cette passe documente l'architecture et ajoute `PLAT-004v` avant toute
implantation. Aucun exécutable PipeWire, aucune dépendance WebRTC et aucun
workflow VM n'ont été ajoutés ou exécutés. `PLAT-004d` reste ouverte jusqu'à
l'implantation et la validation du helper, puis la validation réelle de
`PLAT-004f`.

La version reste `6.20.3` : changement documentaire uniquement.

Message de commit suggéré :

`docs(plat): define dedicated Wayland capture helper`
