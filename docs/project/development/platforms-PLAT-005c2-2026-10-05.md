# Plateformes — PLAT-005c2 — 2026-10-05

État: en cours

## Objectif et critères d'acceptation

Rendre la création de la box Windows 11 locale reproductible avec les médias
fournis par le développeur, en séparant le DVD d'installation IDE du disque
VirtIO et en préparant WinRM, UEFI et TPM 2.0 pour le démarrage Vagrant.

## Décisions et raisons

La création reste pilotée par Packer/QEMU, car l'installation Windows
nécessite un fichier de réponses et le chargement du pilote VirtIO avant le
premier démarrage. Vagrant est conservé pour le cycle de vie de la VM et son
provisionnement applicatif. Le bus IDE ne doit pas être forcé sur la VM finale:
le disque construit par Packer reste VirtIO après l'installation.

## Modifications apportées

- ajout de `dev/vagrant/build-windows-box.sh` avec empreintes SHA-256,
  extraction temporaire du pilote `viostor`, validation Packer et enregistrement
  de la box libvirt;
- ajout du template Packer et de `Autounattend.xml` avec UEFI, TPM 2.0, WinRM
  et compte de laboratoire local;
- installation optionnelle de Packer dans le bootstrap Ubuntu, avec checksum;
- ajout de la commande `npm run vm:box:windows` et de la documentation des
  commandes de création et de démarrage;
- suppression de la surcharge `disk_bus = "ide"` dans le profil Vagrant final.

## Vérifications et résultats

- tests unitaires des contrats Vagrant, bootstrap et builder Windows: 11 tests
  réussis;
- `bash -n` des scripts shell: réussi;
- `packer fmt -check`: réussi;
- le chargement de source Packer ne peut pas être exécuté dans cet
  environnement restreint, car le plugin QEMU ne peut pas ouvrir son socket
  Unix (`setsockopt: operation not permitted`).

## Blocages / risques / suite

Le build et le démarrage réels restent à exécuter sur un hôte Linux disposant
des deux ISO, de KVM/libvirt et d'une session pouvant lancer Packer. Tant que
ce parcours n'a pas réussi, `PLAT-005c2` et `PLAT-005c1` restent ouvertes.
