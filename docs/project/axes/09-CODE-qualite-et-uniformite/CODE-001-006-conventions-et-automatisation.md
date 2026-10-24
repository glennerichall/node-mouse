# CODE-001-006 — Conventions et automatisation

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## CODE-001 — Audit de qualité et d'uniformité

  utilisés dans `server/`, `client/`, `scripts/` et `test/`; relever les
  divergences de structure, nommage, imports/exports, indentation, gestion
  d'erreurs et composition; produire une convention courte, des occurrences
  mesurées et un ordre de correction par risque.

## CODE-003 — Modules et nommage

  exports, les noms de fabriques/services et les conventions de fichiers après
  validation de la règle dans CODE-001.

## CODE-004 — Style JavaScript

  ponctuation, retours anticipés et fonctions asynchrones sans mélanger ces
  changements à des modifications fonctionnelles.

## CODE-005 — Automatisation

  lint et formatage; limiter les règles aux conventions décidées et intégrer la
  vérification à la CI sans reformater silencieusement le dépôt.

## CODE-006 — Prévention progressive

  modifiés et aux nouveaux fichiers, puis résorber la dette existante par lots
  identifiés et testés.
