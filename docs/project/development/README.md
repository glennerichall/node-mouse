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

- [Code — CODE-008](./code-CODE-008-2026-10-09.md): suppression des alias npm
  redondants et renommage explicite du hook `postinstall` Linux.
- [Code — CODE-007](./code-CODE-007-2026-10-09.md): retrait du vérificateur
  de style maison et de son intégration à `npm test`.
- [Plateformes — PLAT-001c](./platforms-PLAT-001c-2026-10-09.md): installation
  sans compilation native sur la cible, résolution des binaires précompilés
  Linux et vérification des artefacts x64/ARM64 du paquet.
- [Plateformes — PLAT-001c x64](./platforms-PLAT-001c-x64-2026-10-09.md):
  génération des prébuilds projet x64, ajout de la compilation croisée ARM64
  et vérification de l'architecture des ELF; le toolchain ARM64 doit encore
  être installé pour valider la production réelle des binaires cibles.
- [Expérience utilisateur — UX-006](./ux-UX-006-2026-10-04.md): vitesse et
  accélération du pointeur configurables localement par appareil.
- [Expérience utilisateur — UX-006a](./ux-UX-006a-2026-10-04.md): mise en page
  contenue et fusion des mouvements en attente côté serveur.
- [Expérience utilisateur — UX-006b](./ux-UX-006b-2026-10-04.md): adaptation
  verticale du panneau latéral aux écrans mobiles courts.
- [Expérience utilisateur — UX-006c](./ux-UX-006c-2026-10-04.md): bordure
  d'élévation sur la commande d'accès et les actions administratives actives.
- [Expérience utilisateur — UX-006d](./ux-UX-006d-2026-10-09.md): réglage local
  des vitesses lente et rapide de la courbe du pointeur.
- [Expérience utilisateur — UX-001/002](./ux-UX-002-2026-10-09.md): liste des
  appareils associés, révocation d'une association et accès au parcours QR.
- [Expérience utilisateur — UX-002a/002b](./ux-UX-002a-002b-2026-10-09.md):
  révocation en lot, protection de la session courante et page Sécurité dédiée.

- [Architecture — ARCH-008](./architecture-ARCH-008-2026-10-03.md): handlers
  nommés et exportés pour les routes de configuration et abonnements clients.
- [Architecture — ARCH-009](./architecture-ARCH-009-2026-10-03.md): service
  d'overlay commun et implantations Linux/Windows déplacées derrière la façade
  OS.
- [Exploitation — OPS-001](./operations-OPS-001-2026-10-02.md): commande CLI
  locale affichant la version du paquet installé.
- [Exploitation — OPS-004](./ops-OPS-004-2026-10-09.md): version et chemin
  réellement exécutés, version candidate et résultat effectif de l'installation.

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
- [Plateformes — PLAT-004m](./platforms-PLAT-004m-2026-10-09.md): absorption
  des erreurs `EPIPE` du helper XWayland durant l'arrêt du service.
- [Plateformes — PLAT-004n](./platforms-PLAT-004n-2026-10-09.md): correction
  des commandes `HIDE`/`SHOW` perdues par le read-ahead stdio du helper QR.
- [Plateformes — PLAT-004o](./platforms-PLAT-004o-2026-10-09.md): bascule du QR
  cohérente avec le masquage au survol et transitions d'affichage sérialisées.
- [Plateformes — PLAT-004p](./platforms-PLAT-004p-2026-10-09.md): récupération
  si le helper QR refuse une commande d'affichage ou de mise à jour.
- [Plateformes — PLAT-004q](./platforms-PLAT-004q-2026-10-09.md): commandes
  acquittées, état de visibilité confirmé et protection du `SHOW` sous pointeur.
- [Plateformes — PLAT-004r](./platforms-PLAT-004r-2026-10-09.md): limitation
  du probe hover pour éviter la saturation CPU et démarrage serveur non bloqué.
- [Plateformes — PLAT-004s](./platforms-PLAT-004s-2026-10-09.md): confirmation
  de la position du pointeur avant de masquer le QR sur `EnterNotify`.
- [Plateformes — PLAT-004t](./platforms-PLAT-004t-2026-10-09.md): coalescence
  des bascules QR et fermeture sans attente d'ACK pendant l'arrêt.
- [Expérience utilisateur — UX-007](./ux-UX-007-2026-10-09.md): libellé
  explicite et traductions du bouton de bascule QR.
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
- [Plateformes — PLAT-005f](./platforms-PLAT-005f-2026-10-09.md): installateur
  local de l'environnement de développement Linux Ubuntu/Debian.
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
- [ARCH-025](./arch-ARCH-025-2026-10-07.md): extraction des handlers
  d'authentification administrateur hors du routeur Express.
- [ARCH-026](./arch-ARCH-026-2026-10-07.md): extraction des handlers des
  informations serveur hors du routeur Express.
- [ARCH-027](./arch-ARCH-027-2026-10-07.md): découplage du catalogue des
  remotes du routeur administrateur.
- [ARCH-028](./arch-ARCH-028-2026-10-07.md): organisation des composants HTTP
  par routeurs, handlers, guards et middlewares.
- [ARCH-029](./arch-ARCH-029-2026-10-07.md): extraction des derniers handlers
  inline des routeurs HTTP.
- [ARCH-030](./arch-ARCH-030-2026-10-07.md): regroupement des frontières de
  montage HTTP publiques et protégées.
- [ARCH-031](./arch-ARCH-031-2026-10-07.md): tests des frontières de montage
  HTTP et clôture de la consolidation du routage.
- [ARCH-032](./arch-ARCH-032-2026-10-07.md): formalisation du contrat entre
  transport et subscribers sans dispatcher central.
- [ARCH-033](./arch-ARCH-033-2026-10-07.md): retrait des alias legacy des
  événements et actions QR.
- [ARCH-034](./arch-ARCH-034-2026-10-07.md): adaptation Socket.IO vers le
  contrat de canal Express-like des subscribers.
- [ARCH-035](./arch-ARCH-035-2026-10-07.md): extraction du chaînage de
  callbacks dans un composant indépendant du transport.
- [ARCH-036](./arch-ARCH-036-2026-10-07.md): regroupement des subscribers de
  connexion sous une arborescence dédiée, distincte des actions métier.
- [ARCH-037](./arch-ARCH-037-2026-10-07.md): utilisation de la réponse du
  canal pour les résultats des actions administrateur.
- [ARCH-038](./arch-ARCH-038-2026-10-07.md): montage local du guard admin et
  abstraction commune des réponses d'action.
- [ARCH-039](./arch-ARCH-039-2026-10-07.md): adoption du channel fluent et des
  réponses implicites fournies par le callback.
- [ARCH-040](./arch-ARCH-040-2026-10-07.md): navigation locale des pages client
  et réduction des réponses d'action.
- [ARCH-041](./arch-ARCH-041-2026-10-07.md): alignement du subscriber QR sur
  le channel fluent et sa réponse directe.
- [ARCH-042](./arch-ARCH-042-2026-10-07.md): suppression du helper intermédiaire
  dans les callbacks QR.
- [ARCH-043](./arch-ARCH-043-2026-10-07.md): adoption de `pillarjs/router`
  pour router les paquets Socket.IO et passage des événements de transport à
  une notation par chemins.
- [ARCH-044](./arch-ARCH-044-2026-10-07.md): isolation et validation d'un
  adaptateur routeur avant toute migration progressive des subscribers.
- [ARCH-045](./arch-ARCH-045-2026-10-07.md): routeur global au bootstrap et
  première migration du subscriber QR vers une factory de routes.
- [ARCH-046](./arch-ARCH-046-2026-10-07.md): protocole `route:request` et
  migration complète des subscribers en factories de routes.
- [ARCH-046 — clôture HTTP](./arch-ARCH-046-2026-10-08.md): validation du
  montage Express des routeurs d'actions et du transport HTTP agnostique.
- [CODE-001/002/005/006](./code-CODE-001-2026-10-08.md): audit mesuré,
  convention de style, contrôle automatisé et prévention progressive.
- [CODE-003/004](./code-CODE-003-004-2026-10-08.md): imports, conventions de
  nommage des modules et contrôle stylistique renforcé.
- [REL-001](./rel-REL-001-2026-10-08.md): bornes des timestamps d'entrée et
  drainage robuste des mouvements coalescés.
- [REL-002](./rel-REL-002-2026-10-08.md): reprise automatique du backend
  uinput après redémarrage du service.
- [REL-003](./rel-REL-003-2026-10-08.md): configuration des délais de
  reconnexion et du heartbeat Socket.IO.
- [REL-004](./rel-REL-004-2026-10-08.md): bornes de capture et cadence
  adaptative de la prévisualisation.
- [REL-004a](./rel-REL-004a-2026-10-08.md): limite maximale de cadence rendue
  configurable et protégée par un test de non-régression.
- [REL-006](./rel-REL-006-2026-10-08.md): reprise explicite du socket après
  coupure réseau et retour de connectivité.
- [REL-007](./rel-REL-007-2026-10-08.md): erreur explicite de port occupé,
  contrôle d'intégrité et fermeture propre de SQLite.
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
