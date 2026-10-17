# REL — Connexions, reprise et cycle de vie

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## REL-002 — cycle de reconnexion

**État:** Terminé.

  reconnexion, restaurer l'état client après le retour du serveur, empêcher les
  doublons et les paquets Socket.IO tamponnés, traiter explicitement les
  commandes émises pendant la coupure, et tester le cycle déconnexion/
  reconnexion. Inclut la reprise du backend uinput après redémarrage du
  service.

## REL-006 — reprise après veille et réseau

**État:** Terminé.

  connexion après veille, changement Wi-Fi et redémarrage réseau, sans
  conserver de socket obsolète ni dupliquer les commandes.

## REL-007 — arrêt et reprise du serveur

**État:** Terminé.

  applicatives et SQLite après le drainage HTTP, signaler immédiatement un
  port déjà occupé, et valider l'intégrité SQLite au démarrage après un arrêt
  brutal. Ajouter des tests ciblés du démarrage, de l'arrêt et de la reprise.

## REL-011 — état de santé

**État:** À faire.

Les critères quantitatifs (latence, charge, stabilité) sont à établir dans la
tâche avant toute optimisation.
