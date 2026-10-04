# Plateformes — PLAT-004g2 — 2026-10-03

État: terminé

## Objectif et critères d'acceptation

Séparer la souris et le clavier virtuels uinput afin que Linux les classifie
selon leur fonction, sans modifier le contrat applicatif, les permissions ou la
configuration système.

## Décisions et raisons

Le bridge déclarait un périphérique hybride activant les touches clavier, les
boutons et les axes relatifs. Deux périphériques spécialisés décrivent plus
fidèlement les événements produits et évitent de faire dépendre leur
classification d'une règle udev supplémentaire.

Une piste fondée sur des métadonnées DPI et une migration Polkit a été retirée
avant clôture parce qu'elle était trop intrusive et ne pouvait pas représenter
la préférence de chaque client. Cette itération ne prétend donc pas corriger la
vitesse ni l'accélération ressenties.

Le lecteur XWayland de position globale est aussi retiré du chargement uinput :
l'overlay natif n'en dépend plus et le contrôleur conserve sa position
synthétique à partir des mouvements reçus.

## Modifications apportées

- Création de deux périphériques nommés `Remote Mouse Virtual Mouse` et
  `Remote Mouse Virtual Keyboard`.
- Limitation de la souris aux axes relatifs et boutons, et du clavier aux codes
  clavier.
- Routage distinct des événements dans le bridge Node-API.
- Retrait du chargeur de position XWayland de la stratégie uinput.
- Documentation de l'absence de nouvelle permission système.
- Passage correctif de la version `6.18.1` à `6.18.2`.

## Vérifications et résultats

- `npm run build:uinput` : compilation réussie avec `-Werror`.
- Tests ciblés : 4 suites et 17 tests réussis.
- Suite complète : 89 suites et 319 tests réussis.
- L'environnement Codex ne fournit pas `/dev/uinput`; l'ouverture réelle n'y a
  pas été rejouée, mais son indisponibilité est remontée sans crash.

## Blocages / risques / suite

Le ressenti du pointeur reste propre au client et à son environnement. Il sera
traité dans `UX-006` plutôt que par une correction Wayland dans le bridge.
