# Laboratoire Vagrant/libvirt/QEMU

Ce laboratoire est conçu pour un poste de développement Linux. Vagrant décrit
et provisionne les machines, `vagrant-libvirt` les gère par libvirt et QEMU/KVM
les exécute avec l'accélération matérielle.

## Prérequis

- Vagrant;
- le plugin communautaire `vagrant-libvirt`;
- libvirt et son service système;
- QEMU/KVM pour invités x86_64;
- un utilisateur autorisé à accéder à `/dev/kvm` et à `qemu:///system`.

Sur Ubuntu x86_64, le bootstrap installe ces prérequis ainsi que la version de
Vagrant indiquée dans le script :

```bash
dev/vagrant/install-host-ubuntu.sh
```

Le script affiche les opérations, utilise `sudo` uniquement pour les paquets et
les groupes système, vérifie le SHA-256 du paquet officiel Vagrant avant son
installation et installe `vagrant-libvirt` dans le compte courant. Il faut
fermer puis rouvrir la session après une première addition aux groupes `kvm` ou
`libvirt`.

La commande suivante vérifie ces capacités et affiche les versions réellement
utilisées :

```bash
dev/vm doctor
```

Elle ne modifie pas le système. Sur une autre distribution, l'installation des
paquets et l'ajout éventuel de l'utilisateur aux groupes de virtualisation
restent des opérations explicites. Le plugin s'installe séparément avec :

```bash
vagrant plugin install vagrant-libvirt
```

## Configuration locale

Initialiser le fichier non versionné :

```bash
dev/vm init
```

Modifier ensuite `dev/vagrant/config.local.yml` et renseigner une box compatible
avec le provider libvirt. Le socle ne choisit pas encore une distribution : les
profils graphiques X11 et Wayland appartiennent à `PLAT-005b`, et Windows 11 à
`PLAT-005c`.

Les répertoires `.vagrant`, `cache`, `images`, `iso`, `secrets` et le fichier de
configuration locale sont ignorés par Git. Aucun média, disque ou secret ne
doit être ajouté au dépôt.

## Cycle de vie

Chaque commande destructive ou modificatrice exige le nom explicite de la
machine :

```bash
dev/vm status
dev/vm create lab
dev/vm start lab
dev/vm stop lab
dev/vm ssh lab
dev/vm destroy lab
```

`destroy` conserve la confirmation interactive de Vagrant et ne supprime ni la
box source ni les médias locaux. `create` démarre la VM sans provisionnement;
`start` applique le provisionnement déclaré par le futur profil.

## Dépannage

- `/dev/kvm` absent : activer la virtualisation matérielle dans le firmware et
  charger le module KVM correspondant au processeur.
- `/dev/kvm` inaccessible : corriger les groupes et règles de la distribution,
  puis rouvrir la session utilisateur.
- `qemu:///system` inaccessible : vérifier que libvirt est démarré et que
  l'utilisateur est autorisé à ouvrir la connexion système.
- provider absent : exécuter `vagrant plugin install vagrant-libvirt`, puis
  relancer `dev/vm doctor`.
- conflit de gems Ruby : utiliser un ensemble Vagrant/provider fourni et testé
  par la même distribution, ou l'installation Vagrant officiellement prise en
  charge par le provider.
