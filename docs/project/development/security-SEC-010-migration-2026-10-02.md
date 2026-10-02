# Sécurité — migration vers SEC-010 — 2026-10-02
État: terminé

## Objectif et critères d'acceptation

Documenter une procédure de mise à niveau utilisable par les installations de
la version précédente, avant que le déverrouillage administrateur mobile soit
disponible.

## Décisions et raisons

La procédure utilise directement `npm update -g` puis le redémarrage du service.
Elle préserve la configuration et la base existantes et évite de demander à
l'utilisateur de réexécuter l'installateur.

## Modifications apportées

- Ajout au README des commandes de mise à niveau du paquet global et du service.
- Ajout des étapes d'activation du mot de passe après mise à niveau.
- Ajout d'avertissements contre l'écrasement de la configuration et sur les
  permissions du préfixe npm global.

## Vérifications et résultats

- Les noms du paquet et des commandes correspondent à `package.json` et à la
  commande CLI de service existante.
- `git diff --check` réussit.

## Blocages / risques / suite

Cette procédure initiale exige un terminal local ou SSH. Les mises à jour
suivantes peuvent être lancées depuis le mobile après déverrouillage.
