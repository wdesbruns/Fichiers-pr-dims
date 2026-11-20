/* =====================================================================
   S1 — NOTE DE CALCUL (simplifiée 1 page / complète), aperçu, impression, Word
   Principe : sections choisies → document HTML autonome (repris par l'export Word).
   ===================================================================== */
const NDC_SECTIONS = [
  ["docs", "Documents de référence (saisis dans NH)"],
  ["unites", "Unités et conventions"],
  ["hyp", "Hypothèses de charges (G, T, climatiques, sismiques, épreuve)"],
  ["ref", "Références normatives"],
  ["mat", "Matériaux et sections"],
  ["mod", "Modèle 2D / 3D"],
  ["liai", "Liaisons extérieures et intérieures"],
  ["chg", "Chargement par cas"],
  ["comb", "Combinaisons d'actions"],
  ["ddc", "Descente de charges"],
  ["elu", "Résultats ELU : diagrammes N, V, M"],
  ["els", "Résultats ELS : déformée et déplacements"],
  ["verif", "Vérifications (critères et taux)"],
  ["fix", "Fixations sur l'ouvrage"],
  ["alert", "Alertes de conception, hypothèses et limites"],
];
const NDC_COMPLET = NDC_SECTIONS.map((s) => s[0]);
let NDC = { niveau: "simple", sec: Object.fromEntries(NDC_COMPLET.map((k) => [k, true])), ddc: "les2", formules: "detail" };
try { const o = JSON.parse(localStorage.getItem("fip.s1.ndc")); if (o && o.sec) NDC = { ...NDC, ...o }; } catch (e) { }
const ndcEnr = () => { try { localStorage.setItem("fip.s1.ndc", JSON.stringify(NDC)); } catch (e) { } };

/* ---------- interface ---------- */
function ndcUI() {
  const c = $("ndcOpts"); if (!c) return;
  c.innerHTML = `<div class="row"><div><label>Modèle de note</label><select id="ndcNiv"><option value="simple">Note simplifiée (1 page)</option><option value="complet">Note complète</option><option value="perso">Note personnalisée</option></select></div>
    <div><label>Descente de charges</label><select id="ndcDdc"><option value="cas">Cas simples (caractéristiques)</option><option value="elu">ELU (enveloppes)</option><option value="les2">Cas simples + ELU</option></select></div>
    <div><label>Critères</label><select id="ndcForm"><option value="detail">Formules détaillées (valeurs numériques)</option><option value="resume">Résumé des taux</option></select></div></div>
    <div class="opts" id="ndcSec" style="columns:2;font-size:13px">${NDC_SECTIONS.map(([k, l]) => `<label style="display:block;font-weight:400"><input type="checkbox" data-ns="${k}"> ${l}</label>`).join("")}</div>`;
  const maj = () => { $("ndcNiv").value = NDC.niveau; $("ndcDdc").value = NDC.ddc; $("ndcForm").value = NDC.formules;
    c.querySelectorAll("[data-ns]").forEach((el) => { el.checked = NDC.niveau === "complet" ? true : !!NDC.sec[el.dataset.ns]; el.disabled = NDC.niveau === "simple"; });
    $("ndcSec").style.opacity = NDC.niveau === "simple" ? 0.45 : 1; };
  $("ndcNiv").onchange = () => { NDC.niveau = $("ndcNiv").value; if (NDC.niveau === "complet") NDC.sec = Object.fromEntries(NDC_COMPLET.map((k) => [k, true])); ndcEnr(); maj(); };
  $("ndcDdc").onchange = () => { NDC.ddc = $("ndcDdc").value; ndcEnr(); };
  $("ndcForm").onchange = () => { NDC.formules = $("ndcForm").value; ndcEnr(); };
  c.querySelectorAll("[data-ns]").forEach((el) => el.onchange = () => { NDC.sec[el.dataset.ns] = el.checked; NDC.niveau = "perso"; ndcEnr(); maj(); });
  maj();
  $("ndcVoir").onclick = () => ndcOuvrir();
  $("ndcWord").onclick = async () => { const b = $("ndcWord"), l = b.innerHTML; b.disabled = true; b.innerHTML = "⏳ Génération…";
    try { const el = await ndcRendre(true); await EXPORT.wordDe(el, { titre: ndcTitre(), fichier: "NDC_" + ($("repere").value || "support") }); } catch (e) { alert("Export impossible : " + e.message); }
    finally { b.disabled = false; b.innerHTML = l; $("ndcHors").innerHTML = ""; } };
  $("ndcImp").onclick = async () => { const el = await ndcRendre(true), w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escH(ndcTitre())}</title><link rel="stylesheet" href="../commun/calc.css"><style>${NDC_CSS}@page{size:A4;margin:12mm}body{background:#fff}</style></head><body>${el.outerHTML}</body></html>`);
    w.document.close(); $("ndcHors").innerHTML = ""; setTimeout(() => w.print(), 500); };
}
const ndcTitre = () => (NDC.niveau === "simple" ? "Note de calcul simplifiée" : "Note de calcul") + " – support " + ((NDC.ident && NDC.ident.repere) || $("repere").value || "");
const NDC_CSS = `.ndc{font-size:12.5px;line-height:1.45;color:#171a1e;max-width:190mm;margin:auto}.ndc h1{font-size:19px;color:#114088;margin:0 0 6px}.ndc h2{font-size:15px;color:#114088;border-left:4px solid #e30009;padding-left:8px;margin:16px 0 6px}
  .ndc h3{font-size:13px;margin:10px 0 4px}.ndc table{width:100%;border-collapse:collapse;margin:4px 0 8px}.ndc td,.ndc th{border:1px solid #d5dae1;padding:3px 6px;vertical-align:top;font-size:12px}.ndc th{background:#eef1f5;text-align:left}
  .ndc .n{text-align:right;white-space:nowrap}.ndc .ok{color:#1d7a36;font-weight:700}.ndc .ko{color:#c0141c;font-weight:700}.ndc .lay,.ndc .lay>tbody>tr>td{border:0;padding:0 4px}.ndc svg{max-width:100%;height:auto}
  .ndc .form td:first-child{width:28%;font-weight:600}.ndc .exe{border:2px solid #171a1e;padding:4px 8px;font-weight:700;text-align:center;margin:6px 0}.ndc .pied{font-size:10.5px;color:#5f6670;margin-top:8px}
  .ndc.simple{font-size:11.5px}.ndc.simple td,.ndc.simple th{font-size:11px;padding:2px 5px}.ndc img{max-width:100%}`;

/* ---------- briques ---------- */
const z0 = (v) => (Math.abs(v) < 0.005 ? 0 : v);
const ok = (r) => r <= 1 ? `<span class="ok">✔ ${f(r * 100, 0)} %</span>` : `<span class="ko">✘ ${f(r * 100, 0)} %</span>`;
function ndcIdent(D, V) {
  const K = CAHIER.existe() ? CAHIER.lire().affaire : {}, ph = K.phase || "APS/APD";
  const I = NDC.ident || {};
  const L = [["Affaire", CAHIER.libAffaire ? (CAHIER.libAffaire(K) || $("affaire").value || "—") : ($("affaire").value || "—"), "Support", `${I.repere || $("repere").value || "—"} – ${TYPES[D.typ].n}`],
    ["Client / site", [K.client, K.site].filter(Boolean).join(" – ") || "—", "Quantité", String(I.qte ?? ($("qte").value || "1"))], ["Lignes / isométrique", I.lignes || $("zone").value || "—", "Phase", ph],
    ["Rédacteur", $("auteur").value || K.realise || "—", "Date", new Date().toLocaleDateString("fr-FR")]];
  return `<table>${L.map((r) => `<tr><th style="width:18%">${r[0]}</th><td>${escH(r[1])}</td><th style="width:16%">${r[2]}</th><td>${escH(r[3])}</td></tr>`).join("")}</table>`;
}
const ndcExe = (ph) => `<div class="exe">NOTE DE PRÉDIMENSIONNEMENT – PHASE ${escH(ph || "APS/APD")} – NON VALABLE POUR EXÉCUTION</div>`;
function ndcHyp(D, V, court) {
  const T = V.Gm.T, L = [];
  L.push(["G – permanentes", "oui", `Poids propre des profilés (automatique) ; tuyauteries en service : ${T.map((t, i) => `${escH(t.nom)} q = ${f(t.P.qop, 3)} kN/m × ${f(+t.portee || 0, 2)} m${+t.Gsup ? ` + ${f(+t.Gsup, 2)} kN` : ""} → G = ${f(V.CC.detail[i].G, 2)} kN`).join(" ; ")}`, "NF EN 1991-1-1"]);
  L.push(["Q – exploitation", "—", "Support de tuyauterie sans accès ni stockage : pas de charge d'exploitation (équipements portés intégrés à G).", "NF EN 1991-1-1 §6"]);
  L.push(["T – température", D.cT ? "oui" : "non", D.cT ? `Frottement μ·G : ${T.map((t) => `${escH(t.nom)} μ = ${f(+t.mu || 0, 2)} (${t.fonc === "guide" ? "guidé" : t.fonc === "fixe" ? "point fixe" : "glissant"})`).join(" ; ")} ; efforts de point fixe saisis ou estimés. Action variable : ψ<sub>0</sub> = 0,6 ; ψ<sub>1</sub> = 0,5 ; ψ<sub>2</sub> = 0.` : "—", "NF EN 1990 Tab. A1.1 + AN"]);
  L.push(["W – vent", D.cW ? "oui" : "non", D.cW ? `q<sub>p</sub>(z) = ${f(D.qp, 3)} kN/m² ; tuyaux c<sub>f</sub> = ${f(D.cft, 2)} (sur D calorifugé) ; profilés c<sub>f</sub> ${D.cfp == null ? "selon AN fig. 7.39 à 7.50 (largeur projetée)" : "= " + f(D.cfp, 2)} ; directions ±X, ±Y. ψ<sub>0</sub> = 0,6.` : "—", "NF EN 1991-1-4 + AN (C1)"]);
  L.push(["S – neige", D.cS ? "oui" : "non", D.cS ? `s<sub>k</sub> = ${f(D.sk, 2)} kN/m² ; μ = ${f(D.mus, 2)} sur D calorifugé ; altitude ${D.altN ? "> 1000 m" : "≤ 1000 m"} (ψ<sub>0</sub> = ${D.altN ? "0,7" : "0,5"}).` : "—", "NF EN 1991-1-3 + AN (C1)"]);
  L.push(["E – séisme", D.cE ? "oui" : "non", D.cE ? `Éléments non structuraux : S<sub>a</sub> = α·S·[3(1 + z/H)/(1 + (1 − T<sub>a</sub>/T<sub>1</sub>)²) − 0,5] = ${f(V.CC.Sa, 3)} (α·S = ${f(D.aS, 3)} ; z/H = ${f(D.zH, 2)} ; T<sub>a</sub>/T<sub>1</sub> = ${f(D.TaT, 2)}) ; F<sub>a</sub> = S<sub>a</sub>·γ<sub>a</sub>/q<sub>a</sub>·G = ${f(V.CC.kE, 3)}·G (γ<sub>a</sub> = ${f(D.ga, 1)} ; q<sub>a</sub> = ${f(D.qa, 1)}) ; directions X et Y, 100 % / 30 %. Composante verticale non prise en compte.` : "—", "NF EN 1998-1 §4.3.5 + AN ; arrêté du 22/10/2010"]);
  L.push(["EP – épreuve", D.cEP ? "oui" : "non", D.cEP ? "Lignes à fluide moins dense que l'eau : situation d'épreuve où l'eau (classée Q) remplace le fluide de service ; combinaisons γ<sub>G</sub>·(G − G<sub>fl</sub>) + γ<sub>Q</sub>·E<sub>P</sub>, non combinées aux autres actions variables. Lignes à fluide aussi dense que l'eau : épreuve couverte par G." : "—", "—"]);
  if (["crap", "sand"].includes(document.getElementById("fix").value)) L.push(["Structure existante (profilé crapauté ou pris en sandwich)", "hors périmètre", `Le profilé existant ${escH(document.getElementById("crProf").value)} qui porte le support n'est pas vérifié par cette note : flexion locale de la semelle, effort tranchant, résistance et stabilité de l'élément, et transmission des efforts à l'ouvrage restent à justifier par le titulaire de l'ouvrage existant, avec les réactions d'appui de la présente note. ${document.getElementById("fix").value === "sand" ? "Serrage des tiges et contre-plaque : tiges vérifiées en traction et cisaillement, contre-plaque non dimensionnée." : "Glissement des crapauds : valeurs du catalogue ou frottement (NF EN 1993-1-8 §3.9)."}`, "NF EN 1993-1-1 §6.2 ; NF EN 1993-1-8 Tab. 3.4 et §3.9"]);
  if (court) return L.filter((l) => l[1] === "oui").map((l) => `<b>${l[0]}</b>`).join(" · ");
  return `<table><tr><th>Action</th><th>Prise en compte</th><th>Valeurs retenues</th><th>Référence</th></tr>${L.map((l) => `<tr><td><b>${l[0]}</b></td><td>${l[1]}</td><td>${l[2]}</td><td>${l[3]}</td></tr>`).join("")}</table>
    <div class="pied">Coefficients partiels : γ<sub>G</sub> = 1,35 / 1,00 ; γ<sub>Q</sub> = 1,50 (NF EN 1990 éq. 6.10 + AN) ; situation sismique G + A<sub>Ed</sub> (6.12b) ; γ<sub>M0</sub> = γ<sub>M1</sub> = 1,00 ; γ<sub>M2</sub> = 1,25 (NF EN 1993-1-1/NA, 1993-1-8/NA).</div>`;
}
const NDC_REF = [["NF EN 1990 + AN", "Bases de calcul : combinaisons 6.10, 6.12b ; coefficients ψ (Tab. A1.1)"], ["NF EN 1991-1-1 + AN", "Poids propres"], ["NF EN 1991-1-3 + AN", "Neige"], ["NF EN 1991-1-4 + AN", "Vent : q<sub>p</sub>(z), coefficients de force (§7.7, fig. 7.39 à 7.50 NA)"],
  ["NF EN 1993-1-1 + AN", "Résistance des sections (§6.2), stabilité (§6.3), ELS (§7)"], ["NF EN 1993-1-8 + AN", "Assemblages boulonnés (Tab. 3.4), frottement (§3.9)"], ["NF EN 1998-1 + AN", "Séisme : éléments non structuraux (§4.3.5)"], ["Arrêté du 22/10/2010 modifié", "Classification et règles parasismiques (bâtiments à risque normal)"]];
function ndcLiaisons(D, V) {
  const Gm = V.Gm, ddl = ["u<sub>x</sub>", "u<sub>y</sub>", "u<sub>z</sub>", "θ<sub>x</sub>", "θ<sub>y</sub>", "θ<sub>z</sub>"];
  let h = `<h3>Liaisons extérieures (appuis)</h3><table><tr><th>Appui</th><th>Position (y ; z) m</th><th>Type</th><th>Degrés de liberté</th></tr>` +
    Gm.appuis.map((a, i) => { const c = Gm.app[a.n] || a.c, bl = c.map((v, k) => v === 1 ? ddl[k] : null).filter(Boolean), rs = c.map((v, k) => v > 1 ? `${ddl[k]} : ressort ${f(v, 0)} kNm/rad` : null).filter(Boolean);
      const typ = c.slice(3).every((v) => v === 1) ? "Encastrement" : rs.length ? "Encastrement semi-rigide (platine)" : c.slice(0, 3).every((v) => v === 1) ? "Articulation" : "Appui"; return `<tr><td>A${i + 1} – ${escH(a.lib)}</td><td class="n">${f(a.pt[1], 2)} ; ${f(a.pt[2], 2)}</td><td>${typ}</td><td>bloqués : ${bl.join(", ") || "—"}${rs.length ? "<br>" + rs.join("<br>") : ""}</td></tr>`; }).join("") + "</table>";
  const L = [];
  const surBarre = (P, o) => { const v = P.map((x, k) => x - o.A[k]), s = v[0] * o.dir[0] + v[1] * o.dir[1] + v[2] * o.dir[2]; return s > -1e-6 && s < o.L + 1e-6 && Math.hypot(...v.map((x, k) => x - s * o.dir[k])) < 1e-6; };
  Gm.B.forEach((b, bi) => Gm.B.forEach((o, oi) => { if (oi <= bi || ![b.A, b.B].some((P) => surBarre(P, o)) && ![o.A, o.B].some((P) => surBarre(P, b))) return;
    L.push(`<tr><td>${escH(b.lib)} / ${escH(o.lib)}</td><td>${b.art || o.art ? "Articulation (bielle : effort normal seul, rotations libres)" : "Assemblage rigide (encastrement, soudé)"}</td></tr>`); }));
  Gm.T.forEach((t) => L.push(`<tr><td>${escH(t.nom)} → ${escH(Gm.B[t.bi].lib)}</td><td>Bras rigide (excentricité e = ${f(t.e * 1000, 0)} mm) ; ${t.fonc === "fixe" ? "point fixe : efforts dans les 3 directions" : t.fonc === "guide" ? "guidé : frottement axial + effort latéral" : "glissant : frottement μ·G axial"}</td></tr>`));
  return h + `<h3>Liaisons intérieures</h3><table><tr><th>Liaison</th><th>Modélisation</th></tr>${L.join("")}</table>`;
}
function ndcDDC(D, V, mode) {
  const env = enveloppe(V), cas = [["G", "G – permanentes"], ["T", "T – température ±"], ["S", "S – neige"], ["WY", "W<sub>y</sub> – vent transversal ±"], ["WX", "W<sub>x</sub> – vent longitudinal ±"], ["FL", "G<sub>fl</sub> – fluide en service (compris dans G)"], ["EP", "E<sub>P</sub> – eau d'épreuve"], ["EX", "E<sub>x</sub> – séisme ±"], ["EY", "E<sub>y</sub> – séisme ±"]];
  const th = COMP.map((c, i) => `<th class="n">${/\(/.test(c) ? c : c + (i < 3 ? " (kN)" : " (kNm)")}</th>`).join("");
  let h = `<div class="pied">Efforts exercés par le support sur l'ouvrage (repère SCU : X ∥ tuyaux, Y transversal, Z ↑ ; F<sub>z</sub> &lt; 0 descendant). Enveloppes non concomitantes (prudent). Valeurs de prédimensionnement.</div>`;
  env.forEach((E, ia) => { const a = E.a; h += `<h3>A${ia + 1} – ${escH(a.lib)}</h3><table><tr><th>Valeur</th>${th}</tr>`;
    if (mode !== "elu") cas.forEach(([c, n]) => { if (!V.R[c]) return; h += `<tr><td>${n} (caract.)</td>${V.R[c].reactions[a.n].map((x) => `<td class="n">${f(z0(-x), 2)}</td>`).join("")}</tr>`; });
    if (mode !== "cas") { h += `<tr><td><b>ELU – enveloppe</b></td>${E.ELU.map((e) => `<td class="n"><b>${f(z0(e.v), 2)}</b></td>`).join("")}</tr>`;
      if (V.res.some((r) => r.c.type === "Sismique")) h += `<tr><td><b>Sismique – enveloppe</b></td>${E.SIS.map((e) => `<td class="n"><b>${f(z0(e.v), 2)}</b></td>`).join("")}</tr>`; }
    h += "</table>"; });
  return h;
}
/* efforts de la section la plus sollicitée d'une barre logique pour une combinaison (critère « stabilité » ou « cisaillement ») */
function ndcEfforts(V, bi, comb, crit) {
  const P = V.PB[bi], R = P.R, St = P.St; let best = null;
  V.Gm.elemBarre.forEach((eb, k) => { if (eb.bi !== bi) return; [0, eb.L / 2, eb.L].forEach((s) => {
    const F = Barres3D.interne(V.R.G.elems[k], s).map(() => 0), sum = Object.entries(comb.b).reduce((o, [c, kk]) => { if (!V.R[c] || !kk) return o; const v = Barres3D.interne(V.R[c].elems[k], s); return o.map((x, i) => x + kk * v[i]); }, F);
    const [N, Vy, Vz, T, My, Mz] = sum; let r;
    if (crit === "B") { if (N < 0) { const n = -N / (St.chiN * R.NRk), kf = Math.min(1 + 0.6 * Math.min(St.lam, 1) * n, 1 + 0.6 * n); r = { v: n + kf * Math.abs(My) / (St.chiLT * R.MyRk) + kf * Math.abs(Mz) / R.MzRk, n, kf }; } else r = { v: Math.abs(My) / (St.chiLT * R.MyRk) + Math.abs(Mz) / R.MzRk + N / R.NRk, n: 0, kf: 1 }; }
    else { const rt = Math.abs(T) * 1e6 / R.Wt / (R.fy / Math.sqrt(3)); r = { v: Math.max(Math.abs(Vz) / R.Vz, Math.abs(Vy) / R.Vy) + rt, rt }; }
    if (!best || r.v > best.r.v) best = { F: sum, x: eb.s0 + s, r }; }); });
  return best;
}
function ndcFormules(D, V) {
  const nu = $("nuance").value; let h = "";
  V.PB.forEach((P, bi) => {
    const R = P.R, St = P.St, p = P.b.p, e = P.eff, Ax = p.A * 1e-4;
    h += `<h3>${escH(P.b.lib)} – ${escH(p.n)} (${nu}, f<sub>y</sub> = ${f(R.fy, 0)} MPa, classe ${R.cl}${R.isL ? ", cornière : axes principaux u, v" : ""})</h3><table class="form">`;
    if (e) { const [N, , , , My, Mz] = e.F, a = Math.abs(N) / R.NRk, b = Math.abs(My) / R.MyRk, c = Math.abs(Mz) / R.MzRk;
      h += `<tr><td>Résistance de section<br><span class="pied">NF EN 1993-1-1 §6.2.1(7), γ<sub>M0</sub> = 1,0</span></td><td>Combinaison ${P.cS ? P.cS.nom : "—"} ; x = ${f(e.x, 2)} m : N<sub>Ed</sub> = ${f(N, 2)} kN ; M<sub>y,Ed</sub> = ${f(My, 3)} kNm ; M<sub>z,Ed</sub> = ${f(Mz, 3)} kNm<br>
        N<sub>Rk</sub> = A·f<sub>y</sub> = ${f(p.A, 2)} cm² × ${f(R.fy, 0)} = ${f(R.NRk, 1)} kN ; M<sub>y,Rk</sub> = W<sub>y</sub>·f<sub>y</sub> = ${f(R.Wy * 1e6, 2)} cm³ × ${f(R.fy, 0)} = ${f(R.MyRk, 2)} kNm ; M<sub>z,Rk</sub> = ${f(R.Wz * 1e6, 2)} cm³ × ${f(R.fy, 0)} = ${f(R.MzRk, 2)} kNm<br>
        |N<sub>Ed</sub>|/N<sub>Rk</sub> + |M<sub>y,Ed</sub>|/M<sub>y,Rk</sub> + |M<sub>z,Ed</sub>|/M<sub>z,Rk</sub> = ${f(a, 3)} + ${f(b, 3)} + ${f(c, 3)}${P.rW > 0.005 ? ` + σ<sub>w</sub>/f<sub>y</sub> ${f(P.rW, 3)}` : ""} = <b>${f(P.rS, 3)}</b> → ${ok(P.rS)}</td></tr>`; }
    if (P.cV) { const E = ndcEfforts(V, bi, P.cV, "V"), [, Vy, Vz, T] = E.F;
      h += `<tr><td>Cisaillement + torsion<br><span class="pied">§6.2.6, §6.2.7</span></td><td>Combinaison ${P.cV.nom} : V<sub>z,Ed</sub> = ${f(Vz, 2)} kN ; V<sub>y,Ed</sub> = ${f(Vy, 2)} kN ; T<sub>Ed</sub> = ${f(T, 3)} kNm<br>
        V<sub>pl,z,Rd</sub> = A<sub>v,z</sub>·f<sub>y</sub>/(√3·γ<sub>M0</sub>) = ${f(R.Vz, 1)} kN ; V<sub>pl,y,Rd</sub> = ${f(R.Vy, 1)} kN ; τ<sub>t</sub> = T/W<sub>t</sub> (W<sub>t</sub> = ${f(R.Wt / 1000, 2)} cm³)<br>
        max(V<sub>z</sub>/V<sub>pl,z</sub> ; V<sub>y</sub>/V<sub>pl,y</sub>) + τ<sub>t</sub>/(f<sub>y</sub>/√3) = <b>${f(P.rV, 3)}</b> → ${ok(P.rV)}</td></tr>`; }
    if (P.cB) { const E = ndcEfforts(V, bi, P.cB, "B"), [N, , , , My, Mz] = E.F, Phi = 0.5 * (1 + St.alpha * (St.lam - 0.2) + St.lam ** 2);
      h += `<tr><td>Stabilité (flambement${St.chiLT < 1 ? ", déversement" : ""})<br><span class="pied">§6.3.1, §6.3.2, interaction simplifiée</span></td><td>L<sub>cr</sub> = ${f(St.Lcr, 2)} m ; λ<sub>1</sub> = 93,9·ε = ${f(St.l1, 1)} ; λ̄ = L<sub>cr</sub>/(i·λ<sub>1</sub>) = ${f(St.lam, 3)} ; courbe ${escH(St.courbe)}, α = ${f(St.alpha, 2)}<br>
        Φ = 0,5·[1 + α(λ̄ − 0,2) + λ̄²] = ${f(Phi, 3)} ; χ = 1/(Φ + √(Φ² − λ̄²)) = <b>${f(St.chiN, 3)}</b>${St.chiLT < 1 ? ` ; M<sub>cr</sub> = ${f(St.mcr, 2)} kNm ; λ̄<sub>LT</sub> = ${f(St.lamLT, 3)} ; χ<sub>LT</sub> = ${f(St.chiLT, 3)}` : ""}<br>
        Combinaison ${P.cB.nom} : N<sub>Ed</sub> = ${f(N, 2)} kN ; M<sub>y,Ed</sub> = ${f(My, 3)} ; M<sub>z,Ed</sub> = ${f(Mz, 3)} kNm${N < 0 ? ` ; n = |N|/(χ·N<sub>Rk</sub>) = ${f(E.r.n, 3)} ; k = 1 + 0,6·λ̄·n ≤ 1 + 0,6·n = ${f(E.r.kf, 3)}<br>
        n + k·|M<sub>y</sub>|/(χ<sub>LT</sub>·M<sub>y,Rk</sub>) + k·|M<sub>z</sub>|/M<sub>z,Rk</sub>` : " (traction) : |M<sub>y</sub>|/(χ<sub>LT</sub>·M<sub>y,Rk</sub>) + |M<sub>z</sub>|/M<sub>z,Rk</sub> + N/N<sub>Rk</sub>"}${P.rW > 0.005 ? " + σ<sub>w</sub>/f<sub>y</sub>" : ""} = <b>${f(P.rB, 3)}</b> → ${ok(P.rB)}</td></tr>`; }
    h += `<tr><td>Déplacement (ELS)<br><span class="pied">§7.2 + AN, combinaisons caractéristiques</span></td><td>${V.eD.bi === bi ? `${escH(V.eD.lib)} : d = ${f(V.eD.d, 2)} mm ≤ min(L/${D.dlim} ; ${D.dmax} mm) = ${f(V.eD.lim, 2)} mm (${V.eD.c.nom}) → ` : ""}taux maxi sur la barre ${ok(P.rD)}</td></tr></table>`;
  });
  return h;
}
/* diagrammes : rendu par le module « Diagrammes » de S1 (sans toucher aux choix de l'utilisateur) */
function ndcDiagrammes(D, V) {
  const sv = { ...dgEtat }, out = {};
  try { ["N", "Vp", "Mp", "Vh", "Mh", "T"].forEach((k) => { dgEtat.k = k; dgEtat.c = null; dgEtat.e = null; dgEtat.v = "auto"; diagrammes(D, V); out[k] = $("vDiag").innerHTML; if (k === "N") { out.def = $("vDef").innerHTML; out.tab = $("rDiag").querySelector("table")?.outerHTML || ""; } }); }
  finally { Object.assign(dgEtat, sv); diagrammes(D, V); }
  return out;
}
const lay2 = (a, b) => `<table class="lay"><tr><td style="width:50%">${a}</td><td style="width:50%">${b}</td></tr></table>`;

/* ---------- document ---------- */
async function ndcRendre(horsEcran) {
  calc(); const { D, V } = dernier, K = CAHIER.existe() ? CAHIER.lire().affaire : {}, ph = K.phase || "APS/APD", simple = NDC.niveau === "simple";
  const S = (k) => NDC.niveau === "complet" || (NDC.niveau === "perso" && NDC.sec[k]);
  const lg = V.lignes, verdict = V.gov.r <= 1, masse = V.Gm.B.reduce((s, b) => s + b.p.m * b.L, 0), fx = fixations(D, V);
  let h = `<div class="ndc ${simple ? "simple" : ""}"><h1>${escH(ndcTitre())}</h1>${ndcIdent(D, V)}${ndcExe(ph)}`;
  const tabVerif = `<table><tr><th>Critère</th><th>Barre / combinaison</th><th class="n">Taux</th></tr>${lg.map((l) => `<tr><td>${l.n.replace(/ – .*$/, "")}</td><td>${l.n.replace(/^.* – /, "")}<br><span class="pied">${escH(l.comb)}</span></td><td class="n">${ok(l.r)}</td></tr>`).join("")}
    ${fx.filter((o) => ((o.mode === "tige" || o.mode === "sand") && o.I && o.I.v > 0) || (o.mode === "crap" && o.rT != null)).map((o) => `<tr><td>Fixations ${o.mode === "tige" ? "(tiges)" : o.mode === "sand" ? "(tiges, sandwich)" : "(crapauds)"}</td><td>${escH(o.ap.lib)}</td><td class="n">${ok(Math.max(o.rT || 0, o.rS || 0, o.I?.v || 0))}</td></tr>`).join("")}</table>`;
  const synth = `<div style="font-size:16px;font-weight:800;margin:4px 0;color:${verdict ? "#1d7a36" : "#c0141c"}">${verdict ? "✔ SUPPORT VÉRIFIÉ" : "✘ SUPPORT NON VÉRIFIÉ"} – taux maxi ${f(V.gov.r * 100, 0)} %</div>
    <div class="pied">Critère dimensionnant : ${V.gov.n.replace(/<[^>]+>/g, "")}</div>`;
  if (simple) {
    h += lay2(vueFace(D, V, { num: false }), synth + tabVerif);
    h += `<table><tr><th style="width:22%">Profilés</th><td>${V.Gm.B.map((b) => `${escH(b.lib)} : <b>${escH(b.p.n)}</b>`).join(" · ")} — ${$("nuance").value} — masse ≈ ${f(masse, 1)} kg</td></tr>
      <tr><th>Tuyauteries</th><td>${V.Gm.T.map((t, i) => `${escH(t.nom)} : ${escH(t.P.desc)}, portée ${f(+t.portee || 0, 2)} m, G = ${f(V.CC.detail[i].G, 2)} kN`).join("<br>")}</td></tr>
      <tr><th>Actions</th><td>${ndcHyp(D, V, true)}${D.cW ? ` (q<sub>p</sub> = ${f(D.qp, 2)} kN/m²)` : ""}${D.cE ? ` (S<sub>a</sub> = ${f(V.CC.Sa, 2)})` : ""} — combinaisons NF EN 1990 6.10${D.cE ? " et 6.12b" : ""} (${V.res.length} ELU, ${V.CAR.length} ELS)</td></tr>
      <tr><th>Modèle</th><td>Barres 3D élastique 1<sup>er</sup> ordre ; platines ${D.platine === "rigide" ? "encastrées" : "semi-rigides"} ; NF EN 1993-1-1 + AN (γ<sub>M0</sub> = γ<sub>M1</sub> = 1,0)</td></tr></table>`;
    const env = enveloppe(V), sis = V.res.some((r) => r.c.type === "Sismique");
    h += `<h3>Descente de charges sur l'ouvrage (enveloppes, par support, repère SCU)</h3><table><tr><th>Appui</th><th>Valeur</th>${COMP.map((c) => `<th class="n">${c}</th>`).join("")}</tr>` +
      env.map((E, i) => `<tr><td>A${i + 1} – ${escH(E.a.lib)}</td><td>ELU</td>${E.ELU.map((e) => `<td class="n">${f(z0(e.v), 2)}</td>`).join("")}</tr>` + (sis ? `<tr><td></td><td>Sismique</td>${E.SIS.map((e) => `<td class="n">${f(z0(e.v), 2)}</td>`).join("")}</tr>` : "")).join("") + "</table>";
    if (!NDC.sansCommun && typeof NOTES !== "undefined") { const dl = NOTES.liste();
      if (dl.length) h += `<div class="pied"><b>Documents de référence</b> : ${dl.map((d) => escH([d.ref, d.ind && "ind. " + d.ind].filter(Boolean).join(" ") + (d.titre ? " – " + d.titre : ""))).join(" ; ")}.</div>`;
      h += `<div class="pied"><b>Unités</b> : longueurs m (sections et cotes en mm), forces kN, moments kN·m, charges kN/m et kN/m², contraintes MPa, déplacements mm, taux en % ; repère X axe des tuyaux, Y transversal, Z vertical ascendant.</div>`; }
    h += `<div class="pied">Références : NF EN 1990, 1991-1-1/-3/-4, 1993-1-1, 1993-1-8, 1998-1 et leurs annexes nationales françaises. Outil FIP Études S1 ${typeof CALC_VERSION !== "undefined" ? CALC_VERSION : ""} – résultats à vérifier par un ingénieur qualifié.</div></div>`;
  } else {
    let n = 0; const T2 = (t) => `<h2>${++n}. ${t}</h2>`;
    h += T2("Synthèse") + synth + tabVerif;
    if (S("docs") && !NDC.sansCommun && typeof NOTES !== "undefined" && NOTES.liste().length) h += T2("Documents de référence") + NOTES.docs();
    if (S("unites") && !NDC.sansCommun && typeof NOTES !== "undefined") h += T2("Unités et conventions") + NOTES.unites("s1");
    if (S("ref")) h += T2("Références normatives") + `<table>${NDC_REF.map((r) => `<tr><td style="width:30%"><b>${r[0]}</b></td><td>${r[1]}</td></tr>`).join("")}</table>`;
    if (S("hyp")) h += T2("Hypothèses de charges") + ndcHyp(D, V);
    if (S("mat")) h += T2("Matériaux et sections") + $("rData").innerHTML;
    if (S("mod")) { let img = ""; try { await perspective(); const s = $("imgPersp").src; if (/^data:image\/png/.test(s)) img = `<img src="${s}" alt="Perspective 3D">`; } catch (e) { }
      h += T2("Modèle (2D et 3D)") + lay2(vueFace(D, V, { num: false }), vueCote(D, V, { num: false })) + (img ? `<div style="text-align:center">${img}</div>` : "") + `<div class="pied">Vues : cotes en mm ; charges G (rouge), vent (bleu), frottement / dilatation (orange). Repère X ∥ tuyaux, Y transversal, Z vertical.</div>`;
      h += `<h3>Numérotation du modèle : nœuds, barres et liaisons</h3>` + lay2(vueFace(D, V, { num: true }), vueCote(D, V, { num: true })) + tableauTopoS1(V, "h3"); }
    if (S("liai")) h += T2("Liaisons") + ndcLiaisons(D, V);
    if (S("chg")) h += T2("Chargement par cas (valeurs caractéristiques)") + $("rCharges").innerHTML;
    if (S("comb")) h += T2("Combinaisons d'actions") + `<p>${V.res.filter((r) => r.c.type === "ELU").length} combinaisons ELU fondamentales (NF EN 1990 éq. 6.10 + AN)${V.res.some((r) => r.c.type === "Sismique") ? `, ${V.res.filter((r) => r.c.type === "Sismique").length} combinaisons sismiques (6.12b, 100 % / 30 %)` : ""}, ${V.CAR.length} combinaisons ELS caractéristiques (6.14b).</p>` + $("rComb").innerHTML + `<h3>Combinaisons ELS caractéristiques</h3><p class="pied">${V.CAR.map((c) => c.nom).join(" ; ")}</p>`;
    if (S("ddc")) h += T2("Descente de charges") + ndcDDC(D, V, NDC.ddc);
    let dg = null; if (S("elu") || S("els")) dg = ndcDiagrammes(D, V);
    if (S("elu")) { const sig = (k) => /[1-9]/.test((dg[k].match(/<text[^>]*font-weight="700"[^>]*>([^<]*)</) || [])[1] || "1");
      h += T2("Résultats ELU – efforts internes (combinaison dimensionnante)") + lay2(dg.N, dg.Vp) + lay2(dg.Mp, dg.Mh) + (sig("T") ? lay2(dg.Vh, dg.T) : "") + dg.tab; }
    if (S("els")) h += T2("Résultats ELS – déformée et déplacements") + `<div style="max-width:120mm;margin:auto">${dg.def}</div><p>Déplacement maximal : <b>${f(V.eD.d, 2)} mm</b> (${escH(V.eD.lib)}, ${V.eD.c.nom}) ≤ min(L/${D.dlim} ; ${D.dmax} mm) = ${f(V.eD.lim, 2)} mm → ${ok(V.eD.r)}</p>`;
    if (S("verif")) h += T2("Vérifications") + (NDC.formules === "detail" ? ndcFormules(D, V) : $("rRatios").innerHTML + $("rBarres").innerHTML) + `<h3>Entraxes entre tuyauteries</h3>` + tableEntraxes(D, V);
    if (S("fix")) h += T2("Fixations sur l'ouvrage") + tableFix(D, V);
    if (S("alert")) { const A = alertes(D, V); h += T2("Alertes de conception, hypothèses et limites") + (A.length ? `<table>${A.map((a) => `<tr><td style="width:5%">${a.niv === "bloq" ? "⛔" : a.niv === "warn" ? "⚠" : "ℹ"}</td><td><b>${a.titre}</b><br>${a.txt}<br><span class="pied">${a.ref || ""}</span></td></tr>`).join("")}</table>` : "<p>Aucune alerte de conception.</p>") + $("rNotes").innerHTML; }
    h += `<div class="pied">Outil FIP Études S1 ${typeof CALC_VERSION !== "undefined" ? CALC_VERSION : ""} – note générée le ${new Date().toLocaleString("fr-FR")} – résultats à vérifier par un ingénieur qualifié.</div></div>`;
  }
  const hote = horsEcran ? $("ndcHors") : $("ndcCorps"); hote.innerHTML = h;
  return hote.firstElementChild;
}
async function ndcOuvrir() { $("ndcModal").hidden = false; $("ndcCorps").innerHTML = '<div class="msg info">⏳ Génération de la note…</div>'; await ndcRendre(false); }
