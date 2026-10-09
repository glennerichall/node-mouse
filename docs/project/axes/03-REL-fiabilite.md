# 03 — REL — Fiabilité et performance

## Résultat visé

Rendre les commandes temps réel et la prévisualisation prévisibles sous charge,
et assurer un cycle de vie robuste du serveur et des connexions.

## Plan de travail

- [x] **REL-001 — bornes des messages d'entrée:** rejeter les timestamps
  impossibles ou obsolètes et garantir que le dispatcher de mouvements conserve
  au plus une contribution en attente, avec une erreur de consommation
  observable sans rejet de promesse non géré.
- [x] **REL-002 — cycle de reconnexion:** borner et exposer l'état de la
  reconnexion, restaurer l'état client après le retour du serveur, empêcher les
  doublons et les paquets Socket.IO tamponnés, traiter explicitement les
  commandes émises pendant la coupure, et tester le cycle déconnexion/
  reconnexion. Inclut la reprise du backend uinput après redémarrage du
  service.
- [x] **REL-003 — délais par transport:** configurer les tentatives, délais de
  reconnexion et heartbeat Socket.IO depuis la configuration serveur, exposer
  cette configuration au client et vérifier les bornes avec des tests.
- [x] **REL-004 — prévisualisation adaptative:** borner la résolution capturée
  à l'écran disponible, respecter la cadence configurée jusqu'à 30 FPS et
  conserver une seule frame en vol lorsque le transport est saturé, avec une
  implantation de capture réutilisable par les environnements X11 et
  Wayland/XWayland compatibles.
- [ ] **REL-005 — télémétrie d'entrée:** mesurer la latence souris/clavier et
  traiter les mouvements obsolètes et le backpressure uniquement lorsqu'un
  usage opérationnel et des seuils sont définis.
- [x] **REL-006 — reprise après veille et réseau:** rétablir proprement la
  connexion après veille, changement Wi-Fi et redémarrage réseau, sans
  conserver de socket obsolète ni dupliquer les commandes.
- [ ] Rendre délais et heartbeats configurables par transport.
- [ ] Adapter résolution/fréquence/compression de la prévisualisation.
- [ ] Suspendre les captures inutilisées et éviter les frames périmées.
- [ ] Tester arrêt gracieux, ports indisponibles, reprise après crash et SQLite.
- [ ] Distinguer contrôles de santé internes et externes.

Les critères quantitatifs (latence, charge, stabilité) sont à établir dans la
tâche avant toute optimisation.
