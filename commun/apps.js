/* =====================================================================
   CATALOGUE DES CALCULETTES (affiché sur l'accueil)
   ---------------------------------------------------------------------
   Ajouter une calculette :
     1. créer son dossier à la racine (ex. « poutre-acier/index.html ») ;
     2. ajouter une entrée dans CALC_APPS (code, titre, catégorie…) ;
     3. si besoin, ajouter une catégorie dans CALC_CATEGORIES.
   statut : "ok" (disponible) ou "bientot" (carte grisée « à venir »)
   vignette : petit schéma SVG affiché sur la carte (facultatif)
   ===================================================================== */
const CALC_VERSION = "v1.1";

const CALC_CATEGORIES = [
  { id: "tuy", nom: "Tuyauterie", sousTitre: "Supportage, portées et descentes de charges · CODETI / EN 13480-3, ASME B31.3", couleur: "#0098db", marqueur: "●" },
  { id: "avenir", nom: "À venir", sousTitre: "Emplacements réservés pour les prochaines calculettes", couleur: "#5f6670", marqueur: "■" },
];

const CALC_APPS = [
  {
    code: "T1",
    titre: "Portée entre supports de tuyauterie",
    description: "Portée maximale ou vérification d'une portée, critère dimensionnant, charges à vide / rempli et descente de charges G / fluide.",
    url: "portee-tuyauterie/",
    categorie: "tuy",
    normes: ["CODETI", "EN 13480-3", "ASME B31.3", "EN 1991-1-1"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 150" xmlns="http://www.w3.org/2000/svg" font-family="Lato,Arial,sans-serif">
  <defs><marker id="v1a" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto"><path d="M0,0 L6,0 L3,6z" fill="#0098db"/></marker>
  <marker id="v1k" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6z" fill="#171a1e"/></marker></defs>
  <text x="62" y="18" font-size="9" fill="#5f6670">Tuyauterie remplie : q = q₀ + q_fluide</text>
  ${[...Array(13)].map((_, i) => `<line x1="${70 + i * 22}" y1="26" x2="${70 + i * 22}" y2="44" stroke="#0098db" stroke-width="1.2" marker-end="url(#v1a)"/>`).join("")}
  <text x="44" y="38" font-size="11" font-weight="700" fill="#0098db">q</text>
  <rect x="70" y="48" width="264" height="18" fill="#e4e8ee" stroke="#171a1e" stroke-width="1"/>
  <rect x="70" y="52" width="264" height="10" fill="#cfe3f5"/>
  <line x1="40" y1="57" x2="70" y2="57" stroke="#171a1e" stroke-dasharray="3 3"/><line x1="334" y1="57" x2="364" y2="57" stroke="#171a1e" stroke-dasharray="3 3"/>
  <path d="M70,66 Q202,92 334,66" fill="none" stroke="#e30009" stroke-dasharray="4 3"/>
  <text x="206" y="90" font-size="9" fill="#e30009">δ ≤ δ_lim</text>
  <polygon points="70,67 62,80 78,80" fill="none" stroke="#171a1e"/><polygon points="334,67 326,80 342,80" fill="none" stroke="#171a1e"/>
  <text x="56" y="96" font-size="9" fill="#114088" font-weight="700">R</text><text x="340" y="96" font-size="9" fill="#114088" font-weight="700">R</text>
  <line x1="70" y1="112" x2="334" y2="112" stroke="#171a1e" marker-start="url(#v1k)" marker-end="url(#v1k)" stroke-width=".8"/>
  <line x1="70" y1="84" x2="70" y2="118" stroke="#171a1e" stroke-width=".5"/><line x1="334" y1="84" x2="334" y2="118" stroke="#171a1e" stroke-width=".5"/>
  <text x="202" y="126" font-size="10" text-anchor="middle" fill="#171a1e">L = portée entre supports</text>
  <text x="202" y="142" font-size="9" text-anchor="middle" fill="#5f6670">σ = P·D/4e + M/Z ≤ f  ·  δ  ·  f₁</text>
</svg>`,
  },
  {
    code: "··",
    titre: "Prochaine calculette",
    description: "Emplacement réservé : demander l'ajout d'un nouveau module.",
    url: "",
    categorie: "avenir",
    normes: [],
    statut: "bientot",
  },
];
