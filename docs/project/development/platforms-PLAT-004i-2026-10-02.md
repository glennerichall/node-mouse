# Plateformes — PLAT-004i — 2026-10-02
État: terminé

## Objectif et critères d'acceptation

- Le QR complet, y compris sa marge silencieuse inférieure, reste visible dans
  une fenêtre YAD ayant la taille configurée.
- La taille et la position extérieures de l'overlay ne changent pas.
- Un test unitaire échoue avec le mode d'affichage précédent et protège le mode
  d'ajustement retenu.

## Décisions et raisons

Le mode `orig` impose les dimensions du PNG à la zone intérieure, alors que la
taille YAD configure la fenêtre extérieure. Le widget GTK dispose donc de moins
de hauteur et rogne le bas. Le mode YAD `fit` adapte le PNG à l'espace intérieur
sans modifier la géométrie de la fenêtre ni le calcul de survol.

## Modifications apportées

- Remplacement de `--size=orig` par `--size=fit` dans les arguments YAD.
- Ajout d'une assertion spécifique interdisant le retour au mode `orig`.
- Passage de version correctif de `6.13.0` à `6.13.1`.

## Vérifications et résultats

- Le test ciblé échoue avec `--size=orig`, puis réussit avec `--size=fit`.
- L'overlay corrigé a été lancé pendant cinq secondes sous GNOME Wayland via
  XWayland sans erreur de processus.
- `npm test`: 81 suites et 289 tests réussis.

## Blocages / risques / suite

Aucun blocage identifié.
