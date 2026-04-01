# AGENTS.md

## Mission
Tu travailles dans une application Node.js / Express / Socket.IO avec frontend web JavaScript.
Tu dois produire du code maintenable, cohérent avec l'existant, et éviter la duplication.

## Règles de travail obligatoires

### 1. Observer avant d’écrire
Avant toute modification :
- inspecter l’arborescence du projet ;
- identifier les patterns déjà utilisés ;
- repérer les middlewares, services, validateurs, utilitaires et conventions de nommage existants ;
- vérifier si une fonctionnalité proche existe déjà ;
- réutiliser l’existant avant de créer un nouveau module.

Ne crée jamais un nouveau helper, service, middleware, hook, utilitaire ou wrapper si l’équivalent existe déjà.

### 2. Respecter l’architecture Express
Toujours aligner le code avec une séparation claire :
- `routes/` : définition des endpoints et composition des middlewares ;
- `controllers/` : adaptation HTTP, lecture req/res ;
- `services/` : logique métier ;
- `repositories/` ou `data/` : accès aux données ;
- `middlewares/` : auth, validation, erreurs, logging ;
- `validators/` ou schémas : validation des entrées ;
- `sockets/` : événements temps réel, rooms, handshake, auth socket.

Éviter la logique métier directement dans les routeurs.
Éviter la validation inline si le projet utilise déjà une couche dédiée.

### 3. REST d’abord
Pour une ressource HTTP :
- utiliser les noms de ressources au pluriel ;
- utiliser les bons verbes HTTP ;
- séparer clairement collection et item ;
- respecter l’idempotence ;
- renvoyer des codes HTTP cohérents ;
- éviter les routes RPC déguisées en REST si une ressource métier peut être modélisée proprement.

Exemples attendus :
- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`

Éviter :
- `POST /getUsers`
- `POST /deleteUser`
- `GET /createUser`

### 4. Middleware et chaînage
Privilégier le pipeline Express :
- auth
- autorisation
- validation
- contrôleur
- gestion d’erreur centralisée

Éviter les duplications de logique cross-cutting dans les contrôleurs.

### 5. Socket.IO
Pour le temps réel :
- garder les événements cohérents et nommés clairement ;
- séparer la logique socket de la logique métier ;
- faire porter la logique métier par des services partagés quand possible entre REST et socket ;
- éviter de dupliquer la même logique dans les handlers HTTP et Socket.IO ;
- utiliser rooms, namespaces et middleware socket seulement si le besoin est réel.

### 6. Dépendances et frameworks
Avant d’introduire une nouvelle lib ou un framework :
- vérifier si le besoin est déjà couvert dans le projet ;
- comparer avec les dépendances déjà installées ;
- évaluer la maturité, la maintenance, la compatibilité, la taille, le lock-in, l’ergonomie et le coût d’intégration ;
- proposer un mini arbitrage “conserver / intégrer / refuser” .

Ne pas ajouter de dépendance de production sans justification explicite.

### 7. Qualité du code
- Favoriser des fonctions petites, lisibles et testables.
- Nommer clairement les modules selon leur responsabilité.
- Préférer la composition à la duplication.
- Préférer l'utilisation de patrons orientés objet à la duplication.
- Proposer une architecture d'abstraction pour établir un contrat clair et réutilisable.
- Supprimer ou factoriser le code mort ou redondant lorsque c’est sûr.
- Préserver la compatibilité avec le style du repo.
- Élaborer des tests unitaires exhaustifs pour le code modifié/ajouté.

### 8. Sortie attendue
Avant de conclure :
- expliquer brièvement ce qui existait déjà et ce qui a été réutilisé ;
- signaler explicitement les duplications évitées ;
- lister les fichiers créés/modifiés ;
- proposer les tests pertinents ;
- vérifier lint/tests/typecheck si disponibles.

## Definition of done
Le travail est terminé seulement si :
- le code respecte la structure du projet ;
- aucune duplication évidente n’a été introduite ;
- les endpoints REST sont correctement modélisés ;
- les middlewares sont à la bonne place ;
- l’intégration socket ne duplique pas la logique métier ;
- les vérifications disponibles ont été lancées ou leur absence a été signalée ;
- les tests unitaires passent avec succès.