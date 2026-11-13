/* =====================================================================
   COEFFICIENTS DE PRESSION ET DE FORCE — VENT (C1)
   NF EN 1991-1-4 (valeurs recommandées retenues par l'AN : clauses 7.2.2, 7.2.8, 7.4.1, 7.6, 7.8…)
   NF EN 1991-1-4/NA (2008) : profilés §7.7 (figures 7.39 à 7.50 NA), c_pi (7.2.9), acrotères (7.4.1)
   CNC2M N0380 « REC EC1-CM » (juillet 2017) : toitures isolées à un versant (§5, Tableaux 2 et 3), c_s·c_d
   des éléments secondaires (§6), c_pe,10 (§7), défaut de corrélation k_dc (§8)
   Valeurs saisies d'après les textes ; à vérifier par l'ingénieur.
   ===================================================================== */
const CV = (() => {
  const lerp = (x, x0, x1, y0, y1) => y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  /* interpolation linéaire dans un tableau [[x, valeur ou tableau]] (bornée aux extrémités) ; null traité comme 0 */
  function interp(T, x) {
    const v = (e) => (e === null || e === undefined ? 0 : e);
    if (x <= T[0][0]) return T[0][1];
    if (x >= T[T.length - 1][0]) return T[T.length - 1][1];
    for (let i = 1; i < T.length; i++) if (x <= T[i][0]) {
      const [x0, a] = T[i - 1], [x1, b] = T[i];
      return Array.isArray(a) ? a.map((ai, k) => lerp(x, x0, x1, v(ai), v(b[k]))) : lerp(x, x0, x1, v(a), v(b));
    }
  }

  /* ---------- 1. Profilés : figures 7.39(NA) à 7.50(NA) — c_x, c_y, c_T, c_N (A_ref = e·ℓ) ----------
     forme : points du contour (en unités de e, N horizontal vers la droite, T vers le haut) pour la largeur projetée */
  const r2 = Math.SQRT1_2;
  const PROFILS = [
    { id: "L", fig: "7.39", lib: "Cornière à ailes égales", fam: ["L"], pts: [[0, 0], [-r2, r2], [-r2, -r2]],
      t: [[0, 2.48, 0, 1.75, 1.75], [45, 1.80, -2.15, 1.80, 2.15], [90, 1.70, 0.70, 0.70, -1.70], [135, 1.90, -0.20, 0.20, -1.90], [180, 1.85, 0, -1.30, -1.30]] },
    { id: "U", fig: "7.40", lib: "U (UPN, UPE)", fam: ["UPN", "UPE", "U"], pts: [[0, -0.5], [0.5, -0.5], [0.5, 0.5], [0, 0.5]],
      t: [[0, 2.00, 0, 0, 2.00], [45, 1.70, -0.85, 0.60, 1.80], [90, 0.60, 0, 0.60, 0], [135, 1.42, 0.85, 0.40, -1.60], [180, 1.80, 0, 0, -1.80]] },
    { id: "LI", fig: "7.41", lib: "Cornière à ailes inégales", fam: ["LI"], pts: [[0, -0.5], [0, 0.5], [-0.5, 0.5]],
      t: [[0, 2.00, 1.00, 1.00, 2.00], [45, 1.80, -0.67, 0.80, 1.80], [90, 0.80, -2.00, 0.80, 2.00], [135, 1.17, 1.03, 0.10, -1.55], [180, 2.00, -0.10, 0.10, -2.00]] },
    { id: "T45", fig: "7.42", lib: "Té (âme 0,45·e)", fam: [], pts: [[0, -0.5], [0, 0.5], [0.45, 0]],
      t: [[0, 1.50, 0, 0, 1.50], [45, 1.13, -0.92, 0.15, 1.45], [90, 0.90, 0.70, 0.90, -0.70], [135, 0.92, -0.57, 1.05, -0.25], [180, 1.45, 0, 0, -1.45]] },
    { id: "T1", fig: "7.43", lib: "Té (âme e)", fam: [], pts: [[0, -0.5], [0, 0.5], [-1, 0]],
      t: [[0, 1.60, 0, 0, 1.60], [45, 2.36, 0.82, 2.25, 1.10], [90, 2.15, -1.35, 2.15, 1.35], [135, 1.35, 0.35, 0.70, -1.20], [180, 2.00, 0, 0, -2.00]] },
    { id: "Z", fig: "7.44", lib: "Z / cornières jumelées décalées", fam: [], pts: [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]],
      t: [[0, 1.80, 0, 0, 1.80], [45, 1.27, 0, 0.90, 0.90], [90, 1.80, 0, 1.80, 0], [135, 0.92, 0, 0.65, -0.65], [180, 1.80, 0, 0, -1.80]] },
    { id: "I", fig: "7.45", lib: "I à ailes étroites (IPE, IPN)", fam: ["IPE", "IPN"], pts: [[-0.25, -0.5], [0.25, -0.5], [0.25, 0.5], [-0.25, 0.5]],
      t: [[0, 2.00, 0, 0, 2.00], [45, 1.70, -0.85, 0.60, 1.80], [90, 0.85, 0, 0.85, 0]] },
    { id: "H", fig: "7.46", lib: "H à larges ailes (HEA, HEB, HEM)", fam: ["HEA", "HEB", "HEM"], pts: [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]],
      t: [[0, 1.60, 0, 0, 1.60], [45, 2.20, -0.22, 1.40, 1.70], [90, 1.90, 0, 1.90, 0]] },
    { id: "RHS", fig: "7.47", lib: "Tube rectangulaire (b = 0,5·h)", fam: ["RHS"], pts: [[-0.25, -0.5], [0.25, -0.5], [0.25, 0.5], [-0.25, 0.5]],
      t: [[0, 2.30, 0, 0, 2.30], [45, 1.48, -0.50, 0.70, 1.40], [90, 0.85, 0, 0.85, 0]] },
    { id: "UU", fig: "7.48", lib: "Double U dos à dos espacés (1,6·e)", fam: [], pts: [[-0.8, -0.5], [0.8, -0.5], [0.8, 0.5], [-0.8, 0.5]],
      t: [[0, 1.30, 0, 0, 1.30], [45, 2.05, -0.22, 1.30, 1.60], [90, 1.30, 0, 1.30, 0]] },
    { id: "PL", fig: "7.49", lib: "Plat", fam: [], pts: [[0, -0.5], [0, 0.5]],
      t: [[0, 2.00, 0, 0, 2.00], [45, 1.35, -1.20, 0.10, 1.80], [90, 0.10, 0, 0.10, 0]] },
    { id: "SHS", fig: "7.50", lib: "Tube carré", fam: ["SHS"], pts: [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]],
      t: [[0, 2.10, 0, 0, 2.10], [45, 2.11, 0, 1.50, 1.50], [90, 2.10, 0, 2.10, 0]] },
  ];
  /* largeur projetée normale au vent (en e), la plus faible des orientations symétriques (prudent) */
  function proj(P, a) {
    return Math.min(...[a, -a, 180 - a, 180 + a].map((d) => {
      const r = (d + 90) * Math.PI / 180, ux = Math.cos(r), uy = Math.sin(r), v = P.pts.map(([x, y]) => x * ux + y * uy);
      return Math.max(...v) - Math.min(...v);
    }));
  }
  /* c_f ramené à la largeur projetée (pour un calcul « surface projetée × c_f », comme dans S1), enveloppe sur α */
  function cfProj(P) {
    let best = { cf: 0, a: 0 };
    P.t.forEach(([a, cx]) => { const p = proj(P, a); if (p < 0.1) return; const cf = cx / p; if (cf > best.cf) best = { cf, a, p, cx }; });
    return best;
  }
  const CF_TUBE = 1.2;                                        // cylindre : c_f,0 maximal de la figure 7.28 (régime sous-critique), prudent
  function cfFamilles() {
    const o = { CHS: CF_TUBE };
    PROFILS.forEach((P) => { const c = cfProj(P); P.fam.forEach((f) => { o[f] = +c.cf.toFixed(2); }); });
    return o;
  }

  /* ---------- 2. Bâtiment fermé ---------- */
  // murs verticaux — Tableau 7.1 (c_pe,10) en fonction de h/d
  const MURS = [[0.25, [-1.2, -0.8, -0.5, 0.7, -0.3]], [1, [-1.2, -0.8, -0.5, 0.8, -0.5]], [5, [-1.2, -0.8, -0.5, 0.8, -0.7]]];
  function murs(b, d, h) {
    const e = Math.min(b, 2 * h), c = interp(MURS, h / d), Z = [];
    if (e < d) Z.push(["A", e / 5], ["B", 4 * e / 5], ["C", d - e]);
    else if (e < 5 * d) Z.push(["A", e / 5], ["B", d - e / 5]);
    else Z.push(["A", d]);
    return { e, hd: h / d, cpe: { A: c[0], B: c[1], C: c[2], D: c[3], E: c[4] }, zones: Z };
  }
  // toiture-terrasse (α < 5°, rives à arêtes vives) — Tableau 7.2
  const TERRASSE = { F: [-1.8, null], G: [-1.2, null], H: [-0.7, null], I: [-0.2, 0.2] };
  // toiture à un versant — Tableau 7.3a (c_pe,10) : θ = 0° [dépression, pression], θ = 180°, θ = 90°
  const MONO0 = [[5, [-1.7, -1.2, -0.6, 0, 0, 0]], [15, [-0.9, -0.8, -0.3, 0.2, 0.2, 0.2]], [30, [-0.5, -0.5, -0.2, 0.7, 0.7, 0.4]], [45, [0, 0, 0, 0.7, 0.7, 0.6]], [60, [null, null, null, 0.7, 0.7, 0.7]], [75, [null, null, null, 0.8, 0.8, 0.8]]];
  const MONO180 = [[5, [-2.3, -1.3, -0.8]], [15, [-2.5, -1.3, -0.9]], [30, [-1.1, -0.8, -0.8]], [45, [-0.6, -0.5, -0.7]], [60, [-0.5, -0.5, -0.5]], [75, [-0.5, -0.5, -0.5]]];
  const MONO90 = [[5, [-2.1, -2.1, -1.8, -0.6, -0.5]], [15, [-2.4, -1.6, -1.9, -0.8, -0.7]], [30, [-2.1, -1.3, -1.5, -1.0, -0.8]], [45, [-1.5, -1.3, -1.4, -1.0, -0.9]], [60, [-1.2, -1.2, -1.2, -1.0, -0.7]], [75, [-1.2, -1.2, -1.2, -1.0, -0.5]]];
  // toiture à deux versants — Tableau 7.4a (θ = 0°) : [F, G, H, I, J] dépression puis pression ; Tableau 7.4b (θ = 90°) : [F, G, H, I]
  const BI0 = [
    [-45, [-0.6, -0.6, -0.8, -0.7, -1.0], [null, null, null, null, null]],
    [-30, [-1.1, -0.8, -0.8, -0.6, -0.8], [null, null, null, null, null]],
    [-15, [-2.5, -1.3, -0.9, -0.5, -0.7], [null, null, null, 0.0, 0.0]],   // I, J : +0,0 à −15° (CNC2M §2)
    [-5, [-2.3, -1.2, -0.8, -0.6, -0.6], [null, null, null, 0.2, 0.2]],
    [5, [-1.7, -1.2, -0.6, -0.6, -0.6], [0, 0, 0, 0.2, 0.2]],
    [15, [-0.9, -0.8, -0.3, -0.4, -1.0], [0.2, 0.2, 0.2, 0, 0]],
    [30, [-0.5, -0.5, -0.2, -0.4, -0.5], [0.7, 0.7, 0.4, 0, 0]],
    [45, [0, 0, 0, -0.2, -0.3], [0.7, 0.7, 0.6, 0, 0]],
    [60, [null, null, null, -0.2, -0.3], [0.7, 0.7, 0.7, null, null]],
    [75, [null, null, null, -0.2, -0.3], [0.8, 0.8, 0.8, null, null]]];
  const BI90 = [[-45, [-1.4, -1.2, -1.0, -0.9]], [-30, [-1.5, -1.2, -1.0, -0.9]], [-15, [-1.9, -1.2, -0.8, -0.8]], [-5, [-1.8, -1.2, -0.7, -0.6]],
    [5, [-1.6, -1.3, -0.7, -0.6]], [15, [-1.3, -1.3, -0.6, -0.5]], [30, [-1.1, -1.4, -0.8, -0.5]], [45, [-1.1, -1.4, -0.9, -0.5]], [60, [-1.1, -1.2, -0.8, -0.5]], [75, [-1.1, -1.2, -0.8, -0.5]]];
  const n2 = (a) => a.map((v) => (v === null ? null : +v.toFixed(2)));
  /* L = longueur le long du faîtage (ou de la rive haute), W = largeur perpendiculaire, h = hauteur au faîtage, α = pente (°) */
  function toiture(type, L, W, h, a) {
    const e0 = Math.min(L, 2 * h), e90 = Math.min(W, 2 * h), R = { type, a, e0, e90, cas: [] };
    if (Math.abs(a) < 5 && type !== "bi") {
      const z = ["F", "G", "H", "I"];
      R.cas.push({ nom: "Toiture-terrasse (α < 5°) – vent ⊥ aux rives", ref: "§7.2.3, Tab. 7.2", zones: z, v: z.map((k) => TERRASSE[k][0]), v2: z.map((k) => TERRASSE[k][1]) });
      R.terrasse = true; return R;
    }
    if (type === "mono") {
      const x = Math.max(a, 5), m0 = interp(MONO0, x);
      R.cas.push({ nom: "θ = 0° (vent sur la rive basse) – dépression", ref: "§7.2.4, Tab. 7.3a", zones: ["F", "G", "H"], v: n2(m0.slice(0, 3)) });
      R.cas.push({ nom: "θ = 0° (vent sur la rive basse) – pression", ref: "§7.2.4, Tab. 7.3a", zones: ["F", "G", "H"], v: n2(m0.slice(3)) });
      R.cas.push({ nom: "θ = 180° (vent sur la rive haute)", ref: "§7.2.4, Tab. 7.3a", zones: ["F", "G", "H"], v: n2(interp(MONO180, x)) });
      R.cas.push({ nom: "θ = 90° (vent parallèle à la pente)", ref: "§7.2.4, Tab. 7.3a", zones: ["F_up", "F_low", "G", "H", "I"], v: n2(interp(MONO90, x)) });
    } else {
      const x = Math.max(-45, Math.min(a, 75)), xs = x > -5 && x < 5 ? (x < 0 ? -5 : 5) : x;
      const ia = (k) => { const T = BI0.map((r) => [r[0], r[k]]); return n2(interp(T, xs)); };
      R.cas.push({ nom: "θ = 0° (vent ⊥ au faîtage) – dépression", ref: "§7.2.5, Tab. 7.4a", zones: ["F", "G", "H", "I", "J"], v: ia(1) });
      R.cas.push({ nom: "θ = 0° (vent ⊥ au faîtage) – pression", ref: "§7.2.5, Tab. 7.4a" + (x < -5 && x > -15 ? " + CNC2M §2" : ""), zones: ["F", "G", "H", "I", "J"], v: ia(2) });
      R.cas.push({ nom: "θ = 90° (vent ∥ au faîtage)", ref: "§7.2.5, Tab. 7.4b", zones: ["F", "G", "H", "I"], v: n2(interp(BI90, xs)) });
      if (Math.abs(a) < 5) R.note = "|α| < 5° : valeurs de la ligne ±5° retenues.";
    }
    return R;
  }
  const CPI = [0.2, -0.3];                                     // NA 7.2.9(6) NOTE 2 : perméabilité non connue avec certitude

  /* ---------- 3. Toiture isolée à un versant — CNC2M §5, Tableau 2 (c_f, X, c1, c2, c3) et Tableau 3 ---------- */
  const TI1 = [ // α : [maxi], [min φ=0], [min φ=1] → [cf, c1, c2, c3], X
    [0, [0.20, 1.10, 0.13, 0.06], [-0.50, -1.40, -1.00, 0.19], [-1.30, -2.95, -2.92, 0.67], 0.25],
    [5, [0.40, 1.30, 0.70, -0.11], [-0.70, -1.80, -1.47, 0.31], [-1.40, -3.15, -3.14, 0.73], 0.25],
    [10, [0.50, 1.60, 0.89, -0.15], [-0.90, -2.10, -1.99, 0.45], [-1.40, -3.15, -3.14, 0.73], 0.25],
    [15, [0.70, 1.80, 1.08, 0.08], [-1.10, -2.50, -1.85, -0.04], [-1.40, -3.00, -2.44, 0.00], 0.325],
    [20, [0.80, 2.10, 0.76, 0.54], [-1.30, -2.90, -1.50, -0.76], [-1.40, -3.00, -1.67, -0.78], 0.40],
    [25, [1.00, 2.30, 1.11, 0.59], [-1.60, -3.20, -2.02, -0.83], [-1.40, -2.80, -1.77, -0.73], 0.40],
    [30, [1.20, 2.40, 1.51, 0.62], [-1.80, -3.60, -2.27, -0.94], [-1.40, -2.70, -1.82, -0.70], 0.40]];
  function toitIsolee1(a, phi) {
    const x = Math.max(0, Math.min(Math.abs(a), 30)), p = Math.max(0, Math.min(phi, 1));
    const mx = interp(TI1.map((r) => [r[0], r[1]]), x), m0 = interp(TI1.map((r) => [r[0], r[2]]), x), m1 = interp(TI1.map((r) => [r[0], r[3]]), x);
    const X = interp(TI1.map((r) => [r[0], r[4]]), x), mn = m0.map((v, k) => v + (m1[k] - v) * p);
    const rive = { max: 0.2, min: -0.5 + (-1.3 + 0.5) * p };   // Tableau 3 : vent sur une rive inclinée (α = 0)
    return { a: x, phi: p, X, max: mx.map((v) => +v.toFixed(3)), min: mn.map((v) => +v.toFixed(3)), rive };
  }

  /* ---------- 3 bis. Toiture isolée à deux versants — Tableau 7.7 : [c_f, c_p,net A, B, C, D] ---------- */
  const TI2 = [
    [-20, [0.7, 0.8, 1.6, 0.6, 1.7], [-0.7, -0.9, -1.3, -1.6, -0.6], [-1.3, -1.5, -2.4, -2.4, -0.6]],
    [-15, [0.5, 0.6, 1.5, 0.7, 1.4], [-0.6, -0.8, -1.3, -1.6, -0.6], [-1.4, -1.6, -2.7, -2.6, -0.6]],
    [-10, [0.4, 0.6, 1.4, 0.8, 1.1], [-0.6, -0.8, -1.3, -1.5, -0.6], [-1.4, -1.6, -2.7, -2.6, -0.6]],
    [-5, [0.3, 0.5, 1.5, 0.8, 0.8], [-0.5, -0.7, -1.3, -1.6, -0.6], [-1.3, -1.5, -2.4, -2.4, -0.6]],
    [5, [0.3, 0.6, 1.8, 1.3, 0.4], [-0.6, -0.6, -1.4, -1.4, -1.1], [-1.3, -1.3, -2.0, -1.8, -1.5]],
    [10, [0.4, 0.7, 1.8, 1.4, 0.4], [-0.7, -0.7, -1.5, -1.4, -1.4], [-1.3, -1.3, -2.0, -1.8, -1.8]],
    [15, [0.4, 0.9, 1.9, 1.4, 0.4], [-0.8, -0.9, -1.7, -1.4, -1.8], [-1.3, -1.3, -2.2, -1.6, -2.1]],
    [20, [0.6, 1.1, 1.9, 1.5, 0.4], [-0.9, -1.2, -1.8, -1.4, -2.0], [-1.3, -1.4, -2.2, -1.6, -2.1]],
    [25, [0.7, 1.2, 1.9, 1.6, 0.5], [-1.0, -1.4, -1.9, -1.4, -2.0], [-1.3, -1.4, -2.0, -1.5, -2.0]],
    [30, [0.9, 1.3, 1.9, 1.6, 0.7], [-1.0, -1.4, -1.9, -1.4, -2.0], [-1.3, -1.4, -1.8, -1.4, -2.0]]];
  function toitIsolee2(a, phi) {
    let x = Math.max(-20, Math.min(a, 30)); const snap = x > -5 && x < 5; if (snap) x = x < 0 ? -5 : 5;
    const p = Math.max(0, Math.min(phi, 1)), g = (k) => interp(TI2.map((r) => [r[0], r[k]]), x), m0 = g(2), m1 = g(3);
    return { a: x, snap, phi: p, max: g(1).map((v) => +v.toFixed(3)), min: m0.map((v, k) => +(v + (m1[k] - v) * p).toFixed(3)) };
  }
  function svgToitIsolee2(T, d) {                             // élévation : 4 dispositions de charge (fig. 7.17) + plan des zones
    const fxs = (v) => fx(v), cas = [["Les deux versants – max", T.max[0], T.max[0]], ["Les deux versants – min", T.min[0], T.min[0]], ["Un versant – max, l'autre non chargé", T.max[0], 0], ["Un versant – min, l'autre non chargé", T.min[0], 0]];
    const pente = Math.max(Math.abs(T.a), 5) * Math.PI / 180, sgn = T.a >= 0 ? -1 : 1;
    const el = cas.map(([t, c1, c2], i) => { const X0 = 10 + (i % 2) * 190, Y0 = 34 + Math.floor(i / 2) * 92, w = 150, hh = Math.tan(pente) * w / 2 * sgn * 0.8, ym = Y0 + 42;
      const fl = (xa, xb, ya, yb, c) => { if (!c) return `<text x="${(xa + xb) / 2}" y="${(ya + yb) / 2 - 10}" font-size="9" text-anchor="middle" fill="#5f6670">0</text>`;
        const n = 4, col = c > 0 ? "#e30009" : "#114088"; let s = ""; for (let k = 0; k < n; k++) { const t2 = (k + 0.5) / n, x = xa + (xb - xa) * t2, y = ya + (yb - ya) * t2, L = 16 * Math.min(Math.abs(c), 2) / 1.3 + 6;
          s += c > 0 ? `<line x1="${x}" y1="${y - L - 2}" x2="${x}" y2="${y - 3}" stroke="${col}" stroke-width="1.6"/><path d="M${x - 3},${y - 7} L${x},${y - 2} L${x + 3},${y - 7}z" fill="${col}"/>` : `<line x1="${x}" y1="${y - 2}" x2="${x}" y2="${y - L - 2}" stroke="${col}" stroke-width="1.6"/><path d="M${x - 3},${y - L + 2} L${x},${y - L - 3} L${x + 3},${y - L + 2}z" fill="${col}"/>`; }
        return s + `<text x="${(xa + xb) / 2}" y="${Math.min(ya, yb) - 26}" font-size="9" text-anchor="middle" fill="${col}" font-weight="700">${fxs(c)}</text>`; };
      return `<text x="${X0}" y="${Y0 - 6}" font-size="9.5" font-weight="700" fill="#114088">${t}</text><polyline points="${X0},${ym} ${X0 + w / 2},${ym + hh} ${X0 + w},${ym}" fill="none" stroke="#171a1e" stroke-width="2.4"/>
        <line x1="${X0 + w / 2}" y1="${ym + hh}" x2="${X0 + w / 2}" y2="${ym + 34}" stroke="#8a929c" stroke-width="2"/>${fl(X0, X0 + w / 2, ym, ym + hh, c1)}${fl(X0 + w / 2, X0 + w, ym + hh, ym, c2)}`; }).join("");
    return `<svg viewBox="0 0 380 220" style="width:100%;max-width:440px">${el}</svg>`;
  }
  function svgZonesTI2(T) {                                   // plan repère des zones A à D (c_p,net, couverture et fixations)
    const X0 = 30, Y0 = 20, W = 260, H = 150, v = { A: T.max[1], B: T.max[2], C: T.max[3], D: T.max[4] }, zz = [["B", 0, 0, 1, 0.1], ["B", 0, 0.9, 1, 0.1], ["C", 0, 0.1, 0.1, 0.8], ["C", 0.9, 0.1, 0.1, 0.8], ["A", 0.1, 0.1, 0.3, 0.8], ["D", 0.4, 0.1, 0.2, 0.8], ["A", 0.6, 0.1, 0.3, 0.8]];
    return `<svg viewBox="0 0 330 200" style="width:100%;max-width:380px">${rectZones(X0, Y0, W, H, zz, v)}<line x1="${X0 + W / 2}" y1="${Y0}" x2="${X0 + W / 2}" y2="${Y0 + H}" stroke="#171a1e" stroke-dasharray="5 3"/>
      <text x="${X0}" y="${Y0 + H + 16}" font-size="9" fill="#5f6670">plan repère (Tab. 7.7) : C = d/10 aux rives, D = d/5 au faîtage, B = b/10 aux pignons</text><text x="${X0}" y="${Y0 + H + 28}" font-size="9" fill="#5f6670">valeurs « maximum » affichées ; c<tspan font-size="7" dy="2">p,net</tspan><tspan dy="-2"> : couverture et fixations</tspan></text></svg>`;
  }

  /* ---------- 4. Mur isolé — Tableau 7.9 (c_p,net), zones A à D (fig. 7.19) ---------- */
  const MI = [[3, [2.3, 1.4, 1.2, 1.2]], [5, [2.9, 1.8, 1.4, 1.2]], [10, [3.4, 2.1, 1.7, 1.2]]];
  function murIsole(l, h, phi, retour) {
    const lh = l / h, c1 = retour ? [2.1, 1.8, 1.4, 1.2] : interp(MI, lh), c08 = [1.2, 1.2, 1.2, 1.2];
    const p = Math.max(0.8, Math.min(phi, 1)), c = c1.map((v, k) => c08[k] + (v - c08[k]) * (p - 0.8) / 0.2);
    const lim = [0.3 * h, 2 * h, 4 * h], Z = [];
    let x0 = 0; ["A", "B", "C", "D"].forEach((k, i) => { const x1 = i < 3 ? Math.min(lim[i], l / 2) : l / 2; if (x1 > x0 + 1e-9) Z.push([k, x0, x1]); x0 = Math.max(x0, x1); });
    return { lh, phi, p, c: c.map((v) => +v.toFixed(2)), zones: Z, treillis: phi < 0.8, retourOK: !retour || l >= h };
  }

  /* ---------- schémas SVG ---------- */
  const COUL = (v) => v === null || v === undefined ? "#eef0f3" : v >= 0 ? `rgba(227,0,9,${Math.min(0.12 + Math.abs(v) / 3, 0.6)})` : `rgba(17,64,136,${Math.min(0.12 + Math.abs(v) / 3, 0.6)})`;
  const fx = (v) => v === null || v === undefined ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2).replace(".", ",");
  const fleche = (x, y, txt) => `<g><line x1="${x - 42}" y1="${y}" x2="${x - 6}" y2="${y}" stroke="#0098db" stroke-width="2.4"/><path d="M${x - 6},${y - 5} L${x + 2},${y} L${x - 6},${y + 5}z" fill="#0098db"/><text x="${x - 44}" y="${y - 6}" font-size="10" fill="#0098db" font-weight="700">${txt || "vent"}</text></g>`;
  function rectZones(X0, Y0, W, H, defs, val) {             // defs : [[zone, x, y, w, h]] en fraction de W, H
    return defs.map(([z, x, y, w, h]) => { const v = val[z];
      return `<rect x="${X0 + x * W}" y="${Y0 + y * H}" width="${w * W}" height="${h * H}" fill="${COUL(v)}" stroke="#171a1e" stroke-width=".8"/>` +
        (w * W > 18 && h * H > 14 ? `<text x="${X0 + (x + w / 2) * W}" y="${Y0 + (y + h / 2) * H + 4}" font-size="${w * W > 50 ? 11 : 9}" text-anchor="middle" font-weight="700">${z.replace("_", "")}${w * W > 46 ? " " + fx(v) : ""}</text>` : ""); }).join("");
  }
  /* plan des murs (vent de gauche) */
  function svgMurs(M, b, d) {
    const W = 420, H = 230, s = Math.min(220 / d, 150 / b), w = d * s, hh = b * s, X0 = 100, Y0 = (H - hh) / 2;
    let x = X0, t = "";
    M.zones.forEach(([z, l]) => { t += `<rect x="${x}" y="${Y0 - 14}" width="${l * s}" height="10" fill="${COUL(M.cpe[z])}" stroke="#171a1e" stroke-width=".6"/><rect x="${x}" y="${Y0 + hh + 4}" width="${l * s}" height="10" fill="${COUL(M.cpe[z])}" stroke="#171a1e" stroke-width=".6"/>`;
      if (l * s > 24) t += `<text x="${x + l * s / 2}" y="${Y0 - 18}" font-size="10" text-anchor="middle" font-weight="700">${z} ${fx(M.cpe[z])}</text>`; x += l * s; });
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:460px"><rect x="${X0}" y="${Y0}" width="${w}" height="${hh}" fill="#f7f9fc" stroke="#171a1e"/>${t}
      <rect x="${X0 - 12}" y="${Y0}" width="8" height="${hh}" fill="${COUL(M.cpe.D)}" stroke="#171a1e" stroke-width=".6"/><rect x="${X0 + w + 4}" y="${Y0}" width="8" height="${hh}" fill="${COUL(M.cpe.E)}" stroke="#171a1e" stroke-width=".6"/>
      <text x="${X0 - 16}" y="${Y0 + hh / 2}" font-size="10" text-anchor="end" font-weight="700">D ${fx(M.cpe.D)}</text><text x="${X0 + w + 16}" y="${Y0 + hh / 2}" font-size="10" font-weight="700">E ${fx(M.cpe.E)}</text>
      ${fleche(X0 - 30, Y0 + hh / 2 + 22)}<text x="${X0 + w / 2}" y="${H - 6}" font-size="10" text-anchor="middle" fill="#5f6670">plan – d = ${d} m (∥ vent), b = ${b} m ; e = ${M.e.toFixed(2)} m</text></svg>`;
  }
  /* plan de toiture avec zones (vent de gauche) ; L le long de l'axe vertical du dessin pour θ = 0 */
  function svgToiture(R, cas, L, W) {
    const th90 = /θ = 90/.test(cas.nom), Dv = th90 ? L : W, Bv = th90 ? W : L, e = th90 ? R.e90 : R.e0;   // Dv : profondeur dans le sens du vent
    const S = Math.min(240 / Dv, 170 / Bv), w = Dv * S, h = Bv * S, X0 = 70, Y0 = 26, val = {};
    cas.zones.forEach((z, i) => { val[z] = cas.v[i]; });
    const fx_ = (m) => Math.min(m / Dv, 1), fy = (m) => Math.min(m / Bv, 0.5), d10 = fx_(e / 10), b4 = fy(e / 4);
    let defs;
    if (R.terrasse) defs = [["F", 0, 0, d10, b4], ["F", 0, 1 - b4, d10, b4], ["G", 0, b4, d10, 1 - 2 * b4], ["H", d10, 0, fx_(e / 2) - d10, 1], ["I", fx_(e / 2), 0, 1 - fx_(e / 2), 1]];
    else if (R.type === "mono" && !th90) defs = [["F", 0, 0, d10, b4], ["F", 0, 1 - b4, d10, b4], ["G", 0, b4, d10, 1 - 2 * b4], ["H", d10, 0, 1 - d10, 1]];
    else if (R.type === "mono") defs = [["F_up", 0, 0, d10, b4], ["F_low", 0, 1 - b4, d10, b4], ["G", 0, b4, d10, 1 - 2 * b4], ["H", d10, 0, fx_(e / 2) - d10, 1], ["I", fx_(e / 2), 0, 1 - fx_(e / 2), 1]];
    else if (!th90) defs = [["F", 0, 0, d10, b4], ["F", 0, 1 - b4, d10, b4], ["G", 0, b4, d10, 1 - 2 * b4], ["H", d10, 0, 0.5 - d10, 1], ["J", 0.5, 0, d10, 1], ["I", 0.5 + d10, 0, 0.5 - d10, 1]];
    else defs = [["F", 0, 0, d10, b4], ["F", 0, 1 - b4, d10, b4], ["G", 0, b4, d10, 0.5 - b4], ["G", 0, 0.5, d10, 0.5 - b4], ["H", d10, 0, fx_(e / 2) - d10, 1], ["I", fx_(e / 2), 0, 1 - fx_(e / 2), 1]];
    defs = defs.filter((z) => z[3] > 1e-6 && z[4] > 1e-6);
    const faite = R.type === "bi" ? (th90 ? `<line x1="${X0}" y1="${Y0 + h / 2}" x2="${X0 + w}" y2="${Y0 + h / 2}" stroke="#171a1e" stroke-dasharray="6 3"/>` : `<line x1="${X0 + w / 2}" y1="${Y0}" x2="${X0 + w / 2}" y2="${Y0 + h}" stroke="#171a1e" stroke-dasharray="6 3"/>`) : "";
    const rive = R.type === "mono" && !R.terrasse ? (th90 ? `<text x="${X0 + w / 2}" y="${Y0 - 6}" font-size="9" text-anchor="middle" fill="#5f6670">rive haute</text><text x="${X0 + w / 2}" y="${Y0 + h + 12}" font-size="9" text-anchor="middle" fill="#5f6670">rive basse</text>`
      : `<text x="${X0 - 4}" y="${Y0 - 6}" font-size="9" fill="#5f6670">${/180/.test(cas.nom) ? "rive haute" : "rive basse"}</text>`) : "";
    return `<svg viewBox="0 0 360 ${h + 60}" style="width:100%;max-width:420px">${rectZones(X0, Y0, w, h, defs, val)}${faite}${rive}${fleche(X0 - 6, Y0 + h / 2)}
      <text x="4" y="${Y0 + h + 28}" font-size="10" fill="#5f6670">plan de toiture – e = ${e.toFixed(2)} m ; e/10 = ${(e / 10).toFixed(2)} m ; e/4 = ${(e / 4).toFixed(2)} m${/H|I/.test(cas.zones.join("")) && (th90 || R.terrasse) ? " ; e/2 = " + (e / 2).toFixed(2) + " m" : ""}</text></svg>`;
  }
  /* toiture isolée à un versant : répartition c1 / c2 → c3 (CNC2M figure 22) */
  function svgToitIsolee(T, c, titre) {
    const W = 380, H = 210, X0 = 64, X1 = 350, Yb = 112, k = 20, y = (v) => Yb - v * k;
    const x01 = X0 + 0.1 * (X1 - X0), pts = `${X0},${Yb} ${X0},${y(c[1])} ${x01},${y(c[1])} ${x01},${y(c[2])} ${X1},${y(c[3])} ${X1},${Yb}`;
    const xr = X0 + T.X * (X1 - X0);
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:420px"><text x="6" y="14" font-size="11" font-weight="700" fill="#114088">${titre}</text>
      <polygon points="${pts}" fill="${COUL(c[0])}" stroke="#171a1e" stroke-width=".8"/><line x1="${X0}" y1="${Yb}" x2="${X1}" y2="${Yb}" stroke="#171a1e" stroke-width="2.5"/>
      <text x="${X0 - 3}" y="${y(c[1]) + (c[1] >= 0 ? 4 : 0)}" font-size="10" text-anchor="end" font-weight="700">c₁ ${fx(c[1])}</text><text x="${x01 + 4}" y="${y(c[2]) + (c[2] >= 0 ? -4 : 12)}" font-size="10" font-weight="700">c₂ ${fx(c[2])}</text><text x="${X1 - 2}" y="${y(c[3]) + (c[3] >= 0 ? -4 : 12)}" font-size="10" text-anchor="end" font-weight="700">c₃ ${fx(c[3])}</text>
      <line x1="${xr}" y1="${Yb - 8}" x2="${xr}" y2="${Yb + 8}" stroke="#e30009" stroke-width="2.5"/><text x="${xr + 4}" y="${c[0] >= 0 ? Yb + 20 : Yb - 12}" font-size="10" fill="#e30009" font-weight="700">c<tspan font-size="7" dy="2">f</tspan><tspan dy="-2"> ${fx(c[0])} à X·d = ${String(T.X).replace(".", ",")}·d</tspan></text>
      ${fleche(X0 - 4, 34)}<text x="${(X0 + x01) / 2}" y="${H - 18}" font-size="9" text-anchor="middle" fill="#5f6670">0,1·d</text><text x="${(x01 + X1) / 2}" y="${H - 18}" font-size="9" text-anchor="middle" fill="#5f6670">0,9·d</text><text x="${W / 2}" y="${H - 4}" font-size="9" text-anchor="middle" fill="#5f6670">rive attaquée à gauche ; c &gt; 0 : pression vers le bas (au-dessus de la toiture)</text></svg>`;
  }
  /* mur isolé : élévation et zones depuis l'extrémité libre */
  function svgMurIsole(M, l, h) {
    const W = 360, Hh = 140, S = Math.min(300 / l, 90 / h), X0 = 30, Y0 = 20, ww = l * S, hh = h * S, val = { A: M.c[0], B: M.c[1], C: M.c[2], D: M.c[3] };
    let t = "";
    M.zones.forEach(([z, a, b]) => { [[a, b], [l - b, l - a]].forEach(([u, v]) => { if (v - u < 1e-9) return;
      t += `<rect x="${X0 + u * S}" y="${Y0}" width="${(v - u) * S}" height="${hh}" fill="${COUL(val[z])}" stroke="#171a1e" stroke-width=".7"/>` + ((v - u) * S > 22 ? `<text x="${X0 + (u + v) / 2 * S}" y="${Y0 + hh / 2 + 4}" font-size="10" text-anchor="middle" font-weight="700">${z} ${(v - u) * S > 50 ? fx(val[z]) : ""}</text>` : ""); }); });
    return `<svg viewBox="0 0 ${W} ${Hh}" style="width:100%;max-width:420px">${t}<line x1="${X0 - 6}" y1="${Y0 + hh}" x2="${X0 + ww + 6}" y2="${Y0 + hh}" stroke="#171a1e" stroke-width="2"/>
      <text x="${X0}" y="${Hh - 18}" font-size="9" fill="#5f6670">élévation – l = ${l} m, h = ${h} m</text><text x="${X0}" y="${Hh - 6}" font-size="9" fill="#5f6670">zones depuis chaque extrémité libre : A jusqu'à 0,3·h, B 2·h, C 4·h, D au-delà</text></svg>`;
  }
  return { PROFILS, proj, cfProj, cfFamilles, CF_TUBE, murs, toiture, CPI, toitIsolee1, toitIsolee2, svgToitIsolee2, svgZonesTI2, murIsole, svgMurs, svgToiture, svgToitIsolee, svgMurIsole, fx };
})();
