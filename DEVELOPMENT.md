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

## État courant

| Élément | Valeur |
| --- | --- |
| Lot actif | A — Stabilisation et sécurité |
| Statut | En cours |
| Prochaine tâche | `SEC-002` — Centraliser l'orchestration de sécurité |
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

### SEC-002 — Centraliser l'orchestration de sécurité ➡️

- [ ] Définir un contexte de sécurité commun à HTTP et Socket.IO.
- [ ] Introduire un service de sécurité servant de façade d'orchestration.
- [ ] Lui confier la résolution des informations clientes, l'authentification et
  la construction des décisions utilisées par les guards.
- [ ] Conserver les fonctions réseau pures et les gestionnaires de jetons dans
  des composants spécialisés réutilisables.
- [ ] Retourner des décisions structurées avec motif de refus et identifiant de
  corrélation, sans exposer de secret.
- [ ] Réduire les guards HTTP et Socket.IO à l'adaptation de leur transport.
- [ ] Ajouter des tests de parité entre les décisions HTTP et Socket.IO.
- [ ] Préparer les points d'extension pour les sessions d'appareil, les rôles,
  WebRTC et la journalisation des événements de sécurité.

**Terminé lorsque :** HTTP et Socket.IO construisent le même contexte client et
obtiennent leurs décisions d'authentification du service partagé, tandis que la
cryptographie, les jetons et la résolution réseau restent des composants
spécialisés testables indépendamment.

### SEC-003 — Garantir un secret de session sûr

- [ ] Définir le comportement attendu en développement, test et production.
- [ ] Refuser le démarrage en production avec le secret `change-me`.
- [ ] Générer un secret fort pendant l'installation initiale.
- [ ] Éviter toute impression du secret dans les logs ou diagnostics.
- [ ] Ajouter les tests de configuration et d'installation.
- [ ] Documenter la rotation du secret et son impact sur les sessions.

**Terminé lorsque :** une installation neuve possède un secret unique et une
configuration de production faible ne peut pas démarrer silencieusement.

### SEC-004 — Mettre à jour les dépendances vulnérables

- [ ] Sauvegarder le résultat de l'audit avant modification dans le compte rendu
  du lot.
- [ ] Mettre à jour en priorité Engine.IO, Socket.IO parser et `ws`.
- [ ] Traiter séparément les mises à jour nécessitant une rupture majeure.
- [ ] Exécuter les tests unitaires et navigateur après chaque groupe de mises à
  jour.
- [ ] Vérifier les connexions Socket.IO et Samsung TV.
- [ ] Confirmer l'absence de vulnérabilité élevée de production.

**Terminé lorsque :** l'audit de production ne contient plus d'alerte élevée et
les transports existants restent fonctionnels.

### SEC-005 — Séparer association et session

- [ ] Définir le cycle de vie du jeton d'association.
- [ ] Définir le modèle d'une session d'appareil.
- [ ] Ne plus utiliser directement le jeton QR comme session longue durée.
- [ ] Ajouter expiration, révocation et dernière activité.
- [ ] Prévoir une migration compatible avec les sessions existantes.
- [ ] Ajouter les tests DAO, service, HTTP et Socket.IO.

**Terminé lorsque :** un jeton QR est temporaire, chaque appareil possède une
session révocable et la rotation d'un jeton ne produit pas d'accès imprévisible.

### SEC-006 — Introduire les rôles d'accès

- [ ] Définir les permissions `controller` et `admin`.
- [ ] Centraliser l'autorisation dans un service partagé.
- [ ] Appliquer les permissions aux routes HTTP.
- [ ] Appliquer les mêmes permissions aux événements Socket.IO.
- [ ] Prévoir leur réutilisation par WebRTC.
- [ ] Tester tous les refus d'actions administratives.

**Terminé lorsque :** une session `controller` ne peut modifier la
configuration, redémarrer le service ou installer une mise à jour.

### SEC-007 — Limiter et valider les entrées

- [ ] Définir les limites des corps HTTP.
- [ ] Définir les limites des messages Socket.IO.
- [ ] Ajouter une limitation de débit aux opérations sensibles.
- [ ] Valider `Origin` pour HTTP et Socket.IO.
- [ ] Ajouter une protection CSRF adaptée aux écritures HTTP.
- [ ] Vérifier que les erreurs ne divulguent aucun secret.
- [ ] Ajouter les tests de dépassement et de refus.

**Terminé lorsque :** les entrées surdimensionnées, trop fréquentes ou issues
d'une origine non autorisée sont rejetées proprement.

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
