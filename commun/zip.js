/* Archive ZIP minimale (méthode « stockée », sans compression) : fichiers texte (DXF) et binaires (xlsx) côté navigateur.
   ZIP.creer([{nom, donnees: string | Uint8Array}]) → Blob */
const ZIP = (() => {
  const T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u) => { let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const enc = new TextEncoder();
  const u16 = (v) => [v & 255, (v >>> 8) & 255], u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  function creer(fichiers) {
    const parts = [], central = []; let off = 0;
    const d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    fichiers.forEach((f) => {
      const nom = enc.encode(f.nom), data = typeof f.donnees === "string" ? enc.encode(f.donnees) : f.donnees instanceof Uint8Array ? f.donnees : new Uint8Array(f.donnees), crc = crc32(data);
      const loc = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(tm), ...u16(dt), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nom.length), ...u16(0)]);
      parts.push(loc, nom, data);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(tm), ...u16(dt), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nom.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nom);
      off += loc.length + nom.length + data.length;
    });
    const tailleC = central.reduce((s, p) => s + p.length, 0);
    const fin = new Uint8Array([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(fichiers.length), ...u16(fichiers.length), ...u32(tailleC), ...u32(off), ...u16(0)]);
    return new Blob([...parts, ...central, fin], { type: "application/zip" });
  }
  return { creer, crc32 };
})();
if (typeof module !== "undefined") module.exports = ZIP;
