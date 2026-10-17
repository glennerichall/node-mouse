## Critères de confidentialité vérifiables par profil

- **À faire —** PWA-131 — Le mode actif et son chemin réseau sont visibles par l'utilisateur.
- **À faire —** PWA-132 — Le service PWA gratuit ne possède aucun endpoint de proxy pour les
  commandes.
- **À faire —** PWA-133 — Le profil WebRTC « LAN uniquement » n'utilise aucun serveur TURN.
- **À faire —** PWA-134 — Dans ce profil, les statistiques ICE montrent une connexion directe et
  jamais `relay`.
- **À faire —** PWA-135 — Une capture réseau confirme que les commandes restent sur le LAN dans les
  modes local, WebRTC LAN et HTTPS/WSS local certifié.
- **À faire —** PWA-136 — La signalisation est chiffrée avant de quitter le mobile ou le PC.
- **À faire —** PWA-137 — La signalisation expire et est supprimée après usage.
- **À faire —** PWA-138 — Les journaux du serveur tiers ne contiennent aucun payload de
  signalisation ni secret d'association.
- **À faire —** PWA-139 — Une session établie continue à fonctionner si Internet ou le serveur de
  signalisation devient indisponible.
- **À faire —** PWA-140 — L'interface demande ou respecte une configuration explicite avant de
  basculer vers TURN ou un proxy.
- **À faire —** PWA-141 — Le mode proxy VPN précise que le trafic traverse le VPS de l'utilisateur.
- **À faire —** PWA-142 — Le mode reverse WebSocket précise que le trafic traverse et est terminé
  sur le VPS de l'utilisateur.
- **À faire —** PWA-143 — Le relais refuse toute destination autre que l'instance on-premise
  authentifiée et associée.
