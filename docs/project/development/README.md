# Journal de développement

Ce répertoire conserve les décisions et l'historique du développement par axe.
La [roadmap globale](../ROADMAP.md) ordonne les axes; les [documents d'axes](../README.md)
portent le périmètre et les tâches planifiées.

## Règles de suivi

1. Avant de modifier le code, lire la vision, la roadmap globale, l'axe concerné
   et son journal le plus récent.
2. Si le travail n'est pas planifié, ajouter d'abord une tâche avec identifiant,
   périmètre, dépendances et critères d'acceptation. Une demande explicite de
   l'utilisateur permet de faire cette planification dans le même changement.
3. Pendant l'itération, noter décisions et blocages. À la fin, mettre à jour
   l'état de l'axe et ajouter un journal daté décrivant l'objectif, changements,
   fichiers importants, tests, résultat et travail restant.
4. Ne jamais effacer/réécrire un journal clôturé. Une nouvelle phase ou
   réorientation d'axe reçoit un nouveau fichier; l'ancien reste archivé.
5. Ne cocher que ce qui a été vérifié. Si bloqué, noter la cause et la décision
   ou information nécessaire pour reprendre.

## Convention de nommage

`<axe>-<iteration>-<YYYY-MM-DD>.md`, par exemple
`security-SEC-008-2026-10-01.md`. Les fichiers sont append-only après clôture.

## Historique existant

- [Sécurité — lot A, SEC-001 à SEC-008](./security-lot-a.md): historique
  existant conservé lors de la réorganisation; SEC-008 est terminée.
- [Sécurité — SEC-008](./security-SEC-008-2026-09-26.md): API de gestion des
  appareils associés, révocations et historique local.
- [Sécurité — SEC-009](./security-SEC-009-2026-10-02.md): séparation des
  ressources clientes en lecture et des ressources administrateur.
- [Sécurité — SEC-010](./security-SEC-010-2026-10-02.md): déverrouillage
  administrateur temporaire depuis le panneau latéral.
- [Plateformes — PLAT-004a](./platforms-PLAT-004a-2026-10-02.md): détection de
  la capture RobotJS indisponible sous Wayland et prévention du crash X11.
- [Plateformes — PLAT-004b](./platforms-PLAT-004b-2026-10-02.md): extraction de
  RobotJS derrière `DesktopController` et préparation des chargeurs d'adaptateurs.
- [Plateformes — PLAT-004c](./platforms-PLAT-004c-2026-10-02.md): helper
  RemoteDesktop/libei, sélection Wayland, consentement local et validation réelle.
- [Plateformes — PLAT-004c correctif souris](./platforms-PLAT-004c-mouse-fix-2026-10-02.md):
  activation interactive du portail et arrêt robuste après fermeture du helper.
- [Plateformes — PLAT-004g](./platforms-PLAT-004g-2026-10-02.md): entrée
  Wayland uinput par défaut et conservation du portail comme stratégie optionnelle.
- [Plateformes — PLAT-004g correctif booléens bridge](./platforms-PLAT-004g-bridge-boolean-fix-2026-10-02.md):
  normalisation numérique des clics et touches à la frontière Node-API.
- [Plateformes — PLAT-001a](./platforms-PLAT-001a-2026-10-02.md): installateur
  uinput autonome et migration idempotente des installations existantes.
- [Plateformes — PLAT-001b et PLAT-004h](./platforms-PLAT-001b-PLAT-004h-2026-10-02.md):
  migration uinput pendant la mise à jour intégrée et compatibilité YAD sous
  Wayland via XWayland.
- [Plateformes — PLAT-004i](./platforms-PLAT-004i-2026-10-02.md): correction du
  rognage inférieur du QR par le widget image de YAD.
- Aucun journal d'implémentation PWA distinct n'existait. Les décisions
  historiques restent dans [l'axe PWA](../axes/pwa.md); le journal PWA commence
  avec la première itération réelle, sans rétro-construire d'historique.

## Modèle d'une nouvelle itération

Copier cette structure dans un nouveau fichier:

```markdown
# <Axe> — <ID> — <date>
État: planifié | en cours | terminé | bloqué

## Objectif et critères d'acceptation
## Décisions et raisons
## Modifications apportées
## Vérifications et résultats
## Blocages / risques / suite
```
