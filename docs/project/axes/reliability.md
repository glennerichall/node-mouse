# Axe — Fiabilité et performance

## Résultat visé

Rendre les commandes temps réel et la prévisualisation prévisibles sous charge,
et assurer un cycle de vie robuste du serveur et des connexions.

## Plan de travail

- [ ] Mesurer la latence souris/clavier; traiter mouvements obsolètes et backpressure.
- [ ] Fiabiliser reconnexion après veille, changement Wi-Fi et redémarrage.
- [ ] Rendre délais et heartbeats configurables par transport.
- [ ] Adapter résolution/fréquence/compression de la prévisualisation.
- [ ] Suspendre les captures inutilisées et éviter les frames périmées.
- [ ] Tester arrêt gracieux, ports indisponibles, reprise après crash et SQLite.
- [ ] Distinguer contrôles de santé internes et externes.

Les critères quantitatifs (latence, charge, stabilité) sont à établir dans la
tâche avant toute optimisation.
