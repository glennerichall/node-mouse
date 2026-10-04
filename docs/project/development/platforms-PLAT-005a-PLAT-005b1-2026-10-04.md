# Plateformes — PLAT-005a et PLAT-005b1 — 2026-10-04

État: terminé

## Objectif et critères d'acceptation

Fournir depuis un hôte Linux un laboratoire Vagrant reproductible sur
QEMU/KVM, puis valider dans une première VM Linux une installation neuve et le
parcours d'utilisation non graphique de Remote Mouse.

## Décisions et raisons

Vagrant orchestre les machines par le provider communautaire
`vagrant-libvirt`; libvirt conserve la gestion système et QEMU/KVM exécute les
invités. Les profils versionnés sont séparés des surcharges locales afin que
l'ajout d'une cible ne demande pas de modifier la configuration de chaque
développeur.

La première cible utilise la box libvirt `cloud-image/ubuntu-24.04` épinglée à
`20260926.0.0`. Elle valide le socle commun d'installation sans prétendre
valider une session X11 ou Wayland. Le dépôt est synchronisé par rsync et les
disques, ISO, secrets et états Vagrant restent hors de Git et du paquet npm.

## Modifications apportées

- Commande `dev/vm` pour diagnostic et cycle de vie, avec sous-commande `test`.
- Bootstrap Ubuntu de l'hôte, vérification du paquet officiel Vagrant et
  contrôle des accès KVM/libvirt.
- Profils versionnés avec surcharges locales non versionnées.
- VM `linux-install`, Ubuntu 24.04, service systemd utilisateur persistant et
  port HTTP publié seulement sur l'adresse de boucle locale.
- Test invité couvrant installation depuis le dépôt, version CLI, service,
  `/health`, client web, bundle Socket.IO et réinstallation sans modification
  de la configuration ni de ses secrets.
- Correction du faux négatif `curl` 23 : la réponse HTTP est maintenant lue
  complètement avant la recherche, plutôt que d'envoyer `curl` dans un
  `grep -q` qui ferme prématurément le pipeline.

## Vérifications et résultats

- Hôte Ubuntu 26.04.1 : Vagrant 2.4.9, vagrant-libvirt 0.12.2, libvirt 12.0.0
  et QEMU 10.2.1 détectés et utilisables.
- `vagrant validate` : succès.
- VM supprimée puis recréée depuis la box propre : succès.
- Installation neuve et réinstallation dans Ubuntu 24.04 : succès.
- Service actif, version CLI, santé HTTP, client web et Socket.IO : succès.
- Configuration et secret inchangés après réinstallation : succès.
- Tests unitaires du laboratoire : succès.

## Blocages / risques / suite

La box est communautaire et doit rester épinglée; une mise à niveau exige une
nouvelle validation depuis un disque propre. Le profil serveur ne vérifie ni
les événements d'entrée réels, ni l'overlay, ni l'aperçu. Ces validations
appartiennent aux futurs profils graphiques X11 et Wayland de `PLAT-005b`.
`vagrant-libvirt` 0.12.2 affiche un avertissement non bloquant concernant
`libvirt_ip_command`; le cycle complet et la détection d'adresse réussissent
néanmoins.
