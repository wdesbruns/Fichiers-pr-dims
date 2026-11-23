/* =====================================================================
   CAHIER D'EXÉCUTION — collecte des platines (dimensions et trous issus d'AN1), pièces et profilés à fabriquer,
   DXF de découpe laser (un fichier par platine différente) et classeur Excel associé.
   Entrées globales de la page cahier : K (cahier), an1Type(T), TOPO.retour(clé), CAHIER.repere(T, c).
   Règle : une platine chevillée n'est sortie en fabrication que si AN1 l'a vérifiée (résultat présent, à jour, taux ≤ 100 %).
   ===================================================================== */
const EXEC = (() => {
  const RHO = 7850e-9;                                         // kg/mm³ (acier)
  const f1 = (v) => Math.round(v * 10) / 10, r0 = Math.round;
  const cle = (p) => JSON.stringify([p.lx, p.ly, p.tp, p.nuance, p.trous.map((t) => [Math.round(t.x * 10) / 10, Math.round(t.y * 10) / 10, t.d]).sort((a, b) => a[0] - b[0] || a[1] - b[1])]);
  const nom = (p) => `${p.id}_${p.nuance}_e${p.tp}_${p.lx}x${p.ly}.dxf`;
  function collecter() {
    const plats = new Map(), parConf = {}, problemes = [], avert = [], profils = new Map(), pieces = new Map(), boul = new Map(), supports = [];
    const cumul = (M, k, init, q) => { const o = M.get(k) || M.set(k, { ...init, q: 0 }).get(k); o.q += q; return o; };
    K.types.forEach((T, ti) => {
      if (T.kind !== "s1" || !T.etat) return;
      let G = []; try { G = an1Type(T); } catch (e) { G = []; }
      T.configs.forEach((c) => {
        const R = c.resume, qc = +c.qte || 0; if (!R || !qc) return;
        const rep = CAHIER.repere(T, c), kinds = {}, nuance = R.nuance || "S235"; supports.push({ T, c, rep, qc });
        (R.platines || []).forEach((pl) => {
          let p = { lx: pl.lx, ly: pl.ly, tp: pl.tp, nuance, trous: pl.trous.map((t) => ({ x: t.x, y: t.y, d: t.d })), origine: "S1 – épaisseur et trous provisoires, platine non justifiée" }, chev = "";
          if (pl.aN1) {
            const o = G.find((g) => g.libs.includes(pl.lib)), r = o && TOPO.retour(o.cle), pb = (msg) => problemes.push({ rep, ti, lib: pl.lib, glib: o ? o.lib : pl.lib, msg });
            if (!r) pb("platine non vérifiée dans AN1");
            else if (r.emp !== o.emp) pb("résultat AN1 périmé (efforts modifiés depuis) : relancer AN1");
            else if (!(r.u <= 1)) pb(`platine non conforme dans AN1 (taux ${isFinite(r.u) ? Math.round(r.u * 100) + " %" : "—"})`);
            else if (!r.A || !r.A.length) pb("résultat AN1 sans disposition des chevilles : rouvrir AN1 pour le renvoyer");
            else { p = { lx: r.lx, ly: r.ly, tp: r.tp, nuance: r.nuP || nuance, trous: r.A.map((a) => ({ x: a.x, y: a.y, d: r.df })), origine: "AN1 – vérifiée" };
              chev = `${r.n} × ${r.produit} ${r.diam}${r.cl ? " " + r.cl : ""}, h_ef ${r.hef} mm`; cumul(boul, `Cheville ${r.produit} ${r.diam}${r.cl ? " " + r.cl : ""} – h_ef ${r.hef} mm (AN1)`, { cat: "Chevilles" }, r.n * qc); }
          } else avert.push({ rep, ti, lib: pl.lib, msg: pl.mode === "crap" ? "platine crapautée : épaisseur par défaut 12 mm, à justifier" : "platine non chevillée : épaisseur par défaut 12 mm, à justifier" });
          const k = cle(p), g = plats.get(k) || plats.set(k, { ...p, qte: 0, sup: new Set(), cles: k }).get(k);
          g.qte += qc * (pl.cp ? 2 : 1); g.sup.add(rep);
          kinds[pl.k] = { cle: k, chev, lib: pl.lib };
          if (pl.mode === "tige" || R.fix.mode === "sand") cumul(boul, `Tige filetée M${R.fix.d} cl. ${R.fix.cl} (écrous, rondelles)`, { cat: "Tiges" }, 4 * qc);
          if (pl.mode === "crap") cumul(boul, "Crapaud / pince-poutre (sur profilé existant)", { cat: "Crapauds" }, 4 * qc);
        });
        parConf[T.id + "|" + c.id] = kinds;
        (R.barres || []).forEach((b) => { const L = r0(b.L * 1000), g = cumul(profils, `${b.profil}|${nuance}|${L}`, { profil: b.profil, nuance, L, m: b.m, sup: new Set() }, qc); g.sup.add(rep); });
        (R.pieces || []).forEach((q) => { const g = cumul(pieces, `${q.lib}|${q.L}|${q.l}|${q.e}|${q.nuance}`, { lib: q.lib, L: q.L, l: q.l, e: q.e, nuance: q.nuance === "= tuyauterie" ? "= tuyauterie" : q.nuance, sup: new Set() }, q.q * qc); g.sup.add(rep); });
        (R.tuyaux || []).forEach((t) => { if (t.d) cumul(boul, `Étrier M${t.d} pour ${t.dn ? "DN" + t.dn : "Ø" + f1(t.De)} + écrous`, { cat: "Étriers" }, qc); });
      });
    });
    const L = [...plats.values()].sort((a, b) => a.tp - b.tp || a.lx * a.ly - b.lx * b.ly);
    L.forEach((p, i) => { p.id = "PL-" + String(i + 1).padStart(2, "0"); p.fichier = nom(p); p.sup = [...p.sup]; });
    const byKey = Object.fromEntries(L.map((p) => [p.cles, p]));
    Object.values(parConf).forEach((kinds) => Object.keys(kinds).forEach((k) => { const p = byKey[kinds[k].cle]; Object.assign(kinds[k], { id: p.id, lx: p.lx, ly: p.ly, tp: p.tp, trous: p.trous }); }));
    return { plats: L, parConf, problemes, avert, supports,
      profils: [...profils.values()].map((p) => ({ ...p, sup: [...p.sup] })).sort((a, b) => a.profil.localeCompare(b.profil, "fr", { numeric: true }) || b.L - a.L),
      pieces: [...pieces.values()].map((p) => ({ ...p, sup: [...p.sup] })), boul: [...boul.entries()].map(([k, v]) => ({ des: k, ...v })) };
  }
  /* repères de fabrication : platines PL-xx, pièces P-xx, profilés S-xx */
  function lignesFab(D) {
    const L = [];
    D.plats.forEach((p) => L.push({ sec: "Platines (découpe laser)", rep: p.id, des: `Platine ${p.lx} × ${p.ly} × ${p.tp}${p.trous.length ? ` – ${p.trous.length} trous Ø${p.trous[0].d}` : ""}`, nuance: p.nuance, L: p.lx, l: p.ly, e: p.tp, q: p.qte, mu: f1(p.lx * p.ly * p.tp * RHO - p.trous.reduce((s, t) => s + Math.PI * t.d * t.d / 4 * p.tp * RHO, 0)), sup: p.sup.join(", "), dxf: p.fichier }));
    D.pieces.forEach((p, i) => L.push({ sec: "Tôles, plats et goussets (L × l × e)", rep: "P-" + String(i + 1).padStart(2, "0"), des: p.lib, nuance: p.nuance, L: p.L, l: p.l, e: p.e, q: p.q, mu: f1(p.L * p.l * p.e * RHO), sup: p.sup.join(", ") }));
    D.profils.forEach((p, i) => L.push({ sec: "Profilés (longueurs de débit)", rep: "S-" + String(i + 1).padStart(2, "0"), des: p.profil, nuance: p.nuance, L: p.L, l: "", e: "", q: p.q, mu: f1(p.m * p.L / 1000), sup: p.sup.join(", ") }));
    D.boul.forEach((b) => L.push({ sec: "Boulonnerie et fixations", rep: "", des: b.des, nuance: "", L: "", l: "", e: "", q: b.q, mu: "", sup: "" }));
    return L;
  }
  function fichiersDXF(D) { return D.plats.map((p) => ({ nom: p.fichier, donnees: LASER.dxf({ lx: p.lx, ly: p.ly, trous: p.trous, repere: p.id, matiere: p.nuance, ep: p.tp }) })); }
  function classeur(D, aff) {
    const wb = XLSX.utils.book_new(), add = (n, aoa, w) => { const ws = XLSX.utils.aoa_to_sheet(aoa); ws["!cols"] = w.map((x) => ({ wch: x })); XLSX.utils.book_append_sheet(wb, ws, n); };
    add("Platines laser", [["N°", "Repère", "Fichier DXF", "Matière", "Épaisseur (mm)", "L (mm)", "l (mm)", "Nb trous", "Ø trous (mm)", "Quantité totale", "Origine", "Supports concernés"],
      ...D.plats.map((p, i) => [i + 1, p.id, p.fichier, p.nuance, p.tp, p.lx, p.ly, p.trous.length, p.trous.length ? p.trous[0].d : "", p.qte, p.origine, p.sup.join(", ")]),
      [], ["", "", "", "", "", "", "", "", "Total platines", D.plats.reduce((s, p) => s + p.qte, 0)]], [5, 9, 38, 9, 14, 9, 9, 9, 12, 15, 48, 40]);
    const F = lignesFab(D);
    add("Nomenclature fabrication", [["Section", "Repère", "Désignation", "Matière", "L (mm)", "l (mm)", "e (mm)", "Quantité", "Masse unitaire (kg)", "Masse totale (kg)", "Supports concernés", "Fichier DXF"],
      ...F.map((r) => [r.sec, r.rep, r.des, r.nuance, r.L, r.l, r.e, r.q, r.mu, r.mu === "" ? "" : f1(r.mu * r.q), r.sup, r.dxf || ""])], [30, 9, 60, 14, 9, 9, 9, 10, 16, 16, 40, 38]);
    add("Supports", [["Repère", "Quantité", "Profilés", "Platines"], ...D.supports.map((s) => [s.rep, s.qc, (s.c.resume.profils || []).join(" + "), Object.values(D.parConf[s.T.id + "|" + s.c.id] || {}).map((k) => k.id).join(", ")])], [16, 10, 40, 24]);
    add("Lisez-moi", [["Cahier d'exécution – " + (aff || "")], ["Platines : un fichier DXF de découpe laser par platine différente (calque DECOUPE : contour et trous, calque REPERE : repère à graver ou ignorer ; unité mm ; origine au coin inférieur gauche)."], ["Dimensions, épaisseurs et perçages des platines chevillées : valeurs vérifiées dans AN1 (NF EN 1992-4) ; aucune platine chevillée n'est sortie sans vérification AN1 à jour."], ["Longueurs de débit : longueurs d'axe du modèle de calcul, coupes d'extrémité à confirmer en fabrication."], ["Masses : acier 7 850 kg/m³, platines hors perçages de fixation éventuels non dessinés."]], [120]);
    return XLSX.write(wb, { bookType: "xlsx", type: "array", compression: true });
  }
  return { collecter, lignesFab, fichiersDXF, classeur, nom };
})();
