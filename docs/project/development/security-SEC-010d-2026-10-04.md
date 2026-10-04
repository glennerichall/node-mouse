# Sécurité — SEC-010d — 2026-10-04

État: terminé

## Objectif et critères d'acceptation

Corriger la présentation et la classification des commandes du panneau gauche :
préserver un champ de mot de passe utilisable, n'afficher qu'une commande
d'élévation adaptée à l'état courant et distinguer les commandes QR accessibles
aux contrôleurs des actions administratives.

## Décisions et raisons

Le bouton textuel d'affichage du mot de passe partageait une grille avec le
champ et réduisait excessivement sa largeur. Il devient un bouton icône
positionné dans le champ, avec un libellé accessible qui continue d'indiquer
l'action « afficher » ou « masquer ».

Deux éléments HTML indépendants représentaient « Déverrouiller » et
« Verrouiller ». De plus, la classe `hidden` n'avait aucune règle applicable au
formulaire et aux boutons concernés. Un seul bouton de formulaire porte
maintenant les deux actions selon `adminRelockAvailable`; la ligne du mot de
passe disparaît pendant l'élévation.

Les commandes d'ouverture du QR serveur/client, d'overlay QR et de rotation du
jeton utilisent désormais le préfixe `qr:` et ne passent plus par le garde
administrateur. Les anciens événements `admin:` restent enregistrés comme
alias protégés afin qu'un client déjà chargé ne provoque pas une rupture pendant
la mise à jour.

## Modifications apportées

- Réorganisation du panneau : commandes QR et préférences, actions
  administratives, puis contrôle d'élévation.
- Ajout du défilement vertical lorsque le panneau dépasse la hauteur disponible.
- Remplacement du bouton textuel de visibilité par un œil SVG superposé.
- Fusion des boutons de verrouillage et déverrouillage en une seule commande.
- Ajout des événements Socket.IO `qr:*` et conservation des alias historiques.
- Passage correctif de la version `6.18.2` à `6.18.3`.

## Vérifications et résultats

- Tests unitaires ciblés : 3 suites et 16 tests réussis.
- Tests Playwright ciblés : 4 scénarios desktop/mobile réussis.
- Suite complète : 89 suites et 320 tests réussis.
- `git diff --check` : aucune erreur.

## Blocages / risques / suite

Les noms internes historiques `adminActions` et les événements de notification
pub/sub conservent encore leur vocabulaire administratif. Ils pourront être
renommés dans une itération d'architecture sans modifier à nouveau le contrat
Socket.IO public.
