# 09 — CODE — Qualité et uniformité du code

**État:** à jour; CODE-001 à CODE-008 terminées.

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

## Convention retenue pour la passe CODE

- `server/` utilise quatre espaces; `client/` et `scripts/` utilisent deux
  espaces; `test/` conserve quatre espaces pour les suites Jest existantes.
- Les imports externes précèdent les imports internes; les imports internes
  restent regroupés par domaine.
- Les modules exportent directement leurs fonctions publiques; les routeurs
  exportent une instance montée et délèguent le métier à des handlers nommés.
- Les déclarations de route sont chaînées et limitées au verbe, au chemin et
  aux middlewares; les réponses et les erreurs restent dans les handlers.
- Les fichiers JavaScript ne contiennent pas d'espaces finaux; les
  vérifications automatisées doivent être déterministes et sans formatage
  implicite.

## Plan de travail

- [x] **CODE-001 — Audit de qualité et d'uniformité:** inventorier les styles
  utilisés dans `server/`, `client/`, `scripts/` et `test/`; relever les
  divergences de structure, nommage, imports/exports, indentation, gestion
  d'erreurs et composition; produire une convention courte, des occurrences
  mesurées et un ordre de correction par risque.
- [x] **CODE-002 — Routeurs Express:** adopter une forme canonique dans tous les
  routeurs : handlers nommés et exportés, puis déclaration chaînée du routeur
  limitée aux verbes, chemins et middlewares. Commencer par
  `admin-subs.router.js`, qui mélange actuellement routeur déclaré séparément,
  handlers anonymes et indentation non structurelle; préserver exactement ses
  contrats HTTP/SSE et ajouter des tests directs des handlers.
- [x] **CODE-003 — Modules et nommage:** uniformiser l'ordre des imports, les
  exports, les noms de fabriques/services et les conventions de fichiers après
  validation de la règle dans CODE-001.
- [x] **CODE-004 — Style JavaScript:** uniformiser indentation, accolades,
  ponctuation, retours anticipés et fonctions asynchrones sans mélanger ces
  changements à des modifications fonctionnelles.
- [x] **CODE-005 — Automatisation:** évaluer puis configurer le minimum utile de
  lint et formatage; limiter les règles aux conventions décidées et intégrer la
  vérification à la CI sans reformater silencieusement le dépôt.
- [x] **CODE-006 — Prévention progressive:** appliquer les règles aux fichiers
  modifiés et aux nouveaux fichiers, puis résorber la dette existante par lots
  identifiés et testés.
- [x] **CODE-007 — Retrait du vérificateur de style maison:** retirer
  `scripts/check-code-style.mjs` et son branchement npm; le contrôle de style
  générique ne fait pas partie des vérifications nécessaires au fonctionnement
  ni aux tests métier du produit.
- [x] **CODE-008 — Nettoyage des scripts de dépôt:** inventorier les fichiers
  de `scripts/` et les commandes npm; supprimer les alias réellement redondants,
  retirer les scripts sans appel actif démontré et clarifier les noms qui ne
  décrivent plus leur rôle, sans casser les points d'entrée documentés.

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
