/* =====================================================================
   CATALOGUE DES CALCULETTES (affiché sur l'accueil)
   ---------------------------------------------------------------------
   Ajouter une calculette :
     1. créer son dossier à la racine (ex. « poutre-acier/index.html ») ;
     2. ajouter une entrée dans CALC_APPS (code, titre, catégorie…) ;
     3. si besoin, ajouter une catégorie dans CALC_CATEGORIES.
     4. relire le nom (nom) et le résumé (sousTitre) de la famille : ils doivent couvrir tous ses outils (renommer si besoin).
   statut : "ok" (disponible) ou "bientot" (carte grisée « à venir »)
   vignette : petit schéma SVG affiché sur la carte (facultatif)
   marqueur de catégorie : ● ▬ → ■ ◆ … (couleur d'accent FIP)
   ===================================================================== */
const CALC_VERSION = "v2.91";

const CALC_CATEGORIES = [
  { id: "clim", nom: "Hypothèses de charges", sousTitre: "Charges climatiques et sismiques, permanentes et d'exploitation de l'affaire · NF EN 1990, NF EN 1991-1-1 / 1-3 / 1-4, NF EN 1998-1 + AN, arrêté du 22/10/2010", couleur: "#e30009", marqueur: "▬" },
  { id: "rap", nom: "Rapports de calcul", sousTitre: "Note d'hypothèses et rapport de calcul de l'ouvrage (ossature, supportage, assemblages, descentes de charges) · simplifiés, complets ou au choix, Word / PDF", couleur: "#e30009", marqueur: "■" },
  { id: "tuy", nom: "Tuyauterie et fluides", sousTitre: "Propriétés des fluides, portées entre supports, supports standards, cahier de supportage et descentes de charges · CODETI / NF EN 13480-3, ASME B31.3, Eurocodes + AN", couleur: "#e30009", marqueur: "●" },
  { id: "acier", nom: "Structure acier – éléments et ossatures", sousTitre: "Poutres et poteaux, portiques de toitures isolées (auvents) : prédimensionnement APS/APD · NF EN 1990, NF EN 1991-1-3 / 1-4, NF EN 1993-1-1 + AN", couleur: "#e30009", marqueur: "◆" },
  { id: "asm", nom: "Assemblages et ancrages", sousTitre: "Attaches boulonnées des barres tendues (cornières, UPN) et ancrages des platines sur béton (chevilles mécaniques et chimiques) ; reliés aux outils d'ossature et de supportage · NF EN 1993-1-8 + AN, NF EN 1992-4 + AN, ETE", couleur: "#e30009", marqueur: "▲" },
  { id: "ress", nom: "Aide et ressources", sousTitre: "Pour comprendre et contrôler : manuel technique (mode d'emploi, formules, tests de validation), référentiel des normes vulgarisé, bases de données", couleur: "#e30009", marqueur: "◇" },
  { id: "avenir", nom: "À venir", sousTitre: "Emplacements réservés pour les prochaines calculettes", couleur: "#e30009", marqueur: "■" },
];

const CALC_APPS = [
  {
    code: "MT",
    titre: "Manuel technique",
    description: "Mode d'emploi, manuel de référence (hypothèses, formules détaillées, paragraphes des normes, limites) et tests de validation exécutés en direct : pour comprendre, contrôler et qualifier les calculettes.",
    url: "manuel/",
    categorie: "ress",
    normes: ["Qualification", "Eurocodes + AN"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <rect x="120" y="22" width="160" height="155" rx="6" fill="#fff" stroke="#171a1e"/><rect x="120" y="22" width="18" height="155" fill="#114088"/>
  <text x="210" y="62" font-size="15" text-anchor="middle" fill="#114088" font-weight="800">MANUEL</text>
  <text x="210" y="92" font-size="12" text-anchor="middle" fill="#171a1e">χ = 1/(Φ+√(Φ²−λ̄²))</text>
  <text x="210" y="116" font-size="12" text-anchor="middle" fill="#171a1e">δ = PL³/3EI</text>
  <circle cx="190" cy="148" r="9" fill="#1d7a36"/><path d="M185 148 l4 4 l7 -8" stroke="#fff" stroke-width="2.4" fill="none"/>
  <text x="206" y="153" font-size="12" fill="#1d7a36" font-weight="700">tests OK</text>
</svg>`,
  },
  {
    code: "RF",
    titre: "Référentiel",
    description: "Normes utilisées et notions clés expliquées simplement : combinaisons, vent, neige, séisme, flambement, déversement, torsion, assemblages, supportage… avec formules, ordres de grandeur et références.",
    url: "referentiel/",
    categorie: "ress",
    normes: ["Eurocodes + AN", "CNC2M", "CODETI"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <rect x="70" y="25" width="120" height="150" rx="6" fill="#fff" stroke="#171a1e"/><rect x="200" y="25" width="120" height="150" rx="6" fill="#fff" stroke="#171a1e"/>
  <line x1="195" y1="25" x2="195" y2="175" stroke="#114088" stroke-width="3"/>
  ${[0,1,2,3,4,5].map(i=>`<line x1="85" y1="${50+i*18}" x2="${170-(i%3)*15}" y2="${50+i*18}" stroke="#8a929c" stroke-width="3"/>`).join("")}
  <text x="260" y="70" font-size="20" text-anchor="middle" fill="#114088" font-weight="700">N = χ·A·f</text><text x="260" y="100" font-size="13" text-anchor="middle" fill="#e30009">EN 1993-1-1</text>
  <text x="260" y="130" font-size="13" text-anchor="middle" fill="#5f6670">§6.3.1</text>
</svg>`,
  },
  {
    code: "BD",
    titre: "Base de données",
    description: "Profilés (IPE, HEA, UPN, cornières, tubes…), tubes de tuyauterie, matériaux et fluides, aciers de construction, coefficients ψ, limites de flèche, coefficients de force du vent.",
    url: "base/",
    categorie: "ress",
    normes: ["catalogues", "ASME B36.10M", "EN 10216"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <rect x="50" y="30" width="300" height="140" rx="6" fill="#fff" stroke="#171a1e"/><rect x="50" y="30" width="300" height="24" rx="6" fill="#114088"/>
  ${[0,1,2,3,4].map(i=>`<line x1="50" y1="${78+i*22}" x2="350" y2="${78+i*22}" stroke="#e1e5ea"/>`).join("")}
  <line x1="150" y1="54" x2="150" y2="170" stroke="#e1e5ea"/><line x1="250" y1="54" x2="250" y2="170" stroke="#e1e5ea"/>
  <text x="100" y="47" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">Profilé</text><text x="200" y="47" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">I_y</text><text x="300" y="47" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">kg/m</text>
  <path d="M85,70 h30 v4 h-13 v20 h13 v4 h-30 v-4 h13 v-20 h-13z" fill="#8a929c"/>
</svg>`,
  },
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
  <defs><marker id="v1a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6z" fill="#0098db"/></marker>
  <marker id="v1k" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="M0,0 L6,3 L0,6z" fill="#171a1e"/></marker></defs>
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
    code: "H1",
    titre: "Propriétés des fluides",
    description: "Masse volumique, viscosités et pression de vapeur en fonction de la température : eau, éthanol, essence, naphta, kérosène, gazole, fioul, brut, émulseurs, fluide saisi. Tableau, courbes, ébullition et NPSH.",
    url: "fluides/",
    categorie: "tuy",
    normes: ["IAPWS", "ASTM D1250", "AP-42", "ASTM D341"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <line x1="50" y1="165" x2="360" y2="165" stroke="#171a1e"/><line x1="50" y1="165" x2="50" y2="25" stroke="#171a1e"/>
  <path d="M55,155 C150,150 250,120 350,40" fill="none" stroke="#e30009" stroke-width="3"/><path d="M55,50 C150,90 250,120 350,135" fill="none" stroke="#114088" stroke-width="3"/>
  <text x="300" y="40" font-size="13" fill="#e30009" font-weight="700">P_v</text><text x="300" y="128" font-size="13" fill="#114088" font-weight="700">ν</text>
  <text x="205" y="185" font-size="11" text-anchor="middle" fill="#5f6670">température</text>
  <path d="M95,60 q12,-22 24,0 a12,12 0 1,1 -24,0z" fill="#0098db" opacity=".85"/>
</svg>`,
  },
  {
    code: "S1",
    titre: "Supports standards de tuyauterie",
    description: "8 modèles : montant au sol, console murale, console avec jambe de force, suspente, supports en T, en L (consoles), en U et en L mural. Plusieurs tuyaux (base T1), entraxes, G/T/S/W/E, combinaisons ELU et sismiques, vérifications EN 1993-1-1 par barre, descente de charges par appui, alertes de conception, vues 2D/3D, optimisation.",
    url: "supports/",
    categorie: "tuy",
    normes: ["NF EN 1990", "NF EN 1993-1-1", "NF EN 1991-1-4", "NF EN 1998-1"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <defs><marker id="s1g" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7z" fill="#e30009"/></marker></defs>
  <line x1="20" y1="170" x2="130" y2="170" stroke="#171a1e"/><rect x="55" y="166" width="40" height="4" fill="#171a1e"/><rect x="72" y="40" width="7" height="126" fill="#8a929c"/>
  <circle cx="98" cy="70" r="15" fill="#0b5d73"/><circle cx="98" cy="120" r="11" fill="#0b5d73"/>
  <line x1="98" y1="88" x2="98" y2="104" stroke="#e30009" stroke-width="2" marker-end="url(#s1g)"/>
  <line x1="160" y1="20" x2="160" y2="175" stroke="#171a1e" stroke-width="2"/><rect x="161" y="96" width="90" height="7" fill="#8a929c"/>
  <circle cx="190" cy="83" r="12" fill="#0b5d73"/><circle cx="228" cy="86" r="9" fill="#0b5d73"/>
  <line x1="275" y1="22" x2="380" y2="22" stroke="#171a1e" stroke-width="2"/><rect x="322" y="23" width="7" height="110" fill="#8a929c"/><circle cx="346" cy="118" r="14" fill="#0b5d73"/>
  <text x="20" y="190" font-size="10" fill="#5f6670">sol · mur · plafond — DDC cas simples + enveloppe ELU</text>
</svg>`,
  },
  {
    code: "CS",
    titre: "Cahier de supportage",
    description: "Supports types et configurations (ST-01.1), supports spéciaux (SPE-1.1), BOM, plans types cotés avec perspective, traitement de surface, aperçu du plan. Modèles BOM / simplifié / complet. Informations d'affaire reprises dans toutes les calculettes et le cartouche Word.",
    url: "cahier/",
    categorie: "tuy",
    normes: ["S1", "NF EN 1990", "NF EN 1993-1-1"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <rect x="40" y="18" width="150" height="160" rx="6" fill="#fff" stroke="#171a1e"/><rect x="40" y="18" width="150" height="26" rx="6" fill="#114088"/>
  <text x="115" y="36" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">AFFAIRE</text>
  ${[0,1,2,3,4].map(i=>`<line x1="54" y1="${62+i*22}" x2="150" y2="${62+i*22}" stroke="#8a929c" stroke-width="3"/><circle cx="170" cy="${62+i*22}" r="5" fill="${i===3?'#d4a300':'#2e8540'}"/>`).join("")}
  <rect x="220" y="40" width="7" height="110" fill="#8a929c"/><rect x="220" y="40" width="80" height="7" fill="#8a929c"/><circle cx="270" cy="30" r="10" fill="#0b5d73"/>
  <rect x="320" y="60" width="7" height="90" fill="#8a929c"/><rect x="300" y="60" width="50" height="7" fill="#8a929c"/><circle cx="335" cy="50" r="9" fill="#0b5d73"/>
  <line x1="205" y1="150" x2="370" y2="150" stroke="#171a1e"/>
  <text x="290" y="172" font-size="10" fill="#5f6670" text-anchor="middle">nomenclature · DDC · fiches</text>
</svg>`,
  },
  {
    code: "P1",
    titre: "Poutre acier sur deux appuis",
    description: "Charges réparties et ponctuelles, combinaisons ELU/ELS générées (EN 1990 + AN), flexion, cisaillement, déversement, flèches, fréquence, réactions par action, optimisation du profilé.",
    url: "poutre/",
    categorie: "acier",
    normes: ["NF EN 1990", "NF EN 1993-1-1", "§6.3.2", "§7.2"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <defs><marker id="p1a" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6z" fill="#0098db"/></marker><marker id="p1r" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7z" fill="#e30009"/></marker></defs>
  ${[...Array(12)].map((_, i) => `<line x1="${50 + i * 24}" y1="22" x2="${50 + i * 24}" y2="40" stroke="#0098db" stroke-width="1.1" marker-end="url(#p1a)"/>`).join("")}
  <line x1="200" y1="8" x2="200" y2="40" stroke="#e30009" stroke-width="2.2" marker-end="url(#p1r)"/><text x="206" y="16" font-size="9" fill="#e30009" font-weight="700">P</text>
  <rect x="50" y="43" width="264" height="9" fill="#cfd8e3" stroke="#171a1e"/>
  <polygon points="50,52 42,64 58,64" fill="none" stroke="#171a1e"/><polygon points="314,52 306,64 322,64" fill="none" stroke="#171a1e"/>
  <path d="M50,80 Q182,148 314,80" fill="#114088" fill-opacity=".14" stroke="#114088" stroke-width="1.8"/><line x1="50" y1="80" x2="314" y2="80" stroke="#8a929c"/>
  <text x="50" y="76" font-size="9" fill="#114088" font-weight="700">M (kNm)</text><text x="182" y="128" font-size="9" fill="#e30009" text-anchor="middle" font-weight="700">M_Ed max</text>
  <g transform="translate(336,40)"><path d="M0,0 h44 v6 h-19 v60 h19 v6 h-44 v-6 h19 v-60 h-19 z" fill="#cfd8e3" stroke="#171a1e"/><text x="22" y="88" font-size="9" text-anchor="middle" font-weight="700">IPE</text></g>
  <g font-size="9"><rect x="50" y="152" width="200" height="7" fill="#eef0f3"/><rect x="50" y="152" width="150" height="7" fill="#1d8a3a"/><text x="256" y="159">Flexion 75 %</text>
  <rect x="50" y="166" width="200" height="7" fill="#eef0f3"/><rect x="50" y="166" width="182" height="7" fill="#b26a00"/><text x="256" y="173">Déversement 91 %</text>
  <rect x="50" y="180" width="200" height="7" fill="#eef0f3"/><rect x="50" y="180" width="120" height="7" fill="#1d8a3a"/><text x="256" y="187">Flèche 60 %</text></g>
</svg>`,
  },
  {
    code: "A1",
    titre: "Toiture isolée (auvent) – portique",
    description: "Portique courant mono ou bi-pente à pieds articulés et jarrets (L ≤ 20 m, entraxe ≤ 12 m, pente ≤ 15 %), poteaux laminés ou PRS variables : charges de C1 et G1, vent de toiture isolée, séisme, α_cr et second ordre, vérifications EN 1993-1-1, pannes (laminées ou SADEF), bracons, poutre au vent et palées, flèches, descente de charges, vue 3D.",
    url: "auvent/",
    categorie: "acier",
    normes: ["NF EN 1993-1-1 + AN", "NF EN 1991-1-4 §7.3", "APS/APD"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <line x1="40" y1="170" x2="360" y2="170" stroke="#8a929c"/>
  <path d="M70,170 L70,80 L200,45 L330,80 L330,170" fill="none" stroke="#171a1e" stroke-width="4"/>
  <path d="M70,80 L70,96 L100,80z M330,80 L330,96 L300,80z" fill="#5f6670"/>
  <path d="M70,170 l-8,13 h16z M330,170 l-8,13 h16z" fill="#fff" stroke="#171a1e" stroke-width="1.5"/>
  ${[0,1,2,3,4,5].map(i=>`<line x1="${88+i*45}" y1="${i<3?14+i*-0:14}" x2="${88+i*45}" y2="${i<3?73-i*12:37+(i-3)*12}" stroke="#0098db" stroke-width="1.6"/><path d="M${84+i*45},${i<3?68-i*12:32+(i-3)*12} l4,7 l4,-7z" fill="#0098db"/>`).join("")}
  <path d="M70,80 Q60,60 50,80" fill="none" stroke="#e30009" stroke-width="1.4"/><text x="32" y="60" font-size="10" fill="#e30009" font-weight="700">M</text>
  <text x="200" y="120" font-size="12" text-anchor="middle" fill="#114088" font-weight="800">α<tspan font-size="9" dy="3">cr</tspan><tspan dy="-3"> · φ · 1/(1−1/α</tspan><tspan font-size="9" dy="3">cr</tspan><tspan dy="-3">)</tspan></text>
  <text x="200" y="140" font-size="10" text-anchor="middle" fill="#5f6670">toiture isolée · CNC2M / Tab. 7.7</text>
</svg>`,
  },
  {
    code: "AN1",
    titre: "Ancrages – platine sur béton (chevilles)",
    description: "Chevilles chimiques (HIT-HY 200-A V3 + HAS-U) et mécaniques (HST4) selon la NF EN 1992-4 + AN et les ETE : platine rigide avec zone comprimée ou platine flexible en éléments finis (CBFEM : contrainte et plasticité de la platine, effet de levier), cône, adhérence, extraction, fendage, acier, effet de levier, bord, interactions, séisme (C1 / C2, DLS), h_ef optimale ; plan 2D éditable et vue 3D cotés",
    url: "ancrages/",
    categorie: "asm",
    normes: ["NF EN 1992-4 + AN", "ETE"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <polygon points="40,120 200,80 360,120 200,160" fill="#dcdcd6" stroke="#8a929c"/>
  <polygon points="40,120 200,160 200,190 40,150" fill="#c9c9c4" stroke="#8a929c"/><polygon points="200,160 360,120 360,150 200,190" fill="#b8b8b2" stroke="#8a929c"/>
  <polygon points="130,118 200,100 270,118 200,136" fill="#d8c96a" stroke="#6b6020"/>
  <rect x="186" y="30" width="28" height="88" fill="#8d98a6" stroke="#171a1e"/>
  <g fill="#e30009"><circle cx="160" cy="118" r="5"/><circle cx="240" cy="118" r="5"/><circle cx="200" cy="108" r="5"/><circle cx="200" cy="128" r="5"/></g>
  <line x1="240" y1="20" x2="240" y2="70" stroke="#114088" stroke-width="3"/><path d="M233,20 l7,-12 l7,12z" fill="#114088"/>
  <text x="250" y="45" font-size="12" fill="#114088" font-weight="700">N, M, V</text><text x="40" y="30" font-size="11" fill="#5f6670">NF EN 1992-4 · ETE</text>
</svg>`,
  },
  {
    code: "AS1",
    titre: "Barres tendues boulonnées",
    description: "Cornières simples ou jumelées attachées par une aile, UPN par l'âme, sur gousset : boulons (avec excentricité CTICM), section brute et nette, pression diamétrale, cisaillement de bloc, gousset (diffusion à 30°). Reprend le classeur BE CM ; ouvert depuis A1.",
    url: "barres-tendues/",
    categorie: "asm",
    normes: ["NF EN 1993-1-8 + AN", "CTICM"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <polygon points="40,40 200,40 250,97 200,155 40,155" fill="#eef1f5" stroke="#8a929c"/>
  <rect x="90" y="75" width="270" height="45" fill="#cfd8e3" stroke="#171a1e"/>
  <circle cx="130" cy="105" r="8" fill="#fff" stroke="#e30009" stroke-width="2"/><circle cx="180" cy="105" r="8" fill="#fff" stroke="#e30009" stroke-width="2"/>
  <line x1="300" y1="97" x2="380" y2="97" stroke="#e30009" stroke-width="3"/><path d="M380,90 l12,7 l-12,7z" fill="#e30009"/>
  <text x="300" y="70" font-size="12" fill="#e30009" font-weight="700">N_t,Ed</text><text x="45" y="180" font-size="11" fill="#5f6670">gousset · L 60×60×6 · 2 M16 8.8</text>
</svg>`,
  },
  {
    code: "P2",
    titre: "Poteau acier – compression et flexion",
    description: "Flambement y/z, déversement, interaction N–M (Annexe B), vent latéral et excentricité, traction au soulèvement, import des réactions de la poutre P1, optimisation du profilé.",
    url: "poteau/",
    categorie: "acier",
    normes: ["NF EN 1990", "NF EN 1993-1-1", "§6.3.1", "§6.3.3"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <defs><marker id="p2n" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7z" fill="#e30009"/></marker><marker id="p2w" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6z" fill="#0098db"/></marker></defs>
  <line x1="120" y1="6" x2="120" y2="26" stroke="#e30009" stroke-width="2.4" marker-end="url(#p2n)"/><text x="128" y="16" font-size="10" fill="#e30009" font-weight="700">N_Ed</text>
  <polygon points="120,30 110,18 130,18" fill="none" stroke="#171a1e"/>
  <rect x="116" y="30" width="8" height="140" fill="#cfd8e3" stroke="#171a1e"/>
  <polygon points="120,170 110,184 130,184" fill="none" stroke="#171a1e"/>
  ${[...Array(6)].map((_, i) => `<line x1="62" y1="${42 + i * 24}" x2="110" y2="${42 + i * 24}" stroke="#0098db" stroke-width="1.1" marker-end="url(#p2w)"/>`).join("")}
  <text x="58" y="36" font-size="10" fill="#0098db" font-weight="700">q_w</text>
  <path d="M120,30 Q160,100 120,170" fill="none" stroke="#e30009" stroke-dasharray="5 4"/>
  <text x="170" y="94" font-size="10" fill="#e30009">L_cr,y / L_cr,z</text>
  <g transform="translate(250,30)"><path d="M0,0 h70 v9 h-31 v52 h31 v9 h-70 v-9 h31 v-52 h-31 z" fill="#cfd8e3" stroke="#171a1e"/><text x="35" y="88" font-size="9" text-anchor="middle" font-weight="700">HEA</text></g>
  <text x="250" y="140" font-size="9.5" fill="#171a1e">χy · χz · χLT</text><text x="250" y="156" font-size="9.5" fill="#171a1e">N/(χN_Rk) + k·M/(χLT M_Rk) ≤ 1</text>
</svg>`,
  },
  {
    code: "C1",
    titre: "Charges climatiques et sismiques",
    description: "Localisation sur carte (adresse, altitude IGN), zones de vent / neige / sismicité, qp(z), sk et toiture, spectres horizontal et vertical, Fb, synthèse pour la note d'hypothèses.",
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
    code: "G1",
    titre: "Charges permanentes",
    description: "Complexes de couverture, bardage et plancher (coupe), réseaux et divers, garde-corps, tuyauteries pleines et calorifugées, équipements ponctuels, poids volumiques (Annexe A).",
    url: "charges-permanentes/",
    categorie: "clim",
    normes: ["NF EN 1991-1-1", "Annexe A"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <rect x="40" y="60" width="270" height="10" fill="#9aa3ad"/><rect x="40" y="70" width="270" height="22" fill="#f4e7a1" stroke="#8a929c"/><rect x="40" y="92" width="270" height="6" fill="#5f6670"/>
  <path d="M40,98 l15,-6 l15,6 l15,-6 l15,6 l15,-6 l15,6 l15,-6 l15,6 l15,-6 l15,6 l15,-6 l15,6 l15,-6 l15,6 l15,-6 l15,6 l15,-6 l15,6" fill="none" stroke="#171a1e"/>
  <text x="318" y="68" font-size="9">étanchéité</text><text x="318" y="85" font-size="9">isolant</text><text x="318" y="100" font-size="9">bac acier</text>
  ${[...Array(8)].map((_, i) => `<line x1="${55 + i * 35}" y1="20" x2="${55 + i * 35}" y2="54" stroke="#114088" stroke-width="1.6"/><path d="M${50 + i * 35},48 l5,8 l5,-8z" fill="#114088"/>`).join("")}
  <line x1="55" y1="20" x2="300" y2="20" stroke="#114088" stroke-width="1.6"/><text x="175" y="14" font-size="11" text-anchor="middle" fill="#114088" font-weight="700">g = Σ γ·e  (kN/m²)</text>
  <circle cx="70" cy="150" r="18" fill="#cfd8e3" stroke="#171a1e"/><circle cx="70" cy="150" r="12" fill="#55a9e2"/><text x="96" y="147" font-size="10">tuyauterie</text><text x="96" y="160" font-size="10">G / Q épreuve (kN/m)</text>
  <rect x="250" y="134" width="40" height="30" fill="#e3e7ec" stroke="#171a1e"/><line x1="270" y1="112" x2="270" y2="132" stroke="#e30009" stroke-width="2"/><path d="M265,126 l5,8 l5,-8z" fill="#e30009"/><text x="298" y="147" font-size="10">équipement</text><text x="298" y="160" font-size="10">CTA (kN)</text>
</svg>`,
  },
  {
    code: "Q1",
    titre: "Charges d'exploitation",
    description: "Catégories A à E, H, passerelles et escaliers industriels (ISO 14122, NF E 85-015), charges concentrées, cloisons mobiles, garde-corps (Eurocode, NF E 85-015), coefficients ψ.",
    url: "charges-exploitation/",
    categorie: "clim",
    normes: ["NF EN 1991-1-1 + AN", "NF E 85-015", "NF EN ISO 14122"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <rect x="40" y="110" width="320" height="12" fill="#cfd8e3" stroke="#171a1e"/>
  ${[...Array(9)].map((_, i) => `<line x1="${60 + i * 35}" y1="66" x2="${60 + i * 35}" y2="104" stroke="#0098db" stroke-width="1.6"/><path d="M${55 + i * 35},98 l5,8 l5,-8z" fill="#0098db"/>`).join("")}
  <line x1="60" y1="66" x2="340" y2="66" stroke="#0098db" stroke-width="1.6"/><text x="120" y="58" font-size="11" fill="#0098db" font-weight="700">q_k (kN/m²)</text>
  <line x1="260" y1="20" x2="260" y2="104" stroke="#e30009" stroke-width="2.6"/><path d="M253,96 l7,10 l7,-10z" fill="#e30009"/><text x="270" y="34" font-size="11" fill="#e30009" font-weight="700">Q_k (kN)</text>
  <line x1="340" y1="110" x2="340" y2="70" stroke="#171a1e" stroke-width="2"/><line x1="300" y1="80" x2="336" y2="80" stroke="#e30009" stroke-width="2"/><path d="M330,75 l8,5 l-8,5z" fill="#e30009"/>
  <text x="40" y="150" font-size="10">A · B · C · D · E · H · passerelle ISO 14122 · garde-corps</text><text x="40" y="168" font-size="10" fill="#5f6670">ψ0 / ψ1 / ψ2 — NF EN 1990 Tab. A1.1 + AN</text>
</svg>`,
  },
  {
    code: "RC",
    titre: "Rapport de calcul",
    description: "Rapport de l'ouvrage : hypothèses, ossature (A1), supportage (synthèse et notes détaillées par support), assemblages (AS1), descentes de charges, synthèse des taux ; simplifié, complet ou au choix ; identification et cartouche ; Word / PDF.",
    url: "rapport-calcul/",
    categorie: "rap",
    normes: ["NF EN 1990", "NF EN 1993-1-1 / 1-8"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <rect x="130" y="10" width="140" height="178" fill="#fff" stroke="#8a929c"/><rect x="130" y="10" width="140" height="22" fill="#114088"/><text x="200" y="25" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">RAPPORT DE CALCUL</text>
  ${["1. Hypothèses","2. Ossature A1","3. Supportage","4. Assemblages","5. Descentes de charges","6. Synthèse des taux"].map((t, i) => `<rect x="140" y="${42 + i * 24}" width="4" height="12" fill="#e30009"/><text x="150" y="${52 + i * 24}" font-size="9" fill="#171a1e">${t}</text>`).join("")}
  <g font-size="11" font-weight="700"><rect x="20" y="40" width="60" height="26" rx="4" fill="#dfe9f2"/><text x="50" y="58" text-anchor="middle" fill="#114088">A1</text><rect x="20" y="84" width="60" height="26" rx="4" fill="#dfe9f2"/><text x="50" y="102" text-anchor="middle" fill="#114088">CS</text><rect x="20" y="128" width="60" height="26" rx="4" fill="#dfe9f2"/><text x="50" y="146" text-anchor="middle" fill="#114088">AS1</text></g>
  <path d="M80,53 L128,80 M80,97 L128,97 M80,141 L128,114" stroke="#e30009" stroke-width="1.6" fill="none"/>
  <g font-size="10" font-weight="700" fill="#fff"><rect x="300" y="60" width="70" height="24" rx="3" fill="#2b579a"/><text x="335" y="76" text-anchor="middle">Word</text><rect x="300" y="100" width="70" height="24" rx="3" fill="#e30009"/><text x="335" y="116" text-anchor="middle">PDF</text></g>
</svg>`,
  },
  {
    code: "NH",
    titre: "Note d'hypothèses",
    description: "Rassemble C1, G1, Q1 et les hypothèses générales (durée d'utilisation, classe de conséquences, matériaux) ; combinaisons ; note simplifiée, classique ou complète, Word ou PDF.",
    url: "note-hypotheses/",
    categorie: "rap",
    normes: ["NF EN 1990 + AN"],
    statut: "ok",
    vignette: `
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">
  <rect x="130" y="10" width="140" height="178" fill="#fff" stroke="#8a929c"/><rect x="130" y="10" width="140" height="22" fill="#114088"/><text x="200" y="25" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">NOTE D'HYPOTHÈSES</text>
  ${["1. Références","2. Générales","3. G – permanentes","4. Q – exploitation","5. Vent · neige · séisme","6. Combinaisons"].map((t, i) => `<rect x="140" y="${42 + i * 24}" width="4" height="12" fill="#e30009"/><text x="150" y="${52 + i * 24}" font-size="9" fill="#171a1e">${t}</text>`).join("")}
  <g font-size="11" font-weight="700"><rect x="20" y="40" width="60" height="26" rx="4" fill="#dfe9f2"/><text x="50" y="58" text-anchor="middle" fill="#114088">C1</text><rect x="20" y="84" width="60" height="26" rx="4" fill="#dfe9f2"/><text x="50" y="102" text-anchor="middle" fill="#114088">G1</text><rect x="20" y="128" width="60" height="26" rx="4" fill="#dfe9f2"/><text x="50" y="146" text-anchor="middle" fill="#114088">Q1</text></g>
  <path d="M80,53 L128,80 M80,97 L128,97 M80,141 L128,114" stroke="#e30009" stroke-width="1.6" fill="none"/>
  <g font-size="10" font-weight="700" fill="#fff"><rect x="300" y="60" width="70" height="24" rx="3" fill="#2b579a"/><text x="335" y="76" text-anchor="middle">Word</text><rect x="300" y="100" width="70" height="24" rx="3" fill="#e30009"/><text x="335" y="116" text-anchor="middle">PDF</text></g>
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
