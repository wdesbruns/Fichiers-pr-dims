/* =====================================================================
   RÉFÉRENTIEL — schémas explicatifs (SVG), clé = id de la fiche
   ===================================================================== */
const SCHEMAS = (() => {
  const B = "#114088", R = "#e30009", C = "#0098db", G = "#8a929c", K = "#171a1e", M = "#5f6670";
  const svg = (w, h, s, t) => `<svg viewBox="0 0 ${w} ${h}" style="width:100%;max-width:${Math.min(w * 1.3, 640)}px" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Arial,sans-serif">${s}${t ? `<text x="${w / 2}" y="${h - 4}" font-size="11" text-anchor="middle" fill="${M}">${t}</text>` : ""}</svg>`;
  const fl = (x1, y1, x2, y2, c = R, w = 2) => { const a = Math.atan2(y2 - y1, x2 - x1), l = 7; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"/><path d="M${x2},${y2} L${x2 - l * Math.cos(a - 0.4)},${y2 - l * Math.sin(a - 0.4)} L${x2 - l * Math.cos(a + 0.4)},${y2 - l * Math.sin(a + 0.4)}z" fill="${c}"/>`; };
  const tx = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-size="${o.s || 11}" fill="${o.c || K}" text-anchor="${o.a || "middle"}" font-weight="${o.b ? 700 : 400}">${t}</text>`;
  const sol = (x1, x2, y) => { let s = `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${K}" stroke-width="1.5"/>`; for (let x = x1; x < x2; x += 10) s += `<line x1="${x}" y1="${y}" x2="${x - 6}" y2="${y + 6}" stroke="${G}"/>`; return s; };
  const appui = (x, y) => `<path d="M${x},${y} l-9,14 h18z" fill="#fff" stroke="${K}" stroke-width="1.4"/>`;
  const encastr = (x, y, w = 40) => { let s = `<line x1="${x - w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y}" stroke="${K}" stroke-width="3"/>`; for (let i = -w / 2; i < w / 2; i += 7) s += `<line x1="${x + i}" y1="${y}" x2="${x + i - 6}" y2="${y + 7}" stroke="${G}"/>`; return s; };
  const S = {};

  S.combinaisons = svg(560, 170, (() => {
    const bar = (x, h, c, l) => `<rect x="${x}" y="${120 - h}" width="34" height="${h}" fill="${c}" opacity=".85"/>${tx(x + 17, 136, l, { s: 10 })}`;
    let s = tx(110, 18, "Neige dominante", { b: 1, c: B }) + tx(390, 18, "Vent dominant", { b: 1, c: B });
    s += bar(40, 60, G, "1,35·G") + bar(80, 70, C, "1,5·S") + bar(120, 0.6 * 60, "#7fb7e6", "1,5·0,6·W");
    s += bar(320, 60, G, "1,35·G") + bar(360, 0.5 * 70, C, "1,5·0,5·S") + bar(400, 60, "#7fb7e6", "1,5·W");
    s += `<line x1="20" y1="120" x2="540" y2="120" stroke="${K}"/>`;
    return s;
  })(), "Une action variable dominante à 100 %, les autres réduites par ψ₀ (neige 0,5 ; vent 0,6)");

  S.vent = svg(560, 220, (() => {
    let s = sol(30, 260, 190) + `<line x1="40" y1="190" x2="40" y2="20" stroke="${K}"/>` + tx(40, 14, "z", { b: 1 });
    const pts = []; for (let z = 4; z <= 160; z += 6) { const zz = Math.max(z, 25); pts.push([40 + 52 * Math.log(zz / 3), 190 - z]); }
    s += `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${B}" stroke-width="2.5"/>`;
    [40, 80, 120, 160].forEach((z) => { const zz = Math.max(z, 25), x = 40 + 52 * Math.log(zz / 3); s += fl(44, 190 - z, x - 3, 190 - z, C, 1.6); });
    s += tx(250, 120, "q_p(z) augmente", { c: B, b: 1 }) + tx(250, 135, "avec la hauteur", { c: B }) + tx(80, 172, "z_min : valeur constante", { s: 9.5, c: M, a: "start" });
    s += tx(420, 30, "Rugosité du terrain (catégories)", { b: 1 });
    [["0", "mer, lac", 175, 18], ["II", "rase campagne", 110, 8], ["IIIb", "zone industrielle", 75, 4], ["IV", "ville dense", 50, 2]].forEach(([c, l, v, n], i) => {
      const y = 55 + i * 36; s += `<rect x="330" y="${y}" width="${v}" height="14" fill="${C}" opacity="${0.35 + 0.15 * (3 - i)}"/>` + tx(325, y + 11, c, { a: "end", b: 1 }) + tx(335 + v, y + 11, l, { a: "start", s: 10 });
    });
    return s + tx(420, 205, "terrain lisse = vent plus fort près du sol", { s: 10, c: M });
  })(), "");

  S["coef-vent"] = svg(560, 230, (() => {
    let s = `<rect x="150" y="50" width="200" height="120" fill="#f7f9fc" stroke="${K}"/>` + fl(40, 110, 140, 110, C, 3) + tx(70, 100, "vent", { c: C, b: 1 });
    s += `<rect x="138" y="50" width="10" height="120" fill="${R}" opacity=".6"/>` + tx(118, 185, "D : pression (+)", { c: R, b: 1, s: 10 });
    s += `<rect x="352" y="50" width="10" height="120" fill="${B}" opacity=".45"/>` + tx(400, 185, "E : dépression (−)", { c: B, b: 1, s: 10 });
    [["A", 0, 40, 0.75], ["B", 40, 100, 0.5], ["C", 140, 60, 0.3]].forEach(([z, x, w, o]) => { s += `<rect x="${150 + x}" y="38" width="${w}" height="10" fill="${B}" opacity="${o}"/>` + tx(150 + x + w / 2, 33, z, { b: 1, s: 10 }) + `<rect x="${150 + x}" y="172" width="${w}" height="10" fill="${B}" opacity="${o}"/>`; });
    for (let i = 0; i < 5; i++) s += fl(365, 70 + i * 22, 385, 70 + i * 22, B, 1.4);
    for (let i = 0; i < 5; i++) s += fl(110, 70 + i * 22, 136, 70 + i * 22, R, 1.4);
    s += tx(250, 115, "c_pi : +0,2 / −0,3", { c: M }) + tx(250, 22, "zones A, B, C : aspiration, plus forte près de l'angle", { s: 10, c: M });
    return s + tx(470, 120, "w = q_p·(c_pe − c_pi)", { b: 1, c: K, s: 12 });
  })(), "Vue en plan : la face au vent est poussée, les autres faces sont aspirées");

  S.neige = svg(600, 230, (() => {
    const toit = (x0, w, v1, v2, t) => { const h = 34; let s = `<polygon points="${x0},150 ${x0 + w / 2},${150 - h} ${x0 + w},150" fill="#eef1f5" stroke="${K}" stroke-width="1.4"/><line x1="${x0}" y1="150" x2="${x0}" y2="175" stroke="${K}" stroke-width="1.4"/><line x1="${x0 + w}" y1="150" x2="${x0 + w}" y2="175" stroke="${K}" stroke-width="1.4"/>`;
      const b = (xa, xb, v) => `<rect x="${xa}" y="${150 - h - 10 - 40 * v}" width="${xb - xa}" height="${40 * v}" fill="#a9c9ef" stroke="${B}" stroke-width=".8"/>` + tx((xa + xb) / 2, 150 - h - 14 - 40 * v, v.toFixed(1).replace(".", ","), { s: 10, c: B, b: 1 });
      return s + b(x0, x0 + w / 2, v1) + b(x0 + w / 2, x0 + w, v2) + tx(x0 + w / 2, 196, t, { s: 10 }); };
    let s = toit(20, 160, 0.8, 0.8, "cas (i) : non déplacée") + toit(220, 160, 0.4, 0.8, "cas (ii) : vent de droite") + toit(420, 160, 0.8, 0.4, "cas (iii) : vent de gauche");
    return s + tx(300, 20, "Coefficients de forme μ (pente ≤ 30°) – s = μ·C_e·C_t·s_k", { b: 1, c: B });
  })(), "Toiture à deux versants : la neige peut être soufflée et réduite de moitié sur un versant");

  S.seisme = svg(560, 250, (() => {
    let s = sol(40, 300, 195) + `<rect x="80" y="45" width="160" height="150" fill="#f7f9fc" stroke="${K}"/>`;
    [85, 125, 165].forEach((y) => { s += `<line x1="80" y1="${y}" x2="240" y2="${y}" stroke="${G}"/>`; });
    s += `<rect x="150" y="62" width="40" height="23" fill="${C}" opacity=".8"/>` + tx(170, 78, "équip.", { s: 9, c: "#fff", b: 1 }) + fl(150, 73, 108, 73, R, 2.5) + tx(108, 64, "F_a", { c: R, b: 1 });
    s += `<line x1="255" y1="195" x2="255" y2="45" stroke="${K}" marker-end=""/>` + tx(262, 120, "H", { a: "start", b: 1 }) + `<line x1="200" y1="195" x2="200" y2="73" stroke="${M}" stroke-dasharray="3 3"/>` + tx(207, 150, "z", { a: "start", c: M });
    s += fl(60, 212, 20, 212, K, 1.5) + fl(60, 212, 100, 212, K, 1.5) + tx(60, 228, "a_g (sol)", { s: 10 });
    s += tx(420, 70, "F_a = S_a · W_a · γ_a / q_a", { b: 1, c: B, s: 12 }) + tx(420, 95, "S_a croît avec z/H :", { s: 11 }) + tx(420, 112, "un équipement en toiture", { s: 11, c: M }) + tx(420, 127, "est plus secoué qu'au sol", { s: 11, c: M });
    return s;
  })(), "Élément non structural : force sismique fonction de son poids et de sa hauteur dans le bâtiment");

  S.classes = svg(560, 240, (() => {
    let s = `<line x1="300" y1="190" x2="540" y2="190" stroke="${K}"/><line x1="300" y1="190" x2="300" y2="25" stroke="${K}"/>` + tx(300, 18, "M", { b: 1 }) + tx(540, 205, "rotation", { a: "end", s: 10 });
    const c = [["1", 60, 0.72, B], ["2", 60, 0.45, C], ["3", 48, 0.2, "#d4a300"], ["4", 38, 0.12, R]];
    c.forEach(([n, mx, duc, col], i) => { const ytop = 190 - mx * 2.4, xr = 300 + 30 + duc * 200;
      s += `<path d="M300,190 Q${320},${ytop} ${330},${ytop} L${xr},${ytop} ${n === "1" ? "" : `L${xr + 12},${ytop + 25}`}" fill="none" stroke="${col}" stroke-width="2.2"/>` + tx(xr + 18, ytop + 4 + (n === "1" ? 0 : 20), "classe " + n, { a: "start", s: 10, c: col, b: 1 }); });
    s += `<line x1="300" y1="${190 - 60 * 2.4}" x2="540" y2="${190 - 60 * 2.4}" stroke="${M}" stroke-dasharray="3 3"/>` + tx(538, 190 - 60 * 2.4 - 4, "M_pl", { a: "end", s: 10, c: M });
    s += `<line x1="300" y1="${190 - 48 * 2.4}" x2="540" y2="${190 - 48 * 2.4}" stroke="${M}" stroke-dasharray="3 3"/>` + tx(538, 190 - 48 * 2.4 - 4, "M_el", { a: "end", s: 10, c: M });
    s += `<path d="M60,60 h120 v10 h-55 v100 h55 v10 h-120 v-10 h55 v-100 h-55z" fill="#cfd8e3" stroke="${K}"/>` + `<line x1="60" y1="50" x2="115" y2="50" stroke="${R}"/>` + tx(88, 45, "c", { c: R, b: 1 }) + tx(200, 66, "t", { c: R, b: 1 });
    s += `<path d="M185,58 Q195,52 205,60 Q215,68 225,58" fill="none" stroke="${R}" stroke-width="1.5"/>` + tx(120, 205, "paroi mince (c/t grand) → voilement local", { s: 10, c: M });
    return s;
  })(), "Plus la paroi est élancée, moins la section peut plastifier (classe 4 : voile avant f_y)");

  S.flambement = svg(660, 250, (() => {
    const cas = [["articulé – articulé", "L", 1, "aa"], ["console", "2L", 2, "ec"], ["encastré – articulé", "0,7L", 0.7, "ea"], ["encastré – encastré", "0,5L", 0.5, "ee"]];
    let s = "";
    cas.forEach(([t, l, k, type], i) => { const x = 75 + i * 150, y0 = 190, y1 = 50, h = y0 - y1;
      let d;
      if (type === "aa") d = `M${x},${y0} Q${x + 34},${(y0 + y1) / 2} ${x},${y1}`;
      else if (type === "ec") d = `M${x},${y0} Q${x},${y1 + 40} ${x + 30},${y1}`;
      else if (type === "ea") d = `M${x},${y0} C${x},${y0 - 40} ${x + 38},${y1 + 60} ${x},${y1}`;
      else d = `M${x},${y0} C${x},${y0 - 50} ${x + 36},${y0 - 50} ${x + 18},${(y0 + y1) / 2} S${x},${y1 + 50} ${x},${y1}`;
      s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${G}" stroke-dasharray="4 3"/><path d="${d}" fill="none" stroke="${B}" stroke-width="3"/>`;
      s += type === "aa" ? appui(x, y0) : encastr(x, y0);
      if (type === "aa" || type === "ea") s += `<circle cx="${x}" cy="${y1}" r="4" fill="#fff" stroke="${K}"/>`;
      if (type === "ee") s += `<line x1="${x - 18}" y1="${y1}" x2="${x + 18}" y2="${y1}" stroke="${K}" stroke-width="3"/>`;
      s += fl(x + (type === "ec" ? 30 : 0), y1 - 26, x + (type === "ec" ? 30 : 0), y1 - 4, R, 2) + tx(x, 222, t, { s: 10 }) + tx(x + 42, (y0 + y1) / 2, "L_cr = " + l, { b: 1, c: B, s: 11, a: "start" }); });
    return s;
  })(), "La longueur de flambement dépend des liaisons : une console flambe comme une barre deux fois plus longue");

  S.deversement = svg(560, 220, (() => {
    let s = tx(150, 18, "Vue de dessus", { b: 1, c: B }) + appui(40, 110) + appui(260, 110);
    s += `<line x1="40" y1="100" x2="260" y2="100" stroke="${G}" stroke-dasharray="4 3"/><path d="M40,100 Q150,155 260,100" fill="none" stroke="${B}" stroke-width="3"/>`;
    s += fl(150, 60, 150, 92, R, 2) + tx(158, 70, "charge", { a: "start", c: R, s: 10 }) + fl(150, 104, 150, 125, B, 1.4) + tx(158, 130, "déplacement latéral", { a: "start", c: B, s: 10 }) + tx(150, 175, "semelle comprimée non tenue sur L", { s: 10, c: M });
    s += tx(430, 18, "Coupe au milieu", { b: 1, c: B });
    s += `<g transform="translate(400,110)"><path d="M-30,-55 h60 v6 h-27 v98 h27 v6 h-60 v-6 h27 v-98 h-27z" fill="none" stroke="${G}" stroke-dasharray="3 3"/></g>`;
    s += `<g transform="translate(420,115) rotate(18)"><path d="M-30,-55 h60 v6 h-27 v98 h27 v6 h-60 v-6 h27 v-98 h-27z" fill="#cfd8e3" stroke="${K}"/></g>`;
    s += `<path d="M470,60 A60,60 0 0,1 480,110" fill="none" stroke="${R}" stroke-width="1.6"/>` + tx(495, 90, "rotation", { a: "start", c: R, s: 10 });
    return s;
  })(), "Déversement : la poutre fléchie se dérobe de côté en tournant (flambement latéral)");

  S.torsion = svg(560, 200, (() => {
    let s = tx(140, 18, "Profilé ouvert (U)", { b: 1, c: B }) + tx(420, 18, "Tube fermé", { b: 1, c: B });
    s += `<path d="M100,40 h70 v8 h-62 v104 h62 v8 h-70z" fill="#cfd8e3" stroke="${K}"/>` + `<path d="M380,40 h80 v120 h-80z M388,48 v104 h64 v-104z" fill="#cfd8e3" fill-rule="evenodd" stroke="${K}"/>`;
    s += `<path d="M190,60 A45,45 0 0,1 190,140" fill="none" stroke="${R}" stroke-width="2"/>` + fl(195, 135, 189, 142, R, 1.5) + tx(225, 105, "couple T", { c: R, s: 10 });
    s += tx(140, 182, "I_t UPN 100 ≈ 2,8 cm⁴ : très souple", { s: 10.5, c: R, b: 1 }) + tx(420, 182, "I_t tube 100×100×4 ≈ 360 cm⁴ (×130)", { s: 10.5, c: B, b: 1 });
    s += `<circle cx="250" cy="70" r="11" fill="#0b5d73"/>` + `<line x1="170" y1="70" x2="239" y2="70" stroke="${G}" stroke-dasharray="3 3"/>` + tx(205, 62, "excentricité", { s: 9, c: M });
    return s;
  })(), "Un tuyau décalé de l'axe tord le profilé : un tube fermé résiste bien mieux à la torsion");

  S.deplacements = svg(560, 215, (() => {
    let s = tx(140, 18, "Poutre sur deux appuis", { b: 1, c: B }) + appui(30, 90) + appui(250, 90);
    s += `<line x1="30" y1="90" x2="250" y2="90" stroke="${G}" stroke-dasharray="4 3"/><path d="M30,90 Q140,140 250,90" fill="none" stroke="${B}" stroke-width="3"/>`;
    for (let x = 40; x <= 240; x += 20) s += fl(x, 55, x, 82, R, 1.2);
    s += `<line x1="140" y1="90" x2="140" y2="115" stroke="${R}"/>` + tx(140, 135, "f = 5qL⁴/384EI", { c: R, s: 10, b: 1 }) + tx(140, 165, "limite L/200 à L/350", { s: 10, c: M });
    s += tx(420, 18, "Console (poteau, support)", { b: 1, c: B }) + encastr(360, 180, 40);
    s += `<line x1="360" y1="180" x2="360" y2="50" stroke="${G}" stroke-dasharray="4 3"/><path d="M360,180 Q360,90 395,50" fill="none" stroke="${B}" stroke-width="3"/>` + fl(330, 60, 390, 60, C, 2) + tx(330, 52, "vent", { c: C, s: 10 });
    s += `<line x1="360" y1="45" x2="395" y2="45" stroke="${R}"/>` + tx(400, 40, "u (tête)", { a: "start", c: R, s: 10, b: 1 }) + tx(470, 120, "H/150 (industriel)", { s: 10, c: M }) + tx(470, 135, "min(L/150 ; 5 mm) (supports)", { s: 10, c: M });
    return s;
  })(), "Les déformations sont limitées à l'ELS, même si la résistance est suffisante");

  S.assemblages = svg(560, 240, (() => {
    let s = `<rect x="60" y="40" width="160" height="140" fill="#eef1f5" stroke="${K}"/>`;
    [[95, 75], [185, 75], [95, 145], [185, 145]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${K}" stroke-width="1.5"/>`; });
    s += `<line x1="60" y1="195" x2="95" y2="195" stroke="${R}"/>` + tx(78, 210, "e₂ ≥ 1,2·d₀", { c: R, s: 10, b: 1 }) + `<line x1="95" y1="25" x2="185" y2="25" stroke="${B}"/>` + tx(140, 20, "a₁", { c: B, b: 1 });
    s += `<line x1="235" y1="75" x2="235" y2="145" stroke="${B}"/>` + tx(248, 114, "a₂", { c: B, b: 1 });
    s += tx(420, 50, "Traction F_t (arrachement)", { b: 1, c: R }) + fl(420, 110, 420, 62, R, 2.5) + tx(420, 140, "Cisaillement F_v (glissement)", { b: 1, c: B }) + fl(370, 165, 470, 165, B, 2.5);
    s += tx(420, 200, "F_v/F_v,Rd + F_t/(1,4·F_t,Rd) ≤ 1", { b: 1, s: 11.5 });
    return s;
  })(), "Platine à 4 fixations : pinces aux bords, entraxes, traction et cisaillement");

  S.platines = svg(560, 230, (() => {
    let s = `<line x1="60" y1="180" x2="320" y2="180" stroke="${K}"/><line x1="60" y1="180" x2="60" y2="25" stroke="${K}"/>` + tx(60, 18, "M", { b: 1 }) + tx(320, 196, "rotation φ", { a: "end", s: 10 });
    s += `<line x1="60" y1="180" x2="95" y2="30" stroke="${B}" stroke-width="2.5"/>` + tx(100, 34, "rigide (S_j ≥ 30·EI/L)", { a: "start", c: B, s: 10, b: 1 });
    s += `<line x1="60" y1="180" x2="230" y2="70" stroke="${C}" stroke-width="2.5"/>` + tx(235, 70, "semi-rigide (S1 : 10·EI/L)", { a: "start", c: C, s: 10, b: 1 });
    s += `<line x1="60" y1="178" x2="310" y2="172" stroke="${R}" stroke-width="2.5"/>` + tx(250, 165, "articulé", { c: R, s: 10, b: 1 });
    s += `<rect x="420" y="40" width="14" height="120" fill="#cfd8e3" stroke="${K}"/><rect x="395" y="160" width="64" height="8" fill="${K}"/>` + encastr(427, 168, 100) + tx(470, 100, "platine", { a: "start", s: 10 }) + tx(470, 115, "chevillée", { a: "start", s: 10 });
    return s;
  })(), "Une platine chevillée tourne un peu : elle est entre l'encastrement parfait et l'articulation");

  S.portee = svg(600, 200, (() => {
    let s = "";
    [60, 240, 420, 560].forEach((x) => { s += `<rect x="${x - 4}" y="110" width="8" height="60" fill="${G}"/>` + sol(x - 20, x + 20, 170); });
    s += `<path d="M60,104 Q150,140 240,104 Q330,140 420,104 Q490,126 560,104" fill="none" stroke="#0b5d73" stroke-width="10" opacity=".85"/>`;
    s += `<line x1="60" y1="104" x2="240" y2="104" stroke="${R}" stroke-dasharray="3 3"/><line x1="150" y1="104" x2="150" y2="122" stroke="${R}"/>` + tx(160, 135, "flèche f", { a: "start", c: R, s: 10, b: 1 });
    s += `<line x1="60" y1="70" x2="240" y2="70" stroke="${B}"/>` + tx(150, 64, "portée L", { c: B, b: 1 }) + tx(330, 40, "tuyau plein (fluide + calorifuge) = charge q", { s: 10.5 });
    for (let x = 270; x <= 400; x += 26) s += fl(x, 48, x, 92, C, 1.2);
    return s;
  })(), "Le tuyau entre deux supports est une poutre : contrainte, flèche et fréquence limitent la portée");

  S.supportage = svg(600, 240, (() => {
    const tube = (x, y) => `<circle cx="${x}" cy="${y}" r="20" fill="#0b5d73" opacity=".85"/>` + `<rect x="${x - 34}" y="${y + 20}" width="68" height="8" fill="${G}"/>`;
    let s = tube(100, 90) + fl(100, 150, 40, 150, B, 2) + fl(100, 150, 160, 150, B, 2) + tx(100, 30, "Glissant", { b: 1, c: B }) + tx(100, 205, "libre en X et en Y", { s: 10, c: M });
    s += tube(300, 90) + `<rect x="270" y="72" width="6" height="38" fill="${K}"/><rect x="324" y="72" width="6" height="38" fill="${K}"/>` + fl(300, 150, 240, 150, B, 2) + fl(300, 150, 360, 150, B, 2) + tx(300, 30, "Guidé", { b: 1, c: B }) + tx(300, 205, "libre dans l'axe, bloqué latéralement", { s: 10, c: M });
    s += tube(500, 90) + `<path d="M480,66 l40,48 M520,66 l-40,48" stroke="${R}" stroke-width="3"/>` + tx(500, 30, "Point fixe", { b: 1, c: R }) + tx(500, 205, "bloqué : reprend la dilatation de la ligne", { s: 10, c: M });
    s += tx(300, 172, "Δ = α·ΔT·L ≈ 1,2 mm/m pour 100 °C", { b: 1, s: 11 });
    return s;
  })(), "Les supports guident la dilatation de la tuyauterie ; seuls les points fixes la bloquent");

  S.entraxes = svg(560, 170, (() => {
    let s = `<rect x="40" y="130" width="480" height="8" fill="${G}"/>`;
    s += `<circle cx="170" cy="85" r="44" fill="#fdf2dc" stroke="#b26a00" stroke-dasharray="3 2"/><circle cx="170" cy="85" r="26" fill="#0b5d73"/>`;
    s += `<circle cx="360" cy="95" r="34" fill="#fdf2dc" stroke="#b26a00" stroke-dasharray="3 2"/><circle cx="360" cy="95" r="20" fill="#0b5d73"/>`;
    s += `<line x1="170" y1="150" x2="360" y2="150" stroke="${B}"/>` + tx(265, 164, "E ≥ (D₁ + D₂)/2 + e_cal1 + e_cal2 + J", { b: 1, c: B });
    s += `<line x1="214" y1="40" x2="326" y2="40" stroke="${R}" stroke-dasharray="3 3"/>` + tx(270, 34, "jeu J (50 à 100 mm)", { c: R, s: 10 });
    return s;
  })(), "");

  S.fluides = svg(560, 220, (() => {
    let s = `<line x1="60" y1="190" x2="520" y2="190" stroke="${K}"/><line x1="60" y1="190" x2="60" y2="20" stroke="${K}"/>` + tx(60, 14, "P_v", { b: 1 }) + tx(520, 206, "température", { a: "end", s: 10 });
    const pts = []; for (let t = 0; t <= 120; t += 4) { const p = Math.exp(18.3 - 3816 / (t + 227)) / 760 * 101.3; pts.push([60 + t * 3.6, 190 - p * 1.4]); }
    s += `<polyline points="${pts.filter((p) => p[1] > 10).map((p) => p.join(",")).join(" ")}" fill="none" stroke="${R}" stroke-width="2.5"/>`;
    const yA = 190 - 101.3 * 1.4; s += `<line x1="60" y1="${yA}" x2="520" y2="${yA}" stroke="${B}" stroke-dasharray="5 3"/>` + tx(515, yA - 5, "P_atm", { a: "end", c: B, b: 1, s: 10 });
    s += `<line x1="${60 + 100 * 3.6}" y1="${yA}" x2="${60 + 100 * 3.6}" y2="190" stroke="${M}" stroke-dasharray="3 3"/>` + tx(60 + 100 * 3.6, 186, "ébullition", { s: 9.5, c: M });
    s += tx(210, 120, "Si P_v approche la pression à l'aspiration", { s: 10.5 }) + tx(210, 135, "d'une pompe → cavitation", { s: 10.5, c: R, b: 1 });
    return s;
  })(), "Eau : la pression de vapeur double à peu près tous les 12 °C et atteint P_atm à 100 °C");

  S.charges = svg(560, 190, (() => {
    let s = `<polygon points="120,90 280,40 440,90" fill="#eef1f5" stroke="${K}" stroke-width="1.4"/><rect x="120" y="90" width="320" height="80" fill="#f7f9fc" stroke="${K}"/>` + sol(80, 480, 170);
    s += fl(280, 5, 280, 36, C, 2) + tx(292, 18, "S neige", { a: "start", c: C, s: 10, b: 1 }) + fl(60, 120, 115, 120, C, 2) + tx(60, 110, "W vent", { a: "start", c: C, s: 10, b: 1 });
    s += tx(280, 120, "G poids propres", { s: 10.5 }) + tx(280, 138, "Q exploitation", { s: 10.5 }) + `<line x1="160" y1="150" x2="400" y2="150" stroke="#0b5d73" stroke-width="6"/>` + tx(280, 164, "T dilatation, frottement", { s: 9.5, c: M });
    s += fl(470, 182, 510, 182, R, 2) + fl(470, 182, 430, 182, R, 2) + tx(470, 176, "E séisme", { s: 10, c: R, b: 1 });
    return s;
  })(), "");
  return S;
})();
