/* =====================================================================
   MOTEUR ACIER COMMUN — FIP Calculettes (poutre P1 / poteau P2)
   NF EN 1990 + AN, NF EN 1991-1-1 + AN, NF EN 1993-1-1 + AN
   Unités internes : kN, m, MPa (N/mm²) ; caractéristiques de section en cm (base PROFILS)
   ===================================================================== */
const ACIER = { E: 210000, G: 81000, gM0: 1.0, gM1: 1.0, g: 9.81 };   // AN française : γM0 = γM1 = 1,0
const NUANCES = { S235: [235, 215, 360], S275: [275, 255, 430], S355: [355, 335, 490] }; // fy t≤40 / 40<t≤80 / fu (EN 1993-1-1 Tab. 3.1)

/* ---------- Catégories d'actions et coefficients ψ (NF EN 1990 Tab. A1.1 + AN) ---------- */
const CAT_Q = {
  A: { n: "A – habitation, résidentiel", psi: [0.7, 0.5, 0.3] },
  B: { n: "B – bureaux", psi: [0.7, 0.5, 0.3] },
  C: { n: "C – lieux de réunion", psi: [0.7, 0.7, 0.6] },
  D: { n: "D – commerces", psi: [0.7, 0.7, 0.6] },
  E: { n: "E – stockage", psi: [1.0, 0.9, 0.8] },
  H: { n: "H – toitures inaccessibles (sauf entretien)", psi: [0.0, 0.0, 0.0] },
};
const PSI_NEIGE = (alt1000) => alt1000 ? [0.7, 0.5, 0.2] : [0.5, 0.2, 0.0];
const PSI_VENT = [0.6, 0.2, 0.0];

/* Limites de flèche (NF EN 1993-1-1/NA §7.2.1, Tab. 7.1 – reprises du classeur) */
const UTILISATIONS = [
  { n: "Toiture en général", wmax: 200, w3: 250, plancher: false },
  { n: "Toiture supportant fréquemment du personnel autre que l'entretien", wmax: 200, w3: 300, plancher: false },
  { n: "Plancher en général", wmax: 200, w3: 300, plancher: true },
  { n: "Plancher/toiture supportant cloisons ou matériaux fragiles/rigides", wmax: 250, w3: 350, plancher: true },
  { n: "Plancher supportant des poteaux", wmax: 400, w3: 500, plancher: true },
  { n: "wmax pouvant nuire à l'aspect du bâtiment", wmax: 250, w3: null, plancher: false },
];
const LOCAUX_FREQ = [{ n: "Habitation / bureau", f: 2.6 }, { n: "Gymnase / salle de danse", f: 5.0 }, { n: "Sans objet (pas de vérification)", f: 0 }];

/* ---------- Utilitaires ---------- */
const fmtN = (x, d = 2) => (typeof x === "number" && isFinite(x)) ? x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";
const escH = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const profil = (n) => PROFILS.find((p) => p.n === n);
const FAM_CLASSIQUES = ["IPE", "HEA", "HEB", "HEM", "IPN", "UPN", "UPE"];
const familles = (toutes) => [...new Set(PROFILS.map((p) => p.f))].filter((f) => toutes || FAM_CLASSIQUES.includes(f));
function fyDe(nuance, p) { const t = Math.max(p.tf || 0, p.tw || 0); return t > 40 ? NUANCES[nuance][1] : NUANCES[nuance][0]; }
const epsilon = (fy) => Math.sqrt(235 / fy);

/* =====================================================================
   COMBINAISONS D'ACTIONS (NF EN 1990 §6.4.3.2 éq. 6.10 et §6.5.3 + AN)
   vars : [{id, nom, psi:[ψ0,ψ1,ψ2], grp?, exclut?:[ids]}]  (seules les actions non nulles)
   ===================================================================== */
function genererCombinaisons(vars) {
  const etats = [];             // 0 = absente, 1 = accompagnement, 2 = dominante
  const rec = (i, cur) => {
    if (i === vars.length) { etats.push(cur.slice()); return; }
    for (const e of [0, 1, 2]) { cur[i] = e; rec(i + 1, cur); }
  };
  rec(0, []);
  const valides = etats.filter((st) => {
    const nLead = st.filter((e) => e === 2).length, nAcc = st.filter((e) => e === 1).length;
    if (nLead > 1 || (nAcc > 0 && nLead === 0)) return false;
    for (let i = 0; i < vars.length; i++) for (let j = i + 1; j < vars.length; j++) {
      if (!st[i] || !st[j]) continue;
      const a = vars[i], b = vars[j];
      if (a.grp && a.grp === b.grp) return false;                                   // ex. vent cas 1 / cas 2
      if ((a.exclut || []).includes(b.id) || (b.exclut || []).includes(a.id)) return false; // ex. H et neige/vent
    }
    for (let i = 0; i < vars.length; i++) if (st[i] === 1 && vars[i].psi[0] === 0) return false; // ψ0 = 0 : inutile
    return true;
  });
  const nom = (f) => Object.entries(f).filter(([, v]) => v).map(([k, v]) => `${v.toLocaleString("fr-FR", { maximumFractionDigits: 3 })}·${k}`).join(" + ");
  const ELU = [], CAR = [];
  for (const st of valides) {
    for (const gG of [1.35, 1.0]) {
      const f = { G: gG };
      vars.forEach((v, i) => { if (st[i] === 2) f[v.id] = 1.5; if (st[i] === 1) f[v.id] = 1.5 * v.psi[0]; });
      ELU.push({ f, nom: nom(f), type: "ELU" });
    }
    const f = { G: 1 };
    vars.forEach((v, i) => { if (st[i] === 2) f[v.id] = 1; if (st[i] === 1) f[v.id] = v.psi[0]; });
    CAR.push({ f, nom: nom(f), type: "ELS car." });
  }
  const fq = { G: 1 }; vars.forEach((v) => { if (v.psi[2]) fq[v.id] = v.psi[2]; });
  const QP = [{ f: fq, nom: nom(fq), type: "ELS q.p." }];
  return { ELU, CAR, QP };
}

/* =====================================================================
   SECTIONS (NF EN 1993-1-1 §5.5, Tab. 5.2)
   ===================================================================== */
function classeSection(p, fy, sollic) {          // sollic : 'flexion' | 'compression'
  if (!(p.tw && p.tf && p.b)) return { cl: null, txt: "non vérifiée (dimensions absentes de la base)" };
  const e = epsilon(fy), U = /^U/.test(p.f);
  if (/^LI?$/.test(p.f)) {                                   // cornières – Tab. 5.2 feuille 3 : classe 3 ou 4
    const r1 = p.h / p.t, r2 = (p.b + p.h) / (2 * p.t), cl = (r1 <= 15 * e && r2 <= 11.5 * e) ? 3 : 4;
    return { cl, txt: `classe ${cl} (cornière : h/t = ${fmtN(r1, 1)} ≤ 15ε = ${fmtN(15 * e, 1)} ; (b+h)/2t = ${fmtN(r2, 1)} ≤ 11,5ε = ${fmtN(11.5 * e, 1)})` };
  }
  if (p.f === "CHS") {                                        // tubes ronds – Tab. 5.2 feuille 3 : d/t
    const r = p.h / p.t, cl = r <= 50 * e * e ? 1 : r <= 70 * e * e ? 2 : r <= 90 * e * e ? 3 : 4;
    return { cl, txt: `classe ${cl} (tube rond : d/t = ${fmtN(r, 1)} ; 50ε² = ${fmtN(50 * e * e, 1)})` };
  }
  if (p.f === "SHS" || p.f === "RHS") {                       // tubes rectangulaires – parois internes, c = h − 3t
    const cfl = (p.b - 3 * p.t) / p.t, cw = (p.h - 3 * p.t) / p.t, lim = sollic === "flexion" ? [72, 83, 124] : [33, 38, 42];
    const cF = cfl <= 33 * e ? 1 : cfl <= 38 * e ? 2 : cfl <= 42 * e ? 3 : 4, cW = cw <= lim[0] * e ? 1 : cw <= lim[1] * e ? 2 : cw <= lim[2] * e ? 3 : 4;
    const cl = Math.max(cF, cW);
    return { cl, clF: cF, clW: cW, txt: `classe ${cl} (paroi comprimée c/t = ${fmtN(cfl, 1)} → cl. ${cF} ; âme c/t = ${fmtN(cw, 1)} → cl. ${cW}, ε = ${fmtN(e, 3)})` };
  }
  const cf = (U ? p.b - p.tw - p.r : (p.b - p.tw - 2 * p.r) / 2) / p.tf;   // semelle comprimée (console) ; tf moyen pour ailes inclinées
  const cw = (p.h - 2 * p.tf - 2 * p.r) / p.tw;            // âme
  const clF = cf <= 9 * e ? 1 : cf <= 10 * e ? 2 : cf <= 14 * e ? 3 : 4;
  const lim = sollic === "flexion" ? [72, 83, 124] : [33, 38, 42];
  const clW = cw <= lim[0] * e ? 1 : cw <= lim[1] * e ? 2 : cw <= lim[2] * e ? 3 : 4;
  const cl = Math.max(clF, clW);
  return { cl, clF, clW, cf, cw, e, txt: `classe ${cl} (semelle c/t = ${fmtN(cf, 1)} → cl. ${clF} ; âme c/t = ${fmtN(cw, 1)} → cl. ${clW}, ε = ${fmtN(e, 3)})` };
}

/* Courbes de flambement (Tab. 6.2, profils laminés en I, S235 à S420) */
const ALPHA = { a0: 0.13, a: 0.21, b: 0.34, c: 0.49, d: 0.76 };
function courbes(p) {
  if (p.ay) return { y: p.ay, z: p.az, cy: "classeur", cz: "classeur", lt: p.aLT, clt: "classeur" };
  const hb = p.h / p.b; let cy, cz;
  if (hb > 1.2) { if (p.tf <= 40) { cy = "a"; cz = "b"; } else { cy = "b"; cz = "c"; } }
  else { if (p.tf <= 100) { cy = "b"; cz = "c"; } else { cy = "d"; cz = "d"; } }
  const clt = hb <= 2 ? "a" : "b";                         // §6.3.2.2, Tab. 6.4 (cas général, laminés)
  return { y: ALPHA[cy], z: ALPHA[cz], cy, cz, lt: ALPHA[clt], clt };
}
function chi(lam, alpha) {                                  // §6.3.1.2 éq. (6.49) ; idem χLT cas général (6.56)
  if (lam <= 0.2) return { chi: 1, phi: 0.5 * (1 + alpha * (lam - 0.2) + lam * lam) };
  const phi = 0.5 * (1 + alpha * (lam - 0.2) + lam * lam);
  return { chi: Math.min(1, 1 / (phi + Math.sqrt(phi * phi - lam * lam))), phi };
}
/* Moment critique de déversement (NCCI SN003 – formule à 3 facteurs, k = kw = 1)  [kNm] */
function Mcr(p, L, C1, C2, zg) {
  const E = ACIER.E * 1e6, G = ACIER.G * 1e6, Iz = p.Iz * 1e-8, It = p.It * 1e-8, Iw = p.Iw * 1e-12;
  const a = Math.PI ** 2 * E * Iz / (L * L);
  return C1 * a * (Math.sqrt(Iw / Iz + L * L * G * It / (Math.PI ** 2 * E * Iz) + (C2 * zg) ** 2) - C2 * zg) / 1000;
}

/* =====================================================================
   AFFICHAGE COMMUN
   ===================================================================== */
/* Code couleur des taux : vert ≤ seuil, JAUNE entre le seuil (90 % par défaut) et 100 % (avertissement non bloquant), rouge > 100 % */
const SEUIL_TAUX = 0.9, JAUNE = "#d4a300";
function barresRatios(lignes, seuil = SEUIL_TAUX) {          // [{n, ref, val, lim, r, unit, comb, gov}]
  return `<table class="ratios"><tr><th>Vérification</th><th class="n">Sollicitation</th><th class="n">Résistance / limite</th><th>Taux</th><th></th></tr>` +
    lignes.map((l) => {
      const w = Math.min(100, l.r * 100), col = l.r > 1 ? "var(--bad)" : l.r > seuil ? JAUNE : "var(--ok)";
      return `<tr class="${l.gov ? "gov" : ""}"><td>${l.n}${l.gov ? ' <span class="badge b-gov">▲ DIMENSIONNANT</span>' : ""}<div class="note">${l.ref || ""}${l.comb ? " · " + escH(l.comb) : ""}</div></td>
      <td class="n">${l.val}</td><td class="n">${l.lim}</td>
      <td style="min-width:120px"><div class="bar"><i style="width:${w}%;background:${col}"></i></div><b style="color:${col}">${fmtN(l.r * 100, 0)} %</b></td>
      <td>${l.r > 1 ? '<span class="badge b-bad">▲ NON VÉRIFIÉ</span>' : l.r > seuil ? '<span class="badge b-jaune">⚠ OK – taux élevé</span>' : '<span class="badge b-ok">● OK</span>'}</td></tr>`;
    }).join("") + "</table>";
}
const badgeTaux = (r, seuil = SEUIL_TAUX) => r > 1 ? '<span class="badge b-bad">▲ NON VÉRIFIÉ</span>' : r > seuil ? '<span class="badge b-jaune">⚠ taux élevé</span>' : '<span class="badge b-ok">● OK</span>';
function alerteTaux(lignes, seuil = SEUIL_TAUX) {          // message non bloquant pour les taux entre le seuil et 100 %
  const L = lignes.filter((l) => l.r > seuil && l.r <= 1);
  if (!L.length) return "";
  return `<div class="msg jaune">⚠ <b>Taux de travail élevé</b> (&gt; ${fmtN(seuil * 100, 0)} %, non bloquant) : ${L.map((l) => `${String(l.n).replace(/<(?!\/?su[bp]>)[^>]+>/g, "")} – ${fmtN(l.r * 100, 0)} %`).join(" ; ")}. Marge faible en phase APS/APD : à confirmer en exécution (Robot…).</div>`;
}
function svgSection(p, larg = 170) {                        // coupe du profilé à l'échelle
  const h = p.h, b = p.b || p.h * 0.45, tw = p.tw || Math.max(5, h / 30), tf = p.tf || Math.max(7, h / 18);
  const k = (larg - 60) / Math.max(h, b), H = h * k, B = b * k, TW = tw * k, TF = tf * k, x0 = 30 + (larg - 60 - B) / 2, y0 = 18;
  const U = /^U/.test(p.f);
  const forme = U
    ? `M${x0},${y0} h${B} v${TF} h${-(B - TW)} v${H - 2 * TF} h${B - TW} v${TF} h${-B} z`
    : `M${x0},${y0} h${B} v${TF} h${-(B - TW) / 2} v${H - 2 * TF} h${(B - TW) / 2} v${TF} h${-B} v${-TF} h${(B - TW) / 2} v${-(H - 2 * TF)} h${-(B - TW) / 2} z`;
  return `<svg viewBox="0 0 ${larg} ${H + 52}" style="width:100%;max-width:${larg}px">
    <path d="${forme}" fill="#cfd8e3" stroke="#171a1e" stroke-width="1.2"/>
    <line x1="${x0 - 10}" y1="${y0 + H / 2}" x2="${x0 + B + 10}" y2="${y0 + H / 2}" stroke="#e30009" stroke-dasharray="4 3" stroke-width=".8"/><text x="${x0 + B + 12}" y="${y0 + H / 2 + 3}" font-size="10" fill="#e30009">y</text>
    <line x1="${U ? x0 + TW / 2 + 6 : x0 + B / 2}" y1="${y0 - 8}" x2="${U ? x0 + TW / 2 + 6 : x0 + B / 2}" y2="${y0 + H + 8}" stroke="#0098db" stroke-dasharray="4 3" stroke-width=".8"/><text x="${(U ? x0 + TW / 2 + 6 : x0 + B / 2) + 3}" y="${y0 + H + 14}" font-size="10" fill="#0098db">z</text>
    <text x="${x0 + B / 2}" y="${y0 + H + 30}" font-size="11" text-anchor="middle" font-weight="700">${escH(p.n)}</text>
    <text x="${x0 + B / 2}" y="${y0 + H + 44}" font-size="9.5" text-anchor="middle" fill="#5f6670">h = ${fmtN(h, 0)}${p.b ? " · b = " + fmtN(p.b, 0) : ""}${p.tw ? " · tw = " + fmtN(p.tw, 1) + " · tf = " + fmtN(p.tf, 1) : ""} mm</text></svg>`;
}
/* Diagramme (V, M, flèche) : xs en m, ys valeurs ; retourne SVG */
function svgDiagramme(xs, ys, { titre, unite, couleur = "#114088", inverse = false, h = 120, w = 560, marque }) {
  const L = xs[xs.length - 1], ymax = Math.max(1e-9, ...ys.map(Math.abs)), m = { l: 46, r: 14, t: 18, b: 16 };
  const X = (x) => m.l + x / L * (w - m.l - m.r), Y = (y) => m.t + (h - m.t - m.b) / 2 - (inverse ? -1 : 1) * y / ymax * (h - m.t - m.b) / 2;
  const pts = xs.map((x, i) => `${X(x)},${Y(ys[i])}`).join(" ");
  let iMax = 0; ys.forEach((y, i) => { if (Math.abs(y) > Math.abs(ys[iMax])) iMax = i; });
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;max-width:${w}px">
    <text x="4" y="12" font-size="11" font-weight="700" fill="${couleur}">${titre}</text>
    <line x1="${m.l}" y1="${Y(0)}" x2="${w - m.r}" y2="${Y(0)}" stroke="#8a929c"/>
    <polygon points="${X(0)},${Y(0)} ${pts} ${X(L)},${Y(0)}" fill="${couleur}" fill-opacity=".14" stroke="none"/>
    <polyline points="${pts}" fill="none" stroke="${couleur}" stroke-width="2"/>
    <circle cx="${X(xs[iMax])}" cy="${Y(ys[iMax])}" r="3.5" fill="#e30009"/>
    <text x="${Math.min(Math.max(X(xs[iMax]) + 6, 190), w - 170)}" y="${Math.max(Y(ys[iMax]) + (ys[iMax] * (inverse ? -1 : 1) >= 0 ? -6 : 14), 26)}" font-size="11" fill="#e30009" font-weight="700">${marque || fmtN(ys[iMax], 2) + " " + unite} (x = ${fmtN(xs[iMax], 2)} m)</text></svg>`;
}
