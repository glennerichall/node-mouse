# PLAT-006c — correction de l'installation de l'extension GNOME

## Problème

`npm run install:gnome-focus` fabriquait une archive ZIP générique, puis
appelait `gnome-extensions enable`. GNOME pouvait terminer l'installation sans
enregistrer cette archive comme un bundle d'extension valide; l'activation
échouait alors avec `Extension “remote-mouse-focus@velor” does not exist`.

## Correction

Le script et le parcours `remote-mouse setup` utilisent maintenant
`gnome-extensions pack`, installent le fichier `.shell-extension.zip`, vérifient
que l'UUID apparaît dans `gnome-extensions list --user`, puis seulement
activent l'extension. La dépendance externe à `zip` a été supprimée.

## Vérification

- `npm test -- --runInBand test/unit/gnome-focus-extension.test.js test/unit/setup-command.test.js test/unit/wayland-window-focus.test.js` — 25 tests réussis.
- `bash -n scripts/install-gnome-focus-extension.sh` — réussi.
- `git diff --check` — réussi.
- `gnome-extensions pack --force --out-dir ... native/gnome-shell/remote-mouse-focus@velor` — bundle `.shell-extension.zip` créé.
