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
- [ ] UX-004 — sélection multi-écrans. **En attente** : le scénario central
  reste une télécommande souris pour HTPC à écran unique; ne pas engager cette
  extension tant que ce besoin ne devient pas prioritaire.
  - [ ] UX-004a — définir le contrat `screens[]` et les adaptateurs de
    détection par plateforme, avec repli explicite vers l'écran logique unique.
  - [ ] UX-004b — ajouter la sélection et la persistance locales de l'écran
    choisi dans l'interface du client.
  - [ ] UX-004c — appliquer l'écran choisi au pointeur, à l'aperçu et aux
    overlays, gérer la disparition d'un écran et couvrir les parcours API,
    unitaires et navigateur.
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
- [x] UX-006e — augmenter à 20 la borne maximale de la vitesse rapide locale
  afin de couvrir les hôtes nécessitant un gain tactile supérieur à 8, sans
  modifier la valeur par défaut ni la borne de la vitesse lente.
- [x] UX-006f — appliquer effectivement la borne de gain rapide à 20 dans la
  courbe de déplacement tactile et protéger ce contrat par un test unitaire.
- [x] UX-007 — nommer explicitement la commande d'affichage du QR comme une
  bascule et traduire son libellé et son intitulé accessible dans toutes les
  langues prises en charge.
- [x] UX-008 — appliquer aux boutons de raccourcis clavier du bas le même
  auto-masquage visuel que les remotes pendant un mouvement de souris; rétablir
  leur opacité à la fin de l'interaction ou dès que l'option est désactivée.
- [ ] UX-009 — tester navigation clavier, lecteurs d'écran, contrastes et
  traductions.
- [x] UX-010 — ajouter un retour haptique aux interactions tactiles, avec une
  dégradation sans erreur lorsque le navigateur ou l'appareil ne le prend pas
  en charge.
- [x] UX-010a — déclencher aussi le retour haptique lorsqu'un tap reconnu sur
  le touchpad émet un clic souris, sans vibration pour les mouvements ou
  contacts qui ne produisent pas de clic.
- [ ] UX-011 — fournir une page de calibration du pointeur Remote Mouse ouverte
  dans le navigateur de l'hôte, qui mesure le déplacement réellement reçu sur
  des cibles aléatoires à distances variables, recueille les deltas bruts et
  ajustés, ajuste une fonction de transfert bornée, puis propose et
  peut appliquer la calibration à la remote cliente.
- [ ] UX-011a — remplacer les durées cibles arbitraires de UX-011 par une
  calibration expérimentale à quatre seuils de vitesse : initialiser chaque
  gain à l'unité, placer les cibles à quatre distances normalisées, mesurer le
  temps de réussite, puis ajuster le gain du seuil par recherche locale et
  appliquer les quatre gains interpolés à la remote.
- [ ] UX-011b — détecter les dépassements de la cible B pendant chaque essai,
  diminuer prioritairement le gain du seuil concerné en cas de dépassement,
  augmenter le gain seulement sans dépassement lorsque le temps augmente, et
  conserver le gain lorsque la performance s'améliore sans erreur.
- [ ] UX-011c — déterminer le dépassement à partir des deltas ajustés : vérifier
  que le déplacement net suit le vecteur A→B, puis comparer la distance totale
  parcourue à la distance directe entre les deux cibles.
- [ ] UX-011d — compter les contacts tactiles distincts nécessaires pour un
  essai, augmenter le gain lorsque l'utilisateur doit reprendre son doigt pour
  atteindre B, et conserver la baisse prioritaire en cas de dépassement.
- [ ] UX-011e — commencer la calibration par le seuil de plus longue distance,
  utiliser un pas initial de gain moins conservateur et afficher explicitement
  le seuil actuellement calibré.
- [ ] UX-011f — répéter les essais d'un seuil jusqu'à stabiliser trois temps
  consécutifs dans une tolérance définie, conserver l'affichage des seuils déjà
  calibrés et ne passer au seuil suivant qu'après cette stabilisation.
- [ ] UX-011g — isoler le gain du seuil testé en neutralisant temporairement
  les autres gains pendant ses essais, et détecter le dépassement par la
  progression cumulée dans la direction A→B.
- [x] UX-011h — abandonner le parcours de calibration expérimentale et revenir
  à la configuration locale des gains lent et rapide dans les Préférences.

UX-001/002 dépendent de SEC-008, terminé : l'API admin fournit la liste des
sessions, leur rôle, leur état, leur dernière activité et la révocation
individuelle. L'interface ne doit jamais afficher de jeton ou d'empreinte.

UX-006 dépend du contrat de commandes existant. Si son indicateur de deltas
ajustés devient un champ durable du protocole, le documenter et le versionner
dans `ARCH-003` sans rendre la préférence dépendante du compte serveur.
