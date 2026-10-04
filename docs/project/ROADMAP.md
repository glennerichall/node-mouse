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
| 1 | [05 — PLAT — Plateformes](./axes/05-PLAT-plateformes.md) | Contrôle fiable sur les systèmes officiellement pris en charge | En cours — Wayland et installation Linux |
| 2 | [07 — OPS — Exploitation](./axes/07-OPS-exploitation.md) | Installation, mise à jour et diagnostic récupérables | En cours — journaux et messages techniques |
| 3 | [01 — SEC — Sécurité](./axes/01-SEC-securite.md) | Accès authentifiés, autorisations cohérentes et révocables | À jour — SEC-011 terminée |
| 4 | [02 — ARCH — Architecture](./axes/02-ARCH-architecture-modulaire.md) | Services métier indépendants des transports et adaptateurs | Planifié — frontière de l'overlay QR |
| 5 | [03 — REL — Fiabilité](./axes/03-REL-fiabilite.md) | Commandes et prévisualisation prévisibles sous charge | Planifié |
| 6 | [04 — UX — Expérience utilisateur](./axes/04-UX-experience-utilisateur.md) | Association, contrôle et diagnostic compréhensibles | Planifié |
| 7 | [06 — PWA — Application web](./axes/06-PWA-application-web.md) | Installation web et transports optionnels sécurisés | Planifié |
| 8 | [09 — CODE — Qualité du code](./axes/09-CODE-qualite-et-uniformite.md) | Style cohérent, conventions explicites et dette mesurée | Planifié — CODE-001 |
| 9 | [08 — QUA — Qualité](./axes/08-QUA-qualite.md) | Changements vérifiés et versions reproductibles | Continu |
| 99 | [BACK — Backlog transversal](./axes/99-BACK-backlog-transversal.md) | Idées à promouvoir dans un axe avant implantation | Exploration |

## Ordre de livraison actuel

1. Stabiliser l'entrée Wayland et l'installation Linux dans l'axe `PLAT`.
2. Améliorer la consultation des journaux et uniformiser leurs messages dans
   l'axe `OPS`.
3. Auditer la qualité et l'uniformité du style dans `CODE-001`, puis normaliser
   les routeurs Express sans changement fonctionnel.
4. Reprendre ensuite les travaux structurants des axes `ARCH`, `REL` et `UX`.

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
  → axes/01-SEC-securite.md
      → SEC-010b
          → development/security-SEC-010b-AAAA-MM-JJ.md (après réalisation)
```

- La roadmap globale priorise les axes sans cases à cocher.
- Les axes définissent les tâches et sont les seuls documents avec des cases à
  cocher.
- Les journaux racontent les itérations réalisées et deviennent immuables une
  fois clôturés.
- Un plan spécialisé, comme Wayland, reprend l'ordinal et l'identifiant de son
  axe propriétaire :
  [05-PLAT-004-wayland.md](./axes/05-PLAT-004-wayland.md).
