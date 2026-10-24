# PWA-060-108-132-143 — Signalisation, relais et transit

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## PWA-068 — Vérifier que la perte du service de signalisation n'affecte pas

  session WebRTC déjà établie.
**Estimation :** 3 à 5 jours.
### Jalon 5 — Déploiement de la PWA publique
**Objectif :** héberger uniquement les ressources publiques et le rendez-vous
de signalisation sur le serveur tiers.

## PWA-075 — Ajouter un test réseau garantissant qu'aucun flux applicatif ne rejoint

  serveur tiers en profil WebRTC « LAN uniquement ».
**Estimation :** 2 à 4 jours.
### Jalon 6 — PWA installable et maintenable
**Objectif :** offrir une installation fiable sur Android, iOS et ordinateur.

## PWA-098 — Ne jamais activer ce chemin comme fallback implicite de WebRTC

**Estimation :** 2 à 4 jours.
### Jalon 9 — Relais custom par reverse WebSocket
**Objectif :** fournir une alternative auto-hébergeable sans pile VPN.

## PWA-108 — Documenter le transit des données en clair au point de terminaison TLS

  VPS et les responsabilités de son administrateur.
**Recommandation :** adopter comme option avancée après un prototype de charge
et de sécurité. Cette solution réduit la pile d'infrastructure, mais son
protocole custom augmente la surface de code critique à maintenir.
**Estimation :** 5 à 8 jours.
### Jalon 10 — Industrialisation
**Objectif :** rendre les releases reproductibles et l'exploitation prévisible.

## PWA-132 — Le service PWA gratuit ne possède aucun endpoint de proxy

  commandes.

## PWA-134 — Dans ce profil, les statistiques ICE montrent une connexion directe

  jamais `relay`.

## PWA-135 — Une capture réseau confirme que les commandes restent sur le LAN

  modes local, WebRTC LAN et HTTPS/WSS local certifié.

## PWA-138 — Les journaux du serveur tiers ne contiennent aucun payload

  signalisation ni secret d'association.

## PWA-139 — Une session établie continue à fonctionner si Internet ou le serveur

  signalisation devient indisponible.

## PWA-140 — L'interface demande ou respecte une configuration explicite avant

  basculer vers TURN ou un proxy.

## PWA-142 — Le mode reverse WebSocket précise que le trafic traverse et est terminé

  sur le VPS de l'utilisateur.

## PWA-143 — Le relais refuse toute destination autre que l'instance on-premise

  authentifiée et associée.
