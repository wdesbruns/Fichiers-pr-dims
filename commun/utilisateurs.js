/* =====================================================================
   COMPTES AUTORISÉS
   ---------------------------------------------------------------------
   Une ligne par utilisateur : identifiant + empreinte du mot de passe.
   Le mot de passe n'est JAMAIS écrit ici en clair.

   Pour ajouter ou changer un mot de passe :
     1. Connecte-toi, puis ouvre la page « commun/empreinte.html »
        (lien « Gérer les comptes » en bas de l'accueil).
     2. Saisis l'identifiant et le nouveau mot de passe.
     3. Copie la ligne générée et colle-la ci-dessous, en remplaçant
        TOUTE l'ancienne ligne du même identifiant (de « { » à « }, »).
        Chaque ligne doit avoir exactement la forme :
          { u: "identifiant", h: "64 caractères 0-9 a-f" },

   (Le mot de passe provisoire livré à l'origine a été remplacé.)
   ===================================================================== */
const CALC_UTILISATEURS = [
  { u: "admin", h: "690b28ccf65d50a0725673e516c890ae3f8652b41250e71c563cf50a6d68e6bb" },
];
