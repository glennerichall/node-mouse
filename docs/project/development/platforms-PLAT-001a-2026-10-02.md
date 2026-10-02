# Plateformes — PLAT-001a — 2026-10-02
État: terminé

## Objectif et critères d'acceptation

Terminer l'installateur Linux uinput et vérifier la migration d'une installation
existante.

- `install-linux.sh` configure uinput sans dépendre d'un second fichier, y
  compris lorsqu'il est exécuté par `curl | bash`.
- Une réexécution conserve le `.env`, le secret de session, les certificats et
  la base SQLite existants.
- La migration ajoute `REMOTE_MOUSE_WAYLAND_INPUT=uinput` seulement si la clé
  manque et ne crée aucun doublon.
- Groupe, règle udev, chargement du module et appartenance utilisateur sont
  idempotents.
- Une option explicite permet de remplacer la configuration lorsqu'il s'agit
  réellement de l'intention de l'opérateur.
- Les scénarios installation neuve et migration sont couverts par tests.

## Décisions et raisons

L'installateur distribué comme fichier unique doit rester autonome. Le script
auxiliaire demeure utile aux développeurs, mais ne peut être une dépendance du
chemin `curl | bash`.

La préservation de configuration est le comportement par défaut d'une mise à
niveau. Un remplacement complet exige désormais `--overwrite-config`; `-y` ne
constitue plus une autorisation de détruire silencieusement les secrets.

## Modifications apportées

- Intégration directe de la création du groupe, de la règle udev, du chargement
  `uinput` et de l'ajout utilisateur dans `install-linux.sh`; le chemin
  `curl | bash` ne dépend plus d'un fichier auxiliaire.
- Ajout de `--overwrite-config`; sans cette option, une configuration existante
  est migrée sans être remplacée, même avec `-y`.
- Ajout idempotent de `REMOTE_MOUSE_WAYLAND_INPUT` seulement lorsque la clé est
  absente; une sélection `portal` existante est respectée.
- Conservation implicite des certificats, du secret et de SQLite par absence
  de réécriture; permissions du `.env` ramenées à `0600`.
- Documentation du chemin de migration et de la reconnexion requise après
  ajout au groupe.
- Tests de l'autonomie du script et d'une double migration avec commandes
  système simulées.

## Vérifications et résultats

- `bash -n scripts/install-linux.sh`: réussi.
- Tests installateur: 8 tests réussis, incluant deux migrations successives;
  port personnalisé, secret, réglage inconnu et contenu SQLite préservés, clé
  Wayland présente une seule fois.
- `npm test`: 80 suites et 283 tests réussis.
- Test d'intégration dans un conteneur Ubuntu 24.04: installation des
  dépendances et du paquet local, compilation native, création du `.env` et
  exécution de la CLI réussies.

## Blocages / risques / suite

- La nouvelle appartenance au groupe n'est visible par le service utilisateur
  qu'après reconnexion de la session graphique; l'installateur l'indique lorsque
  l'utilisateur n'était pas déjà membre.
