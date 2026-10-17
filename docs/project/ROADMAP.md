# Roadmap globale de Remote Mouse

Cette roadmap ordonne les domaines du projet. Elle ne contient aucune tâche :
les cases à cocher, critères d'acceptation et identifiants d'itération se
trouvent exclusivement dans le document de l'axe propriétaire.

La [vision](./VISION.md) fixe l'intention durable du projet. Les
[journaux de développement](./development/README.md) conservent uniquement
l'historique des itérations réalisées.

## Axes

L'ordinal du fichier donne à chaque axe une place structurelle stable. La
priorité courante est exprimée par l'ordre de ce tableau et peut changer sans
entraîner de renommage.

| Priorité | Axe | Résultat visé | État actuel |
| ---: | --- | --- | --- |
| 1 | [05 — PLAT — Plateformes](./axes/05-PLAT-plateformes/index.md) | Contrôle fiable sur les systèmes officiellement pris en charge | En cours — installation Linux et Wayland; volet VM suspendu |
| 2 | [04 — UX — Expérience utilisateur](./axes/04-UX-experience-utilisateur/index.md) | Association, contrôle et diagnostic compréhensibles | En cours — UX-004 en attente; UX-005 non démarrée |
| 3 | [07 — OPS — Exploitation](./axes/07-OPS-exploitation/index.md) | Installation, mise à jour et diagnostic récupérables | À jour — OPS-014 terminée |
| 4 | [01 — SEC — Sécurité](./axes/01-SEC-securite/index.md) | Accès authentifiés, autorisations cohérentes et révocables | À jour — SEC-011 terminée |
| 5 | [02 — ARCH — Architecture](./axes/02-ARCH-architecture-modulaire/index.md) | Services métier indépendants des transports et adaptateurs | ARCH-046 terminée |
| 6 | [03 — REL — Fiabilité](./axes/03-REL-fiabilite/index.md) | Commandes et prévisualisation prévisibles sous charge | En cours — REL-007 terminée |
| 7 | [06 — PWA — Application web](./axes/06-PWA-application-web/index.md) | Installation web et transports optionnels sécurisés | Planifié |
| 8 | [09 — CODE — Qualité du code](./axes/09-CODE-qualite-et-uniformite/index.md) | Style cohérent, conventions explicites et dette mesurée | À jour — CODE-010 terminée |
| 9 | [08 — QUA — Qualité, tests et livraison](./axes/08-QUA-qualite/index.md) | Changements vérifiés et versions reproductibles | QUA-007 centralise le laboratoire et les validations |
| 99 | [BACK — Backlog transversal](./axes/99-BACK-backlog-transversal/index.md) | Idées à promouvoir dans un axe avant implantation | Exploration |

## Ordre de livraison actuel

Les travaux impliquant une VM (création, provisionnement, démarrage, déploiement
ou validation) sont reportés jusqu'à indication contraire de l'utilisateur.
Les tâches correspondantes restent dans leurs axes comme contexte, mais ne font
pas partie de l'ordre actif.

1. Poursuivre les travaux PLAT non liés aux VM : installation Linux et
   intégration Wayland/XWayland, avec validation sur systèmes disponibles sans
   créer ni démarrer de VM.
2. Reprendre les éléments restants d'installation récupérable et de diagnostic
   de l'axe `OPS`.
3. Continuer les itérations UX qui servent le scénario HTPC à écran unique,
   notamment `UX-005`; `UX-004` et ses sous-itérations restent en attente
   jusqu'à ce que le multi-écran devienne un besoin prioritaire, puis traiter
   les travaux `REL` dont les seuils et critères sont définis dans leur axe.
4. Traiter les autres axes selon leur ordre et leur état dans ce document.

Cet ordre n'est pas une seconde liste de tâches. Les documents d'axes restent
les seules sources de vérité sur le contenu et l'avancement des itérations.

## Principes directeurs

1. Préserver le fonctionnement local sans imposer un service Internet.
2. Sécuriser avant toute exposition distante.
3. Séparer la logique métier des transports et des intégrations système.
4. Préférer des composants optionnels et interchangeables.
5. Mesurer avant d'optimiser et tester les plateformes réellement supportées.

## Definition of Done commune

Une évolution est terminée lorsque les critères inscrits dans son axe sont
satisfaits, que les tests pertinents réussissent, que les limitations et
ruptures sont documentées et qu'un journal d'itération terminé conserve le
résultat, les décisions et les vérifications. Les secrets ne doivent être ni
persistés ni journalisés inutilement.

## Convention documentaire

```text
ROADMAP.md
  → axes/01-SEC-securite/index.md
      → SEC-010b
          → development/security-SEC-010b-AAAA-MM-JJ.md (après réalisation)
```

- La roadmap globale priorise les axes sans cases à cocher.
- Les répertoires d'axes contiennent un `index.md` de suivi et des détails
  spécialisés; les `index.md` sont les seuls documents avec des cases à cocher.
- Les journaux racontent les itérations réalisées et deviennent immuables une
  fois clôturés.
- Un plan spécialisé, comme Wayland, reprend l'ordinal et l'identifiant de son
  axe propriétaire :
  [PLAT-004-004v-wayland-capture-et-overlay.md](./axes/05-PLAT-plateformes/PLAT-004-004v-wayland-capture-et-overlay.md).
