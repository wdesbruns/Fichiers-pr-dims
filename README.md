# Portée maximale entre supports de tuyauterie

Application web en un seul fichier (`index.html`), sans installation, utilisable dans un navigateur.

## Fonctions
- Calcul de la **portée maximale** entre supports selon CODETI Div.1 / EN 13480-3 ou ASME B31.3 :
  - contrainte longitudinale soutenue (poids + pression) : EN 13480-3 §12.3.2 / B31.3 §302.3.5(c) ;
  - flèche absolue (2,5 mm par défaut) et/ou relative (L/n) ;
  - fréquence propre minimale (optionnelle).
- Mise en évidence du **critère dimensionnant**.
- Mode **vérification** d'une portée donnée : taux de travail et avertissements.
- Récapitulatif des charges : à vide, fluide, eau, rempli.
- **Descente de charges** aux supports, avec la part tube et la part fluide séparées pour le classement G/Q Eurocode.
- Bases de données : tubes ASME B36.10M / B36.19M (DN15 à DN600, schedules), matériaux (P235GH, P265GH, 16Mo3, P355NH, 1.4301, 1.4307, 1.4404, 1.4571, A106 B, A53 B, API 5L B, A312 TP304/304L/316/316L) et fluides courants.
- Schéma des notations et bouton **Imprimer / PDF**.

## Utilisation
- **En ligne via GitHub Pages** : Settings → Pages → Source « Deploy from a branch », branche `main`, dossier `/ (root)`. L'application est alors disponible à `https://<utilisateur>.github.io/<dépôt>/`.
- **En local** : télécharger `index.html` et l'ouvrir dans un navigateur.

## Avertissement
Les caractéristiques matériaux sont indicatives. Les vérifier sur les normes produit et sur l'édition du code applicable avant toute utilisation contractuelle.
