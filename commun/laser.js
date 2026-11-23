/* DXF de découpe laser d'une platine (R12 ASCII, mm) : contour rectangulaire et perçages (cercles), origine au coin inférieur gauche.
   Calque DECOUPE (couleur 7) : contour et trous ; calque REPERE (couleur 3) : repère, matière, épaisseur (à graver ou ignorer).
   spec : { lx, ly, trous:[{x, y, d}] (x, y depuis le centre de la platine), repere, matiere, ep } */
const LASER = (() => {
  const nb = (v) => (+v).toFixed(3);
  const ent = (type, layer, pairs) => `0\n${type}\n8\n${layer}\n${pairs.map(([c, v]) => c + "\n" + v).join("\n")}\n`;
  const ligne = (x1, y1, x2, y2) => ent("LINE", "DECOUPE", [[10, nb(x1)], [20, nb(y1)], [30, 0], [11, nb(x2)], [21, nb(y2)], [31, 0]]);
  const cercle = (x, y, d) => ent("CIRCLE", "DECOUPE", [[10, nb(x)], [20, nb(y)], [30, 0], [40, nb(d / 2)]]);
  const texte = (x, y, h, t) => ent("TEXT", "REPERE", [[10, nb(x)], [20, nb(y)], [30, 0], [40, nb(h)], [1, String(t).replace(/[^\x20-\x7e]/g, (c) => ({ "é": "e", "è": "e", "ê": "e", "à": "a", "ç": "c", "×": "x", "Ø": "%%c", "°": "%%d" }[c] || "?"))]]);
  function dxf(s) {
    const { lx, ly } = s;
    let e = ligne(0, 0, lx, 0) + ligne(lx, 0, lx, ly) + ligne(lx, ly, 0, ly) + ligne(0, ly, 0, 0);
    (s.trous || []).forEach((t) => { e += cercle(lx / 2 + t.x, ly / 2 + t.y, t.d); });
    const h = Math.min(8, lx / 20), y0 = ly / 2 - h / 2;
    e += texte(lx * 0.08, y0 + h * 1.4, h, `${s.repere} - ${s.matiere} - ep ${s.ep} mm`) + texte(lx * 0.08, y0 - h * 0.4, h, `${nb(lx).replace(/\.?0+$/, "")} x ${nb(ly).replace(/\.?0+$/, "")}`);
    return `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n2\n0\nLAYER\n2\nDECOUPE\n70\n0\n62\n7\n6\nCONTINUOUS\n0\nLAYER\n2\nREPERE\n70\n0\n62\n3\n6\nCONTINUOUS\n0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${e}0\nENDSEC\n0\nEOF\n`;
  }
  return { dxf };
})();
if (typeof module !== "undefined") module.exports = LASER;
