# Plateformes — PLAT-001b et PLAT-004h — 2026-10-02
État: terminé

## Objectif et critères d'acceptation

- Une mise à jour lancée depuis l'application avec `npm update` exécute le
  `postinstall` et propose une autorisation Polkit locale si l'accès uinput
  n'a jamais été configuré.
- Aucune autorisation n'est demandée lorsque le groupe et la règle udev sont
  déjà installés; un refus Polkit n'empêche pas npm de terminer la mise à jour.
- L'overlay YAD force le backend X11 sous une session Wayland afin de conserver
  le placement, le caractère toujours visible et la fenêtre sans décoration.
- Des tests unitaires couvrent la décision de migration et la commande YAD.

## Décisions et raisons

La migration privilégiée appartient au cycle de mise à jour réel du produit,
pas seulement à la réexécution de l'installateur. Le dialogue Polkit reste
local à la machine et n'est tenté que pour un `postinstall` issu du daemon.

YAD est conservé pour l'overlay. Sous Wayland natif, le compositeur contrôle le
placement des fenêtres; XWayland est donc demandé explicitement pour ce petit
overlay dont la position fait partie du contrat.

## Modifications apportées

- Ajout d'une migration `postinstall` limitée aux mises à jour lancées par le
  daemon (`REMOTE_MOUSE_DAEMON=1`).
- Détection idempotente de la règle udev et de l'appartenance au groupe avant
  tout appel à `pkexec`.
- Conservation d'une mise à jour npm réussie en cas de refus Polkit, avec une
  commande `sudo` de rattrapage affichée.
- Marquage explicite de la commande npm générée comme mise à jour du daemon.
- Sélection de `GDK_BACKEND=x11` pour YAD en session Wayland et journalisation
  des erreurs de lancement du processus.
- Passage de la version de `6.12.0` à `6.13.0`, car la migration intégrée ajoute
  un comportement fonctionnel au cycle de mise à jour.

## Vérifications et résultats

- `npm test`: 81 suites et 289 tests réussis.
- Test réel de YAD sous Ubuntu/GNOME Wayland avec le backend X11: lancement sans
  erreur d'affichage, puis arrêt volontaire après trois secondes.
- Vérification locale: Polkit est disponible; la règle udev et l'appartenance
  persistée de l'utilisateur au groupe `remote-mouse-uinput` sont présentes.

## Blocages / risques / suite

Un refus ou l'absence de Polkit laisse uinput non configuré et produit un
avertissement actionnable; la mise à jour du paquet reste installée. Une
nouvelle appartenance au groupe ne devient effective qu'après reconnexion de la
session graphique.
