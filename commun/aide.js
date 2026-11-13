/* =====================================================================
   AIDE INTÉGRÉE — commun à toutes les calculettes
   - bouton « ❓ Aide » dans l'en-tête : panneau latéral avec tutoriel pas à pas
     (bouton « Montrer » : défile vers la zone et la met en évidence), questions
     fréquentes et recherche par mots-clés dans l'aide ;
   - bulles « ? » à côté des champs : explication courte (survol ou clic).
   Utilisation : AIDE.init({ titre, intro, etapes:[{t, html, cible}], faq:[{q, r}],
                             bulles:{ idChamp: 'texte' }, bullesK:{ 'data-k': 'texte' } })
   ===================================================================== */
const AIDE = (() => {
  let cfg = null, panneau = null;
  const BASE = (document.currentScript && document.currentScript.src.replace(/commun\/aide\.js.*$/, "")) || "../";
  const urlRef = (id) => BASE + "referentiel/#" + id;
  const css = `
.aide-q{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;margin-left:4px;border-radius:50%;background:#e7eef8;color:#114088;font:700 10px/1 Inter,Arial,sans-serif;cursor:help;vertical-align:middle;border:1px solid #b9cbe6;flex:none}
.aide-q:hover{background:#114088;color:#fff}
.aide-pop{position:fixed;z-index:9999;max-width:320px;background:#171a1e;color:#fff;font:400 12.5px/1.45 Inter,Arial,sans-serif;padding:8px 10px;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,.25)}
.aide-pan{position:fixed;top:0;right:0;bottom:0;width:min(440px,100vw);z-index:9998;background:#fff;box-shadow:-8px 0 24px rgba(0,0,0,.18);display:flex;flex-direction:column;transform:translateX(105%);transition:transform .2s}
.aide-pan.on{transform:none}
.aide-pan header{padding:12px 14px;border-bottom:3px solid #114088;display:flex;align-items:center;gap:8px}
.aide-pan header h2{font-size:16px;margin:0;flex:1}
.aide-pan .corps{overflow:auto;padding:12px 14px;font-size:13.5px;line-height:1.5}
.aide-pan h3{font-size:13px;color:#114088;text-transform:uppercase;letter-spacing:.04em;margin:16px 0 6px;border-left:3px solid #e30009;padding-left:7px}
.aide-pan ol{padding-left:0;list-style:none;counter-reset:e;margin:0}
.aide-pan ol>li{counter-increment:e;border:1px solid #e1e5ea;border-radius:8px;padding:8px 10px 8px 38px;margin:6px 0;position:relative}
.aide-pan ol>li:before{content:counter(e);position:absolute;left:9px;top:8px;width:20px;height:20px;border-radius:50%;background:#114088;color:#fff;font-weight:700;font-size:12px;text-align:center;line-height:20px}
.aide-pan ol>li b.t{display:block;margin-bottom:2px}
.aide-pan details{border-bottom:1px solid #eef0f3;padding:6px 0}.aide-pan summary{cursor:pointer;font-weight:600;color:#171a1e}
.aide-pan input.cherche{width:100%;padding:8px 10px;border:1px solid #cfd4db;border-radius:6px;font:inherit}
.aide-pan .res{margin-top:8px}.aide-pan .res .it{border-left:3px solid #0098db;background:#f4f8fd;padding:6px 8px;margin:6px 0;border-radius:4px}
.aide-pan button.montrer{padding:2px 8px;font-size:11px;margin-top:4px}
.aide-ref{margin-left:6px;text-decoration:none;font-size:13px;vertical-align:middle;letter-spacing:0;text-transform:none}.aide-ref:hover{filter:brightness(1.2)}
.aide-flash{outline:3px solid #e30009!important;outline-offset:3px;transition:outline-color .4s}
@media print{.aide-q,.aide-pan,.aide-pop{display:none!important}}`;
  const sansAccent = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  let pop = null;
  function bulle(el, texte) {
    const q = document.createElement("span"); q.className = "aide-q noprint"; q.textContent = "?"; q.tabIndex = 0; q.setAttribute("aria-label", "Aide : " + texte.replace(/<[^>]+>/g, ""));
    const montrer = () => { cacher(); pop = document.createElement("div"); pop.className = "aide-pop"; pop.innerHTML = texte; document.body.appendChild(pop);
      const r = q.getBoundingClientRect(), w = Math.min(320, innerWidth - 16); pop.style.maxWidth = w + "px";
      let x = Math.min(Math.max(8, r.left - 20), innerWidth - pop.offsetWidth - 8), y = r.bottom + 6; if (y + pop.offsetHeight > innerHeight - 8) y = r.top - pop.offsetHeight - 6;
      pop.style.left = x + "px"; pop.style.top = y + "px"; };
    const cacher = () => { if (pop) { pop.remove(); pop = null; } };
    q.addEventListener("mouseenter", montrer); q.addEventListener("mouseleave", cacher); q.addEventListener("focus", montrer); q.addEventListener("blur", cacher);
    q.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); pop ? cacher() : montrer(); });
    el.appendChild(q);
  }
  function labelDe(el) {                                     // libellé associé à un champ
    if (el.id) { const l = document.querySelector(`label[for="${el.id}"]`); if (l) return l; }
    const lp = el.closest("label"); if (lp) return lp;
    let p = el.previousElementSibling; while (p && p.tagName !== "LABEL") p = p.previousElementSibling; if (p) return p;
    const par = el.parentElement; if (par) { const l = par.querySelector(":scope > label"); if (l) return l; const pp = par.parentElement && par.parentElement.querySelector(":scope > label"); if (pp) return pp; }
    return null;
  }
  function poserBulles() {
    Object.entries(cfg.bulles || {}).forEach(([id, t]) => { const el = document.getElementById(id); if (!el) return; const l = labelDe(el); if (l && !l.querySelector(".aide-q")) bulle(l, t); });
    Object.entries(cfg.bullesK || {}).forEach(([k, t]) => document.querySelectorAll(`[data-k="${k}"]`).forEach((el) => { const l = labelDe(el); if (l && !l.querySelector(".aide-q")) bulle(l, t); }));
  }
  function poserLiens() {                                    // 📘 vers le référentiel dans le titre des cartes concernées
    (cfg.liens || []).forEach(([sel, id, lib]) => document.querySelectorAll(sel).forEach((el) => {
      const h2 = el.matches("h2") ? el : (el.closest(".card") || el).querySelector("h2"); if (!h2 || h2.querySelector(`.aide-ref[data-r="${id}"]`)) return;
      const a = document.createElement("a"); a.className = "aide-ref noprint"; a.dataset.r = id; a.href = urlRef(id); a.target = "_blank"; a.rel = "noopener"; a.textContent = "📘"; a.title = "Référentiel : " + (lib || id) + " (nouvel onglet)";
      a.addEventListener("click", (e) => e.stopPropagation()); h2.appendChild(a); }));
  }
  function montrer(sel) {
    const el = document.querySelector(sel); if (!el) return;
    const carte = el.closest(".card"); if (carte && carte.classList.contains("replie")) carte.classList.remove("replie");
    const pan = el.closest(".panel"); if (pan && !pan.classList.contains("on")) { const b = document.querySelector(`#tabs button[data-p="${pan.id}"]`); if (b) b.click(); }
    el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("aide-flash"); setTimeout(() => el.classList.remove("aide-flash"), 2200);
    if (innerWidth < 900) panneau.classList.remove("on");
  }
  function chercher(q) {
    const mots = sansAccent(q).split(/[^a-z0-9]+/).filter((m) => m.length > 2);
    if (!mots.length) return "";
    const items = [...(cfg.faq || []).map((f) => ({ t: f.q, h: f.r })), ...(cfg.etapes || []).map((e) => ({ t: e.t, h: e.html, cible: e.cible })),
      ...Object.entries(cfg.bulles || {}).map(([id, t]) => ({ t: (labelDe(document.getElementById(id) || document.body) || {}).textContent || id, h: t, cible: "#" + id }))];
    const sc = items.map((it) => { const txt = sansAccent(it.t + " " + it.h.replace(/<[^>]+>/g, " ")); return { it, s: mots.reduce((s, m) => s + (txt.includes(m) ? (sansAccent(it.t).includes(m) ? 3 : 1) : 0), 0) }; })
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 6);
    return sc.length ? sc.map(({ it }) => `<div class="it"><b>${it.t.replace(/\?$/, "").trim()}</b><div>${it.h}</div>${it.cible ? `<button class="sec montrer" data-c="${it.cible}">Montrer</button>` : ""}</div>`).join("")
      : `<div class="note">Rien trouvé dans l'aide. Reformuler avec d'autres mots (ex. « portée », « pince », « vent », « taux »).</div>`;
  }
  function construire() {
    panneau = document.createElement("aside"); panneau.className = "aide-pan noprint"; panneau.setAttribute("aria-label", "Aide");
    panneau.innerHTML = `<header><h2>❓ ${cfg.titre || "Aide"}</h2><button class="sec" type="button" data-x>✕</button></header><div class="corps">
      ${cfg.intro ? `<div>${cfg.intro}</div>` : ""}
      <h3>Une question ?</h3><input class="cherche" placeholder="Ex. : que mettre dans la portée ? pourquoi le taux est jaune ?" aria-label="Rechercher dans l'aide"><div class="res"></div>
      ${(cfg.etapes || []).length ? `<h3>Tutoriel pas à pas</h3><ol>${cfg.etapes.map((e) => `<li><b class="t">${e.t}</b>${e.html}${e.cible ? `<div><button class="sec montrer" data-c="${e.cible}">Montrer</button></div>` : ""}</li>`).join("")}</ol>` : ""}
      ${(cfg.faq || []).length ? `<h3>Questions fréquentes</h3>${cfg.faq.map((f) => `<details><summary>${f.q}</summary><div>${f.r}</div></details>`).join("")}` : ""}
      ${(cfg.liens || []).length ? `<h3>Pour comprendre (Référentiel)</h3><div>${[...new Map(cfg.liens.map((l) => [l[1], l[2] || l[1]])).entries()].map(([id, lib]) => `<a href="${urlRef(id)}" target="_blank" rel="noopener">📘 ${lib}</a>`).join("<br>")}</div>` : ""}
      <h3>À savoir</h3><div class="note">Les « ? » à côté des champs donnent une explication courte. Les résultats sont des prédimensionnements (APS/APD) à faire valider par un ingénieur structure.</div></div>`;
    document.body.appendChild(panneau);
    panneau.querySelector("[data-x]").onclick = () => panneau.classList.remove("on");
    const inp = panneau.querySelector(".cherche"), res = panneau.querySelector(".res");
    inp.addEventListener("input", () => { res.innerHTML = chercher(inp.value); });
    panneau.addEventListener("click", (e) => { const b = e.target.closest(".montrer"); if (b) montrer(b.dataset.c); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") panneau.classList.remove("on"); });
  }
  function init(c) {
    cfg = c; const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    construire();
    const hd = document.querySelector("header");
    if (hd) { const b = document.createElement("button"); b.type = "button"; b.className = "sec noprint"; b.textContent = "❓ Aide"; b.title = "Tutoriel, questions fréquentes et recherche dans l'aide";
      b.onclick = () => panneau.classList.toggle("on"); const p = hd.querySelector(":scope > button, :scope > a.noprint"); if (p) p.before(b); else hd.appendChild(b); }
    poserBulles(); poserLiens(); let att = false; new MutationObserver(() => { if (att) return; att = true; requestAnimationFrame(() => { att = false; poserBulles(); poserLiens(); }); }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", () => { if (pop) { pop.remove(); pop = null; } });
  }
  return { init, montrer, urlRef };
})();
