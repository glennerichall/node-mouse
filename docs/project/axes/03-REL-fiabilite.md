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
- [ ] Mesurer la latence souris/clavier; traiter mouvements obsolètes et backpressure.
- [ ] Fiabiliser reconnexion après veille, changement Wi-Fi et redémarrage.
- [ ] Rendre délais et heartbeats configurables par transport.
- [ ] Adapter résolution/fréquence/compression de la prévisualisation.
- [ ] Suspendre les captures inutilisées et éviter les frames périmées.
- [ ] Tester arrêt gracieux, ports indisponibles, reprise après crash et SQLite.
- [ ] Distinguer contrôles de santé internes et externes.

Les critères quantitatifs (latence, charge, stabilité) sont à établir dans la
tâche avant toute optimisation.
