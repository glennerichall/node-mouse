# SEC-010-010e — Élévation administrative et commandes protégées

## SEC-010 — Élévation temporaire

Un contrôleur peut déverrouiller temporairement le rôle administrateur depuis le
panneau latéral avec un mot de passe serveur, une expiration et une limitation
stricte des tentatives.

## SEC-010a — Politique du mot de passe

La longueur minimale du mot de passe administrateur est configurable sans
divergence entre l'API d'authentification et l'interface.

## SEC-010b — Reverrouillage et interface

La session courante peut révoquer immédiatement son élévation. Le panneau
alterne entre « Déverrouiller » et « Verrouiller », fournit un contrôle accessible
d'affichage du mot de passe et resynchronise les autorisations HTTP et Socket.IO.

## SEC-010c — Ressource d'élévation

L'élévation est modélisée comme une ressource de la session courante :
`POST /api/admin-auth/elevation` la crée ou la renouvelle et
`DELETE /api/admin-auth/elevation` la supprime. L'ancien chemin RPC `/unlock` est
retiré.

## SEC-010d et SEC-010e — Parcours admin et commandes QR

Le panneau distingue l'administration verrouillée des actions désactivées par
configuration. Les commandes QR accessibles aux contrôleurs sont séparées des
actions administratives, les événements QR possèdent leur propre registrar et
les anciens événements `admin:*` restent des alias protégés de compatibilité.
