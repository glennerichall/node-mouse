# CODE — Routeurs et scripts

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## CODE-002 — Routeurs Express

**État:** Terminé.

  routeurs : handlers nommés et exportés, puis déclaration chaînée du routeur
  limitée aux verbes, chemins et middlewares. Commencer par
  `admin-subs.router.js`, qui mélange actuellement routeur déclaré séparément,
  handlers anonymes et indentation non structurelle; préserver exactement ses
  contrats HTTP/SSE et ajouter des tests directs des handlers.

## CODE-007 — Retrait du vérificateur de style maison

**État:** Terminé.

  `scripts/check-code-style.mjs` et son branchement npm; le contrôle de style
  générique ne fait pas partie des vérifications nécessaires au fonctionnement
  ni aux tests métier du produit.

## CODE-008 — Nettoyage des scripts de dépôt

**État:** Terminé.

  de `scripts/` et les commandes npm; supprimer les alias réellement redondants,
  retirer les scripts sans appel actif démontré et clarifier les noms qui ne
  décrivent plus leur rôle, sans casser les points d'entrée documentés.

## CODE-010 — Rétablir l'entrée de développement npm

**État:** Terminé.

  `npm run dev` comme commande explicite pour lancer le serveur depuis le dépôt,
  documenter son usage dans le parcours d'installation source et ajouter un
  test de manifeste qui protège cette commande contre une suppression
  involontaire. Garder `npm start` comme entrée de lancement standard.
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
