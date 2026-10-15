# Plateformes — PLAT-001k — réconciliation — 2026-10-15
État: terminé

## Objet

Réconcilier l’axe avec la correction déjà présente dans le service Linux :
réactiver l’unité `systemd --user` avant tout redémarrage demandé après une
mise à jour.

## Vérifications

- `restartLinuxDaemon()` exécute `systemctl --user enable` avant de lancer le
  redémarrage différé.
- Un échec de réactivation empêche le redémarrage et retourne l’erreur au
  demandeur.
- Tests ciblés : 8 tests réussis avec couverture désactivée pour éviter que le
  seuil global ne transforme une exécution unitaire isolée en échec.
- La suite complète précédente reste verte : 136 suites, 523 tests réussis et
  1 test ignoré.
- Aucune commande systemd réelle n’a été exécutée sur l’hôte.

## Version et commit

Cette clôture ne modifie aucun fichier du paquet; la version reste `6.20.2`.

Message de commit suggéré:

`docs(roadmap): close PLAT-001k service persistence`
