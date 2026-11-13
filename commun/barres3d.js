/* =====================================================================
   CALCUL DE BARRES 3D (méthode des déplacements, élastique linéaire, 1er ordre)
   FIP Études — supports de tuyauterie, futurs portiques
   Unités : kN, m, kN/m² (E, G), m² (A), m⁴ (I, J)
   Modèle :
     noeuds  : [{x,y,z}]
     barres  : [{i, j, A, Iy, Iz, J, E, G, vz:[x,y,z] (direction approchée de l'axe local z), beta (°, rotation autour de x)}]
               axe local x = de i vers j ; flexion « My » autour de y (plan xz), « Mz » autour de z (plan xy)
     appuis  : {indexNoeud: [ux,uy,uz,rx,ry,rz]}  (1 = bloqué, 0 = libre ; ressort : valeur > 1 = raideur)
     charges : [{n, F:[Fx,Fy,Fz,Mx,My,Mz]}] (repère global)
     reparties : [{b, q:[qx,qy,qz]}] (kN/m, repère global, sur toute la barre)
   ===================================================================== */
const Barres3D = (() => {
  const sub = (a, b) => a.map((v, k) => v - b[k]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const n = Math.hypot(...a); return a.map((v) => v / n); };

  function repere(N, b) {                          // matrice de rotation 3×3 (lignes = ex, ey, ez locaux)
    const pi = N[b.i], pj = N[b.j], d = sub([pj.x, pj.y, pj.z], [pi.x, pi.y, pi.z]), L = Math.hypot(...d), ex = d.map((v) => v / L);
    let vz = b.vz || (Math.abs(ex[2]) > 0.99 ? [1, 0, 0] : [0, 0, 1]);
    if (Math.abs(dot(norm(vz), ex)) > 0.999) vz = Math.abs(ex[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    let ey = norm(cross(vz, ex)), ez = cross(ex, ey);
    const be = (b.beta || 0) * Math.PI / 180;
    if (be) { const c = Math.cos(be), s = Math.sin(be), y2 = ey.map((v, k) => c * v + s * ez[k]), z2 = ez.map((v, k) => -s * ey[k] + c * v); ey = y2; ez = z2; }
    return { R: [ex, ey, ez], L };
  }
  function kLocal(b, L) {                          // matrice de rigidité locale 12×12
    const { E, G, A, Iy, Iz, J } = b, k = [...Array(12)].map(() => Array(12).fill(0));
    const set = (i, j, v) => { k[i][j] += v; if (i !== j) k[j][i] += v; };
    const EA = E * A / L, GJ = G * J / L;
    set(0, 0, EA); set(6, 6, EA); set(0, 6, -EA);
    set(3, 3, GJ); set(9, 9, GJ); set(3, 9, -GJ);
    const z1 = 12 * E * Iz / L ** 3, z2 = 6 * E * Iz / L ** 2, z3 = 4 * E * Iz / L, z4 = 2 * E * Iz / L;   // plan xy (v, θz)
    set(1, 1, z1); set(7, 7, z1); set(1, 7, -z1); set(1, 5, z2); set(1, 11, z2); set(5, 7, -z2); set(7, 11, -z2);
    set(5, 5, z3); set(11, 11, z3); set(5, 11, z4);
    const y1 = 12 * E * Iy / L ** 3, y2 = 6 * E * Iy / L ** 2, y3 = 4 * E * Iy / L, y4 = 2 * E * Iy / L;   // plan xz (w, θy)
    set(2, 2, y1); set(8, 8, y1); set(2, 8, -y1); set(2, 4, -y2); set(2, 10, -y2); set(4, 8, y2); set(8, 10, y2);
    set(4, 4, y3); set(10, 10, y3); set(4, 10, y4);
    return k;
  }
  const T12 = (R) => { const T = [...Array(12)].map(() => Array(12).fill(0)); for (let b = 0; b < 4; b++) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) T[3 * b + r][3 * b + c] = R[r][c]; return T; };
  const mulMV = (M, v) => M.map((r) => r.reduce((s, x, k) => s + x * v[k], 0));
  const mulTtV = (T, v) => T[0].map((_, c) => T.reduce((s, r, k) => s + r[c] * v[k], 0));        // Tᵀ·v
  function fefLocal(ql, L) {                       // efforts d'encastrement parfait (charge uniforme locale)
    const [qx, qy, qz] = ql;
    return [qx * L / 2, qy * L / 2, qz * L / 2, 0, -qz * L * L / 12, qy * L * L / 12,
            qx * L / 2, qy * L / 2, qz * L / 2, 0, qz * L * L / 12, -qy * L * L / 12];
  }

  function resoudre(M) {
    const N = M.noeuds, n = 6 * N.length, K = [...Array(n)].map(() => new Float64Array(n)), F = new Float64Array(n);
    const elems = M.barres.map((b, e) => {
      const { R, L } = repere(N, b), T = T12(R), kl = kLocal(b, L);
      const kg = T.map((_, r) => T.map((__, c) => { let s = 0; for (let a = 0; a < 12; a++) { if (!T[a][r]) continue; for (let d = 0; d < 12; d++) s += T[a][r] * kl[a][d] * T[d][c]; } return s; }));
      const dofs = [...Array(6)].map((_, k) => 6 * b.i + k).concat([...Array(6)].map((_, k) => 6 * b.j + k));
      dofs.forEach((I, a) => dofs.forEach((Jd, c) => { K[I][Jd] += kg[a][c]; }));
      const qg = (M.reparties || []).filter((r) => r.b === e).reduce((s, r) => s.map((v, k) => v + r.q[k]), [0, 0, 0]);
      const ql = mulMV(R, qg), fef = fefLocal(ql, L), fefG = mulTtV(T, fef);
      dofs.forEach((I, a) => { F[I] += fefG[a]; });
      return { b, R, T, L, kl, dofs, ql, fef };
    });
    (M.charges || []).forEach((c) => c.F.forEach((v, k) => { F[6 * c.n + k] += v || 0; }));
    // appuis (bloqués ou ressorts)
    const bloque = new Uint8Array(n);
    Object.entries(M.appuis || {}).forEach(([nd, cond]) => cond.forEach((v, k) => { const I = 6 * nd + k; if (v === 1) bloque[I] = 1; else if (v > 1) K[I][I] += v; }));
    const libres = [...Array(n).keys()].filter((I) => !bloque[I]);
    const m = libres.length, A = libres.map((I) => Float64Array.from(libres.map((Jd) => K[I][Jd]))), bb = Float64Array.from(libres.map((I) => F[I]));
    for (let c = 0; c < m; c++) {                   // élimination de Gauss avec pivot partiel
      let p = c; for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-12) throw new Error("Structure instable (mécanisme) : vérifier les appuis.");
      [A[c], A[p]] = [A[p], A[c]]; [bb[c], bb[p]] = [bb[p], bb[c]];
      for (let r = c + 1; r < m; r++) { const f = A[r][c] / A[c][c]; if (!f) continue; for (let k = c; k < m; k++) A[r][k] -= f * A[c][k]; bb[r] -= f * bb[c]; }
    }
    const x = new Float64Array(m);
    for (let r = m - 1; r >= 0; r--) { let s = bb[r]; for (let k = r + 1; k < m; k++) s -= A[r][k] * x[k]; x[r] = s / A[r][r]; }
    const U = new Float64Array(n); libres.forEach((I, k) => { U[I] = x[k]; });
    // réactions = K·U − F (aux ddl bloqués ; ressorts : −k·u)
    const reactions = {};
    Object.keys(M.appuis || {}).forEach((nd) => {
      reactions[nd] = [...Array(6)].map((_, k) => { const I = 6 * nd + k; if (!bloque[I]) { const kv = M.appuis[nd][k]; return kv > 1 ? -kv * U[I] : 0; } let s = -F[I]; for (let J = 0; J < n; J++) s += K[I][J] * U[J]; return s; });
    });
    // efforts aux extrémités (repère local, efforts exercés SUR la barre)
    elems.forEach((el) => {
      const ug = el.dofs.map((I) => U[I]), ul = mulMV(el.T, ug);
      el.f = mulMV(el.kl, ul).map((v, k) => v - el.fef[k]);
    });
    return { U, reactions, elems, depl: (nd) => [...U.slice(6 * nd, 6 * nd + 6)] };
  }
  /* Efforts internes à l'abscisse s (repère local) : [N, Vy, Vz, T, My, Mz]
     (effort de la partie droite sur la partie gauche ; N > 0 = traction) */
  function interne(el, s) {
    const f = el.f, q = el.ql;
    const Fx = -(f[0] + q[0] * s), Fy = -(f[1] + q[1] * s), Fz = -(f[2] + q[2] * s);
    const Mx = -f[3];
    const My = -(f[4] + s * f[2] + q[2] * s * s / 2);                          // r = (−s,0,0) : (r×F)_y = −rx·Fz = s·Fz
    const Mz = -(f[5] - s * f[1] - q[1] * s * s / 2);                           // (r×F)_z = rx·Fy = −s·Fy
    return [Fx, Fy, Fz, Mx, My, Mz];
  }
  return { resoudre, interne, repere };
})();
