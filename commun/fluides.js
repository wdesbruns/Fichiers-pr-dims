/* =====================================================================
   PROPRIÉTÉS DES FLUIDES EN FONCTION DE LA TEMPÉRATURE (H1)
   Corrélations publiques — valeurs à confirmer par la fiche produit / FDS pour les mélanges.
   - Eau : masse volumique de Kell (1975, 0–150 °C) ; pression de vapeur de Wagner & Pruss (1993, IAPWS) ;
           viscosité de Vogel (μ = 2,414·10⁻⁵·10^(247,8/(T − 140)) Pa·s, 0–370 °C, ±2,5 %).
   - Éthanol : pression de vapeur d'Antoine (log10 P[mmHg] = 8,20417 − 1642,89/(230,300 + t), −57 à 80 °C, Lange) ;
               masse volumique et viscosité ajustées sur valeurs tabulées (0–60 °C).
   - Produits pétroliers : masse volumique API MPMS 11.1 / ASTM D1250 (Tableau 54B, groupes de produits) ;
               pression de vapeur US EPA AP-42 §7.1 (essence et naphta à partir de la RVP, brut à partir de la RVP,
               distillats : constantes A et B du tableau 7.1-2) ; viscosité ASTM D341 (Walther) entre deux points.
   - Émulseur : fiche produit (ρ à 20 °C, viscosité) ; dilatation et pression de vapeur prises égales à celles de l'eau.
   ===================================================================== */
const FLU = (() => {
  const TK = (t) => t + 273.15, PSI = 6.894757, R0 = 459.67;
  /* ---------- eau ---------- */
  const eauRho = (t) => (999.83952 + 16.945176 * t - 7.9870401e-3 * t * t - 46.170461e-6 * t ** 3 + 105.56302e-9 * t ** 4 - 280.54253e-12 * t ** 5) / (1 + 16.87985e-3 * t);
  function eauPv(t) {                                         // kPa
    const T = TK(t), Tc = 647.096, pc = 22064, tau = 1 - T / Tc;
    const a = [-7.85951783, 1.84408259, -11.7866497, 22.6807411, -15.9618719, 1.80122502];
    return pc * Math.exp(Tc / T * (a[0] * tau + a[1] * tau ** 1.5 + a[2] * tau ** 3 + a[3] * tau ** 3.5 + a[4] * tau ** 4 + a[5] * tau ** 7.5));
  }
  const eauMu = (t) => 2.414e-5 * 10 ** (247.8 / (TK(t) - 140)) * 1000;   // mPa·s
  /* ---------- éthanol ---------- */
  const ethRho = (t) => { const p = [806.3, -0.8425, -0.000125]; return p[0] + p[1] * t + p[2] * t * t; };   // 806,3 / 789,4 / 772,4 kg/m³ à 0 / 20 / 40 °C
  const ethPv = (t) => 10 ** (8.20417 - 1642.89 / (230.3 + t)) * 0.1333224;
  const ethMu = (t) => 1.20 * Math.exp(1733.6 * (1 / TK(t) - 1 / 293.15));  // 1,20 mPa·s à 20 °C ; 0,59 à 60 °C
  /* ---------- produits pétroliers ---------- */
  const GROUPES = { brut: [613.9723, 0], essence: [346.4228, 0.4388], jet: [594.5418, 0], fioul: [186.9696, 0.4862] }; // K0, K1 (Tab. 54B)
  function rhoPetrole(rho15, g, t) {
    const [K0, K1] = GROUPES[g], a = K0 / rho15 ** 2 + K1 / rho15, dt = t - 15;
    return rho15 * Math.exp(-a * dt * (1 + 0.8 * a * dt));
  }
  function pvRVP(rvp, t, S = 3) {                            // essence, naphta : AP-42 éq. 1-25 (RVP en psi)
    const s = Math.sqrt(S), l = Math.log(Math.max(rvp, 0.1));
    const A = 15.64 - 1.854 * s - (0.8742 - 0.328 * s) * l, B = 8742 - 1042 * s - (1049 - 179.4 * s) * l;
    return Math.exp(A - B / (t * 1.8 + 32 + R0)) * PSI;
  }
  function pvBrut(rvp, t) { const l = Math.log(Math.max(rvp, 0.1)); return Math.exp(12.82 - 0.9672 * l - (7261 - 1216 * l) / (t * 1.8 + 32 + R0)) * PSI; }
  const pvAB = (A, B) => (t) => Math.exp(A - B / (t * 1.8 + 32 + R0)) * PSI;   // AP-42 tableau 7.1-2 (ln psia, °R)
  /* viscosité cinématique entre deux points (mm²/s) : ASTM D341 si ν ≥ 1,5 mm²/s, sinon loi d'Andrade ln ν = A + B/T */
  function viscFn(t1, n1, t2, n2) {
    if (Math.min(n1, n2) >= 1.5) {
      const W = (n) => Math.log10(Math.log10(n + 0.7)), B = (W(n1) - W(n2)) / (Math.log10(TK(t2)) - Math.log10(TK(t1))), A = W(n1) + B * Math.log10(TK(t1));
      return { f: (t) => 10 ** (10 ** (A - B * Math.log10(TK(t)))) - 0.7, loi: "ASTM D341 (Walther)" };
    }
    const B = Math.log(n1 / n2) / (1 / TK(t1) - 1 / TK(t2)), A = Math.log(n1) - B / TK(t1);
    return { f: (t) => Math.exp(A + B / TK(t)), loi: "loi d'Andrade (ν faible)" };
  }
  /* ---------- catalogue ---------- */
  const CAT = [
    { id: "eau", n: "Eau", plage: [0, 150], ref: "Kell (1975) ; Wagner & Pruss (1993, IAPWS) ; Vogel" },
    { id: "ethanol", n: "Éthanol", plage: [0, 80], ref: "Antoine (Lange's Handbook) ; valeurs tabulées CRC" },
    { id: "essence", n: "Essence (SP95, SP98, E10)", g: "essence", rho15: 745, rvp: 9, v: [20, 0.6, 40, 0.48], plage: [-20, 50], ref: "API MPMS 11.1 Tab. 54B ; AP-42 §7.1 (éq. 1-25)" },
    { id: "naphta", n: "Naphta (léger)", g: "essence", rho15: 700, rvp: 10, v: [20, 0.55, 40, 0.45], plage: [-20, 50], ref: "API MPMS 11.1 Tab. 54B (groupe essences) ; AP-42 §7.1 (éq. 1-25)" },
    { id: "jet", n: "Kérosène / Jet A-1", g: "jet", rho15: 800, pv: [12.390, 8933], v: [20, 1.6, 40, 1.2], plage: [-40, 100], ref: "API MPMS 11.1 Tab. 54B ; AP-42 Tab. 7.1-2 (jet kerosene)" },
    { id: "jp4", n: "Carburéacteur large coupe (JP-4)", g: "jet", rho15: 760, pv: [11.368, 5784.3], v: [20, 1.0, 40, 0.8], plage: [-40, 60], ref: "API MPMS 11.1 Tab. 54B ; AP-42 Tab. 7.1-2 (jet naphtha JP-4)" },
    { id: "gazole", n: "Gazole (diesel EN 590)", g: "fioul", rho15: 835, pv: [12.101, 8907], v: [20, 5.0, 40, 3.0], plage: [-10, 120], ref: "API MPMS 11.1 Tab. 54B ; AP-42 Tab. 7.1-2 (distillate fuel oil No. 2)" },
    { id: "fod", n: "Fioul domestique", g: "fioul", rho15: 845, pv: [12.101, 8907], v: [20, 6.0, 40, 3.5], plage: [-10, 120], ref: "API MPMS 11.1 Tab. 54B ; AP-42 Tab. 7.1-2 (distillate fuel oil No. 2)" },
    { id: "fol", n: "Fioul lourd (n° 6)", g: "fioul", rho15: 980, pv: [10.781, 10475.5], v: [50, 380, 100, 40], plage: [20, 150], ref: "API MPMS 11.1 Tab. 54B ; AP-42 Tab. 7.1-2 (residual oil No. 6)" },
    { id: "brut", n: "Pétrole brut", g: "brut", rho15: 850, rvp: 5, v: [20, 10, 40, 5], plage: [-10, 80], ref: "API MPMS 11.1 Tab. 54A ; AP-42 §7.1 (brut, à partir de la RVP)" },
    { id: "emul", n: "Émulseur (AFFF, AR-AFFF…)", rho20: 1040, v: [5, 6, 20, 3], plage: [0, 50], ref: "Fiche technique du fabricant ; dilatation et pression de vapeur de l'eau" },
    { id: "perso", n: "Fluide saisi (fiche produit)", rho20: 900, alpha: 0.0009, v: [20, 2, 40, 1.4], ant: [7, 1500, 230], plage: [-20, 150], ref: "Données saisies" },
  ];
  /* propriétés à la température t ; P : paramètres saisis (rho15, rvp, v[4], rho20, alpha, ant[3]) */
  function props(id, t, P = {}) {
    const C = CAT.find((c) => c.id === id) || CAT[0], q = { ...C, ...P }, o = { id, n: C.n, t };
    if (id === "eau") { o.rho = eauRho(t); o.pv = eauPv(t); o.mu = eauMu(t); o.nu = o.mu / o.rho * 1000; o.lois = ["ρ : Kell (1975)", "P<sub>v</sub> : Wagner & Pruss (1993)", "μ : Vogel"]; }
    else if (id === "ethanol") { o.rho = ethRho(t); o.pv = ethPv(t); o.mu = ethMu(t); o.nu = o.mu / o.rho * 1000; o.lois = ["ρ : ajustement 0–60 °C (806,3 / 789,4 / 772,4 kg/m³)", "P<sub>v</sub> : Antoine 8,20417 / 1642,89 / 230,300", "μ : Andrade (1,20 mPa·s à 20 °C)"]; }
    else if (C.g) {
      o.rho = rhoPetrole(+q.rho15, C.g, t);
      o.pv = q.rvp != null && C.rvp != null ? (C.g === "brut" ? pvBrut(+q.rvp, t) : pvRVP(+q.rvp, t)) : pvAB(C.pv[0], C.pv[1])(t);
      const V = viscFn(+q.v[0], +q.v[1], +q.v[2], +q.v[3]); o.nu = V.f(t); o.mu = o.nu * o.rho / 1000;
      o.lois = [`ρ : ρ<sub>15</sub> = ${q.rho15} kg/m³, correction ASTM D1250 (groupe ${C.g})`, C.rvp != null ? `P<sub>v</sub> : AP-42 à partir de RVP = ${q.rvp} psi (${f2(q.rvp * PSI)} kPa)` : `P<sub>v</sub> : AP-42 ln P = ${C.pv[0]} − ${C.pv[1]}/T(°R)`, `ν : ${V.loi} entre ${q.v[1]} mm²/s à ${q.v[0]} °C et ${q.v[3]} mm²/s à ${q.v[2]} °C`];
    } else if (id === "emul") {
      o.rho = +q.rho20 * eauRho(t) / eauRho(20); o.pv = eauPv(t); const V = viscFn(+q.v[0], +q.v[1], +q.v[2], +q.v[3]); o.nu = V.f(t); o.mu = o.nu * o.rho / 1000;
      o.lois = [`ρ : ${q.rho20} kg/m³ à 20 °C (fiche), dilatation de l'eau`, "P<sub>v</sub> : celle de l'eau (solution aqueuse)", `ν : ${V.loi} entre les deux points de la fiche`];
    } else {
      o.rho = +q.rho20 / (1 + +q.alpha * (t - 20)); const [A, B, Cc] = q.ant.map(Number); o.pv = 10 ** (A - B / (Cc + t)) * 0.1333224;
      const V = viscFn(+q.v[0], +q.v[1], +q.v[2], +q.v[3]); o.nu = V.f(t); o.mu = o.nu * o.rho / 1000;
      o.lois = [`ρ = ρ<sub>20</sub>/(1 + α·(t − 20)), α = ${q.alpha} /K`, `P<sub>v</sub> : Antoine log10 P[mmHg] = ${A} − ${B}/(${Cc} + t)`, `ν : ${V.loi}`];
    }
    o.d = o.rho / 999.1;                                      // densité relative / eau à 15 °C
    o.hors = t < C.plage[0] || t > C.plage[1]; o.plage = C.plage; o.ref = C.ref;
    return o;
  }
  const f2 = (x) => (Math.round(x * 100) / 100).toString().replace(".", ",");
  /* température d'ébullition sous la pression p (kPa) : P_v(t) = p, dichotomie */
  function ebullition(id, p, P) {
    let a = -60, b = 400; const g = (t) => props(id, t, P).pv - p;
    if (g(a) > 0 || g(b) < 0) return null;
    for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (g(m) > 0) b = m; else a = m; }
    return (a + b) / 2;
  }
  const patm = (z) => 101.325 * (1 - 2.25577e-5 * z) ** 5.25588;   // atmosphère normalisée (kPa)
  return { CAT, props, ebullition, patm, eauRho, eauPv };
})();
