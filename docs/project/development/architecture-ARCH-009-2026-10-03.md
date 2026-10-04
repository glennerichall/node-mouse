# Architecture — ARCH-009 — 2026-10-03

État: terminé

## Objectif et critères d'acceptation

Séparer le service d'overlay QR de ses implantations Linux et Windows sans
modifier le protocole client, la configuration persistée ni le comportement
validé du helper X11/XWayland.

## Décisions et raisons

Le service commun reste propriétaire de l'état logique, de la génération du
PNG, de la sérialisation des mises à jour et des opérations publiques. La
façade OS lui fournit un adaptateur responsable de la géométrie, des processus,
des protocoles et des erreurs propres à la plateforme.

Le helper C demeure dans `native/wayland`, tandis que son client et son
adaptateur appartiennent à `server/os/linux/overlay`. L'implantation
PowerShell/WinForms appartient symétriquement à `server/os/win32/overlay`.

## Modifications apportées

- Retrait de toute sélection par `os.platform()` et de tout import Linux ou
  Windows dans `server/services/overlay`.
- Transformation de `createQrOverlay` en service commun piloté par adaptateur.
- Ajout des adaptateurs Linux et Windows à la façade `services.getOs()`.
- Déplacement du client du helper X11/XWayland sous `server/os/linux/overlay`.
- Déplacement du cycle de fenêtre PowerShell sous `server/os/win32/overlay`.
- Suppression des anciens services spécifiques et du module de réexport
  Windows devenu inutile.
- Ajout de tests de contrat exécutant le service commun contre les deux
  adaptateurs et contre l'absence d'adaptateur.
- Passage de version corrective de `6.18.0` à `6.18.1`.

## Vérifications et résultats

- Tests ciblés: 5 suites et 14 tests réussis.
- Suite complète: 88 suites et 318 tests réussis.
- Recherche statique: aucun import d'implantation Linux ou Windows et aucun
  appel à `os.platform()` dans `server/services/overlay`.

## Blocages / risques / suite

Aucun changement fonctionnel attendu. La validation Wayland/XWayland de
`PLAT-004l` reste la référence comportementale; la validation sur une vraie
session X11 demeure suivie dans cet axe plateforme.
