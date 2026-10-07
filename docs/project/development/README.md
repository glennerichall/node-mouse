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

- [Expérience utilisateur — UX-006](./ux-UX-006-2026-10-04.md): vitesse et
  accélération du pointeur configurables localement par appareil.
- [Expérience utilisateur — UX-006a](./ux-UX-006a-2026-10-04.md): mise en page
  contenue et fusion des mouvements en attente côté serveur.
- [Expérience utilisateur — UX-006b](./ux-UX-006b-2026-10-04.md): adaptation
  verticale du panneau latéral aux écrans mobiles courts.
- [Expérience utilisateur — UX-006c](./ux-UX-006c-2026-10-04.md): bordure
  d'élévation sur la commande d'accès et les actions administratives actives.

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
- [Sécurité — SEC-010e](./security-SEC-010e-2026-10-04.md): états désactivé et
  verrouillé distincts, champ agrandi et commandes QR sorties du registrar
  administrateur.
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
- [Plateformes — PLAT-005a et PLAT-005b1](./platforms-PLAT-005a-PLAT-005b1-2026-10-04.md):
  laboratoire Vagrant/QEMU opérationnel et premier test intégré Linux sur VM
  propre.
- [Plateformes — PLAT-005b2](./platforms-PLAT-005b2-2026-10-04.md): cycle
  Vagrant natif et parcours automatisé navigateur, Socket.IO et uinput avec
  Jest et Playwright.
- [Plateformes — PLAT-005b3a et PLAT-005c1a](./platforms-PLAT-005b3a-PLAT-005c1a-2026-10-05.md):
  validation automatisée de la saisie et de l'aperçu X11, puis préparation du
  profil Windows 11 local avec WinRM, UEFI et TPM 2.0.
- [Plateformes — PLAT-005b3b](./platforms-PLAT-005b3b-2026-10-05.md): correction
  du test qui masquait le QR, validation du retour après survol et capture
  visuelle de la console X11.
- [Plateformes — PLAT-005b2a](./platforms-PLAT-005b2a-2026-10-05.md): attente
  explicite de la redirection du lien de session avant d'exécuter le client
  Socket.IO dans les tests intégrés Linux et Wayland.
- [Plateformes — PLAT-005e](./platforms-PLAT-005e-2026-10-06.md): suppression de
  Vagrant/Packer et déploiement des tests sur les VM fournies par le développeur.
- [OPS-003](./ops-OPS-003-2026-10-06.md): uniformisation en anglais des messages
  techniques des journaux.
- [UX-003](./ux-UX-003-2026-10-06.md): diagnostic visible du transport et des
  erreurs de connexion client.
- [ARCH-007](./arch-ARCH-007-2026-10-06.md): séparation et validation de
  l'adresse d'écoute, de l'URL publique et de la confiance proxy.
- [ARCH-010](./arch-ARCH-010-2026-10-06.md): séparation de la garde admin et
  de la souscription des événements administratifs Socket.IO.
- [ARCH-011](./arch-ARCH-011-2026-10-06.md): contrat minimal de canal et
  orchestration nommée des souscriptions.
- [ARCH-012](./arch-ARCH-012-2026-10-06.md): externalisation et tests des
  composants d'orchestration Socket.IO.
- [ARCH-013](./arch-ARCH-013-2026-10-06.md): regroupement thématique des
  composants Socket.IO et des souscriptions métier.
- [ARCH-014](./arch-ARCH-014-2026-10-06.md): retrait de l'orchestration des
  souscriptions de `server/init`.
- [ARCH-015](./arch-ARCH-015-2026-10-07.md): service réutilisable de subscribers
  et souscription globale par canal.
- [ARCH-016](./arch-ARCH-016-2026-10-07.md): correction du bootstrap Socket.IO
  après suppression du handler d'actions.
- [ARCH-017](./arch-ARCH-017-2026-10-07.md): nommage et injection directe du
  service de souscriptions.
- [ARCH-018](./arch-ARCH-018-2026-10-07.md): séparation des snapshots et des
  journaux de configuration système et fonctionnelle.
- [ARCH-019](./arch-ARCH-019-2026-10-07.md): validation Joi de la configuration
  système au démarrage et des écritures de configuration API.
- [ARCH-020](./arch-ARCH-020-2026-10-07.md): extraction des guards de
  configuration dans un middleware autonome et testable.
- [ARCH-021](./arch-ARCH-021-2026-10-07.md): extraction du contexte de
  configuration géré dans un module testable.
- [ARCH-022](./arch-ARCH-022-2026-10-07.md): extraction des handlers de
  configuration administrateur hors du routeur Express.
- [ARCH-023](./arch-ARCH-023-2026-10-07.md): extraction des handlers d'actions
  administrateur hors du routeur Express.
- [ARCH-024](./arch-ARCH-024-2026-10-07.md): extraction des handlers du
  catalogue des remotes hors du routeur Express.
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
