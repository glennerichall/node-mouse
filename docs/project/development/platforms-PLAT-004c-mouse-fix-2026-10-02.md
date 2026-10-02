# Plateformes — PLAT-004c correctif souris — 2026-10-02

État: terminé

## Objectif et critères d'acceptation

Corriger la souris Wayland qui demeurait inactive après le démarrage normal en
terminal et empêcher un arrêt brutal lorsque le helper avait fermé son pipe.

- Un démarrage interactif doit ouvrir automatiquement le consentement local.
- Un service non interactif ne doit pas ouvrir de dialogue sans la commande
  locale `remote-mouse wayland authorize`.
- Une fermeture `EPIPE` du helper ne doit jamais terminer brutalement Node.js.

## Décisions et raisons

Le serveur initialisait l'adaptateur Wayland sans démarrer le helper. La souris
restait donc silencieusement inactive jusqu'à une commande CLI qui n'était pas
visible dans le flot normal de développement. Un terminal interactif constitue
une action locale explicite; il peut ouvrir le portail automatiquement. Le mode
`systemd` demeure non interactif et conserve l'autorisation CLI explicite.

Le flux stdin du helper peut émettre `EPIPE` de façon asynchrone après une
révocation ou une fermeture. Cet événement doit être absorbé pendant l'arrêt,
car il signifie seulement que le processus natif n'écoute déjà plus.

## Modifications apportées

- Démarrage automatique du helper par `loadWayland()` lorsque stdin est un TTY.
- Conservation du démarrage manuel pour les services non interactifs.
- Gestion de l'événement `EPIPE` sur stdin du helper.
- Documentation du comportement terminal/service.
- Tests anti-régression pour les deux modes d'autorisation et pour `EPIPE`.

## Vérifications et résultats

- Tests ciblés: 5 tests réussis.
- Redémarrage réel en terminal: session Wayland automatiquement passée à
  `ready`, avec `pointer:true` et `keyboard:true`.
- `npm test`: 77 suites et 273 tests réussis.

## Blocages / risques / suite

Le client mobile doit être associé à la nouvelle URL d'entrée après rotation du
jeton provoquée par un redémarrage de développement. La prévisualisation
PipeWire reste hors de ce correctif.
