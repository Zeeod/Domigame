# Ajouter des illustrations de cartes

La liste des images manquantes est dans [IMAGES_MANQUANTES.md](IMAGES_MANQUANTES.md) (ou [images-manquantes.csv](images-manquantes.csv), qui contient aussi le texte de chaque carte, pratique pour écrire un prompt).
Pour la régénérer après avoir ajouté des images : `npx tsx scripts/tools/list-missing-images.ts`.

## Où les mettre

Sur le NAS : **`docker/dominion/data/card-images/`** (File Station). Pas besoin de reconstruire ni de redémarrer : un **Ctrl+F5** dans le navigateur suffit.
Une image placée là remplace aussi celle livrée avec le jeu si elle porte le même nom.

## Nom du fichier

L'identifiant de la carte (colonne **Fichier**), en minuscules, puis `.jpg` ou `.png` : `throne_room.jpg`, `bazaar.png`.

## Format

| Format (colonne) | Cartes | Proportions | Taille conseillée | Cadrage |
|---|---|---|---|---|
| **standard** | Royaume (Action, Trésor, Victoire, Nuit…) | **3:2** paysage | 1200 × 800 (SDXL : 1216 × 832) | Sujet **centré** : en petit dans la Réserve, l'image est recadrée au centre. |
| **paysage** | Événements, Projets, Jalons, Voies, Alliés, Traits, Prophéties, Bienfaits, Maléfices, États, Artefacts | **3:2** paysage | 1200 × 800 (SDXL : 1216 × 832) | Sujet dans les **60 % du haut** : le texte de la carte couvre le bas. |
| **carré** | Cuivre, Argent, Or, Platine, Domaine, Duché, Province, Colonie, Malédiction | **1:1** | 1024 × 1024 | Image pleine carte. |

- **JPG qualité 80–85** conseillé (100 à 250 Ko par image). PNG fonctionne aussi mais pèse plus lourd.
- Pas de texte, de cadre ni de bordure dans l'image : le jeu dessine le nom, le coût et le texte par-dessus.
- Une image aux mauvaises proportions s'affiche quand même (recadrée au centre), mais perd ses bords.

## Conseils pour la génération locale (Stable Diffusion / ComfyUI / Fooocus…)

- Garder le même style pour toutes les cartes : un préfixe fixe, par exemple
  `fantasy medieval painting, oil painting style, warm lighting, detailed, no text, no border` + la description de la carte.
- Le nom anglais aide souvent le modèle à comprendre le sujet (l'identifiant `fishing_village` → « fishing village »).
- Prompt négatif : `text, letters, watermark, frame, border, card, logo`.
