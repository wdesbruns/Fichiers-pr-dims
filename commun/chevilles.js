/* =====================================================================
   CHEVILLES — ancrages de platines dans le béton (NF EN 1992-4 + AN déc. 2022, ETE des produits)
   Unités internes : N, mm, N·mm. Platine rigide (§6.2.1) : répartition élastique des tractions, chevilles
   comprimées inactives, béton comprimé sous la platine (analogie avec la section de béton armé).
   Résistances : §7.2.1 (traction), §7.2.2 (cisaillement), §7.2.3 / Tab. 7.3 (interaction), annexe C (séisme).
   Les efforts par cheville peuvent être imposés (ex. efforts CBFEM d'un logiciel tiers) pour la qualification.
   ===================================================================== */
const CHEV = (() => {
  /* ---------------- produits (valeurs caractéristiques des ETE) ---------------- */
  const AS = { M8: 36.6, M10: 58, M12: 84.3, M16: 157, M20: 245, M24: 353, M27: 459, M30: 561 };   // sections résistantes (mm²)
  const rep = (v, n) => Array(n).fill(v);
  const PROD = {
    HAS: {
      nom: "HIT-HY 200-A V3 + HAS-U / HAS (scellement chimique)", eta: "ETA-19/0601 du 08/09/2025", chimique: true,
      diam: ["M8", "M10", "M12", "M16", "M20", "M24", "M27", "M30"], d: [8, 10, 12, 16, 20, 24, 27, 30], d0: [10, 12, 14, 18, 22, 28, 30, 35],
      hef: [[60, 160], [60, 200], [70, 240], [80, 320], [90, 400], [96, 480], [108, 540], [120, 600]],
      hmin: (i, hef) => (i <= 2 ? Math.max(hef + 30, 100) : hef + 2 * [10, 12, 14, 18, 22, 28, 30, 35][i]),
      smin: [40, 50, 60, 75, 90, 115, 120, 140], cmin: [40, 45, 45, 50, 55, 60, 75, 80],
      cl: { "5.8": { nrks: [18.3, 29.0, 42.1, 78.5, 122.5, 176.5, 229.5, 280.5], k6: 0.6, fuk: 500, fyk: 400, m0: [18.7, 37.3, 65.4, 166.2, 324.6, 561.0, 832.2, 1124.4] },
            "8.8": { nrks: [29.3, 46.4, 67.4, 125.6, 196.0, 282.4, 367.2, 448.8], k6: 0.5, fuk: 800, fyk: 640, m0: [29.9, 59.8, 104.6, 265.9, 519.3, 897.6, 1331.5, 1799.0] } },
      k1: { cr: 7.7, ucr: 11.0 }, k7: 1.0, k8: () => 2.0, ccrN: (hef) => 1.5 * hef,
      ccrsp: (hef, h) => (h / hef >= 2 ? hef : h / hef > 1.3 ? 4.6 * hef - 1.8 * h : 2.26 * hef),
      // adhérences τ_Rk (N/mm², C20/25) : [durée][trou sec ou humide | rempli d'eau][fissuré / non fissuré][plage de température] (Tab. C1)
      tau: {
        50: { sec: { ucr: { I: rep(18, 8), II: rep(15, 8), III: rep(13, 8) }, cr: { I: [7.5, 9.4, ...rep(9.5, 6)], II: [6.4, ...rep(8.0, 7)], III: [5.5, 6.8, ...rep(6.9, 6)] } },
              eau: { ucr: { I: [14.0, 13.8, 13.5, 13.0, 12.5, 11.9, 11.4, 10.9], II: [11.9, 11.7, 11.5, 11.1, 10.6, 10.1, 9.7, 9.3], III: [10.2, 10.1, 9.9, 9.5, 9.1, 8.7, 8.3, 8.0] },
                     cr: { I: [6.1, 7.4, 7.2, 6.7, 6.4, 6.1, 6.1, 6.0], II: [5.2, 6.3, 6.1, 5.7, 5.5, 5.2, 5.2, 5.1], III: [4.5, 5.4, 5.2, 4.9, 4.7, 4.5, 4.5, 4.4] } } },
        100: { sec: { ucr: { I: rep(17, 8), II: rep(14, 8), III: rep(12, 8) }, cr: { I: [6.5, 6.7, ...rep(8.1, 6)], II: [5.5, 5.7, ...rep(7.0, 6)], III: [5.0, 5.0, ...rep(6.0, 6)] } },
               eau: { ucr: { I: [14.0, 13.8, 13.5, 13.0, 12.5, 11.9, 11.4, 10.9], II: [11.9, 11.7, 11.5, 11.1, 10.6, 10.1, 9.7, 9.3], III: [10.2, 10.1, 9.9, 9.5, 9.1, 8.7, 8.3, 8.0] },
                      cr: { I: [5.5, 5.3, 6.1, 5.8, 5.5, 5.3, 5.1, 4.8], II: [4.5, 4.5, 5.2, 4.9, 4.7, 4.5, 4.3, 4.1], III: [3.9, 3.8, 4.5, 4.2, 4.0, 3.8, 3.7, 3.5] } } },
      },
      psiSus0: { 50: { I: 0.80, II: 0.89, III: 0.72 }, 100: { I: 0.85, II: 0.95, III: 0.80 } },
      psiC: (fck) => Math.pow(fck / 20, 0.1), gInst: (eau) => (eau ? 1.4 : 1.0),
      // séisme (Tab. C17 à C26) : C1 M10–M30 (5.8 et 8.8) ; C2 M12–M24, 8.8 seulement
      sis: {
        C1: { ok: (i, cl) => i >= 1, tau: { 50: { I: [0, 5.2, ...rep(7.0, 6)], II: [0, 3.9, ...rep(5.7, 6)], III: [0, 3.5, ...rep(4.8, 6)] }, 100: { I: [0, 4.5, ...rep(6.3, 6)], II: [0, 3.7, ...rep(5.2, 6)], III: [0, 3.1, ...rep(4.4, 6)] } },
              vrks: (i, cl, P, rempli) => P.cl[cl].k6 * P.cl[cl].nrks[i] * 1000, gapRempli: (i) => (i >= 1 && i <= 5 ? 1.0 : null), dN: null, dV: null },
        C2: { ok: (i, cl) => cl === "8.8" && i >= 2 && i <= 5, tau: { 50: { I: [0, 0, 2.7, 4.6, 4.6, 3.5, 0, 0], II: [0, 0, 2.3, 3.9, 3.9, 2.9, 0, 0], III: [0, 0, 2.0, 3.3, 3.3, 2.5, 0, 0] } },
              vrks: (i, cl, P, rempli) => (rempli ? [0, 0, 28, 46, 77, 103][i] : [0, 0, 24, 40, 71, 90][i]) * 1000, gapRempli: () => 1.0,
              dN: [0, 0, 0.3, 0.4, 0.5, 0.4], dV: { rempli: [0, 0, 0.6, 1.2, 1.4, 1.1], vide: [0, 0, 1.9, 3.2, 2.5, 3.5] } },
      },
    },
    HST4: {
      nom: "HST4 (goujon d'ancrage, acier électrozingué, perçage au marteau)", eta: "ETA-21/0878 du 09/10/2025", chimique: false,
      diam: ["M8", "M10", "M12", "M16", "M20"], d: [8, 10, 12, 16, 20], d0: [8, 10, 12, 16, 20],
      hef: [[30, 90], [30, 100], [40, 125], [65, 160], [101, 180]],
      hmin: (i, hef) => [Math.max(80, 1.5 * hef), Math.max(80, 1.5 * hef), Math.max(100, 1.5 * hef), Math.max(120, 1.5 * hef), 160 + hef - 101][i],
      smin: [35, 40, 50, 65, 90], cmin: [40, 45, 55, 65, 80],
      cl: { acier: { nrks: [21.0, 32.5, 46.0, 75.0, 124.2], gN: 1.4, gV: 1.25, m0: [31, 63, 110, 247, 457] } },
      nrkp: { cr: [12, 19, 28, 38, 35], ucr: [19, 30, 42, 55, 49.9] },   // kN, C20/25, perçage au marteau (Tab. C1)
      v0rks: (i, hef) => [16.3, 24.8, Math.min(0.166 * hef + 27.49, 37.4), 62.9, 83.9][i] * 1000,   // Tab. C4 (béton ≥ C20/25)
      k1: { cr: [7.7, 8.9, 8.9, 8.9, 7.7], ucr: [11.0, 11.8, 12.7, 12.7, 11.0] }, k7: 1.0,
      k8: (i, hef) => [[[39, 2.05], [90, 2.76]], [[39, 1.86], [100, 2.00]], [[49, 2.5], [125, 2.74]], [[160, 3.0]], [[180, 3.2]]][i].find(([m]) => hef <= m)?.[1] ?? 2.0,
      ccrN: (hef) => 1.5 * hef, ccrsp: (hef) => 1.9 * hef,   // borne haute du Tab. C1 (formule A_rqd non intégrée : prudent)
      psiC: (fck) => Math.min(Math.pow(fck / 20, 0.5), 1.58), gInst: () => 1.0,
      sis: null,   // performances sismiques du HST4 non intégrées
    },
  };
  /* ---------------- coefficients partiels (NF EN 1992-4/NA Tab. 4.1) ---------------- */
  function gammas(P, cl, eau, sis, gAcierSis) {
    const C = P.cl[cl], gi = P.gInst(eau);
    let gMsN = C.gN || Math.max(1.2 * C.fuk / C.fyk, 1.4), gMsV = C.gV || (C.fuk <= 800 && C.fyk / C.fuk <= 0.8 ? Math.max(C.fuk / C.fyk, 1.25) : 1.5);
    if (sis && gAcierSis === "acc" && C.fuk) { gMsN = Math.max(1.05 * C.fuk / C.fyk, 1.25); gMsV = C.fuk <= 800 && C.fyk / C.fuk <= 0.8 ? Math.max(C.fuk / C.fyk, 1.25) : 1.3; }
    const gc = sis ? 1.3 : 1.5;
    return { gMsN, gMsV, gMc: gc * gi, gMp: gc * gi, gMsp: gc * gi, gMcV: gc, gInst: gi, gc };
  }
  /* ---------------- géométrie : aire de l'union de rectangles, découpée par les bords ---------------- */
  function aireUnion(R, bx) {   // R : [[x0,y0,x1,y1]] ; bx : [xmin,ymin,xmax,ymax]
    const C = R.map(([a, b, c, d]) => [Math.max(a, bx[0]), Math.max(b, bx[1]), Math.min(c, bx[2]), Math.min(d, bx[3])]).filter(([a, b, c, d]) => c > a && d > b);
    if (!C.length) return 0;
    const xs = [...new Set(C.flatMap((r) => [r[0], r[2]]))].sort((a, b) => a - b); let A = 0;
    for (let i = 0; i < xs.length - 1; i++) { const xm = (xs[i] + xs[i + 1]) / 2, I = C.filter((r) => r[0] <= xm && r[2] >= xm).map((r) => [r[1], r[3]]).sort((a, b) => a[0] - b[0]);
      let L = 0, cur = null; I.forEach(([a, b]) => { if (!cur || a > cur[1]) { if (cur) L += cur[1] - cur[0]; cur = [a, b]; } else cur[1] = Math.max(cur[1], b); }); if (cur) L += cur[1] - cur[0];
      A += L * (xs[i + 1] - xs[i]); }
    return A;
  }
  const bornes = (E) => [-E.xm, -E.ym, E.xp, E.yp];   // bords du béton (± Infinity)
  const cMin = (a, E) => Math.min(E.xp - a.x, a.x + E.xm, E.yp - a.y, a.y + E.ym);
  /* ---------------- répartition (platine rigide) ---------------- */
  function repartition(A, pl, d, Ec, ch) {   // ch : {N, Vx, Vy, Mx, My, Mz} en N, N·mm au centre de la platine ; N > 0 traction
    const Es = 210000, As = Math.PI * d * d / 4 * 0.78, Ka = Es * As, n = A.length;
    // béton comprimé sous la platine : cellules
    const nx = 30, ny = 30, cel = []; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) cel.push([-pl.lx / 2 + (i + 0.5) * pl.lx / nx, -pl.ly / 2 + (j + 0.5) * pl.ly / ny]);
    const dA = pl.lx * pl.ly / (nx * ny), Kc = Ec * dA;
    const res = (u) => { let F = [0, 0, 0]; const J = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      const ajout = (x, y, k, sgn) => { const e = u[0] + u[1] * x + u[2] * y; if (sgn * e <= 0) return; const f = k * e, g = [1, x, y]; F[0] += f; F[1] += f * y; F[2] += f * x; const w = [1, y, x];
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) J[a][b] += k * w[a] * g[b]; };
      A.forEach((a) => ajout(a.x, a.y, Ka, 1)); cel.forEach(([x, y]) => ajout(x, y, Kc, -1));
      return { R: [F[0] - ch.N, F[1] - ch.Mx, F[2] + ch.My], J }; };
    // départ : toutes les chevilles tendues, sans béton
    const sx2 = A.reduce((s, a) => s + a.x * a.x, 0) || 1, sy2 = A.reduce((s, a) => s + a.y * a.y, 0) || 1;
    let u = [ch.N / (n * Ka) || 1e-7, -ch.My / (sx2 * Ka), ch.Mx / (sy2 * Ka)];
    if (Math.abs(ch.N) < 1e-9 && Math.abs(ch.Mx) < 1e-9 && Math.abs(ch.My) < 1e-9) u = [0, 0, 0];
    else for (let it = 0; it < 80; it++) { const { R, J } = res(u), nr = Math.hypot(...R); if (nr < 1e-6 * (Math.abs(ch.N) + Math.abs(ch.Mx) / 100 + Math.abs(ch.My) / 100 + 1)) break;
      const s = resoudre3(J, R.map((v) => -v)); if (!s) { u = u.map((v, k) => v + (k ? 0 : 1e-7)); continue; } let t = 1; u = u.map((v, k) => v + t * s[k]); }
    const T = A.map((a) => Math.max(0, Ka * (u[0] + u[1] * a.x + u[2] * a.y)));
    let C = 0, Cx = 0, Cy = 0; cel.forEach(([x, y]) => { const e = u[0] + u[1] * x + u[2] * y; if (e < 0) { const f = -Kc * e; C += f; Cx += f * x; Cy += f * y; } });
    // cisaillement : réparti également + torsion autour du centre de gravité des chevilles
    const gx = A.reduce((s, a) => s + a.x, 0) / n, gy = A.reduce((s, a) => s + a.y, 0) / n, r2 = A.reduce((s, a) => s + (a.x - gx) ** 2 + (a.y - gy) ** 2, 0) || 1;
    const Mzg = ch.Mz - (gx * ch.Vy - gy * ch.Vx);
    const V = A.map((a) => ({ x: ch.Vx / n - Mzg * (a.y - gy) / r2, y: ch.Vy / n + Mzg * (a.x - gx) / r2 }));
    return { T, V, C, Cx: C ? Cx / C : 0, Cy: C ? Cy / C : 0 };
  }
  function resoudre3(M, b) { const A = M.map((r, i) => [...r, b[i]]); for (let c = 0; c < 3; c++) { let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; if (Math.abs(A[p][c]) < 1e-30) return null; [A[c], A[p]] = [A[p], A[c]];
      for (let r = 0; r < 3; r++) if (r !== c) { const k = A[r][c] / A[c][c]; for (let k2 = c; k2 < 4; k2++) A[r][k2] -= k * A[c][k2]; } } return A.map((r, i) => r[3] / r[i]); }
  /* ---------------- vérifications ---------------- */
  function verifier(inp) {
    const P = PROD[inp.prod], i = P.diam.indexOf(inp.diam), d = P.d[i], hef = inp.hef, B = inp.beton, fck = B.fck, cr = B.fiss, E = B.bords, h = B.h, po = inp.pose || {}, cl = inp.cl;
    const S = inp.comb, sis = !!S.sis, Q = inp.sis || {}, cat = Q.cat || "C2", SI = sis && P.sis ? P.sis[cat] : null, G = gammas(P, cl, po.eau, sis, Q.gAcier || "durable");
    const out = { modes: [], alertes: [], g: G };
    if (sis && (!P.sis || !SI || !SI.ok(i, cl))) out.alertes.push(`Situation sismique : performance ${cat} non couverte par l'ETE pour ${inp.diam}${cl && cl !== "acier" ? " " + cl : ""} (${P.eta}).`);
    const amp = sis ? (Q.amp || 1) : 1;
    const hors = inp.A.map((a, k) => (cMin(a, E) <= 0 ? k + 1 : 0)).filter(Boolean);
    if (hors.length) { out.err = `Cheville(s) ${hors.join(", ")} hors du béton (au-delà d'un bord).`; out.T = inp.A.map(() => 0); out.V = inp.A.map(() => ({ x: 0, y: 0 })); out.Cres = { C: 0 }; out.uMax = NaN; return out; }
    // efforts par cheville
    let T, V, Cres;
    if (inp.forces) { T = inp.forces.map((f) => Math.max(0, f.N)); V = inp.forces.map((f) => ({ x: f.Vx, y: f.Vy })); Cres = inp.Cres || { C: 0, x: 0, y: 0 }; }
    else { const r = repartition(inp.A, inp.plaque, d, B.Ecm * 1000, { N: S.N * amp, Vx: S.Vx * amp, Vy: S.Vy * amp, Mx: S.Mx * amp, My: S.My * amp, Mz: S.Mz * amp }); T = r.T; V = r.V; Cres = { C: r.C, x: r.Cx, y: r.Cy }; }
    out.T = T; out.V = V; out.Cres = Cres;
    const A = inp.A, ten = A.map((a, k) => ({ ...a, k, N: T[k] })).filter((a) => a.N > 1e-6), NEd = ten.reduce((s, a) => s + a.N, 0);
    // séisme : α_eq (Tab. C.3), α_gap, réduction DLS (§C.6)
    const groupe = A.length > 1, aeq = (m) => (!sis ? 1 : ({ s: 1, c: groupe ? 0.75 : 0.85, p: groupe ? 0.85 : 1, sp: groupe ? 0.85 : 1, vs: groupe ? 0.85 : 1, cp: groupe ? 0.75 : 0.85, e: groupe ? 0.85 : 1 })[m]);
    const agap = !sis ? 1 : po.annul ? ((SI && SI.gapRempli && SI.gapRempli(i)) || 1) : 0.5;
    let rN = 1, rV = 1;
    if (sis && SI && SI.dN && Q.dls !== "ETE") { const dNreq = Q.dls === "perso" ? Q.dNreq : 3, dVreq = Q.dls === "perso" ? Q.dVreq : 3, dN = SI.dN[i], dV = (po.annul ? SI.dV.rempli : SI.dV.vide)[i];
      if (dN > dNreq) rN = dNreq / dN; if (dV > dVreq) rV = dVreq / dV; out.dls = { dNreq, dVreq, dN, dV, rN, rV }; }
    const ajout = (o) => { o.u = o.Rd > 0 ? o.Ed / o.Rd : (o.Ed > 0 ? Infinity : 0); out.modes.push(o); return o; };
    // --- TRACTION ---
    const C0 = P.cl[cl], nrks = C0.nrks[i] * 1000;
    if (NEd > 0) {
      const iMax = ten.reduce((m, a) => (a.N > m.N ? a : m), ten[0]);
      ajout({ id: "Ns", t: "N", lib: "Rupture de l'acier", ref: "§7.2.1.3" + (sis ? ", §C.5" : ""), Ed: iMax.N, Rd: nrks * aeq("s") / G.gMsN * rN, det: { NRk_s: nrks, gMs: G.gMsN, cheville: iMax.k + 1, rN } });
      // excentricité de la résultante de traction / centre des chevilles tendues
      const gx = ten.reduce((s, a) => s + a.x, 0) / ten.length, gy = ten.reduce((s, a) => s + a.y, 0) / ten.length;
      const tx = ten.reduce((s, a) => s + a.N * a.x, 0) / NEd, ty = ten.reduce((s, a) => s + a.N * a.y, 0) / NEd, eN1 = Math.abs(tx - gx), eN2 = Math.abs(ty - gy);
      const ccr = P.ccrN(hef), scr = 2 * ccr, k1 = Array.isArray(P.k1[cr ? "cr" : "ucr"]) ? P.k1[cr ? "cr" : "ucr"][i] : P.k1[cr ? "cr" : "ucr"];
      const AcN = aireUnion(ten.map((a) => [a.x - ccr, a.y - ccr, a.x + ccr, a.y + ccr]), bornes(E)), Ac0 = scr * scr;
      const cm = Math.min(...ten.map((a) => cMin(a, E))), psiS = Math.min(1, 0.7 + 0.3 * cm / ccr), psiRe = po.reRe || hef >= 100 ? 1 : Math.min(1, 0.5 + hef / 200);
      const psiEc = (e, s) => Math.min(1, 1 / (1 + 2 * e / s)), pE = psiEc(eN1, scr) * psiEc(eN2, scr);
      const z = Cres.C > 0 ? Math.hypot(tx - Cres.x, ty - Cres.y) : 0;
      let psiM = 1; if (Cres.C > 0 && cm >= 1.5 * hef && Cres.C / NEd > 0.8 && z / hef < 1.5) psiM = Math.max(1, 2 - z / (1.5 * hef));
      const N0c = k1 * Math.sqrt(fck) * Math.pow(hef, 1.5), NRkc = N0c * AcN / Ac0 * psiS * psiRe * pE * psiM;
      ajout({ id: "Nc", t: "N", lib: "Rupture par cône de béton", ref: "§7.2.1.4, éq. (7.1) à (7.7)" + (sis ? ", §C.5" : ""), Ed: NEd, Rd: NRkc * aeq("c") / G.gMc * rN,
        det: { N0Rk_c: N0c, k1, AcN, Ac0, ccr, scr, psiS, psiRe, eN1, eN2, psiEc: pE, z, psiM, NRk_c: NRkc, gMc: G.gMc, aeq: aeq("c"), rN } });
      out.NRk_c_ten = NRkc;
      if (P.chimique) {
        const psi0 = P.psiSus0[po.vie || 50][po.temp || "I"], aSus = po.aSus || 0, psiSus = aSus <= psi0 ? 1 : psi0 + 1 - aSus;
        const tabs = P.tau[po.vie || 50][po.eau ? "eau" : "sec"], tauSt = tabs[cr ? "cr" : "ucr"][po.temp || "I"][i] * P.psiC(fck);
        let tau = tauSt; if (sis && SI) tau = (SI.tau[po.vie || 50] || SI.tau[50])[po.temp || "I"][i];   // τ_Rk,eq (ψ_c = 1,0 en séisme)
        const tauUcr20 = P.tau[po.vie || 50][po.eau ? "eau" : "sec"].ucr[po.temp || "I"][i], scrNp = Math.min(7.3 * d * Math.sqrt(psiSus * tauUcr20), 3 * hef), ccrNp = scrNp / 2;
        const ApN = aireUnion(ten.map((a) => [a.x - ccrNp, a.y - ccrNp, a.x + ccrNp, a.y + ccrNp]), bornes(E)), Ap0 = scrNp * scrNp;
        const tauRkc = (cr ? 7.7 : 11.0) / (Math.PI * d) * Math.sqrt(hef * fck), n = ten.length;
        const psiG0 = Math.max(1, Math.sqrt(n) - (Math.sqrt(n) - 1) * Math.pow(tau / tauRkc, 1.5));
        let sMoy = 0; if (n > 1) sMoy = ten.reduce((s, a) => s + Math.min(...ten.filter((b) => b !== a).map((b) => Math.hypot(a.x - b.x, a.y - b.y))), 0) / n;
        const psiG = n > 1 ? Math.max(1, psiG0 - Math.sqrt(Math.min(1, sMoy / scrNp)) * (psiG0 - 1)) : 1;
        const psiSp = Math.min(1, 0.7 + 0.3 * cm / ccrNp), pEp = psiEc(eN1, scrNp) * psiEc(eN2, scrNp);
        const N0p = psiSus * tau * Math.PI * d * hef, NRkp = N0p * ApN / Ap0 * psiG * psiSp * psiRe * pEp;
        ajout({ id: "Np", t: "N", lib: "Rupture combinée extraction-glissement et cône de béton", ref: "§7.2.1.6, éq. (7.13) à (7.21)" + (sis ? ", §C.5" : ""), Ed: NEd, Rd: NRkp * aeq("p") / G.gMp * rN,
          det: { tauRk: tau, psiC: P.psiC(fck), psiSus, scrNp, ccrNp, ApN, Ap0, tauRkc, psiG0, psiG, sMoy, psiSp, psiEc: pEp, N0Rk_p: N0p, NRk_p: NRkp, gMp: G.gMp, aeq: aeq("p"), rN } });
        out.NRk_p_ten = NRkp;
      } else {
        const nrkp = P.nrkp[cr ? "cr" : "ucr"][i] * 1000 * P.psiC(fck), iM = ten.reduce((m, a) => (a.N > m.N ? a : m), ten[0]);
        ajout({ id: "Np", t: "N", lib: "Rupture par extraction-glissement", ref: "§7.2.1.5 (N_Rk,p de l'ETE · ψ_c)" + (sis ? ", §C.5" : ""), Ed: iM.N, Rd: nrkp * aeq("p") / G.gMp * rN, det: { NRk_p: nrkp, psiC: P.psiC(fck), gMp: G.gMp, cheville: iM.k + 1 } });
      }
      // fendage (§7.2.1.7)
      const ccrsp = P.ccrsp(hef, h), hmin = P.hmin(i, hef), lim = A.length > 1 ? 1.2 * ccrsp : ccrsp;
      if (po.spRe && cr) ajout({ id: "Nsp", t: "N", lib: "Rupture par fendage", ref: "§7.2.1.7 (2) b) 2) : armature limitant w_k ≤ 0,3 mm", Ed: 0, Rd: 1, sans: true });
      else if (Math.min(...A.map((a) => cMin(a, E))) >= lim && h >= hmin) ajout({ id: "Nsp", t: "N", lib: "Rupture par fendage", ref: `§7.2.1.7 (2) b) 1) : c ≥ ${A.length > 1 ? "1,2·" : ""}c_cr,sp = ${Math.round(lim)} mm et h ≥ h_min = ${Math.round(hmin)} mm, sans objet`, Ed: 0, Rd: 1, sans: true });
      else {
        const scrsp = 2 * ccrsp, Asp = aireUnion(ten.map((a) => [a.x - ccrsp, a.y - ccrsp, a.x + ccrsp, a.y + ccrsp]), bornes(E)), A0sp = scrsp * scrsp;
        const c1 = cm, psiH = Math.min(Math.pow(h / hmin, 2 / 3), Math.max(1, Math.pow((hef + 1.5 * c1) / hmin, 2 / 3)), 2);
        const N0 = P.chimique ? out.modes.find((m) => m.id === "Np").det.N0Rk_p : Math.min(P.nrkp[cr ? "cr" : "ucr"][i] * 1000 * P.psiC(fck), N0c);   // §7.2.1.7 NOTE
        const NRksp = N0 * Asp / A0sp * Math.min(1, 0.7 + 0.3 * cm / ccrsp) * psiRe * psiEc(eN1, scrsp) * psiEc(eN2, scrsp) * psiH;
        ajout({ id: "Nsp", t: "N", lib: "Rupture par fendage", ref: "§7.2.1.7, éq. (7.23), (7.24)" + (sis ? ", §C.5" : ""), Ed: NEd, Rd: NRksp * aeq("sp") / G.gMsp * rN, det: { ccrsp, hmin, Asp, A0sp, psiH, N0Rk_sp: N0, NRk_sp: NRksp } });
      }
    }
    // --- CISAILLEMENT ---
    const Vi = V.map((v) => Math.hypot(v.x, v.y)), VxT = V.reduce((s, v) => s + v.x, 0), VyT = V.reduce((s, v) => s + v.y, 0), VT = Math.hypot(VxT, VyT);
    if (VT > 1e-6 || Vi.some((v) => v > 1e-6)) {
      const kV = Vi.indexOf(Math.max(...Vi));
      const v0 = P.chimique ? (sis && SI ? SI.vrks(i, cl, P, po.annul) : C0.k6 * nrks) : (P.v0rks(i, hef));
      const v0eq = v0;
      ajout({ id: "Vs", t: "V", lib: "Rupture de l'acier sans bras de levier", ref: "§7.2.2.3.1, éq. (7.35)" + (sis ? ", §C.5" : ""), Ed: Vi[kV], Rd: P.k7 * v0eq * agap * aeq("vs") / G.gMsV * rV, det: { V0Rk_s: v0eq, k7: P.k7, gMs: G.gMsV, agap, aeq: aeq("vs"), cheville: kV + 1, rV } });
      // effet de levier : toutes les chevilles cisaillées
      const ccr = P.ccrN(hef), scr = 2 * ccr, k1 = Array.isArray(P.k1[cr ? "cr" : "ucr"]) ? P.k1[cr ? "cr" : "ucr"][i] : P.k1[cr ? "cr" : "ucr"];
      const AcN = aireUnion(A.map((a) => [a.x - ccr, a.y - ccr, a.x + ccr, a.y + ccr]), bornes(E)), cmA = Math.min(...A.map((a) => cMin(a, E)));
      const gx = A.reduce((s, a) => s + a.x, 0) / A.length, gy = A.reduce((s, a) => s + a.y, 0) / A.length;
      const Mg = V.reduce((s, v, k) => s + (A[k].x - gx) * v.y - (A[k].y - gy) * v.x, 0), eV = VT > 1e-6 ? Math.abs(Mg) / VT : 0;
      const ex = VT > 1e-6 ? eV * Math.abs(VyT) / VT : 0, ey = VT > 1e-6 ? eV * Math.abs(VxT) / VT : 0;   // composantes de l'excentricité de la résultante
      const psiEc = (e) => Math.min(1, 1 / (1 + 2 * e / scr));
      const psiRe = po.reRe || hef >= 100 ? 1 : Math.min(1, 0.5 + hef / 200);
      const NRkcV = k1 * Math.sqrt(fck) * Math.pow(hef, 1.5) * AcN / (scr * scr) * Math.min(1, 0.7 + 0.3 * cmA / ccr) * psiRe * psiEc(ex) * psiEc(ey);
      let NRkpV = Infinity;
      if (P.chimique) { const psi0 = P.psiSus0[po.vie || 50][po.temp || "I"], aSus = po.aSus || 0, psiSus = aSus <= psi0 ? 1 : psi0 + 1 - aSus;
        const tau = P.tau[po.vie || 50][po.eau ? "eau" : "sec"][cr ? "cr" : "ucr"][po.temp || "I"][i] * P.psiC(fck), tauU = P.tau[po.vie || 50][po.eau ? "eau" : "sec"].ucr[po.temp || "I"][i];
        const scrNp = Math.min(7.3 * d * Math.sqrt(psiSus * tauU), 3 * hef), ApN = aireUnion(A.map((a) => [a.x - scrNp / 2, a.y - scrNp / 2, a.x + scrNp / 2, a.y + scrNp / 2]), bornes(E)), n = A.length;
        const tauRkc = (cr ? 7.7 : 11.0) / (Math.PI * d) * Math.sqrt(hef * fck), psiG0 = Math.max(1, Math.sqrt(n) - (Math.sqrt(n) - 1) * Math.pow(tau / tauRkc, 1.5));
        const sMoy = n > 1 ? A.reduce((s, a) => s + Math.min(...A.filter((b) => b !== a).map((b) => Math.hypot(a.x - b.x, a.y - b.y))), 0) / n : 0, psiG = n > 1 ? Math.max(1, psiG0 - Math.sqrt(Math.min(1, sMoy / scrNp)) * (psiG0 - 1)) : 1;
        NRkpV = psiSus * tau * Math.PI * d * hef * ApN / (scrNp * scrNp) * psiG * Math.min(1, 0.7 + 0.3 * cmA / (scrNp / 2)) * psiRe * Math.min(1, 1 / (1 + 2 * ex / scrNp)) * Math.min(1, 1 / (1 + 2 * ey / scrNp)); }
      const k8 = P.k8(i, hef), VRkcp = k8 * Math.min(NRkcV, NRkpV);
      ajout({ id: "Vcp", t: "V", lib: "Rupture du béton par effet de levier", ref: "§7.2.2.4, éq. (7.39" + (P.chimique ? "c" : "a") + ")" + (sis ? ", §C.5" : ""), Ed: VT, Rd: VRkcp * agap * aeq("cp") / G.gc * rV,   // γ_inst = 1,0 en cisaillement (AN Tab. 4.1)
        det: { k8, NRk_c: NRkcV, NRk_p: NRkpV, AcN, eV, VRk_cp: VRkcp, agap, aeq: aeq("cp") } });
      // bord du béton (bords finis plus proches que max(10 h_ef ; 60 d))
      const lim = Math.max(10 * hef, 60 * d), dirs = [["+X", "xp", 1, 0], ["−X", "xm", -1, 0], ["+Y", "yp", 0, 1], ["−Y", "ym", 0, -1]];
      dirs.forEach(([lab, k, ux, uy]) => {
        if (!isFinite(E[k])) return;
        const cOf = (a) => (k === "xp" ? E.xp - a.x : k === "xm" ? a.x + E.xm : k === "yp" ? E.yp - a.y : a.y + E.ym), c1 = Math.min(...A.map(cOf));
        if (c1 >= lim) return;
        const front = po.annul ? A : A.filter((a) => cOf(a) <= c1 + 1);   // espace annulaire non comblé : rangée la plus proche du bord
        // composantes vers le bord (somme algébrique) et parallèles au bord (somme des valeurs absolues, prudent – Fig. 7.12)
        const Vperp = A.reduce((s2, _, k) => s2 + V[k].x * ux + V[k].y * uy, 0), Vpar = A.reduce((s2, _, k) => s2 + Math.abs(V[k].x * uy - V[k].y * ux), 0);
        if (Vperp <= 1e-6 && Vpar <= 1e-6) return;
        const alphaV = Vperp > 1e-6 ? Math.atan2(Vpar, Vperp) : Math.PI / 2, VEd = Vperp > 1e-6 ? Math.hypot(Vperp, Vpar) : Vpar;
        const lf = Math.min(hef, d <= 24 ? 12 * d : Math.max(8 * d, 300)), al = 0.1 * Math.sqrt(lf / c1), be = 0.1 * Math.pow(d / c1, 0.2), k9 = cr ? 1.7 : 2.4;
        const V0 = k9 * Math.pow(d, al) * Math.pow(lf, be) * Math.sqrt(fck) * Math.pow(c1, 1.5);
        // surface A_c,V : union des bandes ±1,5 c1 parallèles au bord, hauteur min(h ; 1,5 c1), bornée par les bords latéraux
        const par = (a) => (ux ? a.y : a.x), lo = ux ? -E.ym : -E.xm, hi = ux ? E.yp : E.xp;
        const AcV = aireUnion(front.map((a) => [par(a) - 1.5 * c1, 0, par(a) + 1.5 * c1, Math.min(h, 1.5 * c1)]), [lo, 0, hi, Infinity]), Ac0V = 4.5 * c1 * c1;
        const c2 = Math.min(...front.map((a) => Math.min(par(a) - lo, hi - par(a)))), psiS = Math.min(1, 0.7 + 0.3 * c2 / (1.5 * c1)), psiH = Math.max(1, Math.sqrt(1.5 * c1 / h));
        const psiA = Math.max(1, 1 / Math.sqrt(Math.cos(alphaV) ** 2 + (0.5 * Math.sin(alphaV)) ** 2)), psiEcV = Math.min(1, 1 / (1 + 2 * (ux ? ey : ex) / (3 * c1)));
        const VRkc = V0 * AcV / Ac0V * psiS * psiH * psiEcV * psiA * (po.reV ? 1.4 : 1);
        ajout({ id: "Vc" + k, t: "V", lib: `Rupture du bord du béton (${lab})`, ref: "§7.2.2.5, éq. (7.40) à (7.48)" + (sis ? ", §C.5" : ""), Ed: VEd, Rd: VRkc * agap * aeq("e") / G.gc * rV,
          det: { c1, k9, lf, alpha: al, beta: be, V0Rk_c: V0, AcV, Ac0V, psiS, psiH, psiA, psiEc: psiEcV, alphaV: alphaV * 180 / Math.PI, n: front.length } });
      });
    }
    // --- INTERACTION (Tab. 7.3 ; séisme éq. C.9, k15 = 1) ---
    const Ms = out.modes.filter((m) => !m.sans);
    const bNs = (k) => { const m = Ms.find((x) => x.id === "Ns"); return m ? T[k] / m.Rd : 0; }, bVs = (k) => { const m = Ms.find((x) => x.id === "Vs"); return m ? Vi[k] / m.Rd : 0; };
    if (Ms.some((m) => m.t === "N") && Ms.some((m) => m.t === "V")) {
      let us = 0; A.forEach((_, k) => { us = Math.max(us, sis ? bNs(k) + bVs(k) : bNs(k) ** 2 + bVs(k) ** 2); });
      out.inter = { acier: { u: us, ref: sis ? "§C.5 (3), éq. (C.9), k15 = 1" : "Tab. 7.3, éq. (7.54)" } };
      const bN = Math.max(0, ...Ms.filter((m) => m.t === "N" && m.id !== "Ns").map((m) => m.u)), bV = Math.max(0, ...Ms.filter((m) => m.t === "V" && m.id !== "Vs").map((m) => m.u));
      const e55 = Math.pow(bN, 1.5) + Math.pow(bV, 1.5), e56 = (bN + bV) / 1.2;
      out.inter.beton = sis ? { u: bN + bV, ref: "§C.5 (3), éq. (C.9), k15 = 1", bN, bV } : (bN > 1 || bV > 1 ? { u: Math.max(bN, bV, e55), ref: "Tab. 7.3 : β ≤ 1 non respecté", bN, bV } : { u: Math.min(e55, e56), ref: e55 <= e56 ? "Tab. 7.3, éq. (7.55)" : "Tab. 7.3, éq. (7.56)", bN, bV, e55, e56 });
    }
    out.uMax = Math.max(0, ...Ms.map((m) => m.u), out.inter ? out.inter.acier.u : 0, out.inter ? out.inter.beton.u : 0);
    if (sis && (!P.sis || !SI || !SI.ok(i, cl))) { out.nv = true; out.uMax = NaN; }   // performance sismique non couverte : non vérifiable
    return out;
  }
  /* h_ef optimale : plus petite profondeur de la plage ETE vérifiant toutes les combinaisons */
  function hefOpti(base, combs, pas = 5) {
    const P = PROD[base.prod], i = P.diam.indexOf(base.diam), [a, b] = P.hef[i];
    for (let hef = a; hef <= b; hef += pas) { if (combs.every((c) => verifier({ ...base, hef, comb: c }).uMax <= 1)) return hef; }
    return null;
  }
  /* axes de la platine selon l'appui S1 : z sortant du béton, (x, y, z) direct
     sol : (X, Y, Z) ; plafond : (X, −Y, −Z) ; mur (console selon +Y) : (−X, Z, Y), vue de face y vers le haut */
  function axesPlatine(k) {
    if (k === "murPied") k = "mur";      // pied de jambe de force : platine murale
    const n = k === "sol" ? [0, 0, 1] : k === "mur" ? [0, 1, 0] : [0, 0, -1], u1 = k === "mur" ? [-1, 0, 0] : [1, 0, 0];
    return { u1, u2: [n[1] * u1[2] - n[2] * u1[1], n[2] * u1[0] - n[0] * u1[2], n[0] * u1[1] - n[1] * u1[0]], n };
  }
  /* F = [Fx, Fy, Fz, Mx, My, Mz] : effort de l'ouvrage sur l'appui (axes globaux) → {N (> 0 traction), Vx, Vy, Mx, My, Mz} dans les axes de la platine */
  function effortsPlatine(F, k) {
    const { u1, u2, n } = axesPlatine(k), d = (a, o) => a[0] * F[o] + a[1] * F[o + 1] + a[2] * F[o + 2];
    return { N: d(n, 0), Vx: d(u1, 0), Vy: d(u2, 0), Mx: d(u1, 3), My: d(u2, 3), Mz: d(n, 3) };
  }
  return { PROD, AS, verifier, repartition, aireUnion, hefOpti, gammas, axesPlatine, effortsPlatine };
})();
if (typeof module !== "undefined") module.exports = CHEV;
