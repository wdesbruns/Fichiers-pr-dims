/* Aide du cahier de supportage (contenu ; moteur : commun/aide.js) */
AIDE.init({
  titre: "Aide – Cahier de supportage",
  intro: "Le cahier regroupe tous les supports de l'affaire : types (ST-01…), configurations (ST-01.1, ST-01.2… : même support, cotes différentes), supports spéciaux (SPE-1…), nomenclature et descentes de charges.",
  etapes: [
    { t: "Renseigner l'affaire", html: "Numéro, client, document, indice, réalisé / contrôlé / approuvé, logo du client. Ces champs se reportent dans toutes les calculettes et dans le cartouche Word.", cible: "#a_num" },
    { t: "Ajouter des supports", html: "« ➕ Type calculé (S1) » ouvre S1 : y dessiner le support puis « Ajouter au cahier ». « ➕ Type à calculer » réserve un repère et une quantité. « ➕ Support spécial » sert aux supports dessinés à part (arbre de Noël…).", cible: "#cGestion" },
    { t: "Créer des configurations", html: "Le bouton ⧉ d'une ligne crée une configuration : modifier seulement les cotes (en mm). Une cote sur fond jaune est propre à la configuration.", cible: "#rGestion" },
    { t: "Paramètres communs", html: "Taux cible, règles de conception, climat C1 : ils s'appliquent à tous les supports. « ⟳ Recalculer tout » met les résultats à jour.", cible: "#params" },
    { t: "Choisir le contenu et sortir le cahier", html: "Modèle BOM, simplifié ou complet (ou cases à cocher), puis Word, Excel ou Imprimer. Penser à exporter le .json pour archiver.", cible: "#niveau" },
  ],
  liens: [["#secRecap", "combinaisons", "Combinaisons et enveloppes"], ["#secBom", "assemblages", "Fixations"]],
  faq: [
    { q: "Type ou configuration ?", r: "Un <b>type</b> = un dessin de support (profilés, tuyaux, actions). Une <b>configuration</b> = le même support avec une ou plusieurs cotes différentes (hauteur, longueur, position des tuyaux). Changer de profilé ou de DN = nouveau type." },
    { q: "Pourquoi « à recalculer » ?", r: "Une cote ou un paramètre commun a changé : cliquer « ⟳ Recalculer tout »." },
    { q: "Où sont enregistrées les données ?", r: "Dans le navigateur de ce poste. Pour les garder ou les transmettre, exporter le fichier .json (et l'importer sur l'autre poste)." },
  ],
  bulles: {
    niveau: "BOM : nomenclature seule. Simplifié : plans types cotés, quantités, repérage. Complet : + vérifications et descentes de charges.",
    g_chev: "Nombre de chevilles comptées par platine dans la nomenclature (si fixation par chevilles).",
    g_majo: "Majoration de masse pour platines, goussets, boulons et soudures (en % de la masse des profilés).",
  },
});
