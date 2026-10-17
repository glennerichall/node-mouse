# Plateformes — PLAT-007 — 2026-10-16

## Objectif

Définir la frontière commune des intégrations de plateforme avant d'ajouter de
nouveaux backends pour Wayland, le preview ou macOS.

## Contrat retenu

La façade OS fournit des capacités indépendantes :

- `app.resolve(spec)` décrit une application détectée sans lancer de processus;
- `app.openOrFocus`, `app.toggleWindow` et `app.closeWindow` retournent un
  résultat explicite et ne masquent pas l'indisponibilité de la fenêtre;
- `url.open` ouvre une URL selon les règles de la plateforme;
- `window.toggleActive` et `window.closeActive` restent des actions séparées;
- `overlay` est optionnel et possède son propre cycle de vie, sa géométrie et
  ses erreurs;
- `desktop` expose les capacités de contrôle et de capture séparément, avec un
  statut et une raison d'indisponibilité.

Chaque adaptateur doit respecter les mêmes formes de résultat, ne pas exposer
les bibliothèques natives à la logique métier et conserver un adaptateur nul
pour les plateformes sans intégration. Une capacité peut être indisponible
sans rendre les autres inutilisables.

Pour le preview, la capture, la conversion de frames et le transport sont des
couches distinctes. Le choix de uinput, portal/libei ou PipeWire appartient à
la capacité correspondante; aucun transport ne doit être imposé par un
backend de capture.

## Portée

Cette itération formalise le contrat et ses responsabilités. Elle ne refactore
pas encore tous les adaptateurs existants et n'ajoute aucune dépendance native.
Les refactorings devront conserver le protocole client, la configuration et le
cycle de jumelage existants.

## Vérifications

- façade Linux, Windows, macOS et fallback comparée au contrat;
- contrat de l'overlay déjà posé par `ARCH-009` conservé;
- séparation capture/entrée/transport alignée avec `PLAT-004u`;
- aucun workflow VM exécuté;
- `git diff --check` réussi.

## Version et suite

Itération documentaire : la version reste `6.20.3`. Les prochaines
modifications pourront appliquer ce contrat aux capacités réellement
prioritaires, en commençant par les diagnostics et le preview lorsque son
transport sera décidé.

Message de commit suggéré:

`docs(plat): define platform adapter contract`
