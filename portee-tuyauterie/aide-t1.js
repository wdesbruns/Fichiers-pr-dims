/* Aide de T1 — portée entre supports (contenu ; moteur : commun/aide.js) */
AIDE.init({
  titre: "Aide – T1 Portée entre supports",
  intro: "T1 calcule la portée maximale entre deux supports d'une tuyauterie (ou vérifie une portée donnée) en contrainte, en flèche et en fréquence, puis donne la charge sur chaque support.",
  etapes: [
    { t: "Projet et tube", html: "Choisir le DN, le schedule et le matériau (base de données), ou saisir un tube.", cible: "#resMain" },
    { t: "Fluide et calorifuge", html: "Fluide (masse volumique), épaisseur et masse volumique du calorifuge, charges ponctuelles éventuelles." },
    { t: "Modèle et critères", html: "Tuyau continu ou travée isolée, flèche admissible, fréquence minimale, mode « portée maximale » ou « vérification »." },
    { t: "Résultats", html: "Portée retenue (arrondie), critère dimensionnant, charges par support (descente de charges) à reporter dans S1.", cible: "#resReact" },
  ],
  faq: [
    { q: "Quelle portée retenir dans S1 ?", r: "La portée réellement prévue entre supports (inférieure ou égale à celle de T1). Dans S1, la « portée » d'un tuyau est la longueur reprise par le support (moyenne des deux portées voisines)." },
    { q: "Pourquoi la flèche gouverne souvent ?", r: "Pour les petits diamètres, le tuyau est souple : il fléchit avant d'atteindre sa contrainte admissible. La flèche est limitée pour éviter les points bas (rétention, vidange)." },
  ],
  liens: [["#resMain", "portee", "Portée entre supports d'une tuyauterie"], ["#resCrit", "portee", "Portée entre supports d'une tuyauterie"], ["#resReact", "supportage", "Supportage et dilatation"]],
});
