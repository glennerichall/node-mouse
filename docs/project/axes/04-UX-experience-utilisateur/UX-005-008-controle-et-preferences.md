# UX-005-008 — Contrôle et préférences

Ce document regroupe les éléments liés à ce domaine. Les identifiants internes conservent la traçabilité du plan de travail.

## UX-006 — permettre à chaque client de régler localement la vitesse

  l'accélération du pointeur sur son appareil, indépendamment du système du
  serveur; persister les préférences dans le navigateur, offrir des valeurs par
  défaut utilisables et une remise à zéro, appliquer vitesse et courbe avant
  l'envoi des deltas, puis signaler au serveur les deltas déjà ajustés afin
  d'éviter un second multiplicateur tout en conservant la compatibilité avec les
  anciens clients utilisant `input.mouseSpeed`.

## UX-006a — contenir tout le panneau latéral dans sa largeur utile, aligner

  à gauche la case d'accélération et borner la pression des mouvements souris
  côté serveur en fusionnant les deltas en attente sans exécutions concurrentes.

## UX-006b — adapter verticalement les contrôles du panneau latéral

  hauteur disponible afin que son contenu complet reste dans le viewport.

## UX-006c — signaler visuellement l'élévation administrative

  bordure orangée sur la commande de déverrouillage et, une fois déverrouillées,
  sur les seules actions qui dépendent du rôle administrateur.

## UX-006d — rendre la courbe de sensibilité du pointeur réglable avec deux

  curseurs persistés localement, pour la vitesse lente et la vitesse rapide;
  interpoler entre les deux de façon bornée, utiliser la vitesse lente lorsque
  l'accélération est désactivée et inclure ces valeurs dans la remise à zéro.

## UX-006e — augmenter à 20 la borne maximale de la vitesse rapide locale

  afin de couvrir les hôtes nécessitant un gain tactile supérieur à 8, sans
  modifier la valeur par défaut ni la borne de la vitesse lente.

## UX-006f — appliquer effectivement la borne de gain rapide à 20

  courbe de déplacement tactile et protéger ce contrat par un test unitaire.

## UX-007 — nommer explicitement la commande d'affichage du QR comme

  bascule et traduire son libellé et son intitulé accessible dans toutes les
  langues prises en charge.

## UX-008 — appliquer aux boutons de raccourcis clavier du bas le même

  auto-masquage visuel que les remotes pendant un mouvement de souris; rétablir
  leur opacité à la fin de l'interaction ou dès que l'option est désactivée.
