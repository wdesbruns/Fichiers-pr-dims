/* =====================================================================
   NOTATIONS DES PROFILÉS : glossaire des grandeurs + schémas cotés par famille
   FIP Études — notations NF EN 1993-1-1 §1.7 et fig. 1.1 (axes y-y fort, z-z faible ; u-u, v-v principaux des cornières)
   ===================================================================== */
const SECTIONS = (() => {
  /* clé : [symbole HTML, signification, unité] */
  const GLOSS = {
    h: ["h", "Hauteur totale de la section (tube rond : diamètre extérieur D)", "mm"],
    b: ["b", "Largeur de la section (largeur des ailes ; cornière : longueur de l'aile horizontale)", "mm"],
    tw: ["t<sub>w</sub>", "Épaisseur de l'âme (w = web)", "mm"],
    tf: ["t<sub>f</sub>", "Épaisseur de l'aile (f = flange) ; IPN / UPN à ailes inclinées : épaisseur moyenne, mesurée à b/4 du bord (IPN) ou à b/2 (UPN)", "mm"],
    t: ["t", "Épaisseur de paroi (cornière, tube)", "mm"],
    r: ["r", "Rayon de congé intérieur âme / aile (laminés) ; tubes : rayon d'angle retenu pour le calcul", "mm"],
    pente: ["pente", "Pente de la face intérieure des ailes (IPN 14 %, UPN 8 %) : prévoir des rondelles biaises pour le boulonnage", "%"],
    m: ["m", "Masse linéique (poids propre = m·g/1000 kN/m)", "kg/m"],
    A: ["A", "Aire de la section", "cm²"],
    Avz: ["A<sub>v,z</sub>", "Aire de cisaillement pour un effort tranchant V<sub>z</sub> (selon z, dans le plan de l'âme) — NF EN 1993-1-1 §6.2.6(3)", "cm²"],
    Avy: ["A<sub>v,y</sub>", "Aire de cisaillement pour un effort tranchant V<sub>y</sub> (selon y, dans le plan des ailes) — §6.2.6(3)", "cm²"],
    Iy: ["I<sub>y</sub>", "Moment quadratique (moment d'inertie) par rapport à l'axe fort y-y : rigidité en flexion autour de y (flèche sous charge selon z)", "cm⁴"],
    Iz: ["I<sub>z</sub>", "Moment quadratique par rapport à l'axe faible z-z : rigidité en flexion autour de z", "cm⁴"],
    Wely: ["W<sub>el,y</sub>", "Module de flexion élastique selon y : W<sub>el,y</sub> = I<sub>y</sub>/v (v = distance de la fibre extrême à l'axe). M<sub>el,Rd</sub> = W<sub>el,y</sub>·f<sub>y</sub>/γ<sub>M0</sub> (classe 3)", "cm³"],
    Welz: ["W<sub>el,z</sub>", "Module de flexion élastique selon z : W<sub>el,z</sub> = I<sub>z</sub>/v", "cm³"],
    Wply: ["W<sub>pl,y</sub>", "Module de flexion plastique selon y : M<sub>pl,Rd</sub> = W<sub>pl,y</sub>·f<sub>y</sub>/γ<sub>M0</sub> (sections de classe 1 ou 2, §6.2.5)", "cm³"],
    Wplz: ["W<sub>pl,z</sub>", "Module de flexion plastique selon z (classes 1 et 2)", "cm³"],
    iy: ["i<sub>y</sub>", "Rayon de giration selon y : i<sub>y</sub> = √(I<sub>y</sub>/A). Élancement λ = L<sub>cr</sub>/i<sub>y</sub> pour le flambement autour de y (§6.3.1.3)", "cm"],
    iz: ["i<sub>z</sub>", "Rayon de giration selon z : i<sub>z</sub> = √(I<sub>z</sub>/A) ; en général le flambement autour de z est déterminant", "cm"],
    It: ["I<sub>t</sub>", "Constante de torsion de Saint-Venant (torsion uniforme) : rigidité G·I<sub>t</sub>. Faible pour les profilés ouverts, élevée pour les tubes", "cm⁴"],
    Iw: ["I<sub>w</sub>", "Constante de gauchissement (torsion non uniforme) : intervient dans le moment critique de déversement M<sub>cr</sub> ; nulle pour cornières et tubes", "cm⁶"],
    Iu: ["I<sub>u</sub>", "Moment quadratique par rapport à l'axe principal majeur u-u de la cornière (inertie maximale)", "cm⁴"],
    Iv: ["I<sub>v</sub>", "Moment quadratique par rapport à l'axe principal mineur v-v (inertie minimale)", "cm⁴"],
    iu: ["i<sub>u</sub>", "Rayon de giration selon u : √(I<sub>u</sub>/A)", "cm"],
    iv: ["i<sub>v</sub>", "Rayon de giration selon v : √(I<sub>v</sub>/A). Gouverne le flambement d'une cornière isolée (le plus petit)", "cm"],
    Wu: ["W<sub>u</sub>", "Module de flexion élastique selon l'axe principal u", "cm³"],
    Wv: ["W<sub>v</sub>", "Module de flexion élastique selon l'axe principal v", "cm³"],
    ey: ["e<sub>y</sub>", "Position du centre de gravité G mesurée depuis le dos de l'aile verticale (selon y)", "cm"],
    ez: ["e<sub>z</sub>", "Position du centre de gravité G mesurée depuis le dos de l'aile horizontale (selon z)", "cm"],
    alpha: ["α", "Angle entre l'axe y-y et l'axe principal u-u (tan α donné dans les catalogues)", "°"],
    ay: ["α<sub>y</sub>", "Facteur d'imperfection de la courbe de flambement autour de y (a = 0,21 ; b = 0,34 ; c = 0,49 ; d = 0,76 — Tab. 6.1 et 6.2)", "—"],
    az: ["α<sub>z</sub>", "Facteur d'imperfection de la courbe de flambement autour de z (Tab. 6.1 et 6.2)", "—"],
    aLT: ["α<sub>LT</sub>", "Facteur d'imperfection de la courbe de déversement (Tab. 6.3 et 6.4)", "—"],
  };
  const COUL = { trait: "#171a1e", rempl: "#cfd8e3", cote: "#114088", y: "#e30009", z: "#0098db", u: "#7b3fa0", v: "#2a9d3a" };
  const fleche = (id, c) => `<marker id="${id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto-start-reverse"><path d="M0,0 L7,3.5 L0,7z" fill="${c}"/></marker>`;
  const DEFS = `<defs>${fleche("sxa", COUL.cote)}</defs>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 12}" fill="${o.c || COUL.cote}" font-weight="${o.fw || 700}" text-anchor="${o.a || "middle"}" font-style="${o.it ? "italic" : "normal"}" paint-order="stroke" stroke="#fff" stroke-width="3">${s}</text>`;
  /* cote entre (x1,y1) et (x2,y2), décalée de d (perpendiculaire), libellé lib ; ext : flèches extérieures (petites cotes) */
  function cote(x1, y1, x2, y2, d, lib, ext = false, pos = 0.3) {
    const L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / L * d, ny = (x2 - x1) / L * d, a = [x1 + nx, y1 + ny], b = [x2 + nx, y2 + ny];
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    let s = `<line x1="${x1 + nx * 0.15}" y1="${y1 + ny * 0.15}" x2="${a[0] + nx * 0.12}" y2="${a[1] + ny * 0.12}" stroke="#8a929c" stroke-width=".8"/><line x1="${x2 + nx * 0.15}" y1="${y2 + ny * 0.15}" x2="${b[0] + nx * 0.12}" y2="${b[1] + ny * 0.12}" stroke="#8a929c" stroke-width=".8"/>`;
    s += ext ? `<line x1="${a[0] - ux * 18}" y1="${a[1] - uy * 18}" x2="${a[0]}" y2="${a[1]}" stroke="${COUL.cote}" marker-end="url(#sxa)"/><line x1="${b[0] + ux * 18}" y1="${b[1] + uy * 18}" x2="${b[0]}" y2="${b[1]}" stroke="${COUL.cote}" marker-end="url(#sxa)"/><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${COUL.cote}"/>`
      : `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${COUL.cote}" marker-start="url(#sxa)" marker-end="url(#sxa)"/>`;
    if (!lib) return s;
    const vert = Math.abs(uy) > 0.9;
    return s + txt(vert ? mx + (nx < 0 ? -6 : 6) : mx, vert ? a[1] + (b[1] - a[1]) * pos + 4 : my + (ny < 0 ? -5 : 14), lib, { a: vert ? (nx < 0 ? "end" : "start") : "middle", it: true });
  }
  const axe = (x1, y1, x2, y2, c, l1, l2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.1" stroke-dasharray="10 3 2 3"/>` +
    txt(x2 + (x2 - x1) / Math.hypot(x2 - x1, y2 - y1) * 9, y2 + (y2 - y1) / Math.hypot(x2 - x1, y2 - y1) * 9 + 4, l2 || l1, { c, fs: 13 }) + txt(x1 - (x2 - x1) / Math.hypot(x2 - x1, y2 - y1) * 9, y1 - (y2 - y1) / Math.hypot(x2 - x1, y2 - y1) * 9 + 4, l1, { c, fs: 13 });
  const G = (x, y) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff" stroke="${COUL.trait}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="1" fill="${COUL.trait}"/>` + txt(x + 9, y - 6, "G", { c: COUL.trait, fs: 11, a: "start" });
  const svg = (W, H, corps, titre) => `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px" role="img" aria-label="${titre}">${DEFS}${corps}${txt(W / 2, H - 6, titre, { c: "#5f6670", fs: 11, fw: 600 })}</svg>`;
  let PC = null;                                                             // profilé courant : cotes chiffrées
  const fmt = (v, d) => (typeof fmtN === "function" ? fmtN(v, d) : String(v));
  const lab = (sym, k, u = "") => PC && PC[k] != null ? `${sym} = ${fmt(PC[k], u ? 2 : Number.isInteger(PC[k]) ? 0 : 1)}${u ? " " + u : ""}` : sym;
  const path = (d) => `<path d="${d}" fill="${COUL.rempl}" stroke="${COUL.trait}" stroke-width="1.4" stroke-linejoin="round"/>`;

  /* ---- I / H (IPE, HE, IPN à ailes inclinées) ---- */
  function schemaI(ipn) {
    const W = 340, H = 330, cx = 170, cy = 155, h = 220, b = 140, tw = 12, tf = 20, r = 12, y0 = cy - h / 2, y1 = cy + h / 2, xl = cx - b / 2, xr = cx + b / 2, wl = cx - tw / 2, wr = cx + tw / 2;
    const tb = ipn ? tf * 0.55 : tf, tr = ipn ? tf * 1.35 : tf;              // IPN : aile plus mince au bord, plus épaisse à la racine
    const d = `M${xl},${y0} H${xr} V${y0 + tb} L${wr + r},${y0 + tr} A${r},${r} 0 0 0 ${wr},${y0 + tr + r} V${y1 - tr - r} A${r},${r} 0 0 0 ${wr + r},${y1 - tr} L${xr},${y1 - tb} V${y1} H${xl} V${y1 - tb} L${wl - r},${y1 - tr} A${r},${r} 0 0 0 ${wl},${y1 - tr - r} V${y0 + tr + r} A${r},${r} 0 0 0 ${wl - r},${y0 + tr} L${xl},${y0 + tb} Z`;
    let s = path(d) + axe(xl - 34, cy, xr + 34, cy, COUL.y, "y") + axe(cx, y0 - 30, cx, y1 + 22, COUL.z, "z") + G(cx, cy);
    s += cote(xl, y0, xr, y0, -14, lab("b", "b")) + cote(xl, y1, xl, y0, -22, lab("h", "h")) + cote(xr, y0, xr, y0 + tf, -22, lab("t<tspan font-size='9' dy='3'>f</tspan>", "tf"), true);
    s += cote(wl, cy + 52, wr, cy + 52, 0.01, "", true) + txt(wr + 24, cy + 46, lab("t<tspan font-size='9' dy='3'>w</tspan>", "tw"), { it: true, a: "start" });
    s += `<line x1="${wr + r * 0.3}" y1="${y0 + tr + r * 0.3}" x2="${wr + 40}" y2="${y0 + tr + 30}" stroke="${COUL.cote}" stroke-width=".9"/>` + txt(wr + 43, y0 + tr + 36, lab("r", "r"), { it: true, a: "start" });
    if (ipn) s += txt(xr + 6, y0 + tf + 30, "pente " + (PC && PC.pente ? PC.pente : 14) + " %", { fs: 10.5, a: "start", c: "#5f6670", fw: 500 });
    return svg(W, H, s, ipn ? "IPN – ailes à face intérieure inclinée" : "IPE, HEA, HEB, HEM – ailes parallèles");
  }
  /* ---- U (UPN inclinées, UPE parallèles) ---- */
  function schemaU(upn) {
    const W = 340, H = 330, cy = 155, h = 220, b = 100, tw = 14, tf = 20, r = 12, xl = 110, xr = xl + b, y0 = cy - h / 2, y1 = cy + h / 2, wr = xl + tw;
    const tb = upn ? tf * 0.7 : tf, tr = upn ? tf * 1.3 : tf;
    const d = `M${xl},${y0} H${xr} V${y0 + tb} L${wr + r},${y0 + tr} A${r},${r} 0 0 0 ${wr},${y0 + tr + r} V${y1 - tr - r} A${r},${r} 0 0 0 ${wr + r},${y1 - tr} L${xr},${y1 - tb} V${y1} H${xl} Z`;
    const gx = xl + b * 0.28;
    let s = path(d) + axe(xl - 34, cy, xr + 34, cy, COUL.y, "y") + axe(gx, y0 - 30, gx, y1 + 22, COUL.z, "z") + G(gx, cy);
    s += cote(xl, y0, xr, y0, -14, lab("b", "b")) + cote(xl, y1, xl, y0, -22, lab("h", "h")) + cote(xr, y0, xr, y0 + tf, -22, lab("t<tspan font-size='9' dy='3'>f</tspan>", "tf"), true);
    s += cote(xl, cy + 60, wr, cy + 60, 0.01, "", true) + txt(wr + 24, cy + 54, lab("t<tspan font-size='9' dy='3'>w</tspan>", "tw"), { it: true, a: "start" });
    s += `<line x1="${wr + r * 0.3}" y1="${y0 + tr + r * 0.3}" x2="${wr + 40}" y2="${y0 + tr + 30}" stroke="${COUL.cote}" stroke-width=".9"/>` + txt(wr + 43, y0 + tr + 36, lab("r", "r"), { it: true, a: "start" });
    if (upn) s += txt(xr + 6, y0 + tf + 30, "pente " + (PC && PC.pente ? PC.pente : 8) + " %", { fs: 10.5, a: "start", c: "#5f6670", fw: 500 });
    return svg(W, H, s, (upn ? "UPN – ailes inclinées" : "UPE – ailes parallèles") + " ; G décalé vers l'âme");
  }
  /* ---- Cornières (L égales, LI inégales) ---- */
  function schemaL(inegale) {
    const W = 340, H = 330, x0 = 80, yb = 248, h = 200, b = inegale ? 130 : 200 * 0.86, t = 18, r = 14;
    const ht = inegale ? 200 : b;                                            // aile verticale h, horizontale b
    const d = `M${x0},${yb} V${yb - ht} H${x0 + t} V${yb - t - r} A${r},${r} 0 0 0 ${x0 + t + r},${yb - t} H${x0 + b} V${yb} Z`;
    // centre de gravité approché (rectangles)
    const A1 = ht * t, A2 = (b - t) * t, gx = x0 + (A1 * t / 2 + A2 * (t + (b - t) / 2)) / (A1 + A2), gy = yb - (A1 * ht / 2 + A2 * t / 2) / (A1 + A2);
    const al = inegale ? 23.6 : 45, ca = Math.cos(al * Math.PI / 180), sa = Math.sin(al * Math.PI / 180), Lu = 150, Lv = 95;
    let s = path(d) + axe(x0 - 30, gy, x0 + b + 30, gy, COUL.y, "y") + axe(gx, yb + 26, gx, yb - ht - 24, COUL.z, "z");
    s += axe(gx - Lu * ca * 0.5, gy + Lu * sa * 0.5, gx + Lu * ca, gy - Lu * sa, COUL.u, "u") + axe(gx - Lv * sa * 0.9, gy - Lv * ca * 0.9, gx + Lv * sa, gy + Lv * ca, COUL.v, "v") + G(gx, gy);
    s += `<path d="M${gx + 46},${gy} A46,46 0 0 0 ${gx + 46 * ca},${gy - 46 * sa}" fill="none" stroke="${COUL.u}" stroke-width=".9"/>` + txt(gx + 52 * Math.cos(al * Math.PI / 360), gy - 52 * Math.sin(al * Math.PI / 360) + 4, (PC && PC.alpha != null ? "α = " + fmt(PC.alpha, 1) + "°" : "α"), { c: COUL.u, a: "start", fs: 12 });
    s += cote(x0, yb, x0, yb - ht, -26, lab("h", "h"), false, 0.75);
    s += cote(x0, yb, x0 + b, yb, 42, lab("b", "b")) + cote(x0, yb - ht, x0 + t, yb - ht, -12, lab("t", "t"), true);
    s += cote(x0, yb, gx, yb, 16, "", gx - x0 < 40) + txt(gx + 8, yb + 26, lab("e<tspan font-size='9' dy='3'>y</tspan>", "ey", "cm"), { it: true, fs: 12, a: "start" });
    s += `<line x1="${x0 + b + 4}" y1="${yb}" x2="${x0 + b + 22}" y2="${yb}" stroke="#8a929c" stroke-width=".8"/><line x1="${x0 + b + 16}" y1="${yb}" x2="${x0 + b + 16}" y2="${gy}" stroke="${COUL.cote}" marker-start="url(#sxa)" marker-end="url(#sxa)"/>` + txt(x0 + b + 22, (gy + yb) / 2 + 4, lab("e<tspan font-size='9' dy='3'>z</tspan>", "ez", "cm"), { it: true, fs: 12, a: "start" });
    s += `<line x1="${x0 + t + r * 0.3}" y1="${yb - t - r * 0.3}" x2="${x0 + t + 4}" y2="${yb - t + 34}" stroke="${COUL.cote}" stroke-width=".9"/>` + txt(x0 + t + 2, yb - t + 46, lab("r", "r"), { it: true, a: "end" });
    return svg(W, H, s, inegale ? "Cornière à ailes inégales (aile longue h verticale)" : "Cornière à ailes égales (h = b)");
  }
  /* ---- Tubes rectangulaires / carrés ---- */
  function schemaRHS(carre) {
    const W = 340, H = 330, cx = 170, cy = 150, h = 200, b = carre ? 200 : 130, t = 16, ro = 26, ri = ro - t;
    const rr = (w, hh, r) => `<rect x="${cx - w / 2}" y="${cy - hh / 2}" width="${w}" height="${hh}" rx="${r}" ry="${r}"`;
    let s = `<path d="M${cx - b / 2 + ro},${cy - h / 2} H${cx + b / 2 - ro} A${ro},${ro} 0 0 1 ${cx + b / 2},${cy - h / 2 + ro} V${cy + h / 2 - ro} A${ro},${ro} 0 0 1 ${cx + b / 2 - ro},${cy + h / 2} H${cx - b / 2 + ro} A${ro},${ro} 0 0 1 ${cx - b / 2},${cy + h / 2 - ro} V${cy - h / 2 + ro} A${ro},${ro} 0 0 1 ${cx - b / 2 + ro},${cy - h / 2} Z
      M${cx - b / 2 + t + ri},${cy - h / 2 + t} A${ri},${ri} 0 0 0 ${cx - b / 2 + t},${cy - h / 2 + t + ri} V${cy + h / 2 - t - ri} A${ri},${ri} 0 0 0 ${cx - b / 2 + t + ri},${cy + h / 2 - t} H${cx + b / 2 - t - ri} A${ri},${ri} 0 0 0 ${cx + b / 2 - t},${cy + h / 2 - t - ri} V${cy - h / 2 + t + ri} A${ri},${ri} 0 0 0 ${cx + b / 2 - t - ri},${cy - h / 2 + t} Z" fill="${COUL.rempl}" fill-rule="evenodd" stroke="${COUL.trait}" stroke-width="1.4"/>`;
    s += axe(cx - b / 2 - 32, cy, cx + b / 2 + 32, cy, COUL.y, "y") + axe(cx, cy - h / 2 - 28, cx, cy + h / 2 + 22, COUL.z, "z") + G(cx, cy);
    s += cote(cx - b / 2, cy - h / 2, cx + b / 2, cy - h / 2, -14, lab("b", "b")) + cote(cx - b / 2, cy + h / 2, cx - b / 2, cy - h / 2, -22, lab("h", "h")) + cote(cx + b / 2 - t, cy + 40, cx + b / 2, cy + 40, 0.01, "", true) + txt(cx + b / 2 + 24, cy + 34, lab("t", "t"), { it: true, a: "start" });
    s += `<line x1="${cx + b / 2 - ro * 0.3}" y1="${cy - h / 2 + ro * 0.3}" x2="${cx + b / 2 + 26}" y2="${cy - h / 2 - 6}" stroke="${COUL.cote}" stroke-width=".9"/>` + txt(cx + b / 2 + 29, cy - h / 2 - 8, lab("r", "r"), { it: true, a: "start" });
    return svg(W, H, s, carre ? "SHS – tube carré (h = b)" : "RHS – tube rectangulaire");
  }
  /* ---- Tube rond ---- */
  function schemaCHS() {
    const W = 340, H = 330, cx = 170, cy = 150, R = 100, t = 16;
    let s = `<path d="M${cx - R},${cy} a${R},${R} 0 1 0 ${2 * R},0 a${R},${R} 0 1 0 ${-2 * R},0 Z M${cx - R + t},${cy} a${R - t},${R - t} 0 1 1 ${2 * (R - t)},0 a${R - t},${R - t} 0 1 1 ${-2 * (R - t)},0 Z" fill="${COUL.rempl}" fill-rule="evenodd" stroke="${COUL.trait}" stroke-width="1.4"/>`;
    s += axe(cx - R - 32, cy, cx + R + 32, cy, COUL.y, "y") + axe(cx, cy - R - 28, cx, cy + R + 22, COUL.z, "z") + G(cx, cy);
    s += cote(cx - R, cy - R, cx + R, cy - R, -14, PC ? "D = " + fmt(PC.h, 1) : "h = D") + cote(cx + R - t, cy + 40, cx + R, cy + 40, 0.01, "", true) + txt(cx + R + 24, cy + 34, lab("t", "t"), { it: true, a: "start" });
    return svg(W, H, s, "CHS – tube rond (axes y et z équivalents)");
  }
  function schema(fam, p = null) { PC = p; try { return schema0(fam); } finally { PC = null; } }
  function schema0(fam) {
    if (fam === "IPN") return schemaI(true);
    if (/^(IPE|HE[ABM])$/.test(fam)) return schemaI(false);
    if (fam === "UPN") return schemaU(true);
    if (fam === "UPE" || /^U/.test(fam)) return schemaU(false);
    if (fam === "L") return schemaL(false);
    if (fam === "LI") return schemaL(true);
    if (fam === "SHS") return schemaRHS(true);
    if (fam === "RHS") return schemaRHS(false);
    if (fam === "CHS") return schemaCHS();
    return "";
  }
  /* point d'interrogation avec la signification (survol / focus clavier ou tactile) */
  const bulle = (k) => { const g = GLOSS[k]; if (!g) return ""; return `<span class="qm" tabindex="0" role="note" aria-label="${g[1].replace(/<[^>]+>/g, "")}" data-tip="${(g[0] + " : " + g[1] + " (" + g[2] + ")").replace(/<[^>]+>/g, "").replace(/"/g, "&quot;")}">?</span>`; };
  const CSS = `.qm{display:inline-block;width:14px;height:14px;border-radius:50%;background:#e1e8f2;color:#114088;font-size:10px;font-weight:700;font-style:normal;text-align:center;line-height:14px;margin-left:4px;cursor:help;position:relative;vertical-align:1px}
  .qm:hover::after,.qm:focus::after{content:attr(data-tip);position:absolute;top:19px;left:50%;transform:translateX(-50%);white-space:normal;width:260px;background:#171a1e;color:#fff;padding:7px 9px;border-radius:6px;font-size:11.5px;font-weight:400;line-height:1.4;z-index:20;text-align:left;box-shadow:0 4px 14px rgba(0,0,0,.25)}
  th:last-child .qm:hover::after,th:last-child .qm:focus::after,th:nth-last-child(2) .qm:hover::after,th:nth-last-child(2) .qm:focus::after{left:auto;right:-6px;transform:none}
  th:nth-child(2) .qm:hover::after,th:nth-child(2) .qm:focus::after{left:-6px;transform:none}
  @media print{.qm{display:none}}`;
  return { GLOSS, schema, bulle, CSS };
})();
