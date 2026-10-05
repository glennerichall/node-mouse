# Laboratoire Vagrant/libvirt/QEMU

Ce laboratoire cible un hôte Linux. Vagrant décrit et provisionne directement
les machines; `vagrant-libvirt` utilise libvirt et QEMU/KVM. Il n'y a ni
surcouche de cycle de vie ni configuration YAML propre au projet.

## Prérequis de l'hôte

- Vagrant et le plugin `vagrant-libvirt`;
- libvirt et une connexion accessible à `qemu:///system`;
- QEMU/KVM et un accès utilisateur à `/dev/kvm`.

Sur Ubuntu x86_64, le bootstrap optionnel installe et vérifie ces prérequis :

```bash
dev/vagrant/install-host-ubuntu.sh
```

Il vérifie le SHA-256 du paquet officiel Vagrant avant l'installation. Après
une première addition aux groupes `kvm` ou `libvirt`, rouvrir la session.

## Cycle de vie Vagrant

Les commandes sont celles de Vagrant :

```bash
cd dev/vagrant
vagrant status
vagrant up linux-install
vagrant up linux-x11
vagrant ssh linux-install
vagrant halt linux-install
vagrant destroy linux-install
```

`destroy` conserve la confirmation interactive de Vagrant et ne supprime pas
la box source. La machine `linux-install` utilise la box libvirt Ubuntu 24.04
épinglée dans le `Vagrantfile` et synchronise le dépôt par rsync. Les tests
obtiennent son adresse privée depuis `vagrant ssh-config`; aucun port fixe de
l'hôte n'est réservé.

Les disques, ISO, secrets, caches et états Vagrant restent ignorés par Git et
ne sont jamais inclus dans le paquet npm.

## Suites automatisées

Depuis la racine du dépôt :

```bash
npm test                  # unités et contrats statiques
npm run test:e2e          # interface locale avec Playwright
npm run test:integration  # VM, installation, mise à jour et uinput
npm run test:all          # les trois suites précédentes
```

La suite VM laisse la machine démarrée pour faciliter le diagnostic; utiliser
`vagrant halt linux-install` ensuite, ou `vagrant destroy linux-install` pour
repartir d'un disque propre. Vagrant assure le démarrage, la synchronisation et
le provisionnement. Jest vérifie le service, la version, HTTP et la conservation
de la configuration. Playwright charge le vrai client Socket.IO dans Chromium;
`evtest` confirme que ses commandes atteignent les périphériques virtuels
uinput de l'invité.

Ce profil sans bureau vérifie la chaîne client → serveur → uinput, mais pas le
rendu d'un bureau. L'overlay QR, l'aperçu et le comportement visuel sous une
vraie session X11 ou Wayland restent des validations distinctes jusqu'à l'ajout
des profils graphiques de `PLAT-005b`.

## Profil Linux X11

`linux-x11` installe Xfce, LightDM et Xorg, ouvre automatiquement une vraie
session X11 pour `vagrant`, puis installe Remote Mouse avec RobotJS. La console
graphique SPICE permet les contrôles visuels. Son provisionnement se lance avec :

```bash
npm run test:vm:x11
```

Jest vérifie qu'il s'agit réellement d'une session Xorg, que le service est
actif et que les commandes du client Playwright déplacent le pointeur et
produisent les touches attendues. Le même parcours exige une trame d'aperçu et
conserve une capture du bureau dans `test-results/vm-x11/overlay-root.xwd` pour
le contrôle visuel de l'overlay QR.

La saisie et l'aperçu X11 sont validés. La capture du 5 octobre 2026 a cependant
montré que le helper d'overlay se déclarait visible sans afficher le QR : cette
anomalie reste suivie dans `PLAT-005b3b` et empêche de déclarer l'overlay validé.

## Profil Windows 11

Le dépôt ne fournit ni Windows ni licence. La box locale doit déjà contenir
Windows 11, les pilotes VirtIO et WinRM. Le profil ajoute explicitement UEFI et
un TPM 2.0 émulé. Indiquer la box, construire l'archive npm courante, puis
provisionner :

```bash
export REMOTE_MOUSE_WINDOWS_BOX=organisation/windows-11
export REMOTE_MOUSE_UEFI_LOADER=/usr/share/OVMF/OVMF_CODE_4M.ms.fd
npm run vm:pack:windows
npm run test:vm:windows
```

L'archive est créée dans `dev/vagrant/artifacts/`, ignoré par Git. Sans box
locale ou sans archive, le profil échoue explicitement; il ne télécharge aucun
média Windows. `PLAT-005c1` restera ouverte jusqu'à une exécution réelle.

## Dépannage

- `/dev/kvm` absent ou inaccessible : activer la virtualisation matérielle,
  charger KVM et vérifier les groupes de l'utilisateur;
- `qemu:///system` inaccessible : démarrer libvirt et vérifier les droits;
- provider absent : `vagrant plugin install vagrant-libvirt`;
- état douteux : `vagrant destroy linux-install`, puis relancer la suite.
