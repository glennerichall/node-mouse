# Développement actif

> Tableau de suivi opérationnel de Remote Mouse. Les orientations à long terme
> restent dans [ROADMAP.md](./ROADMAP.md) et les travaux PWA/TLS dans
> [ROADMAP-PWA.md](./ROADMAP-PWA.md).

## Utilisation

- `[ ]` : à faire ;
- `[x]` : terminé et vérifié ;
- `🚧` : en cours ;
- `⛔` : bloqué, avec la raison indiquée ;
- `➡️` : prochain travail recommandé.

Une case ne doit être cochée qu'après validation de ses critères d'acceptation
et des tests pertinents. Les tâches terminées restent dans ce fichier jusqu'à
la clôture du lot, puis sont déplacées dans le journal des lots terminés.

## Modèle de déploiement visé

Remote Mouse est conçu pour un serveur accessible sur le réseau local, dont le
QR est affiché sur place. Le nombre d'utilisateurs est limité et ceux-ci sont
normalement physiquement présents et se connaissent. Ce contexte réduit le
besoin d'une gestion lourde des comptes, mais ne protège pas contre un client
malveillant déjà présent sur le LAN ni contre une exposition accidentelle à
Internet.

## État courant

| Élément | Valeur |
| --- | --- |
| Lot actif | A — Stabilisation et sécurité |
| Statut | En cours |
| Prochaine tâche | `SEC-008` — Gérer les appareils associés |
| Version | `6.9.1` — bump `patch` pour le durcissement SEC-007 |
| Roadmap globale | [ROADMAP.md](./ROADMAP.md) |
| Roadmap PWA | [ROADMAP-PWA.md](./ROADMAP-PWA.md) |

## Travaux préparatoires terminés

- [x] Cartographier l'architecture Express, Socket.IO, PWA et persistance.
- [x] Établir la roadmap globale du projet.
- [x] Séparer la roadmap PWA/TLS et documenter les modes de déploiement.
- [x] Recenser les limites HTTPS, WSS, WebRTC et Local Network Access.
- [x] Établir une baseline de tests : 196 tests unitaires et 18 tests navigateur.
- [x] Réaliser un premier audit des dépendances de production.

## Lot A — Stabilisation et sécurité

### SEC-001 — Sécuriser l'adresse cliente

- [x] Écrire un test démontrant qu'un client peut falsifier
  `X-Forwarded-For: 127.0.0.1` dans l'implémentation actuelle.
- [x] Supprimer la lecture directe de `X-Forwarded-For` dans les guards HTTP et
  Socket.IO.
- [x] Définir une configuration explicite des proxies de confiance.
- [x] Utiliser une source unique pour résoudre l'adresse cliente.
- [x] Tester les connexions directes, proxifiées, IPv4 et IPv6.
- [x] Vérifier qu'un en-tête falsifié ne contourne plus l'authentification.
- [x] Documenter la configuration derrière proxy.

**Terminé lorsque :** les tests échouent avant le correctif, réussissent après,
et aucun client direct ne peut se présenter comme localhost.

### SEC-002 — Centraliser l'orchestration de sécurité

- [x] Définir un contexte de sécurité commun à HTTP et Socket.IO.
- [x] Introduire un service de sécurité servant de façade d'orchestration.
- [x] Lui confier la résolution des informations clientes, l'authentification et
  la construction des décisions utilisées par les guards.
- [x] Conserver les fonctions réseau pures et les gestionnaires de jetons dans
  des composants spécialisés réutilisables.
- [x] Retourner des décisions structurées avec motif de refus et identifiant de
  corrélation, sans exposer de secret.
- [x] Réduire les guards HTTP et Socket.IO à l'adaptation de leur transport.
- [x] Ajouter des tests de parité entre les décisions HTTP et Socket.IO.
- [x] Préparer les points d'extension pour les sessions d'appareil, les rôles,
  WebRTC et la journalisation des événements de sécurité.

**Terminé lorsque :** HTTP et Socket.IO construisent le même contexte client et
obtiennent leurs décisions d'authentification du service partagé, tandis que la
cryptographie, les jetons et la résolution réseau restent des composants
spécialisés testables indépendamment.

### SEC-003 — Garantir un secret de session sûr

- [x] Définir le comportement attendu en développement, test et production.
- [x] Refuser le démarrage en production avec le secret `change-me` ou une
  valeur de moins de 64 caractères.
- [x] Générer un secret fort pendant l'installation initiale Linux et Windows.
- [x] Éviter toute impression du secret dans les logs ou diagnostics.
- [x] Ajouter les tests de configuration et vérifier les installateurs.
- [x] Documenter la rotation du secret et son impact sur les sessions.

**Terminé lorsque :** une installation neuve possède un secret unique et une
configuration de production faible ne peut pas démarrer silencieusement.

### SEC-004 — Mettre à jour les dépendances vulnérables

- [x] Sauvegarder le résultat de l'audit avant modification dans le compte rendu
  du lot.
- [x] Mettre à jour en priorité Engine.IO, Socket.IO parser et `ws`.
- [x] Traiter séparément les mises à jour nécessitant une rupture majeure.
- [x] Exécuter les tests unitaires et navigateur après chaque groupe de mises à
  jour.
- [x] Vérifier les régressions Socket.IO et Samsung TV avec les tests du projet.
- [x] Confirmer l'absence de vulnérabilité élevée de production.

**Terminé lorsque :** l'audit de production ne contient plus d'alerte élevée et
les transports existants restent fonctionnels.

#### SEC-004 — Baseline d'audit (2026-09-24)

Commande : `npm audit --omit=dev --json` avant mise à jour.

| Sévérité | Nombre |
| --- | ---: |
| Élevée | 3 |
| Modérée | 4 |
| Faible | 1 |
| Critique | 0 |

Dépendances signalées : `engine.io` (DoS polling et WebTransport SID),
`socket.io-parser` (épuisement mémoire), `ws` (DoS et divulgation mémoire),
`qs` (DoS), `body-parser` (DoS avec limite invalide), `socket.io-adapter`,
`node-notifier` et sa dépendance `uuid`. L'audit npm indique des corrections
sans rupture pour la chaîne Socket.IO, `ws`, `qs` et `body-parser`. Pour
`node-notifier`, npm propose `6.0.0`, un changement majeur à examiner
séparément.

#### SEC-004 — Résultat après mise à jour

`npm audit fix --omit=dev` a mis à jour `engine.io` (6.6.6 → 6.6.11),
`socket.io-parser` (4.2.6 → 4.2.7), `socket.io-adapter` (2.5.6 → 2.5.8),
`ws` (8.18.3/8.20.0 → 8.21.3) et `body-parser` (1.20.4 → 1.20.8). Une
surcharge limitée à Express met `qs` à 6.16.0, version corrigée. La version
directe de Socket.IO (4.8.3) et les plages de dépendances applicatives restent
compatibles.

Audit final `npm audit --omit=dev` : aucune vulnérabilité élevée ou critique;
2 alertes modérées subsistent sur `uuid` via `node-notifier@10.0.1`. npm ne
propose de les supprimer qu'en rétrogradant `node-notifier` vers 6.0.0. Cette
rupture n'a pas été appliquée : le notifier n'appelle que `uuid.v4()` sans
buffer, alors que l'avis porte sur les API v3/v5/v6 avec buffer. Les tests
unitaires et navigateur passent (216 tests unitaires, 18 tests navigateur);
les scénarios Samsung sont simulés et ne remplacent pas une vérification sur
téléviseur physique.

### SEC-005 — Séparer association et session

- [x] Définir le cycle de vie du jeton d'association.
- [x] Définir le modèle d'une session d'appareil.
- [x] Ne plus utiliser directement le jeton QR comme session longue durée.
- [x] Ajouter expiration, révocation et dernière activité.
- [x] Refuser les anciens cookies d'association et exiger un nouveau jumelage.
- [x] Ajouter les tests DAO, service, HTTP et Socket.IO.

**Terminé lorsque :** un jeton QR est temporaire, chaque appareil possède une
session révocable et la rotation d'un jeton ne produit pas d'accès imprévisible.

Les nouvelles associations créent un secret de session indépendant, stocké sous
forme de SHA-256 et expirant avec le cookie. Le jeton QR ne sert qu'à créer une
session et n'est jamais accepté comme cookie : après cette mise à jour, les
appareils déjà jumelés devront rescanner le QR une fois. Les sessions peuvent
être révoquées individuellement via `DELETE /api/sessions/current`; la
révocation d'autres appareils attend SEC-008, qui ajoutera la gestion des
appareils associés et leur révocation par un administrateur.

Vérification : 225 tests unitaires (61 suites) et 18 tests navigateur passent.
Le test de flux confirme qu'un jeton d'association produit un cookie indépendant
utilisable sur HTTP et Socket.IO, que l'ancien jeton est refusé comme cookie et
que la révocation rend la session immédiatement invalide.

### SEC-006 — Introduire les rôles d'accès

- [x] Définir les permissions `controller` et `admin`.
- [x] Centraliser l'autorisation dans un service partagé.
- [x] Appliquer les permissions aux routes HTTP.
- [x] Appliquer les mêmes permissions aux événements Socket.IO.
- [x] Exposer un contrat d'autorisation réutilisable par WebRTC.
- [x] Tester les refus d'actions administratives.

**Terminé lorsque :** une session `controller` ne peut modifier la
configuration, redémarrer le service ou installer une mise à jour. Les sessions
jumelées sont `controller`; les clients loopback sont `admin`. L'élévation d'un
appareil distant n'est pas encore exposée.

Vérification : 232 tests unitaires et 18 tests navigateur passent.

### SEC-007 — Limiter et valider les entrées

- [x] Définir les limites des corps HTTP.
- [x] Définir les limites des messages Socket.IO.
- [x] Ajouter une limitation de débit aux opérations sensibles.
- [x] Valider `Origin` pour HTTP et Socket.IO.
- [x] Ajouter une protection CSRF adaptée aux écritures HTTP.
- [x] Vérifier que les erreurs ne divulguent aucun secret.
- [x] Ajouter les tests de dépassement et de refus.

**Terminé lorsque :** les entrées surdimensionnées, trop fréquentes ou issues
d'une origine non autorisée sont rejetées proprement.

Limites appliquées : 32 Kio par corps JSON HTTP, 16 Kio par paquet Socket.IO
(avec un plafond Engine.IO de 64 Kio), 10 associations/minute par IP, 60
écritures HTTP/minute et 15 événements admin Socket.IO/minute par session.
`ALLOWED_ORIGINS` accepte des origines exactes séparées par des virgules; les
requêtes même origine sont permises par défaut. Cette liste ne modifie pas encore
la politique `SameSite` du cookie; l'authentification d'une PWA réellement
cross-site reste dans le lot PWA.

Vérification : 247 tests unitaires et 22 tests navigateur passent. `npm audit
--omit=dev` signale deux vulnérabilités modérées de `uuid`, transitive via
`node-notifier`; aucune vulnérabilité élevée de production n'est signalée.

### SEC-008 — Gérer les appareils associés

- [ ] Lister les sessions d'appareils pour un administrateur.
- [ ] Révoquer une session ou toutes les sessions depuis l'API.
- [ ] Afficher le nom, le rôle, la dernière activité et l'état de chaque appareil.
- [ ] Journaliser localement les associations et révocations.

## Lot B — Socle modulaire

- [ ] `ARCH-001` — Définir un dispatcher de commandes partagé.
- [ ] `ARCH-002` — Extraire la logique métier des handlers Socket.IO.
- [ ] `ARCH-003` — Définir un protocole client/serveur versionné.
- [ ] `ARCH-004` — Introduire un contrat de transport côté client.
- [ ] `ARCH-005` — Adapter Socket.IO au nouveau contrat sans régression.
- [ ] `ARCH-006` — Ajouter des tests de contrat de transport.
- [ ] `ARCH-007` — Séparer `LISTEN_HOST`, `PUBLIC_BASE_URL` et proxies fiables.

## Lot C — Expérience et plateformes

- [ ] `UX-001` — Afficher les appareils associés et leur dernière activité.
- [ ] `UX-002` — Ajouter révocation et réassociation depuis l'interface.
- [ ] `UX-003` — Améliorer les diagnostics de connexion.
- [ ] `UX-004` — Ajouter la sélection multi-écrans.
- [ ] `UX-005` — Ajouter des profils de contrôle.
- [ ] `PLAT-001` — Consolider l'installation Linux.
- [ ] `PLAT-002` — Consolider l'installation Windows.
- [ ] `PLAT-003` — Créer le parcours d'installation macOS.
- [ ] `PLAT-004` — Prototyper une stratégie Wayland.

## Lot D — PWA multi-déploiement

- [ ] `PWA-001` — Produire un artefact PWA statique indépendant.
- [ ] `PWA-002` — Ajouter le transport WebRTC optionnel.
- [ ] `PWA-003` — Créer la signalisation WebRTC chiffrée.
- [ ] `PWA-004` — Déployer le service PWA gratuit.
- [ ] `PWA-005` — Publier le paquet WebRTC auto-hébergeable.
- [ ] `PWA-006` — Publier l'exemple VPS avec proxy VPN.
- [ ] `PWA-007` — Prototyper le relais custom par reverse WebSocket.
- [ ] `PWA-008` — Documenter HTTPS/WSS local avec certificat reconnu.
- [ ] `PWA-009` — Tester l'installation sur Android, iOS et desktop.

Les critères détaillés de ces tâches sont définis dans
[ROADMAP-PWA.md](./ROADMAP-PWA.md).

## Vérifications obligatoires avant de cocher une tâche

- [ ] Le périmètre et les critères d'acceptation sont satisfaits.
- [ ] Un test de non-régression spécifique existe pour chaque bug corrigé.
- [ ] Les tests unitaires passent.
- [ ] Les tests navigateur passent lorsque le frontend ou le transport change.
- [ ] `git diff --check` ne signale aucune erreur.
- [ ] Aucun secret ou payload sensible n'apparaît dans les logs.
- [ ] La documentation et les exemples de configuration sont à jour.
- [ ] Les modes de déploiement existants restent compatibles.
- [ ] Les changements de protocole sont versionnés.
- [ ] Les risques ou limites restantes sont consignés.

## Definition of Done du lot actif

- [ ] Toutes les tâches obligatoires du lot sont terminées.
- [ ] Les tests complets passent dans un environnement propre.
- [ ] La couverture des zones critiques modifiées n'a pas diminué.
- [ ] L'audit des dépendances a été revu.
- [ ] Les installations concernées ont été testées.
- [ ] Le changelog ou les notes de release sont prêts.
- [ ] La roadmap globale reflète les décisions prises.
- [ ] Les tâches non terminées ont été déplacées vers le lot approprié.
- [ ] Le lot a reçu une version et un commit identifiables.

## Blocages et décisions

| Date | Élément | Statut | Décision ou action attendue |
| --- | --- | --- | --- |
| — | Aucun blocage actif | — | — |

## Journal des lots terminés

| Lot | Date | Version | Résultat |
| --- | --- | --- | --- |
| — | — | — | Aucun lot clôturé |

---

Mettre ce fichier à jour dans le même changement que la tâche terminée afin que
les cases cochées correspondent toujours à l'état réel du dépôt.
