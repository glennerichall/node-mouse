# 04 — UX — Expérience utilisateur

## Résultat visé

Rendre l'association, le contrôle, le diagnostic et la personnalisation
compréhensibles sur mobile et desktop.

## Plan de travail

- [x] UX-001 — afficher les appareils associés, rôle et dernière activité.
- [x] UX-002 — compléter la liste d'appareils par la révocation individuelle
  d'une association et un accès direct au parcours QR pour réassocier un
  appareil. La liste UX-001 est intégrée à cette interface de gestion pour que
  les actions soient identifiables et compréhensibles.
- [x] UX-002a — permettre la révocation en lot de toutes les associations
  autres que celle de l'appareil courant; confirmer le nombre concerné, garder
  l'appareil courant connecté et déconnecter immédiatement les autres sessions
  révoquées.
- [x] UX-002b — ajouter au panneau latéral un bouton qui ouvre une page dédiée
  à la sécurité et aux appareils associés; ne pas afficher la liste dans le
  panneau latéral ni dans la page de configuration, et compacter les
  informations des appareils révoqués.
- [x] UX-003 — améliorer les diagnostics de connexion et afficher le transport.
- [ ] UX-004 — sélection multi-écrans.
- [ ] UX-005 — profils de contrôle.
- [x] UX-006 — permettre à chaque client de régler localement la vitesse et
  l'accélération du pointeur sur son appareil, indépendamment du système du
  serveur; persister les préférences dans le navigateur, offrir des valeurs par
  défaut utilisables et une remise à zéro, appliquer vitesse et courbe avant
  l'envoi des deltas, puis signaler au serveur les deltas déjà ajustés afin
  d'éviter un second multiplicateur tout en conservant la compatibilité avec les
  anciens clients utilisant `input.mouseSpeed`.
- [x] UX-006a — contenir tout le panneau latéral dans sa largeur utile, aligner
  à gauche la case d'accélération et borner la pression des mouvements souris
  côté serveur en fusionnant les deltas en attente sans exécutions concurrentes.
- [x] UX-006b — adapter verticalement les contrôles du panneau latéral à la
  hauteur disponible afin que son contenu complet reste dans le viewport.
- [x] UX-006c — signaler visuellement l'élévation administrative par une
  bordure orangée sur la commande de déverrouillage et, une fois déverrouillées,
  sur les seules actions qui dépendent du rôle administrateur.
- [x] UX-006d — rendre la courbe de sensibilité du pointeur réglable avec deux
  curseurs persistés localement, pour la vitesse lente et la vitesse rapide;
  interpoler entre les deux de façon bornée, utiliser la vitesse lente lorsque
  l'accélération est désactivée et inclure ces valeurs dans la remise à zéro.
- [x] UX-007 — nommer explicitement la commande d'affichage du QR comme une
  bascule et traduire son libellé et son intitulé accessible dans toutes les
  langues prises en charge.
- [ ] Ajouter retour haptique et commandes configurables.
- [ ] Tester navigation clavier, lecteurs d'écran, contrastes et traductions.

UX-001/002 dépendent de SEC-008, terminé : l'API admin fournit la liste des
sessions, leur rôle, leur état, leur dernière activité et la révocation
individuelle. L'interface ne doit jamais afficher de jeton ou d'empreinte.

UX-006 dépend du contrat de commandes existant. Si son indicateur de deltas
ajustés devient un champ durable du protocole, le documenter et le versionner
dans `ARCH-003` sans rendre la préférence dépendante du compte serveur.
