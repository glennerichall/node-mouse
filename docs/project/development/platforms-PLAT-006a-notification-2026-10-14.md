# PLAT-006a — retour utilisateur de l'action navigateur

## Objectif

Rendre visible côté client l'échec d'activation d'une fenêtre navigateur,
notamment lorsque la détection X11 ne peut pas voir une fenêtre native Wayland.

## Modification

La route `POST /browser/sessions` utilise le résultat de l'action serveur. Si
l'action retourne `false`, elle envoie une notification ciblée au client qui a
émis la commande et répond avec `409`. Le client réutilise son mécanisme de
notification existant; aucun nouveau canal de transport n'est ajouté.

## Vérification

- `npm test -- --runInBand test/unit/action-routers.http.test.js` — 12 tests
  réussis.
- Le test vérifie la réponse `409`, le message de notification et le ciblage
  vers l'identifiant du client demandeur.
