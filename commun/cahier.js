/* =====================================================================
   CAHIER DE SUPPORTAGE — stockage commun et informations d'affaire
   Stockage : navigateur (localStorage « fip.cahier »), export / import .json
   Utilisé par : cahier/ (gestion), supports/ (ajout, édition), toutes les
   calculettes (remplissage automatique des champs d'affaire), export Word (cartouche)
   ===================================================================== */
const CAHIER = (() => {
  const CLE = "fip.cahier";
  const PARAMS = [                                            // paramètres communs de l'affaire appliqués à chaque support S1
    ["rCible", "Taux cible APS/APD (%)", 90], ["platine", "Platines (rigide / semi / saisie)", "semi"], ["Sj", "S_j saisie (kNm/rad)", 500],
    ["jeu", "Jeu J des entraxes (mm)", 50], ["dlim", "Déplacement ≤ L / …", 150], ["dmax", "Déplacement maxi (mm)", 5],
    ["cft", "c_f tuyau", 1.2], ["cfp", "c_f profilé", 2.0], ["mus", "μ₁·Ce·Ct (neige)", 0.8], ["altN", "Neige : altitude > 1000 m (0/1)", "0"],
    ["zH", "Séisme : z/H", 1], ["TaT", "Séisme : Ta/T1", 1], ["qa", "Séisme : q_a", 1], ["ga", "Séisme : γ_a", 1],
    ["rTmin", "Épaisseur mini (mm)", 4], ["rGarde", "Garde au sol mini (mm)", 150], ["rElanc", "Élancement Lcr/i maxi", 200],
    ["rConsole", "Porte-à-faux sans jambe de force ≤ (m)", 1.2], ["rMontant", "Montant / suspente ≤ (m)", 2.5], ["rBerceau", "Étrier jusqu'au DN", 250],
    ["rBord", "Distance mini tuyau – bord (mm)", 50], ["rTors", "Alerte torsion (% fy/√3)", 30]];
  /* Modèle (version 2) : types[] = { id, nom (ST-01 / SPE-1), kind 's1'|'spe', designation, etat (S1), cotesDef, cotes0, vues,
       plan, masse (spe), ddc (spe), configs: [{ id, n, qte, reperes, lignes, cotes (écarts / cotes0), resume }] } */
  const REGLAGES = { prefST: "ST-", prefSPE: "SPE-", chev: 4, majo: 10 };
  const vide = () => ({ version: 2, reglages: { ...REGLAGES }, rapport: { niveau: "simple" }, affaire: { num: "", intitule: "", client: "", site: "", doc: "", indice: "A", date: new Date().toISOString().slice(0, 10), phase: "APS", realise: "", controle: "", approuve: "", logo: "" },
    params: Object.fromEntries(PARAMS.map(([k, , d]) => [k, d])), climat: null, types: [] });
  function migrer(o) {                                         // version 1 (supports[]) → version 2 (types[] + configurations)
    if (o.version === 1) {
      o.types = (o.supports || []).map((s) => ({ id: s.id, nom: s.nom, kind: "s1", designation: "", etat: s.etat, resume: s.resume,
        configs: [{ id: uid(), n: 1, qte: s.qte, reperes: s.reperes, lignes: s.lignes, cotes: {}, resume: s.resume }] }));
      o.reglages = { ...REGLAGES, majo: o.majo ?? 10 }; delete o.supports; delete o.majo; o.version = 2;
    }
    o.reglages = { ...REGLAGES, ...(o.reglages || {}) }; o.rapport = o.rapport || { niveau: "simple" }; o.types = o.types || [];
    return o;
  }
  function lire() { try { const o = JSON.parse(localStorage.getItem(CLE)); if (o && o.version) { o.params = { ...vide().params, ...(o.params || {}) }; return migrer(o); } } catch (e) { } return vide(); }
  function ecrire(o) { try { localStorage.setItem(CLE, JSON.stringify(o)); return true; } catch (e) { alert("Enregistrement impossible dans ce navigateur (stockage plein ou désactivé). Exporter le cahier en .json."); return false; } }
  const existe = () => { try { return !!localStorage.getItem(CLE); } catch (e) { return false; } };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const repere = (t, c) => t.nom + "." + c.n;
  const libAffaire = (a) => [a.num, a.intitule].filter(Boolean).join(" – ");
  /* Remplit les champs vides d'une calculette avec les informations d'affaire.
     carte : { idChamp: clé } avec clé ∈ affaire, doc, realise, client… ou fonction(a) */
  function remplir(carte) {
    if (!existe()) return; const a = lire().affaire;
    Object.entries(carte).forEach(([id, k]) => {
      const el = document.getElementById(id); if (!el || el.value) return;
      const v = typeof k === "function" ? k(a) : k === "affaire" ? libAffaire(a) : k === "doc" ? [a.doc, a.indice && "ind. " + a.indice].filter(Boolean).join(" ") : a[k];
      if (v) { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }
    });
  }
  return { CLE, PARAMS, REGLAGES, vide, migrer, repere, lire, ecrire, existe, uid, libAffaire, remplir };
})();
