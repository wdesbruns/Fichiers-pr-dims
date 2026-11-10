# FIP Calculettes

Portail de calculettes du bureau d'études, aux couleurs FIP (bleu #114088, rouge #e30009, ciel #0098db). Site statique, GitHub Pages.

## Structure
```
index.html                 ← page de connexion (l'adresse à communiquer)
accueil.html               ← tableau de bord : une tuile par calculette
portee-tuyauterie/         ← portée entre supports (CODETI / EN 13480-3, ASME B31.3)
commun/
  utilisateurs.js          ← comptes autorisés (identifiant + empreinte du mot de passe)
  apps.js                  ← liste des calculettes affichées sur l'accueil
  auth.js                  ← logique de connexion / protection des pages
  style.css                ← style commun (charte FIP)
  img/                     ← logo et picto FIP
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
