/* =====================================================================
   CATALOGUE DES CALCULETTES (affiché sur l'accueil)
   ---------------------------------------------------------------------
   Ajouter une calculette :
     1. créer son dossier à la racine (ex. « poutre-acier/index.html ») ;
     2. ajouter une entrée dans CALC_APPS (code, titre, catégorie…) ;
     3. si besoin, ajouter une catégorie dans CALC_CATEGORIES.
   statut : "ok" (disponible) ou "bientot" (carte grisée « à venir »)
   vignette : petit schéma SVG affiché sur la carte (facultatif)
   marqueur de catégorie : ● ▬ → ■ ◆ … (couleur d'accent FIP)
   ===================================================================== */
const CALC_VERSION = "v1.3";

const CALC_CATEGORIES = [
  { id: "tuy", nom: "Tuyauterie", sousTitre: "Supportage, portées et descentes de charges · CODETI / EN 13480-3, ASME B31.3", couleur: "#e30009", marqueur: "●" },
  { id: "clim", nom: "Actions climatiques et sismiques", sousTitre: "Vent, neige, séisme, poids des complexes · NF EN 1991-1-3 / 1-4, NF EN 1998-1 + AN, arrêté du 22/10/2010", couleur: "#e30009", marqueur: "▬" },
  { id: "avenir", nom: "À venir", sousTitre: "Emplacements réservés pour les prochaines calculettes", couleur: "#e30009", marqueur: "■" },
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
    code: "C1",
    titre: "Hypothèses climatiques, sismiques et complexes",
    description: "Localisation sur carte (adresse, altitude IGN), zones de vent / neige / sismicité, qp(z), sk et toiture, spectres et Fb, poids des complexes, synthèse pour la note de calcul.",
    url: "climat/",
    categorie: "clim",
    normes: ["NF EN 1991-1-3", "NF EN 1991-1-4", "NF EN 1998-1", "Arrêté 22/10/2010"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <rect x="8" y="10" width="150" height="175" rx="3" fill="#0b2d63"/>
  <rect x="16" y="18" width="134" height="16" rx="2" fill="#fff"/><text x="22" y="30" font-size="8" fill="#1f6fd1">Rechercher une adresse…</text>
  <rect x="16" y="40" width="134" height="40" fill="#fff"/><text x="22" y="52" font-size="7" fill="#5f6670">Commune</text><text x="80" y="52" font-size="7" fill="#171a1e">MONTPELLIER</text>
  <text x="22" y="64" font-size="7" fill="#5f6670">Altitude</text><text x="80" y="64" font-size="7" fill="#1f6fd1" font-weight="700">50 m</text>
  <rect x="16" y="84" width="134" height="16" fill="#fff"/><text x="22" y="95" font-size="8" fill="#114088" font-weight="700">Neige</text><rect x="124" y="84" width="26" height="16" fill="#62b86a"/><text x="137" y="95" font-size="8" text-anchor="middle" font-weight="700">B2</text>
  <rect x="16" y="101" width="134" height="16" fill="#fff"/><text x="22" y="112" font-size="8" fill="#114088" font-weight="700">Vent</text><rect x="124" y="101" width="26" height="16" fill="#55a9e2"/><text x="137" y="112" font-size="8" text-anchor="middle" font-weight="700" fill="#fff">3</text>
  <rect x="16" y="118" width="134" height="16" fill="#fff"/><text x="22" y="129" font-size="8" fill="#114088" font-weight="700">Sismicité</text><rect x="124" y="118" width="26" height="16" fill="#ffd866"/><text x="137" y="129" font-size="8" text-anchor="middle" font-weight="700">2</text>
  <rect x="16" y="142" width="134" height="20" fill="#06204a"/><text x="24" y="156" font-size="10" fill="#fff" font-weight="700">sk = 0,55 kN/m²</text>
  <rect x="166" y="10" width="226" height="175" fill="#dfe9f2"/>
  <path d="M228,32 L262,24 L300,40 L330,36 L350,62 L344,98 L362,128 L340,160 L300,172 L268,160 L236,168 L214,140 L222,110 L196,86 L206,56 Z" fill="#f4f19a" stroke="#8a929c"/>
  <path d="M300,40 L330,36 L350,62 L344,98 L362,128 L340,160 L300,172 L300,120 L320,96 L310,70 Z" fill="#a7e3a3" stroke="#8a929c"/>
  <path d="M236,168 L268,160 L300,172 L300,120 L262,130 L222,110 L214,140 Z" fill="#62b86a" stroke="#8a929c"/>
  <path d="M287,141 c0,-9 6,-14 6,-14 c0,0 6,5 6,14 a6,6 0 0 1 -12,0z" fill="#e30009"/><circle cx="293" cy="141" r="2.4" fill="#fff"/>
  <g font-size="9" font-weight="700"><rect x="176" y="18" width="20" height="13" fill="#f4f19a"/><text x="186" y="28" text-anchor="middle">A1</text><rect x="196" y="18" width="20" height="13" fill="#a7e3a3"/><text x="206" y="28" text-anchor="middle">B1</text><rect x="216" y="18" width="20" height="13" fill="#62b86a"/><text x="226" y="28" text-anchor="middle">B2</text></g>
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
