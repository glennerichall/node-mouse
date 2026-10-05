# Plateformes — PLAT-005b3b — 2026-10-05

État: terminé

## Objectif et critères d'acceptation

Afficher le QR dans la VM X11, le masquer pendant le survol puis le réafficher
à la sortie du pointeur; rendre cette validation relançable et conserver une
capture visuelle qui représente réellement l'écran invité.

## Décisions et raisons

Le helper natif dessinait correctement le QR. Le client Playwright du test
X11 envoyait toutefois `qr:toggle-overlay` à chaque exécution. Comme l'état de
départ variait, les journaux alternaient entre `visible:false` et
`visible:true`; certaines exécutions masquaient donc le QR juste avant la
capture. En outre, `xwd -root` ne capture pas le contenu de cette fenêtre
native de premier niveau. L'absence de QR dans cet artefact ne prouvait pas une
panne de rendu.

Le parcours redémarre le service pour repartir de sa visibilité initiale,
attend que la fenêtre soit mappée et opaque, puis vérifie le masquage et le
retour après déplacement du pointeur. La capture passe par la console QEMU,
qui inclut effectivement l'overlay.

## Modifications apportées

- retrait de la bascule QR du client de test générique;
- assertion X11 du mappage et de l'opacité complète de la fenêtre;
- exercice automatisé du survol, du masquage et du réaffichage;
- capture PNG de la console QEMU dans `test-results/vm-x11/overlay.png`;
- détection de la session Xorg par son type plutôt que par un identifiant
  LightDM codé en dur.

## Vérifications et résultats

- test unitaire `vagrant-laboratory.test.js` : 6 tests réussis;
- `npm run test:vm:x11` : 2 tests réussis sur Ubuntu 24.04/Xfce/Xorg;
- capture de `test-results/vm-x11/overlay.png` inspectée : QR visible en haut à
  droite;
- cycle de survol : fenêtre masquée au passage du pointeur et réaffichée après
  sa sortie.

## Blocages / risques / suite

PLAT-005b3 est terminée pour Ubuntu 24.04/X11. La validation Wayland et
l'exécution fonctionnelle Windows 11 restent suivies séparément dans l'axe.
