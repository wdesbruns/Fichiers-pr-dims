/* =====================================================================
   EXPORT WORD (.docx) ET EXCEL (.xlsx) — commun à toutes les calculettes
   Bibliothèques chargées à la demande : docx 9.5.1 (MIT), SheetJS 0.18.5 (Apache-2.0)
   Utilisation dans une page :
     EXPORT.init({ code:'P1', titre:'…', zones:()=>[éléments], donnees:()=>[racines], avant:()=>{}, nom:()=>'repère' })
   ===================================================================== */
const EXPORT = (() => {
  const BASE = (document.currentScript && document.currentScript.src.replace(/export\.js.*$/, "")) || "../commun/";
  let cfg = null;

  /* ---------- outils ---------- */
  const charger = (src) => new Promise((ok, ko) => {
    if (document.querySelector(`script[data-lib="${src}"]`)) return ok();
    const s = document.createElement("script"); s.src = BASE + src; s.dataset.lib = src;
    s.onload = ok; s.onerror = () => ko(new Error("Chargement impossible : " + src)); document.head.appendChild(s);
  });
  const telecharger = (blob, nom) => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nom;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  const propre = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  const nomFichier = (ext) => `${cfg.code}_${propre(cfg.nom ? cfg.nom() : "") || "note"}_${new Date().toISOString().slice(0, 10)}.${ext}`;
  const ignorer = (el) => el.nodeType === 1 && (el.matches("script,style,button,.noprint,.bar,.printhead,.leaflet-container,.sugg,[hidden]") || !!el.closest(".noprint,[hidden]"));
  const hex = (rgb) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || ""); return m ? [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, "0")).join("").toUpperCase() : null; };
  const valeurChamp = (el) => {
    if (el.tagName === "SELECT") return el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : "";
    if (el.type === "checkbox" || el.type === "radio") return el.checked ? "☑" : "☐";
    return el.value;
  };
  const texte = (el) => {                                   // texte lisible (champs = valeurs)
    if (el.nodeType === 3) return el.nodeValue;
    if (el.nodeType !== 1 || ignorer(el)) return "";
    if (el.matches("input,select,textarea")) return valeurChamp(el);
    if (el.tagName === "BR") return "\n";
    if (el.tagName.toLowerCase() === "svg") return "";
    const t = [...el.childNodes].map(texte).join("");
    return /^(DIV|P|LI|H1|H2|H3|H4|TR|SUMMARY|UL)$/.test(el.tagName) ? t + "\n" : t;
  };
  const net = (t) => t.replace(/[ \t ]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();

  /* ---------- SVG → PNG (couleurs CSS figées) ---------- */
  async function svgEnPng(svg) {
    const clone = svg.cloneNode(true), src = [svg, ...svg.querySelectorAll("*")], dst = [clone, ...clone.querySelectorAll("*")];
    src.forEach((o, i) => {
      const cs = getComputedStyle(o), d = dst[i];
      ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "fill-opacity", "stroke-opacity", "font-size", "font-weight", "font-family", "text-anchor"].forEach((p) => {
        const v = cs.getPropertyValue(p); if (v && v !== "normal" && !(p === "stroke-dasharray" && v === "none")) d.style.setProperty(p, v);
      });
    });
    const vb = svg.viewBox && svg.viewBox.baseVal, w = (vb && vb.width) || svg.clientWidth || 400, h = (vb && vb.height) || svg.clientHeight || 200;
    clone.setAttribute("width", w); clone.setAttribute("height", h); clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
    const k = 2, c = document.createElement("canvas"); c.width = w * k; c.height = h * k;
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
    return { data: new Uint8Array(await blob.arrayBuffer()), w, h };
  }

  /* =====================================================================
     WORD
     ===================================================================== */
  async function word() {
    const D = window.docx;
    const { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ImageRun, ShadingType, AlignmentType, Header, Footer, PageNumber, BorderStyle } = D;
    const ENCRE = "171A1E";
    const runs = (node, fmt = {}) => {
      if (node.nodeType === 3) {
        const t = node.nodeValue.replace(/\s+/g, " "); if (!t.trim() && !fmt.garderEspace) return t ? [new TextRun({ text: " ", ...fmt })] : [];
        return [new TextRun({ text: t, bold: fmt.bold, subScript: fmt.sub, superScript: fmt.sup, color: fmt.color, size: fmt.size })];
      }
      if (node.nodeType !== 1 || ignorer(node)) return [];
      if (node.matches("input,select,textarea")) return [new TextRun({ text: valeurChamp(node), bold: true, color: "1F6FD1", size: fmt.size })];
      if (node.tagName === "BR") return [new TextRun({ break: 1 })];
      if (node.tagName.toLowerCase() === "svg") return [];
      const f = { ...fmt }, tag = node.tagName;
      if (tag === "B" || tag === "STRONG" || node.classList.contains("badge") || node.matches("th")) f.bold = true;
      if (tag === "SUB") f.sub = true; if (tag === "SUP") f.sup = true;
      const col = hex(getComputedStyle(node).color); if (col && col !== ENCRE && col !== "000000") f.color = col; else delete f.color;
      if (node.classList.contains("badge")) return [new TextRun({ text: " [" + net(texte(node)) + "] ", bold: true, color: f.color, size: 16 })];
      return [...node.childNodes].flatMap((n) => runs(n, f));
    };
    const BLOC = /^(DIV|SECTION|P|UL|OL|LI|TABLE|H1|H2|H3|H4|DETAILS|SUMMARY|FORM|MAIN|HEADER|FOOTER|LABEL|IMG)$/;
    const estBloc = (n) => n.nodeType === 1 && (BLOC.test(n.tagName) || n.tagName.toLowerCase() === "svg");
    async function blocs(el, opt = {}) {
      const out = []; let enCours = [];
      const vider = () => { if (enCours.some((r) => r)) out.push(new Paragraph({ children: enCours, spacing: { after: 60 }, ...(opt.para || {}) })); enCours = []; };
      for (const n of el.childNodes) {
        if (n.nodeType === 1 && ignorer(n)) continue;
        if (!estBloc(n)) { enCours.push(...runs(n, opt.fmt || {})); continue; }
        vider();
        const tag = n.tagName.toUpperCase();
        if (tag === "SVG") { try { const im = await svgEnPng(n), w = Math.min(600, im.w * (opt.echelle || 1)), h = w * im.h / im.w; out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: im.data, transformation: { width: w, height: h } })] })); } catch (e) { } }
        else if (tag === "IMG") {                                   // image (ex. perspective 3D) en data:image/png
          const src = n.getAttribute("src") || "";
          if (src.startsWith("data:image/png")) { const bin = atob(src.split(",")[1]), u8 = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
            const w = Math.min(600, n.naturalWidth || 600), h = w * ((n.naturalHeight || 400) / (n.naturalWidth || 600));
            out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: "png", data: u8, transformation: { width: w, height: h } })] })); }
        }
        else if (tag === "TABLE") { out.push(await tableau(n)); out.push(new Paragraph({ text: "", spacing: { after: 60 } })); }
        else if (/^H[1-4]$/.test(tag) || tag === "SUMMARY") {
          const niv = tag === "H1" || tag === "H2" ? 26 : 22;
          out.push(new Paragraph({ spacing: { before: 200, after: 80 }, keepNext: true, border: tag === "H2" ? { left: { style: BorderStyle.SINGLE, size: 18, color: "E30009", space: 6 } } : undefined, children: runs(n, { bold: true, color: "114088", size: niv }) }));
        }
        else if (tag === "UL" || tag === "OL") { for (const li of n.children) out.push(new Paragraph({ bullet: { level: 0 }, children: runs(li, { size: 18 }), spacing: { after: 40 } })); }
        else if (n.classList.contains("hero")) out.push(await tableHero(n));
        else if (n.classList.contains("msg")) { const fond = hex(getComputedStyle(n).backgroundColor); out.push(new Paragraph({ children: runs(n), shading: fond ? { type: ShadingType.CLEAR, fill: fond, color: "auto" } : undefined, spacing: { before: 60, after: 60 } })); }
        else out.push(...await blocs(n, { ...opt, fmt: n.classList.contains("note") ? { size: 17, color: "5F6670" } : opt.fmt }));
      }
      vider();
      return out;
    }
    async function tableHero(n) {
      const kpis = [...n.children];
      return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: kpis.map((k) => new TableCell({ shading: { type: ShadingType.CLEAR, fill: "F6F7F9", color: "auto" }, children: [...k.children].map((c) => new Paragraph({ children: runs(c, c.classList.contains("v") ? { bold: true, size: 26 } : { size: 16 }) })) })) })] });
    }
    async function tableau(t) {
      const rows = [];
      for (const tr of t.rows) {
        if (ignorer(tr)) continue;
        const cs = getComputedStyle(tr), fondTr = tr.matches(".gov,.key") ? hex([...tr.cells].map((c) => getComputedStyle(c).backgroundColor).find((b) => !/rgba\(0, 0, 0, 0\)|transparent/.test(b))) : null;
        const cells = [];
        for (const td of tr.cells) {
          if (ignorer(td)) continue;
          let contenu = await blocs(td, { fmt: { size: 17, bold: tr.matches(".key,.gov") || td.tagName === "TH" }, echelle: 0.5 });
          if (!contenu.length) contenu = [new Paragraph({ text: "" })];
          cells.push(new TableCell({ children: contenu, columnSpan: td.colSpan > 1 ? td.colSpan : undefined,
            shading: td.tagName === "TH" ? { type: ShadingType.CLEAR, fill: "EEF1F5", color: "auto" } : fondTr ? { type: ShadingType.CLEAR, fill: fondTr, color: "auto" } : undefined,
            margins: { top: 40, bottom: 40, left: 80, right: 80 } }));
        }
        if (cells.length && cs.display !== "none") rows.push(new TableRow({ children: cells, cantSplit: true, tableHeader: rows.length === 0 && [...tr.cells].every((c) => c.tagName === "TH") }));
      }
      return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
    }

    // ---- contenu
    const enfants = [];
    let logo = null; try { logo = new Uint8Array(await (await fetch(BASE + "img/logo-fip.png")).arrayBuffer()); } catch (e) { }
    enfants.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: cfg.titre, bold: true, size: 32, color: "114088" })] }));
    // cartouche d'affaire (cahier de supportage) — provisoire, en attendant la trame Word FIP
    let aff = null; try { const o = JSON.parse(localStorage.getItem("fip.cahier")); if (o && o.affaire && (o.affaire.num || o.affaire.intitule || o.affaire.client)) aff = o.affaire; } catch (e) { }
    let logoClient = null, dimLogo = { width: 64, height: 32 };
    if (aff) {
      if (aff.logo) await new Promise((ok) => { const im = new Image(); im.onload = () => { dimLogo = { width: Math.min(140, Math.round(32 * im.naturalWidth / im.naturalHeight)), height: 32 }; ok(); }; im.onerror = ok; im.src = aff.logo; });
      if (/^data:image\/png;base64,/.test(aff.logo || "")) { try { logoClient = Uint8Array.from(atob(aff.logo.split(",")[1]), (c) => c.charCodeAt(0)); } catch (e) { } }
      const dt = aff.date ? new Date(aff.date).toLocaleDateString("fr-FR") : "", lib = [aff.num, aff.intitule].filter(Boolean).join(" – ");
      const L = [["Affaire", lib, "Client", aff.client], ["Site", aff.site, "Phase", aff.phase], ["N° de document", aff.doc, "Indice / date", [aff.indice, dt].filter(Boolean).join(" du ")],
        ["Réalisé", aff.realise, "Contrôlé", aff.controle], ["Approuvé", aff.approuve, "Outil", cfg.code + " – FIP Calculettes"]];
      const cel = (t, gras, w) => new TableCell({ width: { size: w, type: WidthType.PERCENTAGE }, shading: gras ? undefined : { type: ShadingType.CLEAR, fill: "EEF2F7", color: "auto" }, children: [new Paragraph({ children: [new TextRun({ text: String(t || "—"), size: 17, bold: !!gras, color: gras ? ENCRE : "5F6670" })] })] });
      enfants.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: L.map((r) => new TableRow({ cantSplit: true, children: [cel(r[0], 0, 16), cel(r[1], 1, 34), cel(r[2], 0, 16), cel(r[3], 1, 34)] })) }));
      enfants.push(new Paragraph({ text: "", spacing: { after: 120 } }));
    }
    const info = document.getElementById("phInfo"); if (info) enfants.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: net(info.textContent), size: 18, color: "5F6670" })] }));
    const donnees = tableDonnees();
    if (donnees.length) {
      enfants.push(new Paragraph({ spacing: { before: 120, after: 80 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: "E30009", space: 6 } }, children: [new TextRun({ text: "DONNÉES D'ENTRÉE", bold: true, color: "114088", size: 22 })] }));
      enfants.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: donnees.map(([g, v]) => new TableRow({ cantSplit: true, children: [
        new TableCell({ width: { size: 55, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: g, size: 17 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: v, size: 17, bold: true, color: "1F6FD1" })] })] })] })) }));
      enfants.push(new Paragraph({ text: "", spacing: { after: 120 } }));
    }
    for (const z of cfg.zones()) { if (z) enfants.push(...await blocs(z.tagName === "TABLE" ? wrap(z) : z)); }
    function wrap(t) { const d = document.createElement("div"); d.appendChild(t.cloneNode(true)); return d; }

    const doc = new D.Document({
      creator: "FIP Calculettes", title: cfg.titre, description: "Note de calcul générée par FIP Calculettes",
      styles: { default: { document: { run: { font: "Calibri", size: 20, color: ENCRE } } } },
      sections: [{
        properties: { page: { margin: { top: 1000, bottom: 900, left: 900, right: 900 } } },
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "114088", space: 4 } }, children: [
          ...(logoClient ? [new ImageRun({ type: "png", data: logoClient, transformation: dimLogo }), new TextRun({ text: "   " })] : []),
          ...(logo ? [new ImageRun({ type: "png", data: logo, transformation: { width: 92, height: 32 } })] : []),
          new TextRun({ text: "   " + cfg.code + " – " + cfg.titre, size: 16, color: "5F6670" })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: "FIP Calculettes – outil d'aide au calcul, résultats à vérifier par un ingénieur qualifié – page ", size: 14, color: "5F6670" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "5F6670" }), new TextRun({ text: " / ", size: 14, color: "5F6670" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "5F6670" })] })] }) },
        children: enfants,
      }],
    });
    telecharger(await D.Packer.toBlob(doc), nomFichier("docx"));
  }

  /* ---------- données d'entrée (libellé → valeur) ---------- */
  function tableDonnees() {
    const racines = cfg.donnees ? cfg.donnees() : [], zones = cfg.zones().filter(Boolean), lignes = [];
    for (const r of racines) for (const el of r.querySelectorAll("input,select")) {
      if (ignorer(el) || el.type === "hidden" || zones.some((z) => z.contains(el))) continue;
      const v = valeurChamp(el); if (v === "" || v == null) continue;
      let lib = "";
      const tr = el.closest("tr");
      if (tr && el.closest("table")) {
        const td = el.closest("td"), idx = [...tr.cells].indexOf(td), th = el.closest("table").rows[0].cells[idx];
        lib = net(texte(tr.cells[0]).replace(v, "")) + (th && idx > 0 ? " – " + net(texte(th)) : "");
      } else if (el.closest("label")) lib = net(texte(el.closest("label")).replace(v, ""));
      else { let p = el.previousElementSibling; while (p && p.tagName !== "LABEL") p = p.previousElementSibling; lib = p ? net(texte(p)) : (el.placeholder || el.id); }
      if (el.type === "checkbox") { if (!el.checked) continue; lignes.push([lib, "oui"]); continue; }
      lignes.push([lib || el.id, String(v)]);
    }
    return lignes;
  }

  /* =====================================================================
     EXCEL
     ===================================================================== */
  function cellule(t) {
    t = net(t).replace(/\n/g, " ");
    const m = /^([−-]?\d{1,3}(?:[   ]\d{3})*(?:,(\d+))?)\s*(%|[A-Za-zµ°²³/·]{1,8}|)$/.exec(t);
    if (!m || /^\d{5}$/.test(t)) return { v: t, t: "s" };
    const val = parseFloat(m[1].replace(/[   ]/g, "").replace("−", "-").replace(",", ".")), d = (m[2] || "").length, u = m[3];
    if (u === "%") return { v: val / 100, t: "n", z: d ? "0." + "0".repeat(d) + "%" : "0%" };
    const z = "#,##0" + (d ? "." + "0".repeat(d) : "") + (u ? ` "${u}"` : "");
    return { v: val, t: "n", z };
  }
  function excel() {
    const X = window.XLSX, wb = X.utils.book_new();
    const feuille = (lignes, nom) => {
      const ws = {}; let maxC = 0;
      lignes.forEach((l, r) => l.forEach((c, k) => { if (c == null || c === "") return; const cel = typeof c === "object" ? c : cellule(String(c)); ws[X.utils.encode_cell({ r, c: k })] = cel; maxC = Math.max(maxC, k); }));
      ws["!ref"] = X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(lignes.length - 1, 0), c: maxC } });
      ws["!cols"] = [...Array(maxC + 1)].map((_, k) => ({ wch: Math.min(70, Math.max(8, ...lignes.map((l) => String((l[k] && l[k].v != null ? l[k].v : l[k]) ?? "").length + 2))) }));
      let n = nom.replace(/[\\/?*[\]:]/g, " ").slice(0, 31), i = 2; while (wb.SheetNames.includes(n)) n = nom.slice(0, 28) + " " + i++;
      X.utils.book_append_sheet(wb, ws, n);
    };
    // Feuille 1 : résultats
    const info = document.getElementById("phInfo"), L = [[cfg.code + " – " + cfg.titre], [info ? net(info.textContent) : ""], []];
    for (const z of cfg.zones()) {
      if (!z) continue;
      const titres = z.matches("h2,h3") ? [z] : [...z.querySelectorAll("h2")];
      if (z.querySelector && !z.querySelector("table") && !z.matches("table")) {          // bloc de texte (verdict, notes)
        const t = net(texte(z)); if (t) { L.push([t.split("\n")[0].toUpperCase()]); t.split("\n").slice(1).forEach((x) => L.push(["", x])); L.push([]); }
        continue;
      }
      if (titres[0]) L.push([net(texte(titres[0])).toUpperCase()]);
      for (const t of (z.matches("table") ? [z] : z.querySelectorAll("table"))) {
        if (ignorer(t)) continue;
        for (const tr of t.rows) { if (ignorer(tr)) continue; const l = []; for (const td of tr.cells) { l.push(net(texte(td))); for (let s = 1; s < td.colSpan; s++) l.push(""); } L.push(l); }
        L.push([]);
      }
    }
    feuille(L, "Résultats");
    const d = tableDonnees(); if (d.length) feuille([["Donnée", "Valeur"], ...d], "Données d'entrée");
    X.writeFile(wb, nomFichier("xlsx"), { compression: true });
  }

  /* =====================================================================
     BOUTONS
     ===================================================================== */
  async function lancer(type, bouton) {
    const lib = bouton.innerHTML; bouton.disabled = true; bouton.innerHTML = "⏳ Génération…";
    try {
      if (cfg.avant) await cfg.avant();
      if (type === "word") { await charger("lib/docx/docx.iife.js"); await word(); }
      else { await charger("lib/xlsx/xlsx.mini.min.js"); excel(); }
    } catch (e) { console.error(e); alert("Export impossible : " + e.message); }
    finally { bouton.disabled = false; bouton.innerHTML = lib; }
  }
  function init(c) {
    cfg = c;
    const imp = [...document.querySelectorAll("header button")].find((b) => /Imprimer/.test(b.textContent));
    const mk = (txt, coul, type) => { const b = document.createElement("button"); b.type = "button"; b.innerHTML = txt; b.style.background = coul; b.style.borderColor = coul; b.style.marginRight = "6px"; b.title = "Télécharger la note au format " + (type === "word" ? "Word (.docx)" : "Excel (.xlsx)"); b.onclick = () => lancer(type, b); return b; };
    const bW = mk("📄 Word", "#2b579a", "word"), bX = mk("📊 Excel", "#217346", "excel");
    if (imp) { imp.before(bW, bX); } else document.body.prepend(bW, bX);
  }
  return { init, _cellule: cellule };
})();
