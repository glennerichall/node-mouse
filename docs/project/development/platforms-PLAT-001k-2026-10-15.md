# Plateformes — PLAT-001k — 2026-10-15

## Objectif

Conserver le démarrage automatique du service utilisateur Linux après une mise
à jour de Remote Mouse et un redémarrage de la session ou de la machine.

## Cause

L'unité `remote-mouse.service` était active mais `UnitFileState=disabled`.
Elle pouvait donc fonctionner jusqu'à l'arrêt courant, puis ne plus être
tirée par `default.target` au démarrage suivant.

## Correction

- Réactiver l'unité avec `systemctl --user enable` avant chaque redémarrage
  Linux demandé par l'application.
- Refuser le redémarrage si cette réactivation échoue, au lieu de masquer que
  le service ne sera pas persistant.

## Vérifications

- Tests unitaires du service Linux : ordre enable puis restart et échec sans
  redémarrage si enable échoue.
- Validation réelle recommandée sur l'hôte :
  `systemctl --user is-enabled remote-mouse.service` doit retourner `enabled`.
