# FIP Calculettes

Portail de calculettes du bureau d'études, aux couleurs FIP (bleu #114088, rouge #e30009, ciel #0098db). Site statique, GitHub Pages.

## Structure
```
index.html                 ← page de connexion (l'adresse à communiquer)
accueil.html               ← tableau de bord : une tuile par calculette
supports/                  ← S1 supports de tuyauterie (montant, console, suspente, T, L, U, L mural) – calcul 3D, DDC, vues 2D/3D
portee-tuyauterie/         ← T1 portée entre supports (CODETI / EN 13480-3, ASME B31.3)
poutre/                    ← P1 poutre acier sur deux appuis (EN 1990 combinaisons + EN 1993-1-1)
poteau/                    ← P2 poteau acier (flambement, déversement, interaction N–M)
climat/                    ← C1 hypothèses climatiques, sismiques et complexes (carte, vent, neige, séisme)
  data/                    ← bases de zonage (générées depuis le classeur Excel), contours des départements
outils/generer_profils.py  ← régénère commun/data/profils.js (I, U, cornières, tubes)
outils/proprietes_cornieres.py ← caractéristiques des cornières (axes principaux)
outils/extraire_excel.py   ← régénère climat/data/ à partir du classeur Excel
commun/
  utilisateurs.js          ← comptes autorisés (identifiant + empreinte du mot de passe)
  apps.js                  ← liste des calculettes affichées sur l'accueil
  auth.js                  ← logique de connexion / protection des pages
  style.css                ← style commun (charte FIP)
  img/                     ← logo et picto FIP
  barres3d.js              ← calcul de barres 3D (méthode des déplacements), validé sur cas analytiques
  data/tuyauterie.js       ← base commune tubes / matériaux / fluides (T1, S1)
  acier.js                 ← moteur commun P1/P2 : combinaisons, classes, χ, Mcr
  calc.css                 ← style commun des calculettes P1/P2
  data/profils.js          ← 141 profilés (IPE, HEA, HEB, HEM : eurocodepy LGPL ; IPN, UPN, UPE : classeur)
  export.js                ← boutons Word (.docx) et Excel (.xlsx) de toutes les calculettes
  lib/docx/                ← docx 9.5.1 (MIT), chargée au clic
  lib/xlsx/                ← SheetJS 0.18.5 (Apache-2.0), chargée au clic
  lib/three/               ← Three.js 0.160.1 (MIT), vue 3D chargée à la demande
  lib/leaflet/             ← bibliothèque de carte Leaflet 1.9.4 (licence BSD-2)
  empreinte.html           ← outil pour générer la ligne d'un compte
robots.txt                 ← demande aux moteurs de recherche de ne pas indexer
```

## Comptes
Compte provisoire : `admin` / `Calculettes2026!`, **à remplacer dès la mise en ligne**.

1. Se connecter, puis cliquer sur « Gérer les comptes » en bas de l'accueil.
2. Générer la ligne de son compte et la copier.
3. Sur GitHub, ouvrir `commun/utilisateurs.js` → ✏️ Edit, coller la ligne, supprimer la ligne `admin` → Commit.

## Ajouter une calculette
1. Créer un dossier (ex. `poutre-acier/index.html`).
2. En tête de la page, ajouter :
   ```html
   <meta name="robots" content="noindex, nofollow">
   <script src="../commun/auth.js"></script>
   <script>calcProteger("../");</script>
   ```
3. Ajouter une entrée dans `commun/apps.js`.

## Sécurité : à savoir
La connexion protège contre l'**accès fortuit**, pas contre une personne déterminée. Un site statique n'a pas de serveur pour contrôler l'accès, et le dépôt public est lisible par tous. Les mots de passe ne sont pas stockés en clair (seule leur empreinte SHA-256 l'est). Malgré cela, ne pas réutiliser un mot de passe important et ne pas publier de données confidentielles. Pour une vraie protection, passer à Cloudflare Pages + Cloudflare Access (gratuit), sans réécrire les calculettes.

## Mise en ligne
Settings → Pages → Deploy from a branch → `main` / `(root)`. Adresse : `https://<utilisateur>.github.io/Calculettes/`.

## C1 – Hypothèses climatiques et sismiques
- Reprend le classeur « Hypotheses_climatiques_sismiques_complexes.xlsx » : mêmes formules et mêmes bases.
  Non-régression : 27 valeurs de l'exemple (Montpellier) identiques à Excel.
- Services en ligne utilisés par le navigateur (gratuits, sans clé) : Géoplateforme IGN (fond de carte,
  recherche d'adresse, altitude RGE ALTI) ; secours : api-adresse.data.gouv.fr. Sans connexion : saisie
  département / commune / INSEE.
- Mise à jour des bases : `python3 outils/extraire_excel.py classeur.xlsx`, puis commit de `climat/data/`.

## Nouvelle version
À chaque mise à jour, incrémenter `CALC_VERSION` dans `commun/apps.js` et le paramètre `?v=` des liens vers `commun/*.js|css` et `climat/data/*.js` (oblige les navigateurs à recharger les fichiers).

## P1 / P2 – Poutre et poteau acier
- Base : classeur « Calculette_poutre-poteau_v5.xlsm », corrigé et complété (voir l'historique des commits).
- Contrôles : M_cr et χ_LT recoupés avec le classeur (écart < 1 %) ; IPE 220 L = 5 m recalculé à la main.
