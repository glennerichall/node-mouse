# QUA-007 / PLAT-005 — Laboratoire et validations multiplateformes

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## QUA-007 — Laboratoire et validations multiplateformes

Le laboratoire, les profils d’environnement et les validations d’installation,
d’exécution et de compatibilité sont suivis par les sous-tâches historiques
`PLAT-005*`, conservées dans l’index de cet axe. Les validations VM restent
suspendues selon la contrainte globale de la roadmap.

## PLAT-005a — créer le socle Vagrant du laboratoire

**État:** Terminé.

  commune, vérification explicite et documentée des versions de Vagrant,
  `vagrant-libvirt`, libvirt et QEMU/KVM, configuration locale non versionnée,
  répertoires de cache et d'état ignorés, cycle de vie
  créer/démarrer/arrêter/détruire et documentation de dépannage. Les opérations
  destructrices doivent exiger la désignation explicite d'une machine et ne
  jamais supprimer une image source.

## PLAT-005b3 — provisionner une VM Ubuntu 24.04 avec une vraie session

**État:** Terminé.

  Xfce/Xorg ouverte pour l'utilisateur de test; installer Remote Mouse en mode
  X11 et automatiser avec Jest/Playwright la souris, le clavier et la capture.
  L'overlay QR doit produire un contrôle visuel conservé comme artefact sans
  confondre cette vérification avec Wayland/XWayland.

## PLAT-005c1a — déclarer le profil Windows 11 optionnel, son contrat WinRM,

**État:** Terminé.

  ses ressources QEMU UEFI/TPM 2.0, son paquet npm local ignoré par Git et son
  provisionnement PowerShell; conserver `PLAT-005c1` ouverte jusqu'à une
  exécution avec une box Windows locale et licenciée.

## PLAT-005d — fournir des tests intégrés relançables dans les invités

**État:** À faire.

  parcours d'installation doit couvrir installation neuve, démarrage du
  service, santé HTTP et version CLI; le parcours de mise à jour doit vérifier
  la conservation de la configuration, des secrets et des données; le parcours
  d'utilisation doit vérifier chargement du client, connexion Socket.IO et
  commandes souris/clavier jusqu'à l'observation des événements dans l'invité.
  Produire un rapport local distinguant assertions automatisées, contrôles
  visuels de l'overlay/aperçu et validations sur machine physique, puis permettre
  de restaurer un état propre sans reconstruire les médias de base.

## PLAT-005e — abandonner l'orchestration Vagrant/Packer des machines

**État:** Terminé.

  développement; les développeurs fournissent leurs VM et les scripts de
  `dev/deploy/` déploient le dépôt par SSH/rsync avant les tests intégrés.

## PLAT-005f — fournir un installateur idempotent pour préparer un poste

**État:** Terminé.

  développement Linux Ubuntu/Debian : vérifier la version de Node.js attendue
  par le projet, installer ou signaler les outils système requis pour le
  développement, la compilation locale des composants natifs et les tests,
  puis installer les dépendances npm du dépôt. Distinguer ces prérequis locaux
  de ceux des machines cibles gérés par `dev/deploy/` et des dépendances
  d'exécution du produit; ne créer ni ne gérer de VM. Documenter les paquets
  installés, les privilèges nécessaires, les limites de distribution et les
  étapes de vérification; permettre de relancer le script sans effets
  indésirables.

## PLAT-005g — étendre `dev/setup-linux.sh` pour préparer la génération

**État:** Terminé.

  prébuilds projet x64 et ARM64 sur un hôte amd64 : détecter l'architecture
  étrangère et les paquets cibles requis, configurer la source ARM64 officielle
  Ubuntu sans écraser une configuration gérée par le développeur, installer le
  toolchain croisé et les en-têtes X11/libpng cibles après confirmation, puis
  générer les deux jeux d'artefacts. Le mode `--check` doit signaler les
  prérequis et artefacts manquants sans modifier le système.

## PLAT-005h — suspendre les travaux liés aux machines virtuelles

**État:** Terminé.

  consigner que toute création, tout provisionnement ou toute validation
  nécessitant une VM est reporté jusqu'à indication contraire; conserver les
  tâches et décisions existantes sans les supprimer ni exécuter les scripts de
  déploiement VM. Critères : la roadmap globale et cet axe signalent clairement
  la suspension; aucune tâche VM n'apparaît dans l'ordre de livraison actif;
  les travaux non liés aux VM restent planifiables.

## PLAT-005i — retirer le harnais VM et son déploiement SSH devenus

**État:** Terminé.

  obsolètes après l'ajout des validations natives GitHub Actions; supprimer les
  profils Jest/Playwright, le `DesktopProbe`, le runner distant et les scripts
  `dev/deploy/`, sans retirer les smoke tests multiplateformes actifs.

## PLAT-005j — faire préparer automatiquement l'accès `/dev/uinput`

**État:** Terminé.

  `dev/setup-linux.sh` lorsqu'il est lancé dans une session Wayland; conserver
  l'absence d'élévation en session X11, rendre l'opération idempotente et
  signaler en mode `--check` lorsqu'une reconnexion de session est nécessaire.
La Definition of Done commune est dans la [roadmap](../../ROADMAP.md).

## PLAT-005b — ajouter deux profils Linux distincts, X11 et Wayland,

**État:** À faire.

  bootstrap idempotent qui installe le projet, ses prérequis de compilation et
  son service; permettre de vérifier séparément installation neuve, mise à
  jour, souris, clavier, aperçu et overlay QR.

## PLAT-005c — ajouter un profil Windows 11 avec UEFI, TPM virtuel et média

**État:** À faire.

  d'installation fourni localement par le développeur; automatiser le
  bootstrap nécessaire aux tests d'installation, de mise à jour et de
  désinstallation sans redistribuer d'image ni de licence Microsoft.

## PLAT-005b1 — ajouter un profil Linux serveur Ubuntu 24.04 reproductible,

**État:** Terminé.

  avec box libvirt et version épinglées, puis y exécuter un test intégré noir
  couvrant installation depuis le dépôt, service utilisateur, version CLI,
  santé HTTP, chargement du client et réinstallation sans perte de la
  configuration. Ce profil valide l'installation commune mais ne vaut pas
  validation X11 ou Wayland.

## PLAT-005b2 — remplacer l'orchestrateur VM Bash par le cycle de vie Vagrant

**État:** Terminé.

  natif, exécuter les assertions d'installation avec Jest et le client réel
  avec Playwright, puis vérifier que les commandes Socket.IO souris/clavier
  produisent les événements attendus sur les périphériques virtuels uinput.
  `npm run test:all` doit agréger les suites unitaires, navigateur et VM, tandis
  que les validations visuelles Wayland restent explicitement séparées.

## PLAT-005b2a — stabiliser la navigation du test Playwright partagé après

**État:** Terminé.

  l'ouverture d'un lien de session à jeton : attendre la fin de la redirection
  avant d'accéder au contexte JavaScript, puis vérifier que le parcours passe
  dans les invités d'installation et Wayland.

## PLAT-005b3a — valider dans la VM Xfce/Xorg l'installation, le service,

**État:** Terminé.

  les mouvements RobotJS, les événements clavier et une trame d'aperçu au
  moyen du client Playwright réel; conserver une capture du bureau comme
  artefact du contrôle visuel.

## PLAT-005b3b — rendre la validation de l'overlay X11 déterministe

**État:** Terminé.

  pas basculer sa visibilité dans le test de saisie, vérifier que la fenêtre
  reste mappée et qu'elle revient après un survol, puis conserver une capture
  visuelle où le QR apparaît. Le test précédent masquait le QR en envoyant une
  commande de bascule avant la capture.

## PLAT-005b4 — provisionner une VM Ubuntu 24.04 GNOME avec une vraie

**État:** À faire.

  session Wayland, puis valider la suite d'exécution commune au moyen du
  provider Wayland du `DesktopProbe` : souris/clavier vers une fenêtre native,
  QR XWayland visible, masqué au survol et réaffiché après sortie. Conserver
  une capture QEMU. Exclure l'aperçu PipeWire tant que PLAT-004d n'est pas
  implantée; ne pas présenter cette VM comme validation multi-compositeur ou
  matérielle.

## PLAT-005b5 — remplacer les suites d'intégration propres aux profils VM

**État:** À faire.

  par deux suites canoniques, installation et exécution, pilotées par un
  `DesktopProbe` qui sélectionne par configuration les providers X11,
  Wayland et Windows. La même commande doit pouvoir s'exécuter sur le poste
  natif, dans un invité Vagrant et sur un runner GitHub Actions; les scénarios
  et assertions métier restent communs, seuls les observateurs système
  diffèrent. Réduire Vagrant à la préparation de la cible et au lancement de
  cette commande, sans dupliquer les tests ni leur orchestration.

## PLAT-005b6 — ajouter une validation GitHub Actions sans Vagrant

**État:** Terminé.

  l'installation depuis le tarball npm et le démarrage du serveur sur des
  runners Ubuntu X11, Ubuntu Wayland headless et Windows. Vérifier la santé
  HTTP et la version exposée par chaque installation; conserver les tests
  d'entrée physique, de capture et de service dans leurs suites spécialisées
  tant que le provider natif correspondant n'est pas disponible.

## PLAT-005b7 — faire sélectionner au smoke test le service natif seulement

**État:** Terminé.

  lorsque `systemd --user` est réellement disponible sur le runner; vérifier
  alors installation, état actif, santé et désinstallation, sinon signaler un
  contrôle systemd ignoré et conserver le démarrage direct. Ne pas provisionner
  de VM ou de daemon externe pour fabriquer cette capacité.

## PLAT-005b8 — exécuter les suites unitaires et Playwright E2E dans GitHub

**État:** Terminé.

  Actions sur les runners Ubuntu existants; installer les navigateurs requis,
  publier les rapports d’échec utiles, isoler les projets Playwright dans des
  processus, ports et bases SQLite séparés, et garder ces contrôles distincts
  des smoke tests d’installation et des validations VM suspendues.

## PLAT-005b8a — corriger le scénario Playwright des préférences de vitesse

**État:** Terminé.

  pour ne modifier le curseur rapide qu'après réactivation de l'accélération;
  le test doit vérifier séparément l'état désactivé et la modification
  ultérieure des deux valeurs.

## PLAT-005c1 — définir et provisionner depuis une box Windows 11 locale

**État:** À faire.

  contrat Vagrant WinRM, les ressources QEMU UEFI/TPM et l'installation du
  paquet courant; fournir les commandes de test séparées et refuser clairement
  l'exécution lorsque la box ou l'artefact npm local manque.

## PLAT-005c2 — fournir un script de création local de la box Vagrant

**État:** À faire.

  `libvirt` Windows 11 à partir des chemins fournis par le développeur pour
  l'ISO Windows et l'ISO VirtIO; séparer le DVD IDE du disque VirtIO, charger
  automatiquement le pilote de stockage VirtIO pendant l'installation, puis
  automatiser le bootstrap avec WinRM, UEFI et TPM 2.0. Créer et enregistrer
  l'artéfact sous `dev/vagrant/` ignoré par Git, sans modifier ni supprimer les
  ISO sources ni une box existante. Documenter les prérequis et vérifier la
  configuration Packer ainsi que l'ajout de la box; garder l'itération ouverte
  jusqu'à un build et un démarrage réels avec les médias locaux.

## QUA-002a — protéger la baseline de couverture Jest avec des seuils

**État:** Terminé.

    globaux vérifiables et non bloquants pour les nouveaux travaux.

## QUA-003 — couvrir sessions, rôles, proxies et contrats de transport

**État:** À faire.

  des tests de sécurité.

## QUA-004 — tester les installations Linux, Windows et macOS,

**État:** À faire.

  PWA sur des appareils réels.

## QUA-005 — déclarer les versions Node.js prises en charge et automatiser

**État:** À faire.

  l'audit des dépendances.

## QUA-006 — générer le changelog, les artefacts et checksums, et documenter

**État:** À faire.

  la compatibilité.
