# Journal de développement

Ce répertoire conserve les décisions et l'historique du développement par axe.
La [roadmap globale](../ROADMAP.md) ordonne les axes. Les documents numérotés
dans [`axes/`](../axes/) sont les seules sources de vérité pour les tâches,
leurs cases à cocher et leurs critères d'acceptation.

## Règles de suivi

1. Avant de modifier le code, lire la vision, la roadmap globale, l'axe concerné
   et son journal le plus récent.
2. Si le travail n'est pas planifié, l'ajouter d'abord dans l'axe propriétaire
   avec identifiant, périmètre, dépendances et critères d'acceptation. Ne pas
   recopier cette liste dans la roadmap globale ni dans un journal planifié.
3. Pendant l'itération, conserver les décisions utiles au futur journal. À la
   fin, cocher l'axe et ajouter un journal daté décrivant l'objectif,
   changements, fichiers importants, tests, résultat et travail restant.
4. Ne jamais effacer/réécrire un journal clôturé. Une nouvelle phase ou
   réorientation d'axe reçoit un nouveau fichier; l'ancien reste archivé.
5. Ne cocher que ce qui a été vérifié. Si bloqué, noter la cause et la décision
   ou information nécessaire pour reprendre.

## Convention de nommage

`<axe>-<iteration>-<YYYY-MM-DD>.md`, par exemple
`security-SEC-008-2026-10-01.md`. Un journal est créé après la réalisation de
l'itération et devient append-only dès sa clôture.

## Historique existant

- [Architecture — ARCH-008](./architecture-ARCH-008-2026-10-03.md): handlers
  nommés et exportés pour les routes de configuration et abonnements clients.
- [Architecture — ARCH-009](./architecture-ARCH-009-2026-10-03.md): service
  d'overlay commun et implantations Linux/Windows déplacées derrière la façade
  OS.
- [Exploitation — OPS-001](./operations-OPS-001-2026-10-02.md): commande CLI
  locale affichant la version du paquet installé.

- [Sécurité — lot A, SEC-001 à SEC-008](./security-lot-a.md): historique
  existant conservé lors de la réorganisation; SEC-008 est terminée.
- [Sécurité — SEC-008](./security-SEC-008-2026-09-26.md): API de gestion des
  appareils associés, révocations et historique local.
- [Sécurité — SEC-009](./security-SEC-009-2026-10-02.md): séparation des
  ressources clientes en lecture et des ressources administrateur.
- [Sécurité — SEC-010](./security-SEC-010-2026-10-02.md): déverrouillage
  administrateur temporaire depuis le panneau latéral.
- [Sécurité — SEC-010a](./security-SEC-010a-2026-10-02.md): seuil configurable
  du mot de passe de déverrouillage administrateur.
- [Sécurité — SEC-010b](./security-SEC-010b-2026-10-03.md): reverrouillage
  immédiat de la session administrateur et affichage contrôlé du mot de passe.
- [Sécurité — SEC-010c](./security-SEC-010c-2026-10-03.md): modélisation REST
  de l'élévation temporaire de la session administrateur.
- [Sécurité — SEC-010d](./security-SEC-010d-2026-10-04.md): panneau ordonné par
  niveau d'accès, bouton d'élévation unique et œil intégré au champ du mot de
  passe.
- [Sécurité — SEC-011](./security-SEC-011-2026-10-03.md): durée de grâce des
  anciens jetons d'entrée uniformisée à 120 minutes.
- [Sécurité — migration vers SEC-010](./security-SEC-010-migration-2026-10-02.md):
  procédure npm de bootstrap pour une installation qui ne peut pas encore se
  déverrouiller depuis le mobile.
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
- [Plateformes — PLAT-004l](./platforms-PLAT-004l-2026-10-03.md): remplacement
  implanté de YAD par un helper QR X11/XWayland; validation visuelle terrain
  encore requise avant clôture.
- [Plateformes — PLAT-004g2](./platforms-PLAT-004g2-2026-10-03.md): séparation
  des périphériques uinput souris/clavier sans nouvelle permission système et
  retrait du lecteur de position XWayland du parcours uinput.
- [Plateformes — abandon de PLAT-004k](./platforms-PLAT-004k-abandon-2026-10-04.md):
  remplacement d'une normalisation par OS par des préférences locales au client
  planifiées dans `UX-006`.
- Aucun journal d'implémentation PWA distinct n'existait. Les décisions
  historiques restent dans [l'axe PWA](../axes/06-PWA-application-web.md); le journal PWA commence
  avec la première itération réelle, sans rétro-construire d'historique.

## Modèle d'une nouvelle itération

Copier cette structure dans un nouveau fichier:

```markdown
# <Axe> — <ID> — <date>
État: terminé | abandonné

## Objectif et critères d'acceptation
## Décisions et raisons
## Modifications apportées
## Vérifications et résultats
## Blocages / risques / suite
```
