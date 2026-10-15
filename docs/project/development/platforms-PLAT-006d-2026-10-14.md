# PLAT-006d — vérification CI de l'extension GNOME

## Décision

Ajouter un job GitHub Actions dédié sur `ubuntu-24.04`. Le job installe GJS et
les outils GNOME, fabrique le bundle avec `gnome-extensions pack`, vérifie que
le fichier `.shell-extension.zip` existe et exécute le code de l'extension
avec GJS.

Le test GJS vérifie la recherche par classe, instance et titre, l'activation
sur un espace de travail et le comportement de la méthode D-Bus. Il ne prétend
pas remplacer un test avec une session Mutter réelle; ce dernier nécessite un
environnement graphique GNOME complet.

## Vérification locale

- `gjs --module test/integration/gnome-focus-extension.mjs` — réussi.
- `gnome-extensions pack --force --out-dir ... native/gnome-shell/remote-mouse-focus@velor` — bundle créé.
- `git diff --check` — réussi.
