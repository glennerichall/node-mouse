# 09 — CODE — Qualité et uniformité du code

**État:** planifié; prochaine tâche: CODE-001.

## Résultat visé

Rendre le code prévisible à lire et à modifier en appliquant des conventions
explicites et vérifiables. Les refactorisations doivent rester progressives,
préserver les contrats fonctionnels et être accompagnées des tests pertinents.

Cet axe porte la qualité interne du code. L'axe `QUA` reste responsable des
tests transversaux, de la CI et des releases; l'axe `ARCH` reste responsable du
découpage des responsabilités et des contrats entre composants.

## Principes

- Mesurer les écarts avant de choisir ou d'automatiser une convention.
- Retenir une forme canonique par construction équivalente.
- Corriger les fichiers par lots cohérents et vérifiables, sans réécriture
  globale difficile à réviser.
- Distinguer les écarts purement stylistiques des problèmes d'architecture ou
  de comportement.
- Ajouter une règle automatisée seulement si elle est stable, comprise et
  applicable sans bruit excessif.

## Plan de travail

- [ ] **CODE-001 — Audit de qualité et d'uniformité:** inventorier les styles
  utilisés dans `server/`, `client/`, `scripts/` et `test/`; relever les
  divergences de structure, nommage, imports/exports, indentation, gestion
  d'erreurs et composition; produire une convention courte, des occurrences
  mesurées et un ordre de correction par risque.
- [ ] **CODE-002 — Routeurs Express:** adopter une forme canonique dans tous les
  routeurs : handlers nommés et exportés, puis déclaration chaînée du routeur
  limitée aux verbes, chemins et middlewares. Commencer par
  `admin-subs.router.js`, qui mélange actuellement routeur déclaré séparément,
  handlers anonymes et indentation non structurelle; préserver exactement ses
  contrats HTTP/SSE et ajouter des tests directs des handlers.
- [ ] **CODE-003 — Modules et nommage:** uniformiser l'ordre des imports, les
  exports, les noms de fabriques/services et les conventions de fichiers après
  validation de la règle dans CODE-001.
- [ ] **CODE-004 — Style JavaScript:** uniformiser indentation, accolades,
  ponctuation, retours anticipés et fonctions asynchrones sans mélanger ces
  changements à des modifications fonctionnelles.
- [ ] **CODE-005 — Automatisation:** évaluer puis configurer le minimum utile de
  lint et formatage; limiter les règles aux conventions décidées et intégrer la
  vérification à la CI sans reformater silencieusement le dépôt.
- [ ] **CODE-006 — Prévention progressive:** appliquer les règles aux fichiers
  modifiés et aux nouveaux fichiers, puis résorber la dette existante par lots
  identifiés et testés.

## Critères d'acceptation de l'axe

- Une convention courte décrit les formes canoniques avec des exemples du
  projet.
- Chaque divergence inventoriée appartient à une tâche identifiable et
  priorisée.
- Deux constructions équivalentes ne restent pas durablement sous plusieurs
  formes sans justification documentée.
- Les refactorisations de style ne modifient pas les contrats observables et
  les suites de tests concernées restent vertes.
- Les vérifications automatisées produisent des erreurs actionnables et peu de
  faux positifs.
