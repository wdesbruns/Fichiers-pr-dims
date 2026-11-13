/* Aide de poutre (contenu ; moteur : commun/aide.js) */
AIDE.init({
  titre: "Aide – P1 Poutre acier",
  intro: "P1 vérifie une poutre sur deux appuis : résistance, déversement, flèches et vibrations, avec toutes les combinaisons d'actions de l'Eurocode.",
  etapes: [
    { t: "Projet et profilé", html: "Choisir la famille et le profilé, la nuance d'acier ; le bouton d'optimisation propose le plus léger.", cible: "#rHero" },
    { t: "Charges", html: "Charges permanentes et variables (catégorie d'exploitation, neige, vent) : les combinaisons sont générées automatiquement." },
    { t: "Résultats", html: "Verdict, taux par critère (vert, jaune, rouge), diagrammes et réactions aux appuis.", cible: "#rRatios" },
  ],
  faq: [{ q: "Pourquoi le taux est jaune ?", r: "Le profilé est vérifié (≤ 100 %) mais au-delà du taux cible de prédimensionnement : marge réduite pour les aléas d'APS/APD." }],
  liens: [["#rRatios", "resistance", "Résistance des sections"], ["#rRatios", "deversement", "Déversement"], ["#rData", "classes", "Classes de section"], ["#rNotes", "combinaisons", "Combinaisons d'actions"], ["#rNotes", "deplacements", "Flèches et déplacements"]],
});
