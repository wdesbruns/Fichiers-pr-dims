/* =====================================================================
   DESSIN INDUSTRIEL — planches de plans (vues orthogonales, faces cachées, cotation ISO)
   FIP Études — moteur générique (S1, cahier de supportage, futur export DXF)
   Unités : modèle en m ; planche en mm (viewBox = format papier).
   Conventions : projection européenne (ISO 5456-2, méthode E) ; traits ISO 128 (fort 0,5 / fin 0,25 / axe mixte fin) ;
   cotation ISO 129 (flèches pleines, cote au-dessus de la ligne, lisible de bas et de droite) ; écritures ISO 3098 (h = 3,5 / 2,5 mm).
   Faces cachées : algorithme du peintre sur faces planes + arêtes de silhouette et arêtes vives (> 15°).
   ===================================================================== */
const DESSIN = (() => {
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], add = (a, b) => a.map((v, i) => v + b[i]), mul = (a, k) => a.map((v) => v * k);
  const sub = (a, b) => a.map((v, i) => v - b[i]), cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm = (a) => { const n = Math.hypot(...a) || 1; return a.map((v) => v / n); };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const F = "Arial,Helvetica,sans-serif", TF = 0.5, TFin = 0.25;
  const FORMATS = { A3: [420, 297], A4: [297, 210] };
  const ECHELLES = [1, 2, 5, 10, 20, 50, 100];                                  // échelles recommandées NF EN ISO 5455
  /* Vues : u → droite, v → haut, w → vers l'observateur */
  const VUES = {
    face: { titre: "VUE DE FACE", u: [0, 1, 0], v: [0, 0, 1], w: [1, 0, 0] },
    gauche: { titre: "VUE DE GAUCHE", u: [1, 0, 0], v: [0, 0, 1], w: [0, -1, 0] },
    droite: { titre: "VUE DE DROITE", u: [-1, 0, 0], v: [0, 0, 1], w: [0, 1, 0] },
    dessus: { titre: "VUE DE DESSUS", u: [0, 1, 0], v: [-1, 0, 0], w: [0, 0, 1] },
  };

  /* ---------- solides : prismes (profilés, platines, tubes, boulons) ---------- */
  const aire = (P) => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  const ccw = (P, sens = 1) => (aire(P) * sens < 0 ? P.slice().reverse() : P);
  /* prisme : origine o, axe ex (longueur L), section (y, z) dans la base ey, ez ; outer (+ hole facultatif)
     opt.c0 / opt.c1 : plans de coupe {p, n} des extrémités (coupe biaise : l'arête de chaque sommet s'arrête sur le plan) */
  function prisme(o, ex, ey, ez, L, outer, hole, opt = {}) {
    const O = ccw(outer, 1), H = hole ? ccw(hole, -1) : null;
    const sP = (pl, y, z, def) => { if (!pl) return def; const q = add(add(o, mul(ey, y)), mul(ez, z)), c = dot(pl.n, ex); return Math.abs(c) < 1e-6 ? def : dot(pl.n, sub(pl.p, q)) / c; };
    const P = (s, [y, z]) => add(add(add(o, mul(ex, s === 0 ? sP(opt.c0, y, z, 0) : s === L ? sP(opt.c1, y, z, L) : s)), mul(ey, y)), mul(ez, z));
    const nc = (pl, sg) => { if (!pl) return mul(ex, sg); const n = nrm(pl.n); return dot(n, ex) * sg < 0 ? mul(n, -1) : n; };
    const faces = [];
    const cotes = (R) => R.forEach((p, i) => { const q = R[(i + 1) % R.length], dy = q[0] - p[0], dz = q[1] - p[1];
      faces.push({ rings: [[P(0, p), P(0, q), P(L, q), P(L, p)]], n: nrm(add(mul(ey, dz), mul(ez, -dy))) }); });
    cotes(O); if (H) cotes(H);
    faces.push({ rings: [O.map((p) => P(0, p)), ...(H ? [H.map((p) => P(0, p))] : [])], n: nc(opt.c0, -1) });
    faces.push({ rings: [O.map((p) => P(L, p)), ...(H ? [H.map((p) => P(L, p))] : [])], n: nc(opt.c1, 1) });
    return { faces, fond: opt.fond, trait: opt.trait };
  }
  const cercle = (r, n = 40) => [...Array(n)].map((_, i) => [r * Math.cos(2 * Math.PI * i / n), r * Math.sin(2 * Math.PI * i / n)]);
  const boite = (c, dx, dy, dz, opt) => prisme([c[0] - dx / 2, c[1], c[2]], [1, 0, 0], [0, 1, 0], [0, 0, 1], dx, [[-dy / 2, -dz / 2], [dy / 2, -dz / 2], [dy / 2, dz / 2], [-dy / 2, dz / 2]], null, opt);
  /* cylindre d'axe a → b, rayon r (tube creux si ri) */
  function cylindre(a, b, r, ri, opt) {
    const d = sub(b, a), L = Math.hypot(...d), ex = mul(d, 1 / L), t = Math.abs(ex[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], ey = nrm(cross(t, ex)), ez = cross(ex, ey);
    return prisme(a, ex, ey, ez, L, cercle(r), ri ? cercle(ri) : null, opt);
  }

  /* ---------- rendu d'une vue (coordonnées planche, mm) ---------- */
  function rendreVue(V, sol, X, Y) {
    const w = V.w, cle = (p) => p.map((v) => Math.round(v * 1e5)).join(","), ek = (a, b) => { const A = cle(a), B = cle(b); return A < B ? A + "|" + B : B + "|" + A; };
    const items = [];
    sol.forEach((S) => {
      const adj = new Map(); S.faces.forEach((f, fi) => f.rings.forEach((R) => R.forEach((p, i) => { const k = ek(p, R[(i + 1) % R.length]); (adj.get(k) || adj.set(k, []).get(k)).push(fi); })));
      S.faces.forEach((f, fi) => {
        const c = dot(f.n, w); if (c <= 1e-6) return;
        const edges = [];
        f.rings.forEach((R) => R.forEach((p, i) => { const q = R[(i + 1) % R.length], nb = adj.get(ek(p, q)).filter((j) => j !== fi);
          const vive = !nb.length || nb.some((j) => dot(S.faces[j].n, w) <= 1e-6 || dot(S.faces[j].n, f.n) < Math.cos(15 * Math.PI / 180)); if (vive) edges.push([p, q]); }));
        const pts = f.rings.flat(), prof = pts.reduce((s, p) => s + dot(p, w), 0) / pts.length;
        items.push({ prof, f, edges, S });
      });
    });
    items.sort((a, b) => a.prof - b.prof);
    const P2 = (p) => `${X(dot(p, V.u)).toFixed(2)},${Y(dot(p, V.v)).toFixed(2)}`;
    return items.map(({ f, edges, S }) => `<path d="${f.rings.map((R) => "M" + R.map(P2).join("L") + "Z").join("")}" fill="${S.fond || "#fff"}" fill-rule="evenodd" stroke="none"/>` +
      (edges.length ? `<path d="${edges.map(([p, q]) => "M" + P2(p) + "L" + P2(q)).join("")}" stroke="#000" stroke-width="${S.trait || TF}" stroke-linecap="round" fill="none"/>` : "")).join("");
  }

  /* ---------- primitives 2D de la planche ---------- */
  const STY = { fort: `stroke="#000" stroke-width="${TF}"`, fin: `stroke="#000" stroke-width="${TFin}"`, axe: `stroke="#000" stroke-width="${TFin}" stroke-dasharray="8 1.5 1 1.5"`,
    tirets: `stroke="#000" stroke-width="${TFin}" stroke-dasharray="3 1.5"`, fantome: `stroke="#000" stroke-width="${TFin}" stroke-dasharray="10 1.5 1 1.5 1 1.5"`, cache: `stroke="#000" stroke-width="${TFin}" stroke-dasharray="3 1.5"` };
  const txt = (x, y, s, o = {}) => `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="${F}" font-size="${o.h || 3.5}" ${o.b ? 'font-weight="700"' : ""} text-anchor="${o.a || "start"}" ${o.rot ? `transform="rotate(${o.rot} ${x.toFixed(2)} ${y.toFixed(2)})"` : ""} fill="#000">${esc(s)}</text>`;
  const fleche = (x, y, dx, dy) => { const L = 3, l = 0.75, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n; return `<path d="M${x},${y} L${x - ux * L - uy * l},${y - uy * L + ux * l} L${x - ux * L + uy * l},${y - uy * L - ux * l}Z" fill="#000"/>`; };
  /* cote linéaire ISO : points a, b (planche), direction 'h' ou 'v', ligne de cote à la coordonnée c (y pour 'h', x pour 'v') */
  function cote(a, b, dir, c, texte) {
    let s = "";
    if (dir === "h") { const [x1, x2] = [a[0], b[0]], sg = (y) => Math.sign(c - y) || 1;
      [[x1, a[1]], [x2, b[1]]].forEach(([x, y]) => { if (Math.abs(c - y) > 0.5) s += `<line x1="${x}" y1="${y + sg(y) * 1}" x2="${x}" y2="${c + sg(y) * 2}" ${STY.fin}/>`; });
      const L = Math.abs(x2 - x1), xm = (x1 + x2) / 2, ext = L < 9, d = Math.sign(x2 - x1) || 1;
      s += `<line x1="${ext ? Math.min(x1, x2) - 5 : x1}" y1="${c}" x2="${ext ? Math.max(x1, x2) + 5 : x2}" y2="${c}" ${STY.fin}/>` + (ext ? fleche(x1, c, d, 0) + fleche(x2, c, -d, 0) : fleche(x1, c, -d, 0) + fleche(x2, c, d, 0));
      s += txt(ext && L < 6 ? Math.max(x1, x2) + 6 : xm, c - 1.2, texte, { a: ext && L < 6 ? "start" : "middle" });
    } else { const [y1, y2] = [a[1], b[1]], sg = (x) => Math.sign(c - x) || 1;
      [[a[0], y1], [b[0], y2]].forEach(([x, y]) => { if (Math.abs(c - x) > 0.5) s += `<line x1="${x + sg(x) * 1}" y1="${y}" x2="${c + sg(x) * 2}" y2="${y}" ${STY.fin}/>`; });
      const L = Math.abs(y2 - y1), ym = (y1 + y2) / 2, ext = L < 9, d = Math.sign(y2 - y1) || 1;
      s += `<line x1="${c}" y1="${ext ? Math.min(y1, y2) - 5 : y1}" x2="${c}" y2="${ext ? Math.max(y1, y2) + 5 : y2}" ${STY.fin}/>` + (ext ? fleche(c, y1, 0, d) + fleche(c, y2, 0, -d) : fleche(c, y1, 0, -d) + fleche(c, y2, 0, d));
      s += txt(c - 1.2, ext && L < 6 ? Math.min(y1, y2) - 6 : ym, texte, { a: ext && L < 6 ? "end" : "middle", rot: -90 });
    }
    return s;
  }
  const hachures = (x1, y1, x2, y2, nx, ny, pas = 2.5, lg = 3) => { const L = Math.hypot(x2 - x1, y2 - y1), n = Math.max(2, Math.floor(L / pas)); let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${STY.fort}/>`;
    for (let i = 0; i <= n; i++) { const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n; s += `<line x1="${x}" y1="${y}" x2="${x + (nx + (y2 - y1) / L * 0.7) * lg}" y2="${y + (ny - (x2 - x1) / L * 0.7) * lg}" ${STY.fin}/>`; } return s; };

  /* ---------- planche ---------- */
  /* spec : { format:'A3'|'A4', vues:[{id, col, lig}], solides:[...], aides:[{type:'axe'|'tirets'|'fin', pts:[[x,y,z]...], vues?}], cercles:[{c, r, n, style, vues?}],
             sols:[{a, b, mat:[x,y,z] (côté matière), vues?}], murs:[{rect:[[...]...] (4 pts), vues?}], cotes:[{vue, a, b, dir, cote:'haut'|'bas'|'gauche'|'droite', niv, txt}],
             reperes:[{vue, p, n}], etiquettes:[{vue, p, txt, dx, dy}], nomenclature:[[rep, qte, des, mat, long, masse]], tableau:{titre, cols, rows}, cartouche:{...}, notes:[...] } */
  function planche(spec) {
    const [PW, PH] = FORMATS[spec.format] || FORMATS.A3, mL = 20, mA = 10, zx0 = mL, zx1 = PW - mA, zy0 = mA, zy1 = PH - mA;
    // bloc cartouche + nomenclature + tableau (coin inférieur droit)
    const nom = spec.nomenclature || [], tab = spec.tableau, lgN = 6, wB = Math.min(180, zx1 - zx0), hCart = 36, hNom = nom.length ? (nom.length + 1) * lgN : 0, hTab = tab ? (tab.rows.length + 2) * 5.5 : 0, hB = hCart + hNom + (tab ? hTab + 3 : 0);
    const bloc = { x0: zx1 - wB, y0: zy1 - hB, x1: zx1, y1: zy1 };
    const lignesNotes = [], ncN = Math.max(30, Math.floor((bloc.x0 - zx0 - 6) / 1.35));      // notes coupées à la largeur disponible
    (spec.notes || []).forEach((n) => { let l = ""; String(n).split(" ").forEach((m) => { if ((l + " " + m).trim().length > ncN) { lignesNotes.push(l.trim()); l = m; } else l += " " + m; }); if (l.trim()) lignesNotes.push(l.trim()); });
    const hNotes = lignesNotes.length ? lignesNotes.length * 3.4 + 4 : 0;
    /* vues interrompues : intervalles [a, b] supprimés le long d'un axe du modèle, remplacés par une bande de 7 mm (lignes de rupture) */
    const mkMap = (ints, gm) => { const L = ints.slice().sort((p, q) => q[0] - p[0]); return (t) => L.reduce((t, [a, b]) => (t <= a ? t : t >= b ? t - (b - a) + gm : a + (t - a) / (b - a) * gm), t); };
    const intsVue = (V, axe) => (spec.interruptions || []).filter((I) => !I.vues || I.vues.includes(V.id)).flatMap((I) => { const c = dot(I.ax, V[axe]); return Math.abs(c) > 0.99 ? [c > 0 ? [I.a, I.b] : [-I.b, -I.a]] : []; });
    const mapper = (V, k, coupes) => { const gm = 7 / k; V.iu = coupes ? intsVue(V, "u") : []; V.iv = coupes ? intsVue(V, "v") : []; V.mu = mkMap(V.iu, gm); V.mv = mkMap(V.iv, gm);
      V.u0 = V.mu(V.r.u0); V.u1 = V.mu(V.r.u1); V.v0 = V.mv(V.r.v0); V.v1 = V.mv(V.r.v1); };
    const essai = (liste, coupes = false) => {
      const vues = liste.map((v) => ({ ...VUES[v.id], ...v }));
      const tousPts = spec.solides.flatMap((S) => S.faces.flatMap((f) => f.rings.flat())).concat((spec.aides || []).flatMap((a) => a.pts)).concat((spec.sols || []).flatMap((s) => [s.a, s.b]));
      vues.forEach((V) => { const pv = tousPts.filter((p) => true); const us = pv.map((p) => dot(p, V.u)), vs = pv.map((p) => dot(p, V.v));
        (spec.cercles || []).forEach((c) => { if (!c.vues || c.vues.includes(V.id)) { us.push(dot(c.c, V.u) - c.r, dot(c.c, V.u) + c.r); vs.push(dot(c.c, V.v) - c.r, dot(c.c, V.v) + c.r); } });
        V.u0 = Math.min(...us); V.u1 = Math.max(...us); V.v0 = Math.min(...vs); V.v1 = Math.max(...vs); });
      const cols = [...new Set(vues.map((v) => v.col))].sort(), ligs = [...new Set(vues.map((v) => v.lig))].sort();
      cols.forEach((c) => { const L = vues.filter((v) => v.col === c), a = Math.min(...L.map((v) => v.u0)), b = Math.max(...L.map((v) => v.u1)); L.forEach((v) => { v.u0 = a; v.u1 = b; }); });
      ligs.forEach((r) => { const L = vues.filter((v) => v.lig === r), a = Math.min(...L.map((v) => v.v0)), b = Math.max(...L.map((v) => v.v1)); L.forEach((v) => { v.v0 = a; v.v1 = b; }); });
      vues.forEach((V) => { V.r = { u0: V.u0, u1: V.u1, v0: V.v0, v1: V.v1 }; });
      // marges de cotation (mm planche) selon les cotes demandées
      const MG = (V, cote) => 10 + 8 * (1 + Math.max(-1, ...(spec.cotes || []).filter((c) => c.vue === V.id && c.cote === cote).map((c) => c.niv || 0)));
      vues.forEach((V) => { V.mg = { g: MG(V, "gauche"), d: MG(V, "droite"), h: MG(V, "haut") + 6, b: MG(V, "bas") }; });
      // choix de l'échelle normalisée et placement
      let ech = null, place = null, grille = null;
      for (const e of ECHELLES) {
        const k = 1000 / e, wc = {}, hl = {};
        vues.forEach((V) => mapper(V, k, coupes));
        cols.forEach((c) => { wc[c] = Math.max(...vues.filter((v) => v.col === c).map((v) => (v.u1 - v.u0) * k + v.mg.g + v.mg.d)); });
        ligs.forEach((r) => { hl[r] = Math.max(...vues.filter((v) => v.lig === r).map((v) => (v.v1 - v.v0) * k + v.mg.h + v.mg.b)); });
        const W = cols.reduce((s, c) => s + wc[c], 0), H = ligs.reduce((s, r) => s + hl[r], 0);
        if (W + 6 * (cols.length - 1) > zx1 - zx0 || H + 2 + 4 * (ligs.length - 1) + 5 + hNotes > zy1 - zy0) continue;
        const gx = Math.min(12, (zx1 - zx0 - W) / Math.max(cols.length, 1)), x0 = {}, y0 = {}; let x = zx0 + gx / 2; cols.forEach((c) => { x0[c] = x; x += wc[c] + gx; });
        let y = zy0 + 2; ligs.forEach((r) => { y0[r] = y; y += hl[r] + 4; });
        const rects = vues.map((V) => ({ V, x: x0[V.col] + V.mg.g, y: y0[V.lig] + V.mg.h, w: (V.u1 - V.u0) * k, h: (V.v1 - V.v0) * k }));
        const chev = rects.some((r) => r.x - r.V.mg.g < bloc.x1 && r.x + r.w + r.V.mg.d > bloc.x0 && r.y - r.V.mg.h < bloc.y1 && r.y + r.h + r.V.mg.b > bloc.y0);
        if (chev) continue;
        ech = e; place = rects; grille = { x0, y0, wc, hl, cols, ligs }; break;
      }
      return { ech, place, grille };
    };
    // choix : vues complètes ; interrompues si l'échelle y gagne ; vue de dessus abandonnée seulement si elle coûte plus d'un facteur 2
    const coupes = !!(spec.interruptions && spec.interruptions.length);
    let best = essai(spec.vues, false);
    if (coupes) { const r = essai(spec.vues, true); if (r.ech && (!best.ech || r.ech < best.ech)) best = r; }
    if (spec.vues.some((v) => v.option)) { const L = spec.vues.filter((v) => !v.option); let r = essai(L, false); if (coupes) { const r2 = essai(L, true); if (r2.ech && (!r.ech || r2.ech < r.ech)) r = r2; } if (r.ech && (!best.ech || r.ech * 2 < best.ech)) best = r; }
    let { ech, place, grille } = best;
    const vues = place ? place.map((r) => r.V) : spec.vues.map((v) => ({ ...VUES[v.id], ...v }));
    if (!ech) { ech = 100; const k = 10; vues.forEach((V) => { V.mg = V.mg || { g: 18, d: 18, h: 24, b: 18 }; if (V.u0 == null) { V.u0 = 0; V.u1 = 1; V.v0 = 0; V.v1 = 1; } V.mu = V.mu || ((t) => t); V.mv = V.mv || ((t) => t); V.iu = V.iu || []; V.iv = V.iv || []; }); place = vues.map((V, i) => ({ V, x: zx0 + 20 + i * 120, y: zy0 + 20, w: (V.u1 - V.u0) * k, h: (V.v1 - V.v0) * k })); }
    const k = 1000 / ech;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" class="planche" style="width:100%;background:#fff" font-family="${F}">`;
    s += `<rect x="0" y="0" width="${PW}" height="${PH}" fill="#fff"/><rect x="${zx0}" y="${zy0}" width="${zx1 - zx0}" height="${zy1 - zy0}" fill="none" stroke="#000" stroke-width="0.7"/>`;
    [[PW / 2, 0, PW / 2, zy0], [PW / 2, PH, PW / 2, zy1], [0, PH / 2, zx0, PH / 2], [PW, PH / 2, zx1, PH / 2]].forEach(([a, b, c, d]) => { s += `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#000" stroke-width="0.7"/>`; });   // repères de centrage
    place.forEach(({ V, x, y, w, h }) => {
      const X = (u) => x + (V.mu(u) - V.u0) * k, Y = (v) => y + (V.v1 - V.mv(v)) * k, P = (p) => [X(dot(p, V.u)), Y(dot(p, V.v))], dans = (o) => !o.vues || o.vues.includes(V.id);
      let g = "";
      // ouvrage : murs (hachures béton) puis sols
      (spec.murs || []).filter(dans).forEach((m) => { const Q = m.rect.map(P), xs = Q.map((q) => q[0]), ys = Q.map((q) => q[1]), a = Math.min(...xs), b = Math.max(...xs), c = Math.min(...ys), d = Math.max(...ys);
        if (b - a < 0.3 || d - c < 0.3) return; const id = "hb" + Math.random().toString(36).slice(2, 8);
        g += `<defs><pattern id="${id}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" stroke="#000" stroke-width="0.18"/></pattern></defs><rect x="${a}" y="${c}" width="${b - a}" height="${d - c}" fill="url(#${id})" stroke="#000" stroke-width="${TF}"/>`; });
      g += rendreVue(V, spec.solides, X, Y);
      (spec.sols || []).filter(dans).forEach((so) => { const a = P(so.a), b = P(so.b), L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) return; const m = P(so.mat), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        let nx = m[0] - mx, ny = m[1] - my; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n; g += hachures(a[0], a[1], b[0], b[1], nx, ny); });
      (spec.aides || []).filter(dans).forEach((a) => { const Q = a.pts.map(P); if (Q.length < 2 || Math.hypot(Q[Q.length - 1][0] - Q[0][0], Q[Q.length - 1][1] - Q[0][1]) < 0.5) return;
        g += `<polyline points="${Q.map((q) => q.map((v) => v.toFixed(2)).join(",")).join(" ")}" fill="none" ${STY[a.type] || STY.fin}/>`; });
      (spec.cercles || []).filter(dans).forEach((c) => { const n = c.n || [1, 0, 0]; if (Math.abs(dot(n, V.w)) < 0.9) return; const [cx, cy] = P(c.c), r = c.r * k;
        g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" ${STY[c.style] || STY.fin}/>`;
        if (c.croix) g += `<line x1="${cx - r - 2}" y1="${cy}" x2="${cx + r + 2}" y2="${cy}" ${STY.axe}/><line x1="${cx}" y1="${cy - r - 2}" x2="${cx}" y2="${cy + r + 2}" ${STY.axe}/>`; });
      // lignes de rupture (trait fin avec zigzag, ISO 128) : bande blanche par pièce traversant l'intervalle
      const zig = (x1, y1, x2, y2) => { const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux, m = L / 2, P2 = (t, o) => `${(x1 + ux * t + nx * o).toFixed(2)},${(y1 + uy * t + ny * o).toFixed(2)}`;
        return `<polyline points="${[P2(0, 0), P2(m - 1.6, 0), P2(m - 0.8, 1.8), P2(m + 0.8, -1.8), P2(m + 1.6, 0), P2(L, 0)].join(" ")}" fill="none" ${STY.fin}/>`; };
      [["u", V.iu], ["v", V.iv]].forEach(([axe, L]) => L.forEach(([a, b]) => spec.solides.forEach((S) => {
        let o0 = Infinity, o1 = -Infinity; const oth = axe === "u" ? V.v : V.u, ax = V[axe];
        S.faces.forEach((f) => { const t = f.rings[0].map((p) => dot(p, ax)); if (Math.min(...t) < a && Math.max(...t) > b) f.rings[0].forEach((p) => { const o = dot(p, oth); o0 = Math.min(o0, o); o1 = Math.max(o1, o); }); });
        if (o0 > o1) return;
        if (axe === "u") { const xa = X(a), xb = X(b), ya = Y(o1) - 2.5, yb = Y(o0) + 2.5; g += `<rect x="${xa + 0.15}" y="${ya}" width="${xb - xa - 0.3}" height="${yb - ya}" fill="#fff"/>` + zig(xa, ya, xa, yb) + zig(xb, ya, xb, yb); }
        else { const ya = Y(b), yb = Y(a), xa = X(o0) - 2.5, xb = X(o1) + 2.5; g += `<rect x="${xa}" y="${ya + 0.15}" width="${xb - xa}" height="${yb - ya - 0.3}" fill="#fff"/>` + zig(xa, ya, xb, ya) + zig(xa, yb, xb, yb); } })));
      // cotes
      const niv = { gauche: 0, droite: 0, haut: 0, bas: 0 };
      (spec.cotes || []).filter((c) => c.vue === V.id).forEach((c) => { const a = P(c.a), b = P(c.b), n = c.niv || 0, pos = { gauche: x - 10 - 8 * n, droite: x + w + 10 + 8 * n, haut: y - 10 - 8 * n, bas: y + h + 10 + 8 * n }[c.cote];
        g += cote(a, b, c.cote === "gauche" || c.cote === "droite" ? "v" : "h", pos, c.txt); });
      // étiquettes et repères (bulles)
      (spec.etiquettes || []).filter((e) => e.vue === V.id).forEach((e) => { const [px, py] = P(e.p), tx = px + (e.dx || 12), ty = py + (e.dy || -10);
        g += `<line x1="${px}" y1="${py}" x2="${tx}" y2="${ty}" ${STY.fin}/><line x1="${tx}" y1="${ty}" x2="${tx + (e.dx < 0 ? -1 : 1) * (e.txt.length * 1.75 + 2)}" y2="${ty}" ${STY.fin}/>` + txt(tx + (e.dx < 0 ? -1 : 1) * 1, ty - 1, e.txt, { h: 2.5, a: e.dx < 0 ? "end" : "start" }); });
      const cx0 = x + w / 2, cy0 = y + h / 2;
      (spec.reperes || []).filter((r) => r.vue === V.id).forEach((r) => { const [px, py] = P(r.p); let dx = r.dx ?? (px - cx0), dy = r.dy ?? (py - cy0); const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
        const L = r.L || 14, bx = px + dx * L, by = py + dy * L, R = 3.5;
        g += `<circle cx="${px}" cy="${py}" r="0.6" fill="#000"/><line x1="${px}" y1="${py}" x2="${bx - dx * R}" y2="${by - dy * R}" ${STY.fin}/><circle cx="${bx}" cy="${by}" r="${R}" fill="#fff" ${STY.fin}/>` + txt(bx, by + 1.25, r.n, { a: "middle" }); });
      g += txt(x + w / 2, y + h + V.mg.b + 1, V.titre, { a: "middle", h: 3.5, b: 1 });
      s += `<g>${g}</g>`;
    });
    // perspective isométrique (sans échelle) dans la plus grande zone libre
    if (spec.iso) {
      const w = nrm(spec.iso.w || [1, -1, 1]), u = nrm(cross([0, 0, 1], w)), v = cross(w, u), Vi = { id: "iso", u, v, w };   // u × v = w (repère direct, observateur côté w)
      const sols = spec.solides.concat(spec.iso.solides || []), pts = sols.flatMap((S) => S.faces.flatMap((f) => f.rings.flat())), us = pts.map((p) => dot(p, u)), vs = pts.map((p) => dot(p, v));
      const du = Math.max(...us) - Math.min(...us), dv = Math.max(...vs) - Math.min(...vs);
      const occ = place.map((r) => [r.x - r.V.mg.g, r.y - r.V.mg.h, r.x + r.w + r.V.mg.d, r.y + r.h + r.V.mg.b + 6]);
      const gR = Math.max(...occ.map((o) => o[2])), gB = Math.max(...occ.map((o) => o[3]));
      const cand = [[gR + 4, zy0 + 4, zx1 - 4, bloc.y0 - 4], [zx0 + 4, gB + 2, bloc.x0 - 4, zy1 - hNotes - 2]];
      if (grille) grille.cols.forEach((c) => grille.ligs.forEach((r) => { if (!place.some((p) => p.V.col === c && p.V.lig === r)) cand.push([grille.x0[c] + 2, grille.y0[r] + 2, zx1 - 4, bloc.y0 - 4]); }));
      const libre = (R) => !occ.some((o) => o[0] < R[2] && o[2] > R[0] && o[1] < R[3] && o[3] > R[1]) && !(bloc.x0 < R[2] && bloc.x1 > R[0] && bloc.y0 < R[3] && bloc.y1 > R[1]);
      let mieux = null;
      cand.forEach((R) => { if (R[2] - R[0] < 50 || R[3] - R[1] < 50 || !libre(R)) return; const ki = Math.min((R[2] - R[0] - 10) / du, (R[3] - R[1] - 16) / dv); if (!mieux || ki > mieux.ki) mieux = { R, ki }; });
      if (mieux) { const { R, ki } = mieux, kk = Math.min(ki, k * 1.5), cx = (R[0] + R[2]) / 2, cy = (R[1] + R[3] - 8) / 2, um = (Math.max(...us) + Math.min(...us)) / 2, vm = (Math.max(...vs) + Math.min(...vs)) / 2;
        s += `<g>${rendreVue(Vi, sols, (a) => cx + (a - um) * kk, (b) => cy - (b - vm) * kk)}${txt(cx, cy + dv * kk / 2 + 8, "PERSPECTIVE (sans échelle)", { a: "middle", b: 1 })}</g>`; }
    }
    // tableau des configurations
    let yb = bloc.y0;
    const ligne = (x1, y1, x2, y2, l = TFin) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="${l}"/>`;
    if (tab) {
      const nc = tab.cols.length, wcol = wB / nc, hl = 5.5; s += txt(bloc.x0, yb + 3.5, tab.titre || "Tableau des configurations", { h: 3, b: 1 }); yb += 4.5;
      s += `<rect x="${bloc.x0}" y="${yb}" width="${wB}" height="${hl * (tab.rows.length + 1)}" fill="#fff" stroke="#000" stroke-width="${TF}"/>`;
      tab.cols.forEach((c, i) => { s += txt(bloc.x0 + wcol * (i + 0.5), yb + 3.8, c, { a: "middle", h: 2.5, b: 1 }); if (i) s += ligne(bloc.x0 + wcol * i, yb, bloc.x0 + wcol * i, yb + hl * (tab.rows.length + 1)); });
      tab.rows.forEach((r, j) => { const yy = yb + hl * (j + 1); s += ligne(bloc.x0, yy, bloc.x1, yy, j ? TFin : TF); r.forEach((c, i) => { s += txt(bloc.x0 + wcol * (i + 0.5), yy + 3.8, c, { a: "middle", h: 2.5 }); }); });
      yb += hl * (tab.rows.length + 1) + 2;
    }
    // nomenclature (repères numérotés de bas en haut, en-tête en bas, au-dessus du cartouche)
    if (nom.length) {
      const C = [[12, "Rep."], [12, "Qté"], [78, "Désignation"], [22, "Matière"], [28, "Long. (mm)"], [28, "Masse (kg)"]], wt = C.reduce((a, c) => a + c[0], 0), kx = wB / wt;
      const yN = bloc.y1 - hCart - hNom; s += `<rect x="${bloc.x0}" y="${yN}" width="${wB}" height="${hNom}" fill="#fff" stroke="#000" stroke-width="${TF}"/>`;
      let xx = bloc.x0; const xs = C.map((c) => { const a = xx; xx += c[0] * kx; return a; });
      xs.slice(1).forEach((xv) => { s += ligne(xv, yN, xv, yN + hNom); });
      const rows = nom.slice().reverse();
      rows.forEach((r, j) => { const yy = yN + lgN * j; if (j) s += ligne(bloc.x0, yy, bloc.x1, yy); r.forEach((c, i) => { s += txt(i === 2 ? xs[i] + 1.5 : xs[i] + C[i][0] * kx / 2, yy + 4.1, c, { a: i === 2 ? "start" : "middle", h: 2.5 }); }); });
      const yh = yN + lgN * rows.length; s += ligne(bloc.x0, yh, bloc.x1, yh, TF); C.forEach((c, i) => { s += txt(xs[i] + c[0] * kx / 2, yh + 4.1, c[1], { a: "middle", h: 2.5, b: 1 }); });
    }
    // cartouche provisoire
    const K = spec.cartouche || {}, yc = bloc.y1 - hCart, xc = bloc.x0;
    s += `<rect x="${xc}" y="${yc}" width="${wB}" height="${hCart}" fill="#fff" stroke="#000" stroke-width="0.7"/>`;
    const cel = (x, y, wd, hd, lab, val, o = {}) => ligne(x, y, x + wd, y) + ligne(x, y, x, y + hd) + txt(x + 1.2, y + 2.6, lab, { h: 1.8 }) + txt(x + (o.c ? wd / 2 : 1.5), y + hd - 1.6, val, { h: o.h || 2.8, b: o.b, a: o.c ? "middle" : "start" });
    const w1 = 45, w2 = wB - w1;
    if (K.logo) s += `<image href="${esc(K.logo)}" x="${xc + 2}" y="${yc + 2}" width="${w1 - 4}" height="12" preserveAspectRatio="xMidYMid meet"/>`;
    else s += txt(xc + w1 / 2, yc + 10, "FIP", { a: "middle", h: 7, b: 1 });
    s += txt(xc + w1 / 2, yc + 17.5, "France Ingénierie Process", { a: "middle", h: 2 });
    s += cel(xc + w1, yc, w2 / 2, 9, "Affaire", K.affaire || "—") + cel(xc + w1 + w2 / 2, yc, w2 / 2, 9, "Client / site", K.client || "—");
    s += cel(xc + w1, yc + 9, w2, 10, "Désignation", K.titre || "—", { h: 3.5, b: 1 });
    const w3 = w2 / 4; [["Échelle", "1:" + ech], ["Format", (spec.format || "A3") + " paysage"], ["Date", K.date || new Date().toLocaleDateString("fr-FR")], ["Indice", K.indice || "—"]].forEach(([l, v], i) => { s += cel(xc + w1 + w3 * i, yc + 19, w3, 8.5, l, v); });
    [["Dessiné", K.dessine || "—"], ["Vérifié", K.verifie || "—"], ["N° de plan", K.plan || "—"]].forEach(([l, v], i) => { s += cel(xc + w1 + (w2 / 3) * i, yc + 27.5, w2 / 3, 8.5, l, v, { b: i === 2 }); });
    s += ligne(xc, yc + 19, xc + w1, yc + 19) + txt(xc + w1 / 2, yc + 24.5, "Projection européenne", { a: "middle", h: 2 });
    // symbole de la méthode E (ISO 5456-2)
    const sx = xc + w1 / 2 - 8, sy = yc + 30; s += `<path d="M${sx},${sy - 2} L${sx + 7},${sy - 3.5} L${sx + 7},${sy + 3.5} L${sx},${sy + 2}Z" fill="none" ${STY.fin}/><circle cx="${sx + 13}" cy="${sy}" r="3.5" fill="none" ${STY.fin}/><circle cx="${sx + 13}" cy="${sy}" r="2" fill="none" ${STY.fin}/>`;
    s += `<line x1="${sx - 1}" y1="${sy}" x2="${sx + 17.5}" y2="${sy}" ${STY.axe}/>`;
    s += lignesNotes.map((l, i) => txt(zx0 + 3, zy1 - 3 - (lignesNotes.length - 1 - i) * 3.4, l, { h: 2.5 })).join("");   // notes à gauche du cartouche
    s += txt(zx1 - 1, zy0 - 2, K.provisoire === false ? "" : "Cartouche provisoire – à remplacer par le cartouche FIP", { a: "end", h: 2 });
    return { svg: s + "</svg>", echelle: ech, format: spec.format || "A3" };
  }
  return { prisme, boite, cylindre, cercle, planche, VUES, FORMATS };
})();
