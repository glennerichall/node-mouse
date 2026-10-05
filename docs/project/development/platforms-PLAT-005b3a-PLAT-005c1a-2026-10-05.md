# Plateformes — PLAT-005b3a et PLAT-005c1a — 2026-10-05

État: terminé

## Objectif et critères d'acceptation

Ajouter au laboratoire une vraie session X11 qui permette de vérifier les
capacités déjà codées, puis préparer un profil Windows 11 reproductible sans
redistribuer Windows, une licence ou une image de machine virtuelle.

## Décisions et raisons

Le profil X11 utilise Xfce, LightDM et Xorg dans la même box Ubuntu 24.04
épinglée que le test d'installation. Jest orchestre l'invité et Playwright
exécute le client livré; `xinput`, `xdotool` et une capture XWD fournissent les
observations du bureau plutôt que de simuler les contrôleurs.

Windows reste volontairement optionnel. Vagrant reçoit le nom d'une box locale
par variable d'environnement et le paquet à tester provient de `npm pack`. Le
profil ne télécharge aucun média Microsoft. Son contrat statique est terminé,
mais sa validation fonctionnelle demeure ouverte tant qu'une box locale n'a
pas été fournie.

## Modifications apportées

- profil `linux-x11` avec Xfce, LightDM, Xorg, autologin et console SPICE;
- installation X11 de Remote Mouse avec configuration de service explicite;
- parcours Jest/Playwright couvrant session Xorg, service, souris, clavier et
  réception d'une trame d'aperçu;
- capture XWD locale du bureau pour la vérification de l'overlay;
- profil `windows-11` WinRM avec UEFI, TPM 2.0 émulé et ressources adaptées;
- création d'un paquet npm local ignoré par Git et provisionnement avec
  l'installateur PowerShell existant;
- commandes npm dédiées aux deux profils.

## Vérifications et résultats

- `vagrant validate` : succès avec Vagrant 2.4.9 et vagrant-libvirt 0.12.2;
- VM Ubuntu 24.04 : session `x11` fournie par X.Org 21.1.11 et service actif;
- Jest X11 : 2 tests réussis;
- souris : déplacement RobotJS observé par `xdotool`;
- clavier : `KEY_A` et `KEY_ENTER` observés par XInput2;
- aperçu : trame `preview:frame` reçue par le client Playwright;
- profil Windows : contrat Vagrant couvert par le test unitaire, sans exécution
  réelle faute de box Windows locale dans le laboratoire.

## Blocages / risques / suite

La capture X11 a révélé que l'overlay QR n'était pas dessiné alors que le helper
natif restait actif et annonçait l'état visible. `PLAT-005b3b` suit ce défaut et
`PLAT-005b3` reste ouverte. `PLAT-005c1` reste également ouverte jusqu'à une
exécution sur une box Windows 11 locale avec WinRM et les pilotes VirtIO.
