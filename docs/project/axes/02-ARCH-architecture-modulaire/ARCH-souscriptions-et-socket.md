# ARCH — Souscriptions et intégration Socket.IO

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## ARCH-002 — extraire la logique métier des handlers Socket.IO

**État:** Terminé.

  routeurs par domaine; le handler Socket.IO adapte la requête et fournit les
  services via `request.services`.

## ARCH-009 — Frontière du service d'overlay

**Dépendance:** l'implantation fonctionnelle de `PLAT-004l` sert de référence;
ce refactoring ne doit pas modifier son comportement ni réintroduire YAD.

**Modules concernés:**

- `server/services/overlay` pour le contrat applicatif commun;
- `server/services/os` pour la sélection et l'injection de l'adaptateur;
- `server/os/linux/overlay` pour le helper X11/XWayland;
- `server/os/win32/overlay` pour l'implantation PowerShell/WinForms;
- `native/wayland` pour le source C, dont l'emplacement reste inchangé.

**Critères d'acceptation:**

- `server/services/overlay` n'importe aucun module spécifique à Linux, Windows
  ou macOS et ne consulte pas directement `os.platform()`;
- le service commun possède l'état logique et les opérations `show`, `hide`,
  `toggle`, `update` et `close`, tandis que les adaptateurs possèdent les
  fenêtres, processus, protocoles et erreurs propres à leur OS;
- l'adaptateur est obtenu par la façade OS existante et un adaptateur nul garde
  le serveur opérationnel sur une plateforme non prise en charge;
- Linux conserve l'affichage et le survol natifs validés par `PLAT-004l`, et
  Windows conserve la géométrie ainsi que les commandes actuelles;
- des tests de contrat communs sont rejoués contre les adaptateurs simulés et
  les tests spécifiques Linux et Windows restent verts;
- aucun changement n'est apporté au protocole client, à la configuration
  persistée ou au cycle de jumelage QR.

## ARCH-010 — séparer la garde des actions administratives de la souscription

**État:** Terminé.

  des événements : le contexte d'autorisation est évalué au bootstrap Socket.IO,
  tandis que le registrar admin reçoit un canal et un émetteur de réponses.

## ARCH-011 — formaliser le contrat de canal (`id`, `on`, `emit`) et exposer

**État:** Terminé.

  une orchestration nommée des souscriptions (`subscribeInput`,
  `subscribeBrowser`, etc.) sans dispatcher métier central.

## ARCH-012 — externaliser les composants d'orchestration

**État:** Terminé.

  `bootstrapSocket` et tester séparément les guards, notifications et
  souscriptions Socket.IO.

## ARCH-013 — regrouper les composants Socket.IO et les souscriptions métier

**État:** Terminé.

  par responsabilité, avec un fichier par orchestration ou guard et des noms
  explicites; supprimer le module fourre-tout `socketBootstrapComponents`.

## ARCH-014 — retirer l'orchestration `createEventSubscriptions`

**État:** Terminé.

  `server/remotes` et la regrouper avec l'adaptation de canal Socket.IO.

## ARCH-015 — transformer `createEventSubscriptions` en service d'orchestration

**État:** Terminé.

  réutilisable, construisant les subscribers une fois et exposant `subscribeAll`.

## ARCH-016 — corriger le bootstrap Socket.IO pour consommer le service

**État:** Terminé.

  souscriptions enregistré, sans importer un handler supprimé.

## ARCH-017 — aligner le nom et l'injection du service de souscriptions,

**État:** Terminé.

  supprimer les derniers anciens points d'entrée et vérifier les imports de
  production.

## ARCH-036 — Subscribers regroupés par responsabilité de connexion

**Modules concernés:**

- `../../../server/connection/actions` pour l'ensemble des adapters de souscription
  aux événements de transport;
- `server/services/transport/createEventSubscriptionService.js` pour la
  composition des subscribers;
- tests unitaires des subscribers et du service de souscriptions.

**Critères d'acceptation:**

- les subscribers d'entrée, de remotes et de connexion sont regroupés sous
  `../../../server/connection/actions`;
- les actions métier restent dans `server/remotes/` et ne sont pas déplacées
  dans cette consolidation;
- les imports du service et des tests utilisent les nouveaux chemins sans
  alias de compatibilité obsolète;
- chaque subscriber conserve son contrat de canal et son routage vers l'outil
  métier correspondant;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-037 — Réponse administrateur portée par le canal

**Modules concernés:**

- `../../../server/connection/actions` pour la réponse des
  actions administrateur;
- tests unitaires du subscriber administrateur.

**Critères d'acceptation:**

- le subscriber admin utilise le paramètre `response` fourni au callback du
  canal;
- aucune dépendance à `createSocketActionResponder` ne subsiste dans ce
  subscriber;
- le payload de réponse conserve les champs `action`, `ok`, `message` et
  `openUrl`;
- l'absence de callback de réponse reste tolérée;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-038 — Guards et réponses regroupés avec les subscribers

**Modules concernés:**

- `../../../server/connection/actions` et
  `../../../server/connection/actions` pour le montage local
  des guards administrateur;
- `server/services/transport/sendActionResponse.js` pour la forme commune des
  réponses d'action;
- `../../../server/connection/actions` et l'adapter Socket.IO;
- tests des guards, subscribers et du bootstrap Socket.IO.

**Critères d'acceptation:**

- le guard administrateur est monté uniquement sur les événements `admin:*`;
- aucun guard administrateur métier n'est enregistré comme middleware global
  Socket.IO;
- les subscribers admin et QR utilisent la même abstraction de réponse;
- le payload de réponse est uniforme (`action`, `ok`, `message`, `openUrl`);
- le contexte de sécurité est disponible sur le channel adapté;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-039 — Canal fluent et réponse implicite

**Modules concernés:**

- `server/connection/socket/createSocketChannelAdapter.js` pour la
  normalisation du payload et le chaînage fluent;
- `../../../server/connection/actions` pour la composition
  directe des appels `channel.on`;
- subscribers d'entrée, navigateur et VLC pour la suppression des valeurs par
  défaut transport-spécifiques;
- tests du channel adapter et des subscribers.

**Critères d'acceptation:**

- chaque appel `channel.on(...)` retourne le channel et peut être chaîné;
- l'adapter transforme un payload absent en objet avant d'appeler le callback;
- les callbacks n'initialisent plus eux-mêmes `payload = {}`;
- les réponses sont envoyées directement via le callback `response`;
- aucune abstraction `sendActionResponse` n'est nécessaire dans les
  subscribers;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-040 — Navigation client et réponses minimales

**Modules concernés:**

- `client/ui/main/bindings/bindAdminRemoteButtons.js` pour la navigation
  locale des pages QR et informations serveur;
- actions administrateur de navigation et subscribers admin/QR;
- `client/services/notifications/createNotificationService.js` pour le retrait
  de l'ancien événement de résultat;
- tests unitaires des actions et réponses.

**Critères d'acceptation:**

- le client ouvre directement `/qr` et `/ui/admin/server-info`;
- les actions serveur de navigation ne renvoient plus `openUrl`;
- les réponses d'action contiennent uniquement `ok` et `message`;
- le champ `action` et le topic client `admin.result.received` sont supprimés;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-041 — Subscriber QR conforme au channel fluent

**Modules concernés:**

- `../../../server/connection/actions`;
- test du subscriber QR et contrat fluent du channel.

**Critères d'acceptation:**

- les quatre événements QR sont enregistrés par chaînage de `channel.on`;
- le subscriber ne normalise pas lui-même le payload;
- la réponse est transmise directement par `response` avec `{ok, message}`;
- l'adapter reste responsable du payload absent et du chaînage;
- la suite complète reste verte et la version patch est incrémentée.

## ARCH-042 — Callbacks QR explicites

**Modules concernés:**

- `../../../server/connection/actions`;
- test du subscriber QR.

**Critères d'acceptation:**

- aucun helper intermédiaire ne masque les callbacks QR;
- chaque événement est visible directement dans la chaîne `channel.on`;
- chaque callback utilise le payload fourni et la réponse du channel;
- la suite complète reste verte et la version patch est incrémentée.
