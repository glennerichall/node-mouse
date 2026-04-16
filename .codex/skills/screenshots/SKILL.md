---
name: screenshots-markdown
description: Prend des screenshots desktop ou mobile d’une page web, les enregistre dans le projet, puis met à jour un fichier Markdown avec les images générées.
---

# Skill: Générer des screenshots et les insérer dans le Markdown

## Quand utiliser cette skill
Utilise cette skill quand on demande :
- des captures d’écran d’une page
- une vérification visuelle mobile
- l’ajout de screenshots dans un README ou un autre fichier Markdown

## Entrées attendues
- `url`
- `markdown_file`
- `mode`: `desktop`, `mobile`, ou `both`
- `output_dir`: par défaut `.artifacts/screenshots`

## Instructions
1. Ouvre l’URL dans le navigateur automatisé disponible.
2. Change la langue pour anglais
3. En mode mobile, utilise par défaut un viewport iPhone 14 Pro.
4. Attends que la page soit stable avant de capturer.
5. Enregistre les screenshots dans `output_dir`.
6. Mets à jour `markdown_file` avec des chemins relatifs vers les images.
7. Si une section screenshots existe déjà, remplace-la proprement.