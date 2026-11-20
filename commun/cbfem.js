/* =====================================================================
   CBFEM — platine flexible sur béton (phase 2 de AN1). Unités : N, mm.
   Modèle :
   - platine : plaque épaisse de Reissner-Mindlin, quadrilatères MITC4 (3 ddl par nœud : w, βx, βy), maillage
     rectangulaire passant par les chevilles ; acier élastique – parfaitement plastique traité par rigidité sécante
     en flexion (théorie de la déformation, critère de von Mises sur le moment équivalent) ;
   - béton : appui de Winkler unilatéral (compression seule), raideur k_c = E_cm / h_c ;
   - chevilles : ressorts en traction seule de raideur k_a (déplacement de l'ETE ou tige E_s·A_s/L) ;
   - profilé : parois indéformables dans leur plan (section plane w = w0 + θ1·y − θ2·x imposée par pénalité le long
     des lignes moyennes des parois) ; N, Mx, My appliqués à ce corps rigide (au centre de la platine) ;
   - résolution : factorisation LDLᵀ en ligne de ciel, itérations sur l'état des contacts, des chevilles et des
     rigidités sécantes.
   Sorties : traction par cheville, pression de contact, contrainte équivalente et déformation plastique de la
   platine, effort linéique en pied de paroi (contrainte du profilé, soudures), flèches.
   Convention : z sortant du béton, w > 0 = décollement ; N > 0 traction ; Mx > 0 tend les y > 0 ; My > 0 tend les x < 0.
   ===================================================================== */
const CBFEM = (() => {
  const NU = 0.3, ES = 210000;

  /* ---------- lignes moyennes des parois d'un profilé (repère local : h selon x pour les I/U, origine au centre) ----------
     p : {f, h, b, tw, tf, t} (commun/data/profils.js) ; retour [{a:[x,y], b:[x,y], t}] ou, pour un tube rond, des cordes */
  function parois(p) {
    if (!p) return [];
    const f = p.f || "";
    if (/^(HE|IP)/.test(f)) { const d = (p.h - p.tf) / 2; return [{ a: [-d, -p.b / 2], b: [-d, p.b / 2], t: p.tf }, { a: [d, -p.b / 2], b: [d, p.b / 2], t: p.tf }, { a: [-d, 0], b: [d, 0], t: p.tw }]; }
    if (/^UP/.test(f)) { const d = (p.h - p.tf) / 2, y0 = -p.b / 2 + p.tw / 2; return [{ a: [-d, y0], b: [-d, p.b / 2], t: p.tf }, { a: [d, y0], b: [d, p.b / 2], t: p.tf }, { a: [-d, y0], b: [d, y0], t: p.tw }]; }
    if (/^L/.test(f)) { const t = p.t || p.tw || p.tf, x0 = -p.b / 2 + t / 2, y0 = -p.h / 2 + t / 2; return [{ a: [x0, y0], b: [p.b / 2, y0], t }, { a: [x0, y0], b: [x0, p.h / 2], t }]; }
    if (f === "CHS") { const r = (p.h - p.t) / 2, n = Math.max(16, Math.round(2 * Math.PI * r / 15)), S = []; for (let i = 0; i < n; i++) { const u = 2 * Math.PI * i / n, v = 2 * Math.PI * (i + 1) / n; S.push({ a: [r * Math.cos(u), r * Math.sin(u)], b: [r * Math.cos(v), r * Math.sin(v)], t: p.t }); } return S; }
    if (p.t && p.b && p.h) { const x = (p.b - p.t) / 2, y = (p.h - p.t) / 2; return [{ a: [-x, -y], b: [x, -y], t: p.t }, { a: [x, -y], b: [x, y], t: p.t }, { a: [x, y], b: [-x, y], t: p.t }, { a: [-x, y], b: [-x, -y], t: p.t }]; }
    return [];
  }
  /* parois placées dans le repère de la platine (excentricité ex, ey ; angle en degrés) */
  function paroisPlacees(p, pr) {
    const a = ((pr && pr.a) || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), ex = (pr && pr.x) || 0, ey = (pr && pr.y) || 0, R = ([x, y]) => [ex + x * c - y * s, ey + x * s + y * c];
    return parois(p).map((w) => ({ a: R(w.a), b: R(w.b), t: w.t }));
  }

  /* ---------- maillage : lignes de la grille ---------- */
  function lignes(L, pts, h) {
    const P = [-L / 2, L / 2].concat(pts.filter((v) => v > -L / 2 + 0.35 * h && v < L / 2 - 0.35 * h)).sort((a, b) => a - b), Q = [P[0]];
    for (let i = 1; i < P.length; i++) { if (P[i] - Q[Q.length - 1] < 0.35 * h) { if (i === P.length - 1) { if (Q.length > 1) Q[Q.length - 1] = P[i]; else Q.push(P[i]); } } else Q.push(P[i]); }
    const out = [];
    for (let i = 0; i < Q.length - 1; i++) { const n = Math.max(1, Math.round((Q[i + 1] - Q[i]) / h)); for (let k = 0; k < n; k++) out.push(Q[i] + (Q[i + 1] - Q[i]) * k / n); }
    out.push(Q[Q.length - 1]); return out;
  }

  /* ---------- rigidité élémentaire MITC4 (rectangle a × b) : flexion Kb (pour D = 1 → ×D) et cisaillement Ks (pour κGt = 1) ---------- */
  function elementaire(a, b) {
    const Kb = new Float64Array(144), Ks = new Float64Array(144), g = 1 / Math.sqrt(3), XI = [-1, 1, 1, -1], ET = [-1, -1, 1, 1];
    for (const xi of [-g, g]) for (const et of [-g, g]) {
      const dNx = [], dNy = []; for (let i = 0; i < 4; i++) { dNx.push(XI[i] * (1 + ET[i] * et) / 4 * 2 / a); dNy.push(ET[i] * (1 + XI[i] * xi) / 4 * 2 / b); }
      const B = [new Float64Array(12), new Float64Array(12), new Float64Array(12)];
      for (let i = 0; i < 4; i++) { B[0][3 * i + 1] = dNx[i]; B[1][3 * i + 2] = dNy[i]; B[2][3 * i + 1] = dNy[i]; B[2][3 * i + 2] = dNx[i]; }
      const Db = [[1, NU, 0], [NU, 1, 0], [0, 0, (1 - NU) / 2]], wJ = a * b / 4;
      for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) { let v = 0; for (let m = 0; m < 3; m++) for (let n = 0; n < 3; n++) v += B[m][r] * Db[m][n] * B[n][c]; Kb[r * 12 + c] += v * wJ; }
      // cisaillement à déformations imposées (MITC4)
      const gx = new Float64Array(12), gy = new Float64Array(12), fA = (1 - et) / 2, fC = (1 + et) / 2, fD = (1 - xi) / 2, fB = (1 + xi) / 2;
      gx[0] += -fA / a; gx[3] += fA / a; gx[1] += fA / 2; gx[4] += fA / 2;           // arête 1-2
      gx[9] += -fC / a; gx[6] += fC / a; gx[10] += fC / 2; gx[7] += fC / 2;          // arête 4-3
      gy[0] += -fD / b; gy[9] += fD / b; gy[2] += fD / 2; gy[11] += fD / 2;          // arête 1-4
      gy[3] += -fB / b; gy[6] += fB / b; gy[5] += fB / 2; gy[8] += fB / 2;           // arête 2-3
      for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) Ks[r * 12 + c] += (gx[r] * gx[c] + gy[r] * gy[c]) * wJ;
    }
    // courbures au centre : κx, κy, κxy
    const Bc = [new Float64Array(12), new Float64Array(12), new Float64Array(12)];
    for (let i = 0; i < 4; i++) { const dx = XI[i] / 4 * 2 / a, dy = ET[i] / 4 * 2 / b; Bc[0][3 * i + 1] = dx; Bc[1][3 * i + 2] = dy; Bc[2][3 * i + 1] = dy; Bc[2][3 * i + 2] = dx; }
    return { Kb, Ks, Bc };
  }

  /* ---------- solveur ligne de ciel (LDLᵀ) ---------- */
  function ciel(n, haut) {            // haut[j] = première ligne non nulle de la colonne j
    const pos = new Int32Array(n + 1); for (let j = 0; j < n; j++) pos[j + 1] = pos[j] + (j - haut[j] + 1);
    return { n, haut, pos, v: new Float64Array(pos[n]) };
  }
  const idx = (S, i, j) => S.pos[j] + (i - S.haut[j]);          // i ≤ j, i ≥ haut[j]
  function factoriser(S) {
    const { n, haut, pos, v } = S;
    for (let j = 0; j < n; j++) {
      const hj = haut[j], pj = pos[j] - hj;
      for (let i = hj + 1; i < j; i++) { const hi = haut[i], pi = pos[i] - hi; let s = v[pj + i]; for (let k = Math.max(hi, hj); k < i; k++) s -= v[pi + k] * v[pj + k]; v[pj + i] = s; }
      let d = v[pj + j];
      for (let i = hj; i < j; i++) { const l = v[pj + i] / v[pos[i] + i - haut[i]]; d -= l * v[pj + i]; v[pj + i] = l; }
      if (!(Math.abs(d) > 1e-12)) throw new Error("Modèle CBFEM instable (aucune cheville tendue ni appui actif).");
      v[pj + j] = d;
    }
  }
  function resoudre(S, f) {
    const { n, haut, pos, v } = S, x = Float64Array.from(f);
    for (let j = 0; j < n; j++) { const pj = pos[j] - haut[j]; let s = x[j]; for (let i = haut[j]; i < j; i++) s -= v[pj + i] * x[i]; x[j] = s; }
    for (let j = 0; j < n; j++) x[j] /= v[pos[j] + j - haut[j]];
    for (let j = n - 1; j >= 0; j--) { const pj = pos[j] - haut[j], xj = x[j]; for (let i = haut[j]; i < j; i++) x[i] -= v[pj + i] * xj; }
    return x;
  }

  /* ---------- raideur axiale d'une cheville (N/mm) — À VÉRIFIER ----------
     PROFIS utilise des raideurs d'essais non publiées. Règle calée sur 12 notes PROFIS (2.79) :
     scellement chimique (HAS, M10 à M30, h_ef 60 à 214 mm, béton fissuré ou non) : k = E_s·A_s/L avec L = 80 mm ;
     cheville à expansion (HST4 M8 à M20, h_ef 30 à 111 mm) : k = 160 kN/mm en béton non fissuré, 125 kN/mm en béton fissuré,
     indépendamment du diamètre (raideur gouvernée par le glissement du cône, pas par la tige).
     Contrôlée sans recalage sur 4 notes de plus (2.80 : HST4 M8, HAS M10 et M20) : écart sur la cheville la plus tendue −9 % à +7 %.
     Faibles efforts (chevilles peu tendues, platine comprimée) : tractions sous-estimées (raideur réelle non linéaire).
     Les déplacements à court terme des ETE (δ_N0) donnent des raideurs 2,5 à 7 fois plus faibles, donc moins d'effet de levier. */
  function raideurCheville(chimique, d, hef, t, fiss) {
    const As = 0.78 * Math.PI * d * d / 4, k = chimique ? ES * As / 80 : (fiss ? 125e3 : 160e3);
    return { k, L: ES * As / k, As, src: chimique ? "tige E_s·A_s/L, L = 80 mm (calée sur 7 notes PROFIS, contrôlée sur 8, M10 à M30)" : `${fiss ? 125 : 160} kN/mm en béton ${fiss ? "" : "non "}fissuré (calée sur 4 notes PROFIS, contrôlée sur 1, HST4 M8 à M20)` };
  }

  /* ---------- calcul ----------
     o : { plaque:{lx,ly,t,fy}, A:[{x,y}], ka (N/mm, nombre ou tableau), kc (N/mm³), parois:[{a,b,t}], comb:{N,Mx,My} (N, N·mm, au centre de la platine),
           h (taille de maille visée, facultatif), plastique (true par défaut) } */
  function calculer(o) {
    const { lx, ly, t } = o.plaque, fy = o.plaque.fy || 235, A = o.A, nA = A.length;
    if (!(o.parois && o.parois.length)) throw new Error("CBFEM : un profilé est nécessaire pour appliquer les efforts à la platine.");
    let h = o.h || Math.max(8, Math.min(14, Math.min(lx, ly) / 20));
    if (!o.h) while (3 * (lx / h + 1) * (ly / h + 1) > 6000) h *= 1.1;      // au plus ≈ 6 000 inconnues
    // points durs : chevilles et extrémités de parois parallèles aux axes
    const px = A.map((a) => a.x), py = A.map((a) => a.y);
    o.parois.forEach((w) => { if (Math.abs(w.a[0] - w.b[0]) < 1e-6) px.push(w.a[0]); if (Math.abs(w.a[1] - w.b[1]) < 1e-6) py.push(w.a[1]); });
    let X = lignes(lx, px, h), Y = lignes(ly, py, h), swap = false;
    const nx = X.length, ny = Y.length, nn = nx * ny;
    if (nx < ny) swap = true;                                  // numérotation le long du petit côté (bande minimale)
    const nd = (i, j) => (swap ? j * nx + i : i * ny + j), nddl = 3 * nn + 3, W0 = 3 * nn, T1 = W0 + 1, T2 = W0 + 2;
    // interpolation bilinéaire en un point
    const cherche = (L, v) => { let i = 0; while (i < L.length - 2 && v > L[i + 1]) i++; return i; };
    const interp = (x, y) => { x = Math.max(X[0], Math.min(X[nx - 1], x)); y = Math.max(Y[0], Math.min(Y[ny - 1], y)); const i = cherche(X, x), j = cherche(Y, y), u = (x - X[i]) / (X[i + 1] - X[i]), v = (y - Y[j]) / (Y[j + 1] - Y[j]);
      return [[nd(i, j), (1 - u) * (1 - v)], [nd(i + 1, j), u * (1 - v)], [nd(i + 1, j + 1), u * v], [nd(i, j + 1), (1 - u) * v]].filter((q) => q[1] > 1e-9); };
    // éléments
    const EL = [], cache = {};
    for (let i = 0; i < nx - 1; i++) for (let j = 0; j < ny - 1; j++) { const a = X[i + 1] - X[i], b = Y[j + 1] - Y[j], k = a.toFixed(4) + "_" + b.toFixed(4); if (!cache[k]) cache[k] = elementaire(a, b);
      const N4 = [nd(i, j), nd(i + 1, j), nd(i + 1, j + 1), nd(i, j + 1)], dl = []; N4.forEach((n) => dl.push(3 * n, 3 * n + 1, 3 * n + 2)); EL.push({ i, j, a, b, K: cache[k], dl, s: 1, r: 0 }); }
    // aires tributaires des nœuds (Winkler)
    const aire = new Float64Array(nn); EL.forEach((e) => { for (let q = 0; q < 4; q++) aire[e.dl[3 * q] / 3] += e.a * e.b / 4; });
    // points de liaison profilé – platine
    const PT = []; o.parois.forEach((w, iw) => { const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]), n = Math.max(1, Math.ceil(L / (0.6 * h)));
      const ox = -(w.b[1] - w.a[1]) / L * w.t / 2, oy = (w.b[0] - w.a[0]) / L * w.t / 2;      // deux faces de la paroi (cordons de part et d'autre)
      for (let k = 0; k <= n; k++) { const u = k / n, x = w.a[0] + (w.b[0] - w.a[0]) * u, y = w.a[1] + (w.b[1] - w.a[1]) * u, ds = L / n * (k === 0 || k === n ? 0.5 : 1);
        for (const sg of (o.faces === 1 ? [0] : [-1, 1])) PT.push({ x: x + sg * ox, y: y + sg * oy, xm: x, ym: y, ds, t: w.t, iw, k, N: interp(x + sg * ox, y + sg * oy) }); } });
    // cheville : ressort lié au déplacement moyen sous la rondelle (8 points au rayon 2/3·d_w/2) : pas de charge ponctuelle (résultat indépendant du maillage)
    const sousRondelle = (a, k) => { const dw = Array.isArray(o.dw) ? o.dw[k] : o.dw; if (!(dw > 0)) return interp(a.x, a.y); const m = new Map(), r = dw / 3;
      for (let q = 0; q < 8; q++) for (const [n, c] of interp(a.x + r * Math.cos(q * Math.PI / 4), a.y + r * Math.sin(q * Math.PI / 4))) m.set(n, (m.get(n) || 0) + c / 8); return [...m.entries()]; };
    const AN = A.map((a, k) => ({ N: sousRondelle(a, k), actif: true })), ka = A.map((_, k) => (Array.isArray(o.ka) ? o.ka[k] : o.ka));
    // profil de la ligne de ciel
    const haut = new Int32Array(nddl); for (let j = 0; j < nddl; j++) haut[j] = j;
    const lie = (dl) => { let m = Infinity; for (const d of dl) if (d < m) m = d; for (const d of dl) if (m < haut[d]) haut[d] = m; };
    EL.forEach((e) => lie(e.dl)); AN.forEach((a) => lie(a.N.map((q) => 3 * q[0]))); PT.forEach((p) => lie(p.N.map((q) => 3 * q[0]).concat([W0, T1, T2])));
    const D = ES * t * t * t / (12 * (1 - NU * NU)), Gs = 5 / 6 * ES / (2 * (1 + NU)) * t, my = fy * t * t / 6;
    const kp = 1e4 * Math.max(Gs, ...ka), cont = new Uint8Array(nn).fill(1);
    const f = new Float64Array(nddl); f[W0] = o.comb.N || 0; f[T1] = o.comb.Mx || 0; f[T2] = o.comb.My || 0;
    let u = null, it = 0, conv = false; const plast = o.plastique !== false, ITMAX = o.itmax || 80;
    for (; it < ITMAX; it++) {
      const S = ciel(nddl, haut), add = (i, j, v) => { if (i <= j) S.v[idx(S, i, j)] += v; };
      for (const e of EL) { const Kb = e.K.Kb, Ks = e.K.Ks, dl = e.dl, sb = D * e.s; for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) if (dl[r] <= dl[c]) S.v[idx(S, dl[r], dl[c])] += sb * Kb[r * 12 + c] + Gs * Ks[r * 12 + c]; }
      for (let n = 0; n < nn; n++) if (cont[n]) add(3 * n, 3 * n, o.kc * aire[n]);
      AN.forEach((a, k) => { if (!a.actif) return; for (const [n1, c1] of a.N) for (const [n2, c2] of a.N) add(3 * n1, 3 * n2, ka[k] * c1 * c2); });
      for (const p of PT) { const g = p.N.map(([n, c]) => [3 * n, c]).concat([[W0, -1], [T1, -p.y], [T2, p.x]]); for (const [i1, c1] of g) for (const [i2, c2] of g) add(i1, i2, kp * c1 * c2); }
      // stabilisation minimale des rotations de corps rigide si rien n'est actif (évite un pivot nul)
      factoriser(S); u = resoudre(S, f);
      let chg = 0;
      for (let n = 0; n < nn; n++) { const c = u[3 * n] < 0 ? 1 : 0; if (c !== cont[n]) { cont[n] = c; chg++; } }
      AN.forEach((a) => { let w = 0; for (const [n, c] of a.N) w += c * u[3 * n]; a.w = w; const ac = w > 0; if (ac !== a.actif) { a.actif = ac; chg++; } });
      let ds = 0;
      for (const e of EL) { const k = [0, 0, 0]; for (let m = 0; m < 3; m++) { let v = 0; for (let r = 0; r < 12; r++) v += e.K.Bc[m][r] * u[e.dl[r]]; k[m] = v; }
        const mx = D * (k[0] + NU * k[1]), myy = D * (k[1] + NU * k[0]), mxy = D * (1 - NU) / 2 * k[2], meq = Math.sqrt(mx * mx - mx * myy + myy * myy + 3 * mxy * mxy), r = meq / my;
        e.r = r; if (plast) { const sn = r > 1 ? (1.5 - 0.5 / (r * r)) / r : 1, s2 = 0.5 * (e.s + sn); if (Math.abs(s2 - e.s) > ds) ds = Math.abs(s2 - e.s); e.s = s2; } }
      if (!chg && ds < 2e-3) { conv = true; it++; break; }
    }
    // ---- dépouillement
    const T = AN.map((a, k) => (a.actif ? ka[k] * a.w : 0));
    let C = 0, Cx = 0, Cy = 0, pmax = 0, Ac = 0; const pres = new Float64Array(nn);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const n = nd(i, j); if (cont[n] && u[3 * n] < 0) { const p = -o.kc * u[3 * n], F = p * aire[n]; pres[n] = p; C += F; Ac += aire[n]; Cx += F * X[i]; Cy += F * Y[j]; } }
    // pression lissée par élément (moyenne des 4 nœuds)
    const elems = EL.map((e) => { const p = (pres[e.dl[0] / 3] + pres[e.dl[3] / 3] + pres[e.dl[6] / 3] + pres[e.dl[9] / 3]) / 4; if (p > pmax) pmax = p;
      return { x: X[e.i], y: Y[e.j], a: e.a, b: e.b, r: e.r, sig: Math.min(e.r, 1) * fy, epl: Math.max(0, e.r - 1) * fy / ES, p, w: (u[e.dl[0]] + u[e.dl[3]] + u[e.dl[6]] + u[e.dl[9]]) / 4 }; });
    let rmax = 0; elems.forEach((e) => { if (e.r > rmax) rmax = e.r; });
    // champs aux nœuds de la grille (indice i·ny + j, indépendant de la numérotation) : w, pression, rapport r moyen des mailles voisines
    const Wn = new Float64Array(nx * ny), Pn = new Float64Array(nx * ny), Rn = new Float64Array(nx * ny), cnt = new Float64Array(nx * ny);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const n = nd(i, j); Wn[i * ny + j] = u[3 * n]; Pn[i * ny + j] = pres[n]; }
    EL.forEach((e) => { [[e.i, e.j], [e.i + 1, e.j], [e.i + 1, e.j + 1], [e.i, e.j + 1]].forEach(([i, j]) => { Rn[i * ny + j] += e.r; cnt[i * ny + j]++; }); });
    for (let k = 0; k < Rn.length; k++) Rn[k] /= cnt[k] || 1;
    // efforts linéiques en pied de paroi (N/mm, > 0 : la paroi tire la platine vers le haut)
    let qmax = 0, sprof = 0; const st = {};
    PT.forEach((p) => { let g = -u[W0] - p.y * u[T1] + p.x * u[T2]; for (const [n, c] of p.N) g += c * u[3 * n]; const k = p.iw + "_" + p.k; (st[k] = st[k] || { x: p.xm, y: p.ym, q: 0, t: p.t, iw: p.iw, k: p.k, ds: p.ds }).q += -kp * g / p.ds; });
    const lin = Object.values(st);
    // lissage sur un rayon max(10 mm ; 2,5·t_paroi) (les extrémités et les angles de parois sont des points singuliers du modèle)
    lin.forEach((s) => { const Rl = o.lissage || Math.max(10, 2.5 * s.t), v = lin.filter((z) => Math.hypot(z.x - s.x, z.y - s.y) <= Rl + 1e-6); let F = 0, L = 0; v.forEach((z) => { F += z.q * z.ds; L += z.ds; }); s.qm = F / L; if (Math.abs(s.qm) > qmax) qmax = Math.abs(s.qm); if (Math.abs(s.qm) / s.t > sprof) sprof = Math.abs(s.qm) / s.t; });
    let wmax = 0, wmin = 0; for (let n = 0; n < nn; n++) { if (u[3 * n] > wmax) wmax = u[3 * n]; if (u[3 * n] < wmin) wmin = u[3 * n]; }
    return { T, C, Ac, pmoy: Ac ? C / Ac : 0, Cx: C ? Cx / C : 0, Cy: C ? Cy / C : 0, pmax, sigMax: Math.min(rmax, 1) * fy, eplMax: Math.max(0, rmax - 1) * fy / ES, rmax, qmax, sprof, wmax, wmin,
      elems, lin, X, Y, Wn, Pn, Rn, it, conv, nddl, h, fy, rot: [u[T1], u[T2]], w0: u[W0] };
  }
  /* ---------- contrôle de l'élément : bande console (longueur L, largeur b, épaisseur t, n éléments), charge P en bout → flèche ---------- */
  function consoleTest(L, b, t, n, P) {
    const nddl = 6 * (n + 1), haut = new Int32Array(nddl), K = elementaire(L / n, b), D = ES * t * t * t / (12 * (1 - NU * NU)), Gs = 5 / 6 * ES / (2 * (1 + NU)) * t;
    const dls = (e) => { const N4 = [2 * e, 2 * e + 2, 2 * e + 3, 2 * e + 1], dl = []; N4.forEach((q) => dl.push(3 * q, 3 * q + 1, 3 * q + 2)); return dl; };
    for (let j = 0; j < nddl; j++) haut[j] = j; for (let e = 0; e < n; e++) { const dl = dls(e), m = Math.min(...dl); dl.forEach((d) => { if (m < haut[d]) haut[d] = m; }); }
    const S = ciel(nddl, haut);
    for (let e = 0; e < n; e++) { const dl = dls(e); for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) if (dl[r] <= dl[c]) S.v[idx(S, dl[r], dl[c])] += D * K.Kb[r * 12 + c] + Gs * K.Ks[r * 12 + c]; }
    for (const d of [0, 1, 3, 4]) S.v[idx(S, d, d)] += 1e15;                 // encastrement : w et βx des deux nœuds d'origine (βy libre : flexion cylindrique non imposée)
    const f = new Float64Array(nddl); f[3 * (2 * n)] = P / 2; f[3 * (2 * n + 1)] = P / 2; factoriser(S); const u = resoudre(S, f);
    return (u[3 * (2 * n)] + u[3 * (2 * n + 1)]) / 2;
  }
  return { calculer, parois, paroisPlacees, raideurCheville, elementaire, lignes, consoleTest, NU, ES };
})();
if (typeof module !== "undefined") module.exports = CBFEM;
