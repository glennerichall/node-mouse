# Plateformes — abandon de PLAT-004k — 2026-10-04

État: abandonné

## Objectif et critères d'acceptation

Clore l'approche qui cherchait à rendre la vitesse et l'accélération comparables
entre X11 et Wayland au moyen d'une normalisation choisie par le serveur.

## Décisions et raisons

Le système d'exploitation ne permet pas de déduire la sensation souhaitée : le
navigateur, l'écran tactile, la densité, le compositeur et la préférence de la
personne influencent aussi le résultat. Une correction uinput propre à Wayland
aurait été arbitraire, aurait pu cumuler plusieurs accélérations et aurait rendu
le réglage serveur `input.mouseSpeed` ambigu.

La nouvelle orientation est `UX-006`. Chaque navigateur conserve localement ses
préférences de vitesse et d'accélération et produit les deltas ajustés. Le
serveur doit reconnaître ces nouveaux clients sans rompre les anciens, qui
continuent temporairement d'utiliser `input.mouseSpeed`.

## Modifications apportées

- Fermeture explicite de `PLAT-004k` comme tâche abandonnée.
- Ajout de `UX-006` dans l'axe expérience utilisateur.
- Priorisation de cette personnalisation dans la roadmap globale.

## Vérifications et résultats

- Aucun coefficient propre à Wayland ni changement udev n'est conservé.
- La séparation structurelle des périphériques existante est attribuée à
  `PLAT-004g2`, sans lui attribuer un gain de fluidité non démontré.

## Blocages / risques / suite

`UX-006` devra définir la plage des réglages et la compatibilité du message de
mouvement avant implantation. Un champ durable du protocole devra être rattaché
à `ARCH-003`.
