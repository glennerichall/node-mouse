# Outils de développement

Ce répertoire contient exclusivement l'outillage utilisé pour développer et
valider Remote Mouse. Son contenu ne fait pas partie de l'installation du
produit.

## Laboratoire de machines virtuelles

Le laboratoire [`vagrant/`](./vagrant/) est piloté depuis un hôte Linux avec
Vagrant et le provider `vagrant-libvirt`. Libvirt gère les machines et
QEMU/KVM les exécute.

Après avoir installé les prérequis de l'hôte, utiliser directement Vagrant :

```bash
cd dev/vagrant
vagrant up linux-install
```

Les suites complètes se lancent depuis la racine avec `npm run test:vm` ou
`npm run test:all`.

Les profils Linux X11, Linux Wayland et Windows 11 seront ajoutés dans les
itérations suivantes de `PLAT-005`.
