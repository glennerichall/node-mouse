# Plateformes — PLAT-005b2a — 2026-10-05

État: terminé

## Objectif et critères d'acceptation

Empêcher les tests navigateur en VM de démarrer leur code Socket.IO avant que
la navigation du lien de session à jeton soit terminée, puis valider les
parcours d'installation Linux et Wayland.

## Cause et décision

`/api/sessions/:token` établit la session puis redirige vers `/`. Le test ne
tenait compte que de la présence de `main`; cette assertion pouvait réussir
pendant la transition de document, et `page.evaluate()` perdait alors son
contexte avec `Execution context was destroyed`. Le test attend désormais
l'URL racine après la navigation, avant de vérifier le client et d'ouvrir son
contexte JavaScript.

## Modifications apportées

- attente de `page.waitForURL()` vers `/` dans le client Playwright partagé;
- assertion unitaire statique du contrat d'attente dans
  `vagrant-laboratory.test.js`;
- reprise de l'environnement `DISPLAY` et `XAUTHORITY` de GNOME pour que les
  contrôles d'overlay XWayland puissent interroger le serveur graphique.

## Vérifications et résultats

- test unitaire du laboratoire : 7 tests réussis;
- `npm run test:vm` : 3 tests réussis, dont connexion Socket.IO et commandes
  souris/clavier;
- `npm run test:vm:wayland` : 1 test réussi sur une session GNOME Wayland;
  événements uinput observés et fenêtre QR vérifiée sous XWayland.

## Limites et suite

PLAT-005b4 reste ouverte : cette passe ne vérifie pas encore la réception des
événements par une application Wayland native, ni le masquage/réaffichage du
QR au survol.
