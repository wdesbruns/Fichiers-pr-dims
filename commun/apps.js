/* =====================================================================
   LISTE DES CALCULETTES AFFICHÉES SUR L'ACCUEIL
   ---------------------------------------------------------------------
   Pour ajouter une calculette : créer son dossier à la racine
   (ex. « poutre-acier/index.html ») puis ajouter une ligne ci-dessous.
   statut : "ok" (disponible) ou "bientot" (tuile grisée « à venir »)
   ===================================================================== */
const CALC_APPS = [
  {
    titre: "Portée de tuyauterie",
    description: "Portée maximale entre supports, critère dimensionnant, descente de charges G / fluide.",
    url: "portee-tuyauterie/",
    categorie: "Tuyauterie",
    normes: ["CODETI", "EN 13480-3", "ASME B31.3"],
    icone: "〰",
    statut: "ok",
  },
  {
    titre: "Nouvelle calculette",
    description: "Emplacement réservé pour ta prochaine application.",
    url: "",
    categorie: "À venir",
    normes: [],
    icone: "＋",
    statut: "bientot",
  },
];
