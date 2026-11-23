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
  const F = "Arial,Helvetica,sans-serif", TF = 0.5, TFin = 0.25, SEG = 0.04;
  const FORMATS = { A2: [594, 420], A3: [420, 297], A4: [297, 210] };
  /* gabarits FIP (commun/data/gabarit-a2.js, gabarit-a3.js) : A2 et A3 ; A4 = cartouche simplifié */
  const gabFor = (fmt) => (fmt === "A2" ? (typeof GABARIT_A2 !== "undefined" ? GABARIT_A2 : null) : fmt === "A4" ? null : typeof GABARIT_A3 !== "undefined" ? GABARIT_A3 : null);
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
    const nS = Math.max(1, Math.ceil(L / (opt.seg || SEG))), I = (p, t) => { const a = P(0, p), b = P(L, p); return a.map((v, i) => v + (b[i] - v) * t); };   // faces longues découpées : tri du peintre fiable
    const cotes = (R) => R.forEach((p, i) => { const q = R[(i + 1) % R.length], dy = q[0] - p[0], dz = q[1] - p[1], n = nrm(add(mul(ey, dz), mul(ez, -dy)));
      for (let j = 0; j < nS; j++) faces.push({ rings: [[I(p, j / nS), I(q, j / nS), I(q, (j + 1) / nS), I(p, (j + 1) / nS)]], n }); });
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
  /* parties visibles des arêtes (mode vectoriel / DXF) : une arête de la face i est cachée là où une face j > i (plus proche, peinte après) la recouvre */
  function aretesVisibles(items, P2n) {
    const polys = items.map((it) => { const R = it.f.rings.map((r) => r.map(P2n)), xs = R.flat().map((p) => p[0]), ys = R.flat().map((p) => p[1]); return { R, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; });
    const C = 4, grille = new Map(), cle = (i, j) => i + ":" + j;
    polys.forEach((P, k) => { for (let i = Math.floor(P.x0 / C); i <= Math.floor(P.x1 / C); i++) for (let j = Math.floor(P.y0 / C); j <= Math.floor(P.y1 / C); j++) { const c = cle(i, j); (grille.get(c) || grille.set(c, []).get(c)).push(k); } });
    const EPS = 0.06, dans = (P, x, y) => { if (x < P.x0 + EPS || x > P.x1 - EPS || y < P.y0 + EPS || y > P.y1 - EPS) return false; let c = false, dm = Infinity;
      P.R.forEach((r) => r.forEach((a, i) => { const b = r[(i + 1) % r.length]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
        const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-12, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2)); dm = Math.min(dm, Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy)); }));
      return c && dm > EPS; };
    const cache = (k, x, y) => (grille.get(cle(Math.floor(x / C), Math.floor(y / C))) || []).some((j) => j > k && dans(polys[j], x, y));
    const segs = [];
    items.forEach((it, k) => it.edges.forEach(([p, q]) => { const a = P2n(p), b = P2n(q), L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-3) return;
      const n = Math.max(2, Math.ceil(L / 0.4)), pt = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], vis = [];
      for (let i = 0; i <= n; i++) { const [x, y] = pt(i / n); vis.push(!cache(k, x, y)); }
      const bord = (t0, t1, v0) => { for (let r = 0; r < 6; r++) { const tm = (t0 + t1) / 2, [x, y] = pt(tm); if (!cache(k, x, y) === v0) t0 = tm; else t1 = tm; } return (t0 + t1) / 2; };
      let deb = vis[0] ? 0 : null;
      for (let i = 1; i <= n; i++) { if (vis[i] && deb === null) deb = bord((i - 1) / n, i / n, false); if (!vis[i] && deb !== null) { segs.push([pt(deb), pt(bord((i - 1) / n, i / n, true)), it.S.trait || TF]); deb = null; } }
      if (deb !== null) segs.push([pt(deb), b, it.S.trait || TF]); }));
    return segs;
  }
  function rendreVue(V, sol, X, Y, vec) {
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
    if (vec) return `<g data-c="CONTOUR">` + aretesVisibles(items, (p) => [X(dot(p, V.u)), Y(dot(p, V.v))]).map(([a, b, w]) => `<line x1="${a[0].toFixed(3)}" y1="${a[1].toFixed(3)}" x2="${b[0].toFixed(3)}" y2="${b[1].toFixed(3)}" stroke="#000" stroke-width="${w}" stroke-linecap="round"/>`).join("") + "</g>";
    return items.map(({ f, edges, S }) => `<path d="${f.rings.map((R) => "M" + R.map(P2).join("L") + "Z").join("")}" fill="${S.fond || "#fff"}" fill-rule="evenodd" stroke="none"/>` +
      (edges.length ? `<path d="${edges.map(([p, q]) => "M" + P2(p) + "L" + P2(q)).join("")}" stroke="#000" stroke-width="${S.trait || TF}" stroke-linecap="round" fill="none"/>` : "")).join("");
  }

  /* ---------- primitives 2D de la planche ---------- */
  const CAL = { fort: "CONTOUR", fin: "FIN", axe: "AXES", tirets: "CACHE", cache: "CACHE", fantome: "PIECES_VOISINES" };   // calques DXF
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

  /* symbole de coupe de tuyau (vue de face) : ligne de rupture en S et demi-section hachurée à 45° (côté droit), traits fins ;
     le tout en segments (même rendu en SVG et en DXF) */
  function coupeTuyau(cx, cy, r) {
    const poly = [], N = 24, S = [];
    for (let i = 0; i <= N; i++) { const t = -Math.PI / 2 + Math.PI * i / N; poly.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }      // demi-cercle droit, de haut en bas
    for (let i = 0; i <= N; i++) { const t = 1 - i / N; S.push([cx + 0.5 * r * Math.sin(2 * Math.PI * t), cy - r + 2 * r * t]); }           // ligne en S, de bas en haut
    poly.push(...S.slice(1, -1));
    let g = `<g data-c="FIN"><polyline points="${S.map((p) => p.map((v) => v.toFixed(2)).join(",")).join(" ")}" fill="none" ${STY.fin}/>`;
    const pas = Math.max(0.9, Math.min(2, r / 5)), d0 = cx + cy - 2 * r, d1 = cx + cy + 2 * r;                                                  // droites x + y = d
    for (let d = d0 + pas; d < d1; d += pas * Math.SQRT2) { const X = [];
      poly.forEach((a, i) => { const b = poly[(i + 1) % poly.length], fa = a[0] + a[1] - d, fb = b[0] + b[1] - d; if ((fa < 0) !== (fb < 0)) { const t = fa / (fa - fb); X.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } });
      X.sort((p, q) => p[0] - q[0]); for (let i = 0; i + 1 < X.length; i += 2) g += `<line x1="${X[i][0].toFixed(2)}" y1="${X[i][1].toFixed(2)}" x2="${X[i + 1][0].toFixed(2)}" y2="${X[i + 1][1].toFixed(2)}" ${STY.fin}/>`; }
    return g + "</g>";
  }
  /* trièdre du SCU dans une vue orthogonale (flèches pour les axes dans le plan, ⊙ / ⊗ pour l'axe normal) ou en perspective */
  const AXES = [["X", [1, 0, 0]], ["Y", [0, 1, 0]], ["Z", [0, 0, 1]]];
  function triedre(V, ox, oy, L = 9) {
    let s = "";
    AXES.forEach(([n, e]) => { const cu = dot(e, V.u), cv = dot(e, V.v), cw = dot(e, V.w);
      if (Math.abs(cw) > 0.9 && V.id !== "iso") { s += `<circle cx="${ox}" cy="${oy}" r="1.6" fill="#fff" ${STY.fin}/>` + (cw > 0 ? `<circle cx="${ox}" cy="${oy}" r="0.45" fill="#000"/>` : `<path d="M${ox - 1.1},${oy - 1.1}L${ox + 1.1},${oy + 1.1}M${ox + 1.1},${oy - 1.1}L${ox - 1.1},${oy + 1.1}" ${STY.fin}/>`) + txt(ox - 2.4, oy + 4.2, n, { h: 2.5, b: 1, a: "end" }); return; }
      const dx = cu * L, dy = -cv * L; if (Math.hypot(dx, dy) < 2) return;
      s += `<line x1="${ox}" y1="${oy}" x2="${ox + dx}" y2="${oy + dy}" stroke="#000" stroke-width="0.35"/>` + fleche(ox + dx, oy + dy, dx, dy) + txt(ox + dx * 1.3 + (Math.abs(dx) < 1 ? 1.2 : 0), oy + dy * 1.3 + 1, n, { h: 2.5, b: 1, a: "middle" }); });
    return s + txt(ox + 1.5, oy + 5.5, "SCU", { h: 1.8, a: "start" });
  }
  const etiqAppui = (px, py, n) => `<path d="M${px},${py} l-1.4,2.6 h2.8z" fill="#000"/><line x1="${px}" y1="${py + 2.6}" x2="${px + 6}" y2="${py + 7}" ${STY.fin}/><rect x="${px + 6}" y="${py + 4.8}" width="7" height="4.4" fill="#fff" ${STY.fin}/>` + txt(px + 9.5, py + 8.1, n, { h: 2.5, b: 1, a: "middle" });   // appui : triangle + étiquette encadrée (à droite)

  /* ---------- planche ---------- */
  /* spec : { format:'A3'|'A4', vues:[{id, col, lig}], solides:[...], aides:[{type:'axe'|'tirets'|'fin', pts:[[x,y,z]...], vues?}], cercles:[{c, r, n, style, vues?}],
             sols:[{a, b, mat:[x,y,z] (côté matière), vues?}], murs:[{rect:[[...]...] (4 pts), vues?}], cotes:[{vue, a, b, dir, cote:'haut'|'bas'|'gauche'|'droite', niv, txt}],
             reperes:[{vue, p, n}], etiquettes:[{vue, p, txt, dx, dy}], nomenclature:[[rep, qte, des, mat, long, masse]], tableau:{titre, cols, rows}, cartouche:{...}, notes:[...] } */
  /* ---------- gabarit FIP A3 (commun/data/gabarit-a3.js) : cadre, cartouche et tableau des révisions à attributs ----------
     K (cartouche) : client1, client2, titre (ou titres[3]), projet, doc, lot, chrono, page, rev, bonPour, revisions:[{rev, desc, par, verif, appr, date}] */
  const avecGabarit = (spec) => !!gabFor(spec.format || "A3") && !(spec.cartouche && spec.cartouche.provisoire === true);
  /* cartouche FIP « Titre 1 / 2 / 3 » : champs PROJECT_TITLE, DOC_TITLE_1-3, CTR_DOC_REF (n° du document), SHEET (folio), SCALE, FORMAT, TYPE (code document), DISC (lot) et 6 lignes de révisions
     K : projectTitle (sinon client1 – client2), titres[3] (sinon titre coupé), ctrDoc (sinon projet-doc-lot-chrono-page-rev), folio, projet, doc, lot, chrono, page, rev, revisions:[{rev, desc, par, verif, date}] */
  function valeursGabarit(K, ech, fmt) {
    const coupe = (t, n) => { const L = []; let l = ""; String(t || "").split(" ").forEach((m) => { if ((l + " " + m).trim().length > n) { if (l.trim()) L.push(l.trim()); l = m; } else l += " " + m; }); if (l.trim()) L.push(l.trim()); return L; };
    const tit = K.titres || coupe(K.titre, 44), p2 = (v) => String(v ?? "").padStart(2, "0");
    const doc = K.ctrDoc || [K.projet || "00-000", K.doc || "PLN", K.lot, K.chrono || "01", K.page || "01", K.rev ?? K.indice ?? "0"].filter((x) => x !== "" && x != null).join("-");
    const V = { PROJECT_TITLE: K.projectTitle ?? [K.client1 ?? K.client ?? "", K.client2 ?? ""].filter(Boolean).join(" - "), DOC_TITLE_1: tit[0] || "", DOC_TITLE_2: tit[1] || "", DOC_TITLE_3: tit.slice(2).join(" "),
      CTR_DOC_REF: doc, SHEET: K.folio || p2(K.page || 1) + "/01", SCALE: ech ? "1:" + ech : "SANS", FORMAT: fmt || "A3", TYPE: K.doc || "PLN", DISC: K.lot || "" };
    const R = (K.revisions || []).slice(-6);
    for (let i = 0; i < 6; i++) { const r = R[i] || {}; Object.assign(V, { ["REV_" + i]: R[i] ? String(r.rev ?? i) : i ? "" : "0", ["DATE_" + i]: r.date || "", ["REV_MEMO_" + i]: R[i] ? r.desc || "" : i ? "" : "Création du document", ["ISSUE_" + i]: r.par || "", ["CHECK_" + i]: r.verif || "" }); }
    return V;
  }
  /* hauteur de texte réduite pour tenir dans la case (largeur limite en mm, ≈ 0,6 h par caractère) */
  const LIM = { PROJECT_TITLE: 76, DOC_TITLE_1: 160, DOC_TITLE_2: 160, DOC_TITLE_3: 160, REV_MEMO: 76, CTR_DOC_REF: 56, DISC: 24, SHEET: 20 };
  const hAj = (tag, h, t) => { const L = LIM[tag.replace(/_\d$/, "")], n = String(t ?? "").length; return L && n ? Math.min(h, +(L / (n * 0.6)).toFixed(2)) : h; };
  function gabaritSVG(V, PH, fmt) {
    const G = gabFor(fmt), anc = ["start", "middle", "end"], fs = (h) => +(h / 0.72).toFixed(2);
    let s = `<g data-gabarit="${fmt}">`;
    for (const k of ["F", "C", "R"]) {
      if (!G[k]) continue;
      const B = G[k], [ox, oy] = B.o, X = (x) => +(ox + x).toFixed(3), Y = (y) => +(PH - oy - y).toFixed(3);
      const T = (x, y, h, ha, va, t, att) => `<text${att ? ` data-att="${att}"` : ""} x="${X(x)}" y="${+(Y(y) + (va === 2 ? h / 2 : va === 3 ? h : 0)).toFixed(3)}" font-size="${fs(h)}" text-anchor="${anc[ha] || "start"}" fill="#000">${esc(t)}</text>`;
      s += `<path d="${B.l.map((l) => `M${X(l[0])},${Y(l[1])}L${X(l[2])},${Y(l[3])}`).join("")}" stroke="#000" stroke-width="${k === "F" ? 0.5 : TFin}" fill="none"/>`;
      B.c.forEach((c) => { s += `<circle cx="${X(c[0])}" cy="${Y(c[1])}" r="${c[2]}" fill="none" stroke="#000" stroke-width="${TFin}"/>`; });
      B.r.forEach((r) => { s += `<rect x="${X(r[0])}" y="${Y(r[1] + r[3])}" width="${r[2]}" height="${r[3]}" fill="#000"/>`; });
      B.t.forEach((t) => { s += T(t[0], t[1], t[2], t[3], t[4], t[5]); });
      B.m.forEach((m) => { const n = m[3].length, pas = m[2] * 2; m[3].forEach((l, i) => { s += T(m[0], m[1] - (i - (n - 1) / 2) * pas, m[2], 1, 2, l); }); });
      B.a.forEach((a) => { const v = V[a[0]] ?? ""; s += T(a[2], a[3], hAj(a[0], a[4], v), a[5], a[6], v, a[0]); });
      if (B.logo) B.logo.forEach((g) => { s += `<path d="${g.loops.map((L) => "M" + L.map((p) => X(p[0]) + "," + Y(p[1])).join("L") + "Z").join("")}" fill="#${g.rgb}" fill-rule="evenodd"/>`; });
    }
    return s + "</g>";
  }

  function planche(spec) {
    const GAB = avecGabarit(spec), [PW, PH] = FORMATS[spec.format] || FORMATS.A3, mL = GAB ? 10 : 20, mA = 10, zx0 = mL, zx1 = PW - mA, zy0 = mA, zy1 = PH - mA;
    // bloc cartouche + nomenclature + tableau (coin inférieur droit)
    const A4 = spec.format === "A4", TH = A4 ? { hl: 4.8, f: 2.4, ft: 3, nt: 2.2, bd: 11, b1: 4, b2: 2.1 } : { hl: 6, f: 2.8, ft: 3.5, nt: 2.5, bd: 13, b1: 5, b2: 2.5 };   // tailles selon le format
    const nom = spec.nomenclature || [], tabs = (spec.tableaux || []).concat(spec.tableau ? [spec.tableau] : []).filter((t) => t && t.rows && t.rows.length), lgN = A4 ? 5 : 6, wB = Math.min(GAB ? 170 : 180, zx1 - zx0), hCart = GAB ? 144 : 36, hNom = nom.length ? (nom.length + 1) * lgN : 0;
    const coupeTxt = (t, n) => { const L = []; let l = ""; String(t).split(" ").forEach((m) => { if ((l + " " + m).trim().length > n) { L.push(l.trim()); l = m; } else l += " " + m; }); if (l.trim()) L.push(l.trim()); return L; };
    const ncTab = Math.floor(wB / (A4 ? 1.22 : 1.38));
    tabs.forEach((t) => { t._note = t.note ? coupeTxt(t.note, ncTab) : []; });
    const hTab = tabs.reduce((a, t) => a + (t.rows.length + 1) * TH.hl + TH.ft + 2 + 2.5 + t._note.length * (TH.nt + 0.9), 0), hTp = spec.statut ? TH.bd + 2 : 0, hB = hCart + hNom + hTab + (tabs.length ? 1 : 0) + hTp;
    const bloc = { x0: zx1 - wB, y0: zy1 - hB, x1: zx1, y1: zy1 };
    const coupeR = (R, B) => B && R[0] < B.x1 && R[2] > B.x0 && R[1] < B.y1 && R[3] > B.y0;
    const lignesNotes = [], ncN = Math.max(30, Math.floor((bloc.x0 - zx0 - 6) / 1.35));      // notes coupées à la largeur disponible
    (spec.notes || []).forEach((n) => { let l = ""; String(n).split(" ").forEach((m) => { if ((l + " " + m).trim().length > ncN) { lignesNotes.push(l.trim()); l = m; } else l += " " + m; }); if (l.trim()) lignesNotes.push(l.trim()); });
    const hNotes = lignesNotes.length ? lignesNotes.length * 3.4 + 4 : 0;
    /* deux dispositions du bloc : « pile » (bandeau + tableaux au-dessus de la nomenclature) ou « côte » (bandeau + tableaux à gauche de la nomenclature, si la largeur le permet) */
    const hPile = hTab + (tabs.length ? 1 : 0) + hTp, blocA = { x0: zx1 - wB, y0: zy1 - hCart - hNom, x1: zx1, y1: zy1 };
    const DISPO = { pile: { obst: [bloc], zt: { x0: bloc.x0, y0: bloc.y0, w: wB } } };
    if (hPile > 0 && zx1 - zx0 - 2 * wB - 4 >= 0) { const r = { x0: blocA.x0 - 4 - wB, x1: blocA.x0 - 4, y1: zy1 - hNotes - 1, y0: zy1 - hNotes - 1 - hPile }; DISPO.cote = { obst: [blocA, r], zt: { x0: r.x0, y0: r.y0, w: wB } }; }
    let obst = DISPO.pile.obst;
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
      vues.forEach((V) => { V.mg = { g: MG(V, "gauche"), d: MG(V, "droite"), h: MG(V, "haut") + 6, b: MG(V, "bas") + 5 }; });
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
        const chev = rects.some((r) => { const R = [r.x - r.V.mg.g, r.y - r.V.mg.h, r.x + r.w + r.V.mg.d, r.y + r.h + r.V.mg.b]; return obst.some((B) => coupeR(R, B)); });
        if (chev) continue;
        ech = e; place = rects; grille = { x0, y0, wc, hl, cols, ligs }; break;
      }
      return { ech, place, grille };
    };
    // choix : vues complètes ; interrompues si l'échelle y gagne ; vue de dessus abandonnée seulement si elle coûte plus d'un facteur 2
    const coupes = !!(spec.interruptions && spec.interruptions.length);
    const choisir = () => { let best = essai(spec.vues, false);
      if (coupes) { const r = essai(spec.vues, true); if (r.ech && (!best.ech || r.ech < best.ech)) best = r; }
      if (spec.vues.some((v) => v.option)) { const L = spec.vues.filter((v) => !v.option); let r = essai(L, false); if (coupes) { const r2 = essai(L, true); if (r2.ech && (!r.ech || r2.ech < r.ech)) r = r2; } if (r.ech && (!best.ech || r.ech * 2 < best.ech)) best = r; }
      return best; };
    let best = choisir(), dispo = "pile";
    if (DISPO.cote) { obst = DISPO.cote.obst; const r = choisir(); if (r.ech && (!best.ech || r.ech < best.ech)) { best = r; dispo = "cote"; } else obst = DISPO.pile.obst; }
    const ZT = DISPO[dispo].zt;
    let { ech, place, grille } = best;
    const vues = place ? place.map((r) => r.V) : spec.vues.map((v) => ({ ...VUES[v.id], ...v }));
    if (!ech) { ech = 100; const k = 10; vues.forEach((V) => { V.mg = V.mg || { g: 18, d: 18, h: 24, b: 18 }; if (V.u0 == null) { V.u0 = 0; V.u1 = 1; V.v0 = 0; V.v1 = 1; } V.mu = V.mu || ((t) => t); V.mv = V.mv || ((t) => t); V.iu = V.iu || []; V.iv = V.iv || []; }); place = vues.map((V, i) => ({ V, x: zx0 + 20 + i * 120, y: zy0 + 20, w: (V.u1 - V.u0) * k, h: (V.v1 - V.v0) * k })); }
    const k = 1000 / ech;
    // data-echelle / data-zone : échelle des vues et zone de dessin (fenêtre de présentation du DXF) ; data-ep : élément de l'espace papier
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" class="planche" style="width:100%;background:#fff" font-family="${F}" data-echelle="${ech}" data-zone="${zx0} ${zy0} ${zx1} ${zy1}">`;
    s += `<rect x="0" y="0" width="${PW}" height="${PH}" fill="#fff"/>`;
    if (!GAB) { s += `<rect data-c="CADRE" x="${zx0}" y="${zy0}" width="${zx1 - zx0}" height="${zy1 - zy0}" fill="none" stroke="#000" stroke-width="0.7"/>`;
      [[PW / 2, 0, PW / 2, zy0], [PW / 2, PH, PW / 2, zy1], [0, PH / 2, zx0, PH / 2], [PW, PH / 2, zx1, PH / 2]].forEach(([a, b, c, d]) => { s += `<line data-c="CADRE" x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#000" stroke-width="0.7"/>`; }); }   // repères de centrage
    if (spec.statut) { const T = { x0: ZT.x0, y0: ZT.y0, x1: ZT.x0 + ZT.w, y1: ZT.y0 + hTp - 2 }, ph = spec.statut.phase || "APS/APD";   // bandeau encadré (pas de filigrane)
      s += `<g data-c="CARTOUCHE"><rect x="${T.x0}" y="${T.y0}" width="${T.x1 - T.x0}" height="${T.y1 - T.y0}" fill="#fff" stroke="#000" stroke-width="0.7"/><rect x="${T.x0 + 1}" y="${T.y0 + 1}" width="${T.x1 - T.x0 - 2}" height="${T.y1 - T.y0 - 2}" fill="none" ${STY.fin}/>` +
        txt((T.x0 + T.x1) / 2, T.y0 + 1.6 + TH.b1, `NON VALABLE POUR EXÉCUTION – PHASE ${ph}`, { a: "middle", h: TH.b1, b: 1 }) +
        txt((T.x0 + T.x1) / 2, T.y1 - 2.4, "Cotes et nomenclature de prédimensionnement (avant-projet), à confirmer par les études d'exécution.", { a: "middle", h: TH.b2 }) + "</g>"; }
    place.forEach(({ V, x, y, w, h }) => {
      const X = (u) => x + (V.mu(u) - V.u0) * k, Y = (v) => y + (V.v1 - V.mv(v)) * k, P = (p) => [X(dot(p, V.u)), Y(dot(p, V.v))], dans = (o) => !o.vues || o.vues.includes(V.id);
      let g = "";
      // ouvrage : murs (hachures béton) puis sols
      (spec.murs || []).filter(dans).forEach((m) => { const Q = m.rect.map(P), xs = Q.map((q) => q[0]), ys = Q.map((q) => q[1]), a = Math.min(...xs), b = Math.max(...xs), c = Math.min(...ys), d = Math.max(...ys);
        if (b - a < 0.3 || d - c < 0.3) return; const id = "hb" + Math.random().toString(36).slice(2, 8);
        g += `<g data-c="OUVRAGE"><defs><pattern id="${id}" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" stroke="#000" stroke-width="0.18"/></pattern></defs><rect x="${a}" y="${c}" width="${b - a}" height="${d - c}" fill="url(#${id})" stroke="#000" stroke-width="${TF}"/></g>`; });
      g += rendreVue(V, spec.solides, X, Y, spec.vecteur);
      (spec.sols || []).filter(dans).forEach((so) => { const a = P(so.a), b = P(so.b), L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) return; const m = P(so.mat), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        let nx = m[0] - mx, ny = m[1] - my; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n; g += `<g data-c="OUVRAGE">${hachures(a[0], a[1], b[0], b[1], nx, ny)}</g>`; });
      (spec.aides || []).filter(dans).forEach((a) => { const Q = a.pts.map(P); if (Q.length < 2 || Math.hypot(Q[Q.length - 1][0] - Q[0][0], Q[Q.length - 1][1] - Q[0][1]) < 0.5) return;
        g += `<polyline data-c="${CAL[a.type] || "FIN"}" points="${Q.map((q) => q.map((v) => v.toFixed(2)).join(",")).join(" ")}" fill="none" ${STY[a.type] || STY.fin}/>`; });
      (spec.cercles || []).filter(dans).forEach((c) => { const n = c.n || [1, 0, 0]; if (Math.abs(dot(n, V.w)) < 0.9) return; const [cx, cy] = P(c.c), r = c.r * k;
        g += `<circle data-c="${CAL[c.style] || "FIN"}" cx="${cx}" cy="${cy}" r="${r}" fill="none" ${STY[c.style] || STY.fin}/>`;
        if (c.coupe) g += coupeTuyau(cx, cy, r);
        if (c.croix) g += `<line x1="${cx - r - 2}" y1="${cy}" x2="${cx + r + 2}" y2="${cy}" ${STY.axe}/><line x1="${cx}" y1="${cy - r - 2}" x2="${cx}" y2="${cy + r + 2}" ${STY.axe}/>`; });
      // lignes de rupture (trait fin avec zigzag, ISO 128) : bande blanche par pièce traversant l'intervalle
      const zig = (x1, y1, x2, y2) => { const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy, ny = ux, m = L / 2, P2 = (t, o) => `${(x1 + ux * t + nx * o).toFixed(2)},${(y1 + uy * t + ny * o).toFixed(2)}`;
        return `<polyline points="${[P2(0, 0), P2(m - 1.6, 0), P2(m - 0.8, 1.8), P2(m + 0.8, -1.8), P2(m + 1.6, 0), P2(L, 0)].join(" ")}" fill="none" ${STY.fin}/>`; };
      [["u", V.iu], ["v", V.iv]].forEach(([axe, L]) => L.forEach(([a, b]) => spec.solides.forEach((S) => {
        let o0 = Infinity, o1 = -Infinity; const oth = axe === "u" ? V.v : V.u, ax = V[axe];
        S.faces.forEach((f) => { const t = f.rings[0].map((p) => dot(p, ax)); if (Math.min(...t) < a && Math.max(...t) > b) f.rings[0].forEach((p) => { const o = dot(p, oth); o0 = Math.min(o0, o); o1 = Math.max(o1, o); }); });
        if (o0 > o1) return;
        if (axe === "u") { const xa = X(a), xb = X(b), ya = Y(o1) - 2.5, yb = Y(o0) + 2.5; g += `<rect data-masque="1" x="${xa + 0.15}" y="${ya}" width="${xb - xa - 0.3}" height="${yb - ya}" fill="#fff"/>` + zig(xa, ya, xa, yb) + zig(xb, ya, xb, yb); }
        else { const ya = Y(b), yb = Y(a), xa = X(o0) - 2.5, xb = X(o1) + 2.5; g += `<rect data-masque="1" x="${xa}" y="${ya + 0.15}" width="${xb - xa}" height="${yb - ya - 0.3}" fill="#fff"/>` + zig(xa, ya, xb, ya) + zig(xa, yb, xb, yb); } })));
      // cotes
      const niv = { gauche: 0, droite: 0, haut: 0, bas: 0 };
      (spec.cotes || []).filter((c) => c.vue === V.id).forEach((c) => { const a = P(c.a), b = P(c.b), n = c.niv || 0, pos = { gauche: x - 10 - 8 * n, droite: x + w + 10 + 8 * n, haut: y - 10 - 8 * n, bas: y + h + 10 + 8 * n }[c.cote];
        g += `<g data-c="COTES">${cote(a, b, c.cote === "gauche" || c.cote === "droite" ? "v" : "h", pos, c.txt)}</g>`; });
      // étiquettes et repères (bulles)
      (spec.etiquettes || []).filter((e) => e.vue === V.id).forEach((e) => { const [px, py] = P(e.p), tx = px + (e.dx || 12), ty = py + (e.dy || -10);
        g += `<g data-c="REPERES"><line x1="${px}" y1="${py}" x2="${tx}" y2="${ty}" ${STY.fin}/><line x1="${tx}" y1="${ty}" x2="${tx + (e.dx < 0 ? -1 : 1) * (e.txt.length * 1.75 + 2)}" y2="${ty}" ${STY.fin}/>` + txt(tx + (e.dx < 0 ? -1 : 1) * 1, ty - 1, e.txt, { h: 2.5, a: e.dx < 0 ? "end" : "start" }) + "</g>"; });
      const cx0 = x + w / 2, cy0 = y + h / 2;
      (spec.reperes || []).filter((r) => r.vue === V.id).forEach((r) => { const [px, py] = P(r.p); let dx = r.dx ?? (px - cx0), dy = r.dy ?? (py - cy0); const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
        const L = r.L || 14, bx = px + dx * L, by = py + dy * L, R = 3.5;
        g += `<g data-c="REPERES"><circle cx="${px}" cy="${py}" r="0.6" fill="#000"/><line x1="${px}" y1="${py}" x2="${bx - dx * R}" y2="${by - dy * R}" ${STY.fin}/><circle cx="${bx}" cy="${by}" r="${R}" fill="#fff" ${STY.fin}/>` + txt(bx, by + 1.25, r.n, { a: "middle" }) + "</g>"; });
      if (spec.scu) { g += `<g data-c="REPERES">` + triedre(V, Math.max(Math.min(x - V.mg.g + 12, x + w / 2 - (V.titre.length + 24) * 1.15 - 16), zx0 + 16), y + h + V.mg.b - 7) + "</g>"; /* à gauche du titre de la vue */ (spec.appuis || []).filter((a) => (a.vues || ["face"]).includes(V.id)).forEach((a) => { const [px, py] = P(a.p); g += etiqAppui(px, py, a.n); }); }
      { const t1 = V.titre + (spec.repLib ? " - " + spec.repLib : spec.repSupport ? " - SUPPORT " + spec.repSupport : ""), t2 = "ECHELLE 1:" + ech, yt = y + h + V.mg.b + 1, ul = (t, yy) => { const L = t.length * 2.55; return `<line x1="${(x + w / 2 - L / 2).toFixed(2)}" y1="${yy + 1}" x2="${(x + w / 2 + L / 2).toFixed(2)}" y2="${yy + 1}" ${STY.fin}/>`; };
        g += `<g data-c="TEXTE">${txt(x + w / 2, yt, t1, { a: "middle", h: 3.5, b: 1 })}${ul(t1, yt)}${txt(x + w / 2, yt + 4.6, t2, { a: "middle", h: 3.5, b: 1 })}${ul(t2, yt + 4.6)}</g>`; }
      s += `<g>${g}</g>`;
    });
    // perspective isométrique (sans échelle) dans la plus grande zone libre
    if (spec.iso) {
      const w = nrm(spec.iso.w || [1, -1, 1]), u = nrm(cross([0, 0, 1], w)), v = cross(w, u), Vi = { id: "iso", u, v, w };   // u × v = w (repère direct, observateur côté w)
      const sols = spec.solides.concat(spec.iso.solides || []), pts = sols.flatMap((S) => S.faces.flatMap((f) => f.rings.flat())), us = pts.map((p) => dot(p, u)), vs = pts.map((p) => dot(p, v));
      const du = Math.max(...us) - Math.min(...us), dv = Math.max(...vs) - Math.min(...vs);
      const occ = place.map((r) => [r.x - r.V.mg.g, r.y - r.V.mg.h, r.x + r.w + r.V.mg.d, r.y + r.h + r.V.mg.b + 6]);
      const gR = Math.max(...occ.map((o) => o[2])), gB = Math.max(...occ.map((o) => o[3]));
      const hautO = Math.min(...obst.map((B) => B.y0)), cand = [[gR + 4, zy0 + 4, zx1 - 4, (dispo === "pile" ? bloc.y0 : blocA.y0) - 4], [gR + 4, zy0 + 4, zx1 - 4, hautO - 4], [zx0 + 4, gB + 2, bloc.x0 - 4, zy1 - hNotes - 2]];
      if (grille) grille.cols.forEach((c) => grille.ligs.forEach((r) => { if (!place.some((p) => p.V.col === c && p.V.lig === r)) cand.push([grille.x0[c] + 2, grille.y0[r] + 2, zx1 - 4, hautO - 4]); }));
      const libre = (R) => !occ.some((o) => o[0] < R[2] && o[2] > R[0] && o[1] < R[3] && o[3] > R[1]) && !obst.some((B) => coupeR(R, B));
      let mieux = null;
      cand.forEach((R) => { if (R[2] - R[0] < 50 || R[3] - R[1] < 50 || !libre(R)) return; const ki = Math.min((R[2] - R[0] - 10) / du, (R[3] - R[1] - 16) / dv); if (!mieux || ki > mieux.ki) mieux = { R, ki }; });
      if (mieux) { const { R, ki } = mieux, kk = Math.min(ki, k * 1.5), cx = (R[0] + R[2]) / 2, cy = (R[1] + R[3] - 8) / 2, um = (Math.max(...us) + Math.min(...us)) / 2, vm = (Math.max(...vs) + Math.min(...vs)) / 2;
        const XI = (a) => cx + (a - um) * kk, YI = (b) => cy - (b - vm) * kk;
        s += `<g>${rendreVue(Vi, sols, XI, YI, spec.vecteur)}${txt(cx, cy + dv * kk / 2 + 8, "PERSPECTIVE (sans échelle)", { a: "middle", b: 1 })}`;
        if (spec.scu) { s += `<g data-c="REPERES">` + triedre(Vi, Math.max(R[0] + 12, cx - du * kk / 2 - 6), Math.min(R[3] - 14, cy + dv * kk / 2 + 2), 10) + "</g>"; (spec.appuis || []).forEach((a) => { s += etiqAppui(XI(dot(a.p, u)), YI(dot(a.p, v)), a.n); }); }
        s += "</g>"; }
    }
    // tableau des configurations, nomenclature, cartouche : calque CARTOUCHE
    s += `<g data-c="CARTOUCHE">`;
    let yb = ZT.y0 + hTp;
    const ligne = (x1, y1, x2, y2, l = TFin) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="${l}"/>`;
    tabs.forEach((tab) => {
      const hl = TH.hl, pw = tab.larg || tab.cols.map(() => 1), sw = pw.reduce((a, b) => a + b, 0), xs = []; let xx = ZT.x0; pw.forEach((p) => { xs.push(xx); xx += p / sw * ZT.w; }); const wc = (i) => pw[i] / sw * ZT.w;
      s += txt(ZT.x0, yb + TH.ft + 0.4, tab.titre || "Tableau", { h: TH.ft, b: 1 }); yb += TH.ft + 2;
      s += `<rect x="${ZT.x0}" y="${yb}" width="${ZT.w}" height="${hl * (tab.rows.length + 1)}" fill="#fff" stroke="#000" stroke-width="${TF}"/>`;
      tab.cols.forEach((c, i) => { s += txt(xs[i] + wc(i) / 2, yb + hl * 0.68, c, { a: "middle", h: TH.f, b: 1 }); if (i) s += ligne(xs[i], yb, xs[i], yb + hl * (tab.rows.length + 1)); });
      tab.rows.forEach((r, j) => { const yy = yb + hl * (j + 1); s += ligne(ZT.x0, yy, (ZT.x0 + ZT.w), yy, j ? TFin : TF); r.forEach((c, i) => { s += txt(i === 0 && tab.gauche ? xs[i] + 1.2 : xs[i] + wc(i) / 2, yy + hl * 0.68, c, { a: i === 0 && tab.gauche ? "start" : "middle", h: TH.f, b: tab.gras && tab.gras(j, i) }); }); });
      yb += hl * (tab.rows.length + 1) + 2.5;
      tab._note.forEach((l) => { s += txt(ZT.x0, yb + 1.8, l, { h: TH.nt }); yb += TH.nt + 0.9; });
    });
    // nomenclature (repères numérotés de bas en haut, en-tête en bas, au-dessus du cartouche)
    if (nom.length) {
      const C = [[12, "Rep."], [12, "Qté"], [78, "Désignation"], [22, "Matière"], [28, "Long. (mm)"], [28, "Masse (kg)"]], wt = C.reduce((a, c) => a + c[0], 0), kx = wB / wt;
      const yN = bloc.y1 - hCart - hNom; s += `<rect x="${bloc.x0}" y="${yN}" width="${wB}" height="${hNom}" fill="#fff" stroke="#000" stroke-width="${TF}"/>`;
      let xx = bloc.x0; const xs = C.map((c) => { const a = xx; xx += c[0] * kx; return a; });
      xs.slice(1).forEach((xv) => { s += ligne(xv, yN, xv, yN + hNom); });
      const rows = nom.slice().reverse();
      rows.forEach((r, j) => { const yy = yN + lgN * j; if (j) s += ligne(bloc.x0, yy, bloc.x1, yy); r.forEach((c, i) => { s += txt(i === 2 ? xs[i] + 1.5 : xs[i] + C[i][0] * kx / 2, yy + lgN * 0.68, c, { a: i === 2 ? "start" : "middle", h: A4 ? 2.2 : 2.5 }); }); });
      const yh = yN + lgN * rows.length; s += ligne(bloc.x0, yh, bloc.x1, yh, TF); C.forEach((c, i) => { s += txt(xs[i] + c[0] * kx / 2, yh + lgN * 0.68, c[1], { a: "middle", h: A4 ? 2.2 : 2.5, b: 1 }); });
    }
    const K = spec.cartouche || {}, yc = bloc.y1 - hCart, xc = bloc.x0;
    if (GAB) {   // gabarit FIP A3 : cadre, cartouche et révisions (blocs à attributs dans le DXF)
      s += `</g>` + gabaritSVG(valeursGabarit(K, ech, spec.format || "A3"), PH, spec.format || "A3") + `<g data-c="TEXTE" data-ep="1">` + lignesNotes.map((l, i) => txt(zx0 + 3, zy1 - 3 - (lignesNotes.length - 1 - i) * 3.4, l, { h: 2.5 })).join("") + "</g>";
      return { svg: s + "</svg>", echelle: ech, format: spec.format || "A3" };
    }
    // cartouche provisoire (A4)
    s += `<rect x="${xc}" y="${yc}" width="${wB}" height="${hCart}" fill="#fff" stroke="#000" stroke-width="0.7"/>`;
    const cel = (x, y, wd, hd, lab, val, o = {}) => ligne(x, y, x + wd, y) + ligne(x, y, x, y + hd) + txt(x + 1.2, y + 2.6, lab, { h: 1.8 }) + txt(x + (o.c ? wd / 2 : 1.5), y + hd - 1.6, val, { h: o.h || 2.8, b: o.b, a: o.c ? "middle" : "start" });
    const w1 = 45, w2 = wB - w1;
    if (K.logo) s += `<image href="${esc(K.logo)}" x="${xc + 2}" y="${yc + 2}" width="${w1 - 4}" height="12" preserveAspectRatio="xMidYMid meet"/>`;
    else s += txt(xc + w1 / 2, yc + 10, "FIP", { a: "middle", h: 7, b: 1 });
    s += txt(xc + w1 / 2, yc + 17.5, "France Ingénierie Process", { a: "middle", h: 2 });
    s += cel(xc + w1, yc, w2 / 2, 9, "Affaire", K.affaire || "—") + cel(xc + w1 + w2 / 2, yc, w2 / 2, 9, "Client / site", K.client || "—");
    s += cel(xc + w1, yc + 9, w2, 10, "Désignation", K.titre || "—", { h: 3.5, b: 1 });
    const w3 = w2 / 4; [["Échelle", "1:" + ech], ["Format", (spec.format || "A3") + " paysage"], ["Date", K.date || new Date().toLocaleDateString("fr-FR")], ["Indice / phase", [K.indice, spec.statut ? spec.statut.phase || "APS/APD" : ""].filter(Boolean).join(" – ") || "—"]].forEach(([l, v], i) => { s += cel(xc + w1 + w3 * i, yc + 19, w3, 8.5, l, v); });
    [["Dessiné", K.dessine || "—"], ["Vérifié", K.verifie || "—"], ["N° de plan", K.plan || "—"]].forEach(([l, v], i) => { s += cel(xc + w1 + (w2 / 3) * i, yc + 27.5, w2 / 3, 8.5, l, v, { b: i === 2 }); });
    s += ligne(xc, yc + 19, xc + w1, yc + 19) + txt(xc + w1 / 2, yc + 24.5, "Projection européenne", { a: "middle", h: 2 });
    // symbole de la méthode E (ISO 5456-2)
    const sx = xc + w1 / 2 - 8, sy = yc + 30; s += `<path d="M${sx},${sy - 2} L${sx + 7},${sy - 3.5} L${sx + 7},${sy + 3.5} L${sx},${sy + 2}Z" fill="none" ${STY.fin}/><circle cx="${sx + 13}" cy="${sy}" r="3.5" fill="none" ${STY.fin}/><circle cx="${sx + 13}" cy="${sy}" r="2" fill="none" ${STY.fin}/>`;
    s += `<line x1="${sx - 1}" y1="${sy}" x2="${sx + 17.5}" y2="${sy}" ${STY.axe}/>`;
    s += `</g><g data-c="TEXTE" data-ep="1">`;
    s += lignesNotes.map((l, i) => txt(zx0 + 3, zy1 - 3 - (lignesNotes.length - 1 - i) * 3.4, l, { h: 2.5 })).join("");   // notes à gauche du cartouche
    s += txt(zx1 - 1, zy0 - 2, K.provisoire === false ? "" : "Cartouche simplifié A4 – le gabarit FIP est en A3", { a: "end", h: 2 }) + "</g>";
    return { svg: s + "</svg>", echelle: ech, format: spec.format || "A3" };
  }
  /* ---------- page de garde / sommaire du cahier (gabarit FIP) ----------
     spec : { format, cartouche:K, cols:[…], lignes:[[…]…], largeurs:[…], docsRef:[…], notes:[…] } — tableau à gauche (colonnes de lignes de hauteur constante), documents de référence et notes générales à droite */
  function sommaire(spec) {
    const [PW, PH] = FORMATS[spec.format] || FORMATS.A3, G = gabFor(spec.format || "A3"), zx0 = 10, zy0 = 10, zy1 = PH - 10, K = spec.cartouche || {};
    const cols = spec.cols, lw = spec.largeurs || cols.map(() => 1), sw = lw.reduce((a, b) => a + b, 0), wT = Math.min(150, PW * 0.36), xs = [];
    let xx = 0; lw.forEach((p) => { xs.push(xx); xx += p / sw * wT; });
    const hl = 6.2, nMax = Math.max(4, Math.floor((zy1 - zy0 - 8) / hl) - 1), L = spec.lignes, blocs = [];
    for (let i = 0; i < L.length; i += nMax) blocs.push(L.slice(i, i + nMax)); if (!blocs.length) blocs.push([]);
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" class="planche" style="width:100%;background:#fff" font-family="${F}" data-echelle="1" data-zone="${zx0} ${zy0} ${PW - 10} ${zy1}"><rect x="0" y="0" width="${PW}" height="${PH}" fill="#fff"/>`;
    const ligne = (x1, y1, x2, y2, l = TFin) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="${l}"/>`;
    s += `<g data-c="CARTOUCHE">`;
    blocs.forEach((B, bi) => { const x0 = zx0 + 4 + bi * (wT + 4), y0 = zy0 + 4, H = hl * (B.length + 1);
      s += ligne(x0, y0, x0 + wT, y0, TF) + ligne(x0, y0 + H, x0 + wT, y0 + H, TF) + ligne(x0, y0, x0, y0 + H, TF) + ligne(x0 + wT, y0, x0 + wT, y0 + H, TF);
      cols.forEach((c, i) => { s += txt(x0 + xs[i] + lw[i] / sw * wT / 2, y0 + hl * 0.68, c, { a: "middle", h: 2.8, b: 1 }); if (i) s += ligne(x0 + xs[i], y0, x0 + xs[i], y0 + H); });
      B.forEach((r, j) => { const yy = y0 + hl * (j + 1); s += ligne(x0, yy, x0 + wT, yy); r.forEach((c, i) => { s += txt(x0 + xs[i] + lw[i] / sw * wT / 2, yy + hl * 0.68, c, { a: "middle", h: 2.8 }); }); }); });
    s += "</g>";
    // documents de référence et notes générales (au-dessus du cartouche, partie droite)
    const T = [], tit = (t) => T.push({ t, b: 1 }), puce = (t) => T.push({ t: "•  " + t });
    if ((spec.docsRef || []).length) { tit("DOCUMENTS PROJET DE REFERENCE :"); spec.docsRef.forEach((d) => T.push({ t: d })); T.push({ t: "" }); }
    if ((spec.notes || []).length) { tit("NOTES GENERALES :"); spec.notes.forEach(puce); }
    const x1 = Math.max(zx0 + 8 + blocs.length * (wT + 4), PW * 0.55), y1 = zy1 - 144 - 14 - T.length * 5.2;
    s += `<g data-c="TEXTE">` + T.map((l, i) => txt(x1, y1 + i * 5.2, l.t, { h: 3.5, b: l.b }) + (l.b ? ligne(x1, y1 + i * 5.2 + 1, x1 + l.t.length * 2.6, y1 + i * 5.2 + 1) : "")).join("") + "</g>";
    const V = valeursGabarit(K, null, spec.format || "A3");
    s += gabaritSVG(V, PH, spec.format || "A3");
    return { svg: s + "</svg>", echelle: 1, format: spec.format || "A3" };
  }
  /* =====================================================================
     EXPORT DXF 2000 (AC1015, ASCII, mm) depuis une ou plusieurs planches vectorielles (spec.vecteur = true)
     Une présentation (layout A3/A4) par folio : cadre, cartouche FIP (blocs à attributs), tableaux, nomenclature et notes
     dans l'espace papier ; vues (géométrie, cotes, repères) dans l'espace objet en vraie grandeur (mm), vues par une
     fenêtre à l'échelle du folio (1:éch). Folios côte à côte dans l'espace objet.
     pages : [{ svg, nom }] — nom = nom de la présentation (ex. « F01 ST-01 »).
     Calques ISO : CADRE, CONTOUR, FIN, AXES (CENTER), CACHE (DASHED), PIECES_VOISINES (PHANTOM), COTES, REPERES, TEXTE, OUVRAGE, CARTOUCHE, FILIGRANE, FENETRES (non imprimé)
     ===================================================================== */
  const CALQUES = { "0": [7, "CONTINUOUS"], CADRE: [7, "CONTINUOUS"], CONTOUR: [232, "CONTINUOUS"], FIN: [9, "CONTINUOUS"], AXES: [1, "CENTER"], CACHE: [6, "DASHED"], PIECES_VOISINES: [8, "PHANTOM"],
    COTES: [91, "CONTINUOUS", 0, "8CC88C"], REPERES: [91, "CONTINUOUS", 0, "8CC88C"], TEXTE: [7, "CONTINUOUS"], OUVRAGE: [8, "CONTINUOUS"], CARTOUCHE: [7, "CONTINUOUS"], FILIGRANE: [9, "CONTINUOUS"], FENETRES: [8, "CONTINUOUS", 1] };
  const TIRETS = { "8 1.5 1 1.5": "AXES", "10 1.5 1 1.5 1 1.5": "PIECES_VOISINES", "3 1.5": "CACHE" };
  const CP1252 = "€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F\u0090‘’“”•–—˜™š›œ\u009DžŸ";
  const ASCII = { " ": " ", " ": " ", " ": " ", "≈": "~", "≤": "<=", "≥": ">=", "→": "->", "−": "-", "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9", "²": "2", "³": "3", "⁴": "4" };
  const encTexte = (t) => [...String(t).replace(/[   ≈≤≥→−₀-₉⁴]/g, (c) => ASCII[c] || c).replace(/Ø/g, "%%c").replace(/±/g, "%%p").replace(/°/g, "%%d")].map((c) => { const k = c.codePointAt(0); if (k < 128 || (k >= 160 && k < 256) || CP1252.includes(c)) return c; return "\\U+" + k.toString(16).toUpperCase().padStart(4, "0"); }).join("");
  function enOctets(str) { const out = new Uint8Array(str.length); for (let i = 0; i < str.length; i++) { const c = str[i], k = c.charCodeAt(0), j = CP1252.indexOf(c); out[i] = k < 128 || (k >= 160 && k < 256) ? k : j >= 0 ? 128 + j : 63; } return out; }
  const nomPres = (t) => String(t).replace(/[<>\/\\":;?*|,=`]/g, "-").slice(0, 60);
  function dxf(pages) {
    const nb = (v) => (Math.abs(v) < 1e-9 ? 0 : +(+v).toFixed(4));
    /* ---- 1. lecture des planches : entités { sp: 'M' (objet) | 'P' (papier), f: folio, t: type, L: calque, d: données } ---- */
    const ENT = [], FOL = [];
    let oxm = 0;
    pages.forEach((pg, f) => {
      const doc = new DOMParser().parseFromString(pg.svg, "image/svg+xml"), root = doc.documentElement, vb = root.getAttribute("viewBox").split(/\s+/).map(Number), PH = vb[3], PW = vb[2];
      const k = +root.getAttribute("data-echelle") || 1, Z = (root.getAttribute("data-zone") || `0 0 ${PW} ${PH}`).split(/\s+/).map(Number);
      const fo = { nom: nomPres(pg.nom || "Folio " + String(f + 1).padStart(2, "0")), PW, PH, k, oxm, Z, ins: [] }; FOL.push(fo);
      // transformations : papier (mm de feuille, y vers le haut) ; objet (vraie grandeur = feuille × échelle, folio décalé)
      const T = { P: (p) => [p[0], PH - p[1]], M: (p) => [oxm + p[0] * k, (PH - p[1]) * k] }, K = { P: 1, M: k };
      const masques = [], segs = [];
      const calque = (el, parent) => el.getAttribute("data-c") || TIRETS[(el.getAttribute("stroke-dasharray") || "").trim()] || parent || (+el.getAttribute("stroke-width") >= 0.5 ? "CONTOUR" : "FIN");
      const add = (sp, t, L, d) => ENT.push({ sp, f, t, L, d });
      const seg = (sp, L, a, b) => segs.push({ sp, L, a, b });
      const chemin = (d) => { const Tk = d.match(/[MLHVZmlhvz]|-?\d*\.?\d+(?:e-?\d+)?/g) || [], polys = []; let cur = null, x = 0, y = 0, i = 0, cmd = "M";
        while (i < Tk.length) { if (/[A-Za-z]/.test(Tk[i])) cmd = Tk[i++]; if (/[Zz]/.test(cmd)) { if (cur) { cur.ferme = true; } cmd = "M"; continue; }
          const n = () => +Tk[i++];
          if (cmd === "M") { x = n(); y = n(); cur = { pts: [[x, y]] }; polys.push(cur); cmd = "L"; } else if (cmd === "m") { x += n(); y += n(); cur = { pts: [[x, y]] }; polys.push(cur); cmd = "l"; }
          else if (cmd === "L") { x = n(); y = n(); cur.pts.push([x, y]); } else if (cmd === "l") { x += n(); y += n(); cur.pts.push([x, y]); }
          else if (cmd === "H") { x = n(); cur.pts.push([x, y]); } else if (cmd === "h") { x += n(); cur.pts.push([x, y]); }
          else if (cmd === "V") { y = n(); cur.pts.push([x, y]); } else if (cmd === "v") { y += n(); cur.pts.push([x, y]); } else i++; }
        return polys; };
      const marche = (el, L, sp) => {
        for (const n of el.children) {
          const tag = n.tagName.toLowerCase(), c = calque(n, L);
          if (["defs", "pattern", "image", "title"].includes(tag)) continue;
          if (tag === "g" && n.getAttribute("data-gabarit")) { const V = {}; n.querySelectorAll("[data-att]").forEach((t) => { V[t.getAttribute("data-att")] = t.textContent; }); fo.ins.push(V); fo.gf = n.getAttribute("data-gabarit"); continue; }   // gabarit FIP : blocs + attributs (papier)
          const spN = sp === "P" || n.getAttribute("data-ep") || ["CARTOUCHE", "CADRE"].includes(n.getAttribute("data-c")) ? "P" : "M";
          if (tag === "g") { marche(n, n.getAttribute("data-c") || L, spN); continue; }
          const at = (q) => +n.getAttribute(q) || 0, fill = n.getAttribute("fill") || "", stroke = n.getAttribute("stroke");
          if (tag === "line") seg(spN, c, [at("x1"), at("y1")], [at("x2"), at("y2")]);
          else if (tag === "polyline" || tag === "polygon") { const P = n.getAttribute("points").trim().split(/\s+/).map((q) => q.split(",").map(Number)); P.forEach((p, i) => { if (i) seg(spN, c, P[i - 1], p); }); if (tag === "polygon") seg(spN, c, P[P.length - 1], P[0]); }
          else if (tag === "rect") { const x = at("x"), y = at("y"), w = at("width"), h = at("height");
            if (n.getAttribute("data-masque")) { masques.push([x, y, x + w, y + h]); continue; }
            if (/^url/.test(fill)) { for (let t = -h; t < w; t += 3) { const a = [x + Math.max(t, 0), y + h - Math.max(-t, 0)], L2 = Math.min(w - Math.max(t, 0), h - Math.max(-t, 0)); if (L2 > 0.2) seg(spN, "OUVRAGE", a, [a[0] + L2, a[1] - L2]); } }
            if (stroke && stroke !== "none") [[x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]].forEach(([a, b, cc, d]) => seg(spN, c, [a, b], [cc, d])); }
          else if (tag === "circle") { if ((stroke && stroke !== "none") || fill === "#000") { const p = T[spN]([at("cx"), at("cy")]); add(spN, "CIRCLE", c, { p, r: at("r") * K[spN] }); } }
          else if (tag === "path") { const P = chemin(n.getAttribute("d") || "");
            if (fill === "#000") P.forEach((p) => { const q = p.pts.slice(0, 4); while (q.length < 4) q.push(q[q.length - 1]); add(spN, "SOLID", c, { q: [q[0], q[1], q[3], q[2]].map(T[spN]) }); });
            else if (stroke && stroke !== "none") P.forEach((p) => { p.pts.forEach((q, i) => { if (i) seg(spN, c, p.pts[i - 1], q); }); if (p.ferme) seg(spN, c, p.pts[p.pts.length - 1], p.pts[0]); }); }
          else if (tag === "text") { const t = n.textContent; if (!t.trim()) continue; const an = n.getAttribute("text-anchor"), ha = an === "middle" ? 1 : an === "end" ? 2 : 0;
            const m = /rotate\(\s*(-?[\d.]+)/.exec(n.getAttribute("transform") || ""), lay = n.getAttribute("fill-opacity") && +n.getAttribute("fill-opacity") < 0.5 ? "FILIGRANE" : c;
            add(spN, "TEXT", lay === "CONTOUR" || lay === "FIN" ? "TEXTE" : lay, { p: T[spN]([at("x"), at("y")]), h: at("font-size") * 0.72 * K[spN], t, rot: m ? -+m[1] : 0, ha, va: 0 }); }
        }
      };
      marche(root, null, "M");
      // découpe par les bandes des vues interrompues (géométrie seulement, pas les cotes ni les repères)
      const coupe = (a, b, M) => { let t0 = 0, t1 = 1; const dx = b[0] - a[0], dy = b[1] - a[1], p = [-dx, dx, -dy, dy], q = [a[0] - M[0], M[2] - a[0], a[1] - M[1], M[3] - a[1]];
        for (let i = 0; i < 4; i++) { if (Math.abs(p[i]) < 1e-12) { if (q[i] <= 0) return [[a, b]]; continue; } const r = q[i] / p[i]; if (p[i] < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r); }
        if (t0 >= t1 - 1e-9) return [[a, b]]; const P = (t) => [a[0] + dx * t, a[1] + dy * t], out = []; if (t0 > 1e-9) out.push([a, P(t0)]); if (t1 < 1 - 1e-9) out.push([P(t1), b]); return out; };
      // fusion des segments colinéaires jointifs (arêtes découpées par le tri des faces), suppression des fragments < 0,3 mm
      const groupes = new Map();
      segs.forEach((sg) => { let a = sg.a, b = sg.b; if (b[0] < a[0] - 1e-9 || (Math.abs(b[0] - a[0]) < 1e-9 && b[1] < a[1])) [a, b] = [b, a];
        const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < 1e-6) return; const ux = dx / L, uy = dy / L, ang = Math.round(Math.atan2(uy, ux) * 2000), off = Math.round((a[1] * ux - a[0] * uy) * 200);
        const kk = sg.sp + "|" + sg.L + "|" + ang + "|" + off; (groupes.get(kk) || groupes.set(kk, { sp: sg.sp, L: sg.L, ls: [] }).get(kk)).ls.push([a[0] * ux + a[1] * uy, b[0] * ux + b[1] * uy, a, b]); });
      groupes.forEach((G) => { G.ls.sort((p, q) => p[0] - q[0]); let cur = null; const fus = [];
        G.ls.forEach((l) => { if (cur && l[0] <= cur[1] + 0.05) { if (l[1] > cur[1]) { cur[1] = l[1]; cur[3] = l[3]; } } else { if (cur) fus.push([cur[2], cur[3]]); cur = l.slice(); } });
        if (cur) fus.push([cur[2], cur[3]]);
        fus.forEach(([a0, b0]) => { let L = [[a0, b0]]; if (G.sp === "M" && !["COTES", "REPERES", "TEXTE"].includes(G.L)) masques.forEach((M) => { L = L.flatMap(([a, b]) => coupe(a, b, M)); });
          L.forEach(([a, b]) => { const lg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (lg > (G.L === "CONTOUR" ? 0.3 : 1e-4)) add(G.sp, "LINE", G.L, { a: T[G.sp](a), b: T[G.sp](b) }); }); }); });
      oxm += (PW + 40) * k;
    });
    /* ---- 2. écriture DXF 2000 : poignées, tables, blocs, entités, objets ---- */
    let hs = 0x20; const H = () => (hs++).toString(16).toUpperCase();
    const hT = { VPORT: H(), LTYPE: H(), LAYER: H(), STYLE: H(), VIEW: H(), UCS: H(), APPID: H(), DIMSTYLE: H(), BLOCK_RECORD: H() };
    const hDict = H(), hGroup = H(), hLay = H(), hMls = H(), hMlsStd = H(), hPlot = H(), hPsn = H(), hPh = H();
    const brM = H(), layM = H(), blkM = [H(), H()];
    FOL.forEach((fo, i) => { fo.br = H(); fo.lay = H(); fo.blk = [H(), H()]; fo.nomBloc = i === 0 ? "*Paper_Space" : "*Paper_Space" + (i - 1); });
    const gf = (FOL.find((fo) => fo.ins.length) || {}).gf, GBX = gf ? gabFor(gf) : null, GB = !!GBX;
    const NOMS = { F: "FIP - FORMAT " + (gf || "A3"), C: "CARTOUCHE", R: "Révision", LOGO: "LOGOS FIP" }, BLK = {}, KS = GBX ? ["F", "C", "R"].filter((k2) => GBX[k2]) : [];   // noms du gabarit AutoCAD FIP (DXF 2000 : noms longs admis)
    if (GB) ["LOGO", ...KS].forEach((k2) => { BLK[k2] = { br: H(), blk: [H(), H()] }; });
    const out = [], w = (s) => out.push(s);
    const ent0 = (t, h, own, L, papier, x = "") => `0\n${t}\n5\n${h}\n330\n${own}\n100\nAcDbEntity\n${papier ? "67\n1\n" : ""}8\n${L}${x}`;
    const P3 = (c, p) => `\n${c}\n${nb(p[0])}\n${c + 10}\n${nb(p[1])}\n${c + 20}\n0`;
    const texte = (d, o = "TEXT", att = "", def = "") => `\n100\nAcDbText${P3(10, d.p)}\n40\n${nb(d.h)}\n1\n${encTexte(d.t)}\n50\n${nb(d.rot || 0)}\n7\nISO\n72\n${d.ha || 0}${d.ha || d.va ? P3(11, d.p) : ""}` +
      (o === "TEXT" ? `\n100\nAcDbText\n73\n${d.va || 0}` : o === "ATTDEF" ? `\n100\nAcDbAttributeDefinition\n3\n${att}\n2\n${att}\n70\n0\n74\n${d.va || 0}` : `\n100\nAcDbAttribute\n2\n${att}\n70\n0\n74\n${d.va || 0}`);
    const entite = (e, own, papier) => {
      const h = H(), d = e.d, col = e.col ? `\n62\n${e.col}` : "";
      if (e.t === "LINE") return ent0("LINE", h, own, e.L, papier, col) + `\n100\nAcDbLine${P3(10, d.a)}${P3(11, d.b)}`;
      if (e.t === "CIRCLE") return ent0("CIRCLE", h, own, e.L, papier, col) + `\n100\nAcDbCircle${P3(10, d.p)}\n40\n${nb(d.r)}`;
      if (e.t === "SOLID") return ent0("SOLID", h, own, e.L, papier, col) + `\n100\nAcDbTrace${P3(10, d.q[0])}${P3(11, d.q[1])}${P3(12, d.q[2])}${P3(13, d.q[3])}`;
      if (e.t === "TEXT") return ent0("TEXT", h, own, e.L, papier) + texte(d);
      if (e.t === "ATTDEF") return ent0("ATTDEF", h, own, e.L, papier) + texte(d, "ATTDEF", d.tag);
      if (e.t === "INSERT") { let s = ent0("INSERT", h, own, e.L, papier) + `\n100\nAcDbBlockReference${d.att && d.att.length ? "\n66\n1" : ""}\n2\n${d.nom}${P3(10, d.p)}`;
        if (d.att && d.att.length) { d.att.forEach((a) => { s += "\n" + ent0("ATTRIB", H(), own, e.L, papier) + texte(a, "ATTRIB", a.tag); }); s += "\n" + ent0("SEQEND", H(), h, e.L, papier); }
        return s; }
      if (e.t === "VIEWPORT") return ent0("VIEWPORT", h, own, "FENETRES", papier) + `\n100\nAcDbViewport${P3(10, d.c)}\n40\n${nb(d.w)}\n41\n${nb(d.h)}\n68\n${d.st}\n69\n${d.id}\n12\n${nb(d.vc[0])}\n22\n${nb(d.vc[1])}\n13\n0\n23\n0\n14\n10\n24\n10\n15\n10\n25\n10\n16\n0\n26\n0\n36\n1\n17\n0\n27\n0\n37\n0\n42\n50\n43\n0\n44\n0\n45\n${nb(d.vh)}\n50\n0\n51\n0\n72\n100\n90\n${d.fl}\n1\n\n281\n0\n71\n0\n74\n0\n110\n0\n120\n0\n130\n0\n111\n1\n121\n0\n131\n0\n112\n0\n122\n1\n132\n0\n79\n0\n146\n0`;
      return "";
    };
    // entités de l'espace papier de chaque folio : fenêtre générale (id 1), fenêtre des vues (id 2), gabarit, cartouche et tableaux
    const papier = FOL.map((fo, i) => {
      const L = [], [x0, y0, x1, y1] = fo.Z, cx = (x0 + x1) / 2, cy = fo.PH - (y0 + y1) / 2, hz = y1 - y0;
      L.push({ t: "VIEWPORT", d: { c: [fo.PW / 2, fo.PH / 2], w: fo.PW * 1.1, h: fo.PH * 1.1, st: 1, id: 1, vc: [fo.PW / 2, fo.PH / 2], vh: fo.PH * 1.1, fl: 557088 } });
      L.push({ t: "VIEWPORT", d: { c: [cx, cy], w: x1 - x0, h: hz, st: 2, id: 2, vc: [fo.oxm + cx * fo.k, cy * fo.k], vh: hz * fo.k, fl: 49248 } });   // 49248 = 32768 + 16384 (zoom verrouillé) + 96 (icône SCU)
      if (GB) fo.ins.forEach((V) => KS.forEach((k2) => { const B = GBX[k2], X = B.o[0], Y = B.o[1];
        L.push({ t: "INSERT", L: "CARTOUCHE", d: { nom: NOMS[k2], p: [X, Y], att: B.a.map((a) => ({ tag: a[0], p: [X + a[2], Y + a[3]], h: hAj(a[0], a[4], V[a[0]] ?? ""), ha: a[5], va: a[6], t: V[a[0]] ?? "" })) } }); }));
      ENT.filter((e) => e.sp === "P" && e.f === i).forEach((e) => L.push(e));
      return L; });
    const modele = ENT.filter((e) => e.sp === "M");
    // définitions des blocs du gabarit (coordonnées locales, point de base en bas à droite comme le gabarit AutoCAD)
    const defBloc = {};
    if (GB) { const G = GBX;
      defBloc.LOGO = G.C.logo.flatMap((g) => g.tri.map((t) => ({ t: "SOLID", L: "0", col: g.aci, d: { q: [[t[0], t[1]], [t[2], t[3]], [t[4], t[5]], [t[4], t[5]]] } })));
      KS.forEach((k2) => { const B = G[k2], E2 = [];
        B.l.forEach((l) => E2.push({ t: "LINE", L: "0", d: { a: [l[0], l[1]], b: [l[2], l[3]] } }));
        B.c.forEach((c) => E2.push({ t: "CIRCLE", L: "0", d: { p: [c[0], c[1]], r: c[2] } }));
        B.r.forEach((r) => E2.push({ t: "SOLID", L: "0", d: { q: [[r[0], r[1]], [r[0] + r[2], r[1]], [r[0], r[1] + r[3]], [r[0] + r[2], r[1] + r[3]]] } }));
        B.t.forEach((t) => E2.push({ t: "TEXT", L: "0", d: { p: [t[0], t[1]], h: t[2], ha: t[3], va: t[4], t: t[5] } }));
        B.m.forEach((m) => { const n = m[3].length; m[3].forEach((l, i) => E2.push({ t: "TEXT", L: "0", d: { p: [m[0], m[1] - (i - (n - 1) / 2) * m[2] * 2], h: m[2], ha: 1, va: 2, t: l } })); });
        B.a.forEach((a) => E2.push({ t: "ATTDEF", L: "0", d: { tag: a[0], p: [a[2], a[3]], h: a[4], ha: a[5], va: a[6], t: a[1] } }));
        if (B.logo) E2.push({ t: "INSERT", L: "0", d: { nom: NOMS.LOGO, p: [0, 0] } });
        defBloc[k2] = E2; }); }
    // --- TABLES
    const tab = (n, h, recs, x = "") => `0\nTABLE\n2\n${n}\n5\n${h}\n330\n0\n100\nAcDbSymbolTable\n70\n${recs.length}${x}\n${recs.join("\n")}${recs.length ? "\n" : ""}0\nENDTAB`;
    const rec = (t, h, own, sub, x) => `0\n${t}\n5\n${h}\n330\n${own}\n100\nAcDbSymbolTableRecord\n100\n${sub}${x}`;
    const lt = (n, d, p) => rec("LTYPE", H(), hT.LTYPE, "AcDbLinetypeTableRecord", `\n2\n${n}\n70\n0\n3\n${d}\n72\n65\n73\n${p.length}\n40\n${p.reduce((a, b) => a + Math.abs(b), 0)}` + p.map((v) => `\n49\n${v}\n74\n0`).join(""));
    const tables = [
      tab("VPORT", hT.VPORT, [rec("VPORT", H(), hT.VPORT, "AcDbViewportTableRecord", "\n2\n*Active\n70\n0\n10\n0\n20\n0\n11\n1\n21\n1\n12\n210\n22\n148.5\n13\n0\n23\n0\n14\n10\n24\n10\n15\n10\n25\n10\n16\n0\n26\n0\n36\n1\n17\n0\n27\n0\n37\n0\n40\n300\n41\n1.414\n42\n50\n43\n0\n44\n0\n50\n0\n51\n0\n71\n0\n72\n1000\n73\n1\n74\n3\n75\n0\n76\n0\n77\n0\n78\n0\n281\n0\n65\n0\n146\n0")]),
      tab("LTYPE", hT.LTYPE, [lt("ByBlock", "", []), lt("ByLayer", "", []), lt("Continuous", "Solid line", []), lt("CENTER", "Axe ISO ____ . ____", [8, -1.5, 0.5, -1.5]), lt("DASHED", "Cache ISO __ __", [3, -1.5]), lt("PHANTOM", "Pieces voisines ____ . . ____", [10, -1.5, 0.5, -1.5, 0.5, -1.5])]),
      tab("LAYER", hT.LAYER, [["Defpoints", [7, "CONTINUOUS", 1]], ...Object.entries(CALQUES)].map(([n, [c, l, np, rgb]]) => rec("LAYER", H(), hT.LAYER, "AcDbLayerTableRecord", `\n2\n${n}\n70\n0\n62\n${c}${rgb ? "\n420\n" + parseInt(rgb, 16) : ""}\n6\n${l === "CONTINUOUS" ? "Continuous" : l}${np ? "\n290\n0" : ""}\n370\n-3\n390\n${hPh}`))),
      tab("STYLE", hT.STYLE, [rec("STYLE", H(), hT.STYLE, "AcDbTextStyleTableRecord", "\n2\nStandard\n70\n0\n40\n0\n41\n1\n50\n0\n71\n0\n42\n2.5\n3\ntxt\n4\n"), rec("STYLE", H(), hT.STYLE, "AcDbTextStyleTableRecord", "\n2\nISO\n70\n0\n40\n0\n41\n0.85\n50\n0\n71\n0\n42\n2.5\n3\narial.ttf\n4\n")]),
      tab("VIEW", hT.VIEW, []), tab("UCS", hT.UCS, []),
      tab("APPID", hT.APPID, [rec("APPID", H(), hT.APPID, "AcDbRegAppTableRecord", "\n2\nACAD\n70\n0")]),
      tab("DIMSTYLE", hT.DIMSTYLE, [`0\nDIMSTYLE\n105\n${H()}\n330\n${hT.DIMSTYLE}\n100\nAcDbSymbolTableRecord\n100\nAcDbDimStyleTableRecord\n2\nStandard\n70\n0\n40\n1\n41\n2.5\n42\n0.625\n43\n3.75\n44\n1.25\n140\n2.5\n141\n2.5\n147\n0.625`], "\n100\nAcDbDimStyleTable"),
      tab("BLOCK_RECORD", hT.BLOCK_RECORD, [rec("BLOCK_RECORD", brM, hT.BLOCK_RECORD, "AcDbBlockTableRecord", `\n2\n*Model_Space\n340\n${layM}`),
        ...FOL.map((fo) => rec("BLOCK_RECORD", fo.br, hT.BLOCK_RECORD, "AcDbBlockTableRecord", `\n2\n${fo.nomBloc}\n340\n${fo.lay}`)),
        ...Object.keys(BLK).map((k2) => rec("BLOCK_RECORD", BLK[k2].br, hT.BLOCK_RECORD, "AcDbBlockTableRecord", `\n2\n${NOMS[k2]}\n340\n0`))])];
    // --- BLOCKS
    const bloc = (nom, br, hh, corps, fl = 0) => `0\nBLOCK\n5\n${hh[0]}\n330\n${br}\n100\nAcDbEntity\n8\n0\n100\nAcDbBlockBegin\n2\n${nom}\n70\n${fl}\n10\n0\n20\n0\n30\n0\n3\n${nom}\n1\n${corps}\n0\nENDBLK\n5\n${hh[1]}\n330\n${br}\n100\nAcDbEntity\n8\n0\n100\nAcDbBlockEnd`;
    const blocs = [bloc("*Model_Space", brM, blkM, ""), ...FOL.map((fo, i) => bloc(fo.nomBloc, fo.br, fo.blk, i === 0 ? "" : "\n" + papier[i].map((e) => entite(e, fo.br, true)).join("\n")))];
    if (GB) ["LOGO", ...KS].forEach((k2) => blocs.push(bloc(NOMS[k2], BLK[k2].br, BLK[k2].blk, "\n" + defBloc[k2].map((e) => entite(e, BLK[k2].br, false)).join("\n"), defBloc[k2].some((e) => e.t === "ATTDEF") ? 2 : 0)));
    // --- ENTITIES : espace objet + présentation active (1er folio)
    const ents = modele.map((e) => entite(e, brM, false)).concat(FOL.length ? papier[0].map((e) => entite(e, FOL[0].br, true)) : []);
    // --- OBJECTS
    const plot = (nom) => `\n100\nAcDbPlotSettings\n1\n\n2\nNone\n4\n${nom}\n6\n\n40\n0\n41\n0\n42\n0\n43\n0\n44\n0\n45\n0\n46\n0\n47\n0\n48\n0\n49\n0\n140\n0\n141\n0\n142\n1\n143\n1\n70\n688\n72\n1\n73\n0\n74\n5\n7\n\n75\n16\n76\n0\n77\n2\n78\n300\n147\n1\n148\n0\n149\n0`;
    const layout = (h, nom, ordre, br, vp, W, Hh) => `0\nLAYOUT\n5\n${h}\n330\n${hLay}${plot(W > 500 ? "ISO_full_bleed_A2_(594.00_x_420.00_MM)" : W > 300 ? "ISO_full_bleed_A3_(420.00_x_297.00_MM)" : "ISO_full_bleed_A4_(297.00_x_210.00_MM)")}\n100\nAcDbLayout\n1\n${nom}\n70\n1\n71\n${ordre}\n10\n0\n20\n0\n11\n${W}\n21\n${Hh}\n12\n0\n22\n0\n32\n0\n14\n0\n24\n0\n34\n0\n15\n${W}\n25\n${Hh}\n35\n0\n146\n0\n13\n0\n23\n0\n33\n0\n16\n1\n26\n0\n36\n0\n17\n0\n27\n1\n37\n0\n76\n1\n330\n${br}` + (vp ? `\n331\n${vp}` : "");
    const dict = (h, own, E2, x = "") => `0\nDICTIONARY\n5\n${h}\n330\n${own}\n100\nAcDbDictionary\n281\n1${E2.map(([n, r]) => `\n3\n${n}\n350\n${r}`).join("")}${x}`;
    const objets = [dict(hDict, 0, [["ACAD_GROUP", hGroup], ["ACAD_LAYOUT", hLay], ["ACAD_MLINESTYLE", hMls], ["ACAD_PLOTSETTINGS", hPlot], ["ACAD_PLOTSTYLENAME", hPsn]]),
      dict(hGroup, hDict, []), dict(hLay, hDict, [["Model", layM], ...FOL.map((fo) => [fo.nom, fo.lay])]), dict(hMls, hDict, [["Standard", hMlsStd]]), dict(hPlot, hDict, []),
      `0\nACDBDICTIONARYWDFLT\n5\n${hPsn}\n330\n${hDict}\n100\nAcDbDictionary\n281\n1\n3\nNormal\n350\n${hPh}\n100\nAcDbDictionaryWithDefault\n340\n${hPh}`,
      `0\nACDBPLACEHOLDER\n5\n${hPh}\n330\n${hPsn}`,
      `0\nMLINESTYLE\n5\n${hMlsStd}\n330\n${hMls}\n100\nAcDbMlineStyle\n2\nStandard\n70\n0\n3\n\n62\n256\n51\n90\n52\n90\n71\n2\n49\n0.5\n62\n256\n6\nBYLAYER\n49\n-0.5\n62\n256\n6\nBYLAYER`,
      layout(layM, "Model", 0, brM, null, 420, 297), ...FOL.map((fo, i) => layout(fo.lay, fo.nom, i + 1, fo.br, null, fo.PW, fo.PH))];
    const corps = `0\nSECTION\n2\nCLASSES\n0\nCLASS\n1\nACDBDICTIONARYWDFLT\n2\nAcDbDictionaryWithDefault\n3\nObjectDBX Classes\n90\n0\n280\n0\n281\n0\n0\nCLASS\n1\nACDBPLACEHOLDER\n2\nAcDbPlaceHolder\n3\nObjectDBX Classes\n90\n0\n280\n0\n281\n0\n0\nCLASS\n1\nLAYOUT\n2\nAcDbLayout\n3\nObjectDBX Classes\n90\n0\n280\n0\n281\n0\n0\nENDSEC\n` +
      `0\nSECTION\n2\nTABLES\n${tables.join("\n")}\n0\nENDSEC\n0\nSECTION\n2\nBLOCKS\n${blocs.join("\n")}\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${ents.join("\n")}${ents.length ? "\n" : ""}0\nENDSEC\n0\nSECTION\n2\nOBJECTS\n${objets.join("\n")}\n0\nENDSEC\n0\nEOF\n`;
    const W0 = FOL.length ? FOL[0].PW : 420, H0 = FOL.length ? FOL[0].PH : 297;
    const entete = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n9\n$ACADMAINTVER\n70\n6\n9\n$DWGCODEPAGE\n3\nANSI_1252\n9\n$INSBASE\n10\n0\n20\n0\n30\n0\n9\n$EXTMIN\n10\n0\n20\n0\n30\n0\n9\n$EXTMAX\n10\n${nb(oxm)}\n20\n${nb(H0 * Math.max(1, ...FOL.map((f2) => f2.k)))}\n30\n0\n9\n$LIMMIN\n10\n0\n20\n0\n9\n$LIMMAX\n10\n${W0}\n20\n${H0}\n9\n$LTSCALE\n40\n1\n9\n$PSLTSCALE\n70\n1\n9\n$TEXTSTYLE\n7\nISO\n9\n$CLAYER\n8\n0\n9\n$DIMSTYLE\n2\nStandard\n9\n$EXTNAMES\n290\n1\n9\n$HANDSEED\n5\n${(hs + 1).toString(16).toUpperCase()}\n9\n$TILEMODE\n70\n0\n9\n$INSUNITS\n70\n4\n9\n$MEASUREMENT\n70\n1\n9\n$PLIMMIN\n10\n0\n20\n0\n9\n$PLIMMAX\n10\n${W0}\n20\n${H0}\n9\n$PEXTMIN\n10\n0\n20\n0\n30\n0\n9\n$PEXTMAX\n10\n${W0}\n20\n${H0}\n30\n0\n0\nENDSEC\n`;
    return enOctets(entete + corps);
  }
  /* nom de fichier des plans : n° de document du cartouche (Projet-Doc-Lot-Chrono) suivi de la révision */
  const nomFichierPlans = (K = {}) => String([K.projet || "00-000", K.doc || "PLN", K.lot, K.chrono || "01"].filter(Boolean).join("-") + "_Rev" + (K.rev ?? "0")).replace(/[^\w.-]+/g, "_") + ".dxf";
  return { prisme, boite, cylindre, cercle, planche, sommaire, dxf, nomFichierPlans, VUES, FORMATS };
})();
