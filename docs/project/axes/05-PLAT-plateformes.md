# 05 — PLAT — Plateformes et intégrations système

## Résultat visé

Fournir une installation fiable et des capacités clairement détectées sur
Linux, Windows et à terme macOS, avec des intégrations système extensibles.

## Plan de travail

- [ ] PLAT-001 — consolider installation et service Linux; documenter X11/Wayland.
- [x] PLAT-001a — rendre l'installation uinput autonome et idempotente; migrer
  une installation existante sans remplacer sa configuration, ses secrets ni
  sa base de données.
- [x] PLAT-001b — rattacher la migration privilégiée uinput au `postinstall`
  déclenché par la mise à jour intégrée; demander l'autorisation locale via
  Polkit seulement lorsque la configuration système manque.
- [ ] PLAT-002 — tester installation, service, mise à jour et désinstallation Windows.
- [ ] PLAT-003 — créer l'installation macOS et guider les permissions Accessibilité.
- [ ] PLAT-004 — intégrer le contrôle et la capture Wayland selon le
  [plan dédié](./05-PLAT-004-wayland.md).
- [x] PLAT-004a — détecter la capture RobotJS indisponible sous Wayland et
  neutraliser la prévisualisation sans interrompre le serveur.
- [ ] PLAT-004g — utiliser un périphérique virtuel `uinput` comme stratégie
  d'entrée Wayland par défaut, conserver RemoteDesktop/libei comme stratégie
  optionnelle et limiter la permission système au seul `/dev/uinput`.
- [x] PLAT-004g2 — séparer la souris et le clavier virtuels uinput afin que la
  pile Linux les classifie selon leur fonction, sans ajouter de permission ni
  de configuration système; retirer du parcours uinput la lecture XWayland de
  position globale devenue inutile.
- [x] PLAT-004h — rendre l'overlay QR YAD utilisable sous Wayland en l'exécutant
  explicitement par XWayland lorsque le positionnement global est requis.
- [x] PLAT-004i — empêcher YAD de rogner le QR lorsque la fenêtre a exactement
  la taille configurée, en adaptant l'image à la zone intérieure du widget.
- [ ] PLAT-004j — rétablir sous Wayland/XWayland le masquage temporaire de
  l'overlay QR lorsque le pointeur le survole, puis son réaffichage après la
  sortie du pointeur, sans oscillation, perte permanente de la fenêtre ni
  régression du comportement X11; couvrir la logique de coordonnées par des
  tests et valider le résultat sur Ubuntu 26.04 Wayland réel.
- [ ] PLAT-004l — remplacer l’overlay QR YAD et les contournements de position
  globale par un helper natif X11/XWayland spécialisé, événementiel et isolé;
  conserver la génération du PNG dans Node.js, libérer la zone masquée pour les
  clics et valider affichage, survol et retour du QR sous X11 et GNOME Wayland.
- [x] PLAT-004k — abandonnée : ne pas déduire la sensation du pointeur à partir
  du système d'exploitation ni imposer une correction propre à Wayland. La
  vitesse et l'accélération deviennent des préférences locales du client dans
  `UX-006`; `input.mouseSpeed` reste compatible avec les anciens clients.
- [ ] PLAT-005 — fournir dans `dev/` un laboratoire de développement et de
  validation reproductible, exécuté depuis un hôte Linux avec Vagrant,
  `vagrant-libvirt` et QEMU/KVM, sans ajouter de dépendance ni d'artéfact de
  machine virtuelle au produit livré.
- [x] PLAT-005a — créer le socle Vagrant du laboratoire : `Vagrantfile`, commande
  commune, vérification explicite et documentée des versions de Vagrant,
  `vagrant-libvirt`, libvirt et QEMU/KVM, configuration locale non versionnée,
  répertoires de cache et d'état ignorés, cycle de vie
  créer/démarrer/arrêter/détruire et documentation de dépannage. Les opérations
  destructrices doivent exiger la désignation explicite d'une machine et ne
  jamais supprimer une image source.
- [ ] PLAT-005b — ajouter deux profils Linux distincts, X11 et Wayland, avec un
  bootstrap idempotent qui installe le projet, ses prérequis de compilation et
  son service; permettre de vérifier séparément installation neuve, mise à
  jour, souris, clavier, aperçu et overlay QR.
- [x] PLAT-005b1 — ajouter un profil Linux serveur Ubuntu 24.04 reproductible,
  avec box libvirt et version épinglées, puis y exécuter un test intégré noir
  couvrant installation depuis le dépôt, service utilisateur, version CLI,
  santé HTTP, chargement du client et réinstallation sans perte de la
  configuration. Ce profil valide l'installation commune mais ne vaut pas
  validation X11 ou Wayland.
- [x] PLAT-005b2 — remplacer l'orchestrateur VM Bash par le cycle de vie Vagrant
  natif, exécuter les assertions d'installation avec Jest et le client réel
  avec Playwright, puis vérifier que les commandes Socket.IO souris/clavier
  produisent les événements attendus sur les périphériques virtuels uinput.
  `npm run test:all` doit agréger les suites unitaires, navigateur et VM, tandis
  que les validations visuelles Wayland restent explicitement séparées.
- [x] PLAT-005b3 — provisionner une VM Ubuntu 24.04 avec une vraie session
  Xfce/Xorg ouverte pour l'utilisateur de test; installer Remote Mouse en mode
  X11 et automatiser avec Jest/Playwright la souris, le clavier et la capture.
  L'overlay QR doit produire un contrôle visuel conservé comme artefact sans
  confondre cette vérification avec Wayland/XWayland.
- [x] PLAT-005b3a — valider dans la VM Xfce/Xorg l'installation, le service,
  les mouvements RobotJS, les événements clavier et une trame d'aperçu au
  moyen du client Playwright réel; conserver une capture du bureau comme
  artefact du contrôle visuel.
- [x] PLAT-005b3b — rendre la validation de l'overlay X11 déterministe : ne
  pas basculer sa visibilité dans le test de saisie, vérifier que la fenêtre
  reste mappée et qu'elle revient après un survol, puis conserver une capture
  visuelle où le QR apparaît. Le test précédent masquait le QR en envoyant une
  commande de bascule avant la capture.
- [ ] PLAT-005b4 — provisionner une VM Ubuntu 24.04 GNOME avec une vraie
  session Wayland, puis valider avec le client réel que souris et clavier sont
  injectés par `uinput` et reçus par une fenêtre Wayland native. Vérifier aussi
  l'affichage du QR par XWayland, le masquage au survol et le réaffichage après
  sortie; conserver une capture de la console QEMU. Exclure l'aperçu PipeWire
  tant que PLAT-004d n'est pas implantée, et ne pas présenter cette VM comme
  validation Wayland multi-compositeur ou matérielle.
- [ ] PLAT-005c — ajouter un profil Windows 11 avec UEFI, TPM virtuel et média
  d'installation fourni localement par le développeur; automatiser le
  bootstrap nécessaire aux tests d'installation, de mise à jour et de
  désinstallation sans redistribuer d'image ni de licence Microsoft.
- [ ] PLAT-005c1 — définir et provisionner depuis une box Windows 11 locale le
  contrat Vagrant WinRM, les ressources QEMU UEFI/TPM et l'installation du
  paquet courant; fournir les commandes de test séparées et refuser clairement
  l'exécution lorsque la box ou l'artefact npm local manque.
- [x] PLAT-005c1a — déclarer le profil Windows 11 optionnel, son contrat WinRM,
  ses ressources QEMU UEFI/TPM 2.0, son paquet npm local ignoré par Git et son
  provisionnement PowerShell; conserver `PLAT-005c1` ouverte jusqu'à une
  exécution avec une box Windows locale et licenciée.
- [ ] PLAT-005d — fournir des tests intégrés relançables dans les invités. Le
  parcours d'installation doit couvrir installation neuve, démarrage du
  service, santé HTTP et version CLI; le parcours de mise à jour doit vérifier
  la conservation de la configuration, des secrets et des données; le parcours
  d'utilisation doit vérifier chargement du client, connexion Socket.IO et
  commandes souris/clavier jusqu'à l'observation des événements dans l'invité.
  Produire un rapport local distinguant assertions automatisées, contrôles
  visuels de l'overlay/aperçu et validations sur machine physique, puis permettre
  de restaurer un état propre sans reconstruire les médias de base.
- [ ] Renforcer diagnostics VLC, navigateurs et Samsung TV.
- [ ] Définir un contrat d'adaptateur avant de multiplier les intégrations.

Pour chaque tâche, lister les versions OS testées, prérequis et limitations
observées; distinguer capacités simulées et vérifiées sur machine réelle.

## Laboratoire de développement

Le laboratoire `PLAT-005` est un outil de développement de l'axe, pas une
nouvelle dépendance d'exécution. Le poste hôte officiellement retenu est Linux.
Vagrant décrit les machines et leur provisionnement, le provider communautaire
`vagrant-libvirt` gère leur cycle de vie par libvirt, et QEMU/KVM demeure le
backend de virtualisation. Les versions compatibles de cette chaîne doivent
être contrôlées avant le démarrage plutôt que laissées implicites. Les images,
instantanés, ISO, clés et secrets restent hors du dépôt.

Les profils Linux doivent couvrir une vraie session X11 et une vraie session
Wayland plutôt que de considérer XWayland comme une validation des deux. Le
profil Windows cible Windows 11 et accepte un média obtenu par le développeur.

macOS demeure une plateforme visée par `PLAT-003`, mais ne fait pas partie du
laboratoire QEMU exécuté sur un hôte Linux. Sa validation exigera du matériel
Apple ou un service de CI Apple autorisé; elle ne doit pas bloquer la mise en
place des profils Linux et Windows.

## Compatibilité Linux transitoire

- Ubuntu 26.04 ne fournit plus de session Ubuntu/GNOME sur Xorg; XWayland ne
  donne pas à RobotJS le contrôle global ni la capture du bureau Wayland.
- Jusqu'à PLAT-004, le support complet reste assuré sous une vraie session X11.
  Sur Ubuntu 26.04, cela exige un environnement de bureau proposant encore une
  session Xorg, par exemple Xfce, MATE, KDE/X11 ou i3.
- Le bureau Ubuntu/GNOME Wayland reste utilisable sans prévisualisation, mais le
  contrôle souris/clavier n'est pas déclaré pris en charge avant PLAT-004.
