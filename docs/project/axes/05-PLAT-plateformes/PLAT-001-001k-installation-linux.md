# PLAT-001-001k — Installation et publication Linux

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## PLAT-001 — clôturer le parcours Linux après les sous-tâches setup

**État:** Terminé.

  la génération et le cycle de vie du service `systemd --user` sans toucher au
  service de l'hôte; documenter l'installation, le démarrage lié à la session,
  les commandes de diagnostic et de retrait, ainsi que les capacités et
  permissions propres à X11 et Wayland. Distinguer le contrôle souris/clavier,
  l'overlay QR et l'aperçu; ne pas promettre de capture Wayland non implantée.
  Aucun script de cette clôture ne doit créer, provisionner, démarrer ou valider
  une VM.

## PLAT-001a — rendre l'installation uinput autonome et idempotente

**État:** Terminé.

  une installation existante sans remplacer sa configuration, ses secrets ni
  sa base de données.

## PLAT-001b — rattacher la migration privilégiée uinput au `postinstall`

**État:** Terminé.

  déclenché par la mise à jour intégrée; demander l'autorisation locale via
  Polkit seulement lorsque la configuration système manque.

## PLAT-001c — distribuer les composants natifs Linux sous forme d'artéfacts

**État:** Terminé.

  précompilés dans le paquet npm, sélectionnés selon l'architecture; le
  `postinstall` les utilise sans exiger de compilateur ni d'en-têtes de
  développement sur la machine cible. Inventorier les dépendances npm natives
  pour confirmer leur compatibilité x64/ARM64 et s'appuyer sur leurs artefacts
  et mécanismes de distribution amont; ne pas copier ni maintenir leurs binaires
  dans ce projet.
  Couvrir les bridges Node-API `uinput`/XWayland et l'overlay QR; garder le
  helper libei optionnel. Permettre la compilation croisée ARM64 depuis un hôte
  Linux x64 avec toolchain et bibliothèques de développement cibles, et vérifier
  l'architecture ELF produite. Définir une matrice reproductible x64/ARM64,
  vérifier le contenu npm et l'absence de compilation à l'installation;
  documenter les bibliothèques partagées qui restent requises au runtime.

## PLAT-001d — simplifier l'installation publique autour

**État:** Terminé.

  `npm install -g @velor/remote-mouse`, puis d'une commande explicite
  `remote-mouse setup` qui configure l'application sur Linux et Windows.
  Séparer l'installation du paquet des changements système : le setup doit
  détecter/valider les prérequis, créer la configuration initiale et ses
  secrets, installer le service, et demander explicitement les permissions
  système requises (notamment uinput sous Linux). Rester idempotent et
  préserver configuration et données lors d'une mise à jour. Dépend de
  PLAT-001c et PLAT-001e, et coordonne les critères d'installation récupérable
  d'OPS. Garder
  Les anciens installateurs par système ont été supprimés après reprise de la
  configuration, du service et de la permission uinput par la commande `setup`;
  conserver les tests du nouveau parcours et les outils natifs ciblés.

## PLAT-001e — définir et valider le packaging de publication npm à partir

**État:** Terminé.

  d'un tarball reproductible : contrôler les fichiers inclus/exclus, les
  entrées CLI, les artefacts natifs précompilés et les métadonnées requises;
  exécuter `npm pack` et `npm publish --dry-run`, puis installer le tarball dans
  un préfixe global temporaire et vérifier `remote-mouse --version` ainsi que
  le chargement des composants natifs. Couvrir les architectures prises en
  charge par PLAT-001c. Cette tâche prépare et teste le paquet, sans publier
  automatiquement ni nécessiter de jeton npm.

## PLAT-001f — ajouter une compilation locale de secours au `postinstall`

**État:** Terminé.

  uniquement lorsqu'aucun prébuild correspondant à Linux et à l'architecture
  cible n'est fourni. Le résolveur natif doit sélectionner explicitement le
  prébuild compatible en priorité, puis l'artefact local compilé; ne jamais
  charger un binaire d'une autre architecture. Limiter la compilation aux
  composants natifs maintenus par le projet, vérifier les sources et outils
  requis dans le tarball, et laisser l'installation npm se terminer avec un
  avertissement diagnostique si le toolchain manque ou si la compilation échoue.
  Tester le choix du résolveur et le `postinstall` avec prébuild présent/absent,
  toolchain disponible/indisponible et architectures x64/ARM64. Dépend de
  PLAT-001c et PLAT-001e; cette évolution révise la décision de PLAT-001c de ne
  jamais compiler pendant l'installation.

## PLAT-001g — automatiser la préparation de publication via le hook npm

**État:** Terminé.

  `prepublishOnly` : sur un hôte Linux x64, générer les prébuilds x64 et ARM64
  au moyen de `build:native:prebuild`, vérifier les architectures et le contenu
  du tarball, puis exécuter la validation d'installation de PLAT-001e avant
  qu'`npm publish` ne publie le paquet. Ne pas créer de commande `publish`
  personnalisée; `npm publish --dry-run` doit permettre de tester la chaîne sans
  téléverser. Les vérifications npm imbriquées doivent désactiver les hooks pour
  éviter la récursion. Documenter les prérequis du toolchain et de
  l'authentification npm. Dépend de PLAT-001e.

## PLAT-001h — refactorer `remote-mouse setup` en orchestration générique

**État:** Terminé.

  appuyée sur une stratégie sélectionnée selon l'OS hôte. Séparer validation,
  interaction, configuration persistante et installation du service en modules
  à responsabilité unique. Chaque stratégie Linux/Windows fournit les chemins,
  valeurs et opérations système propres à l'hôte, sans conditions OS dispersées
  dans l'algorithme générique. Tester la sélection des stratégies, leurs
  différences de configuration/permissions et le parcours commun avec des
  stratégies simulées; préserver l'idempotence et le comportement actuel.

## PLAT-001i — faire utiliser par `npm run dev` les artefacts natifs compilés

**État:** Terminé.

  depuis le checkout courant, même si un prébuild plus ancien est présent;
  conserver la priorité du prébuild compatible pour les installations et la
  publication. Couvrir le choix explicite du résolveur par des tests et vérifier
  que le helper QR recompilé est celui lancé en développement.

## PLAT-001j — corriger l'inclusion des prébuilds Linux générés

**État:** Terminé.

  tarball npm lorsque ces artéfacts restent ignorés par Git; aligner les règles
  `.gitignore`, `.npmignore` et l'allowlist `files` sur chaque fichier natif,
  puis vérifier la chaîne réelle de `npm publish --dry-run`.

## PLAT-001k — préserver l'activation du service `systemd --user` après

**État:** Terminé.

  mise à jour de l'application, afin que le service actif soit aussi relancé au
  prochain démarrage; réactiver l'unité avant le redémarrage post-mise-à-jour et
  tester l'ordre des commandes sans hôte systemd réel.
