# PLAT-002-002f — Installation et validation Windows

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## PLAT-002a — ajouter des tests automatisés de la stratégie de setup

**État:** Terminé.

  Windows et de ses tâches planifiées : réexécution idempotente de la
  configuration, préservation des réglages existants et chemins de configuration
  persistés dans la tâche; création/exécution, désactivation, suppression et
  gestion des échecs `schtasks`. Simuler les commandes système et ne pas
  présenter ces tests comme une validation sur un hôte Windows réel.

## PLAT-002b — exécuter la mise à jour npm automatique sans syntaxe shell

**État:** Terminé.

  POSIX : représenter la commande comme un exécutable, des arguments et un
  environnement distincts, en préservant `REMOTE_MOUSE_DAEMON=1` pour le
  `postinstall`. Utiliser l'exécution nécessaire au shim npm Windows, valider
  le nom du paquet avant de l'envoyer au shell, conserver les commandes
  personnalisées configurées et leur exécution shell; tester les variantes
  Linux/Windows, les erreurs et la commande diagnostique sans hôte réel.

## PLAT-002c — rendre le script `test:install` indépendant de la syntaxe

**État:** Terminé.

  d'affectation d'environnement POSIX afin qu'il soit exécutable par npm sur
  Linux et Windows; conserver l'option Jest nécessaire aux modules ESM et
  ajouter une vérification anti-régression des scripts npm.

## PLAT-002d — maintenir la commande `/TR` du service Windows sous la limite

**État:** Terminé.

  de `schtasks` en déportant les chemins et variables de configuration dans un
  launcher local court; vérifier que l'installation et le démarrage conservent
  le répertoire de configuration persistant.

## PLAT-002e — étendre le smoke test Windows pour interroger explicitement

**État:** Terminé.

  la tâche planifiée après installation, vérifier santé/version et commandes CLI,
  puis confirmer après désinstallation que la tâche n'existe plus; conserver le
  nettoyage même lorsqu'une assertion échoue.

## PLAT-002f — exécuter dans le job Windows une réinstallation du tarball

**État:** Terminé.

  npm courant après création de la configuration et de la base; arrêter puis
  recréer la tâche, vérifier la conservation de `.env`, des données et de la
  santé HTTP, puis nettoyer le service.
