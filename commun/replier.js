/* =====================================================================
   CARTES REPLIABLES (bouton − / +) — commun à toutes les pages
   Clic sur le titre d'une carte (h2) : replie / déplie la carte. État mémorisé
   par page (localStorage). Bouton « Tout replier / déplier » dans l'en-tête.
   À l'impression, les cartes repliées sont imprimées dépliées.
   ===================================================================== */
const REPLIER = (() => {
  const SEL = ".card, section.repl";                         // conteneurs repliables (titre = h2 enfant direct)
  const cle = "fip.replie." + location.pathname.replace(/index\.html$/, "");
  const lire = () => { try { return JSON.parse(localStorage.getItem(cle)) || {}; } catch (e) { return {}; } };
  const ecrire = (o) => { try { localStorage.setItem(cle, JSON.stringify(o)); } catch (e) { } };
  const id = (c) => { const h = c.querySelector(":scope > h2"); return c.id || (h ? h.textContent.replace(/[−+]\s*$/, "").trim().slice(0, 60) : ""); };
  const cartes = () => [...document.querySelectorAll(SEL)].filter((c) => c.querySelector(":scope > h2"));
  function basculer(c, etat) {
    const r = etat === undefined ? !c.classList.contains("replie") : etat;
    c.classList.toggle("replie", r); const o = lire(), k = id(c); if (k) { if (r) o[k] = 1; else delete o[k]; ecrire(o); }
  }
  function appliquer() { const o = lire(); cartes().forEach((c) => { c.classList.add("repliable"); if (o[id(c)]) c.classList.add("replie"); }); }
  function init() {
    const st = document.createElement("style");
    st.textContent = `.repliable>h2{cursor:pointer;user-select:none;position:relative;padding-right:26px}
.repliable>h2::after{content:"−";position:absolute;right:0;top:50%;transform:translateY(-50%);width:20px;height:20px;line-height:18px;text-align:center;border:1px solid var(--line,#d6dbe1);border-radius:4px;color:var(--fip-bleu,#114088);font-size:14px;font-weight:700;background:#fff;letter-spacing:0}
.repliable.replie>h2::after{content:"+"}
.repliable.replie>:not(h2){display:none!important}.card.repliable.replie{padding-bottom:4px}.card.repliable.replie>h2{margin-bottom:6px}
@media print{.repliable>h2::after{display:none}.repliable.replie>:not(h2):not(.noprint){display:revert!important}}`;
    document.head.appendChild(st);
    document.addEventListener("click", (e) => { const h = e.target.closest(".repliable>h2"); if (h && !e.target.closest("input,select,button,a")) basculer(h.parentElement); });
    appliquer(); new MutationObserver(() => { cartes().forEach((c) => { if (!c.classList.contains("repliable")) { c.classList.add("repliable"); if (lire()[id(c)]) c.classList.add("replie"); } }); }).observe(document.body, { childList: true, subtree: true });
    const hd = document.querySelector("header");
    if (hd) {
      const b = document.createElement("button"); b.type = "button"; b.className = "sec noprint"; b.title = "Replier / déplier toutes les cartes"; b.textContent = "⊟ Tout replier";
      b.onclick = () => { const tout = cartes().some((c) => !c.classList.contains("replie")); cartes().forEach((c) => basculer(c, tout)); b.textContent = tout ? "⊞ Tout déplier" : "⊟ Tout replier"; };
      const premier = hd.querySelector(":scope > button, :scope > a.noprint, :scope > .actions"); if (premier) premier.before(b); else hd.appendChild(b);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  return { basculer, appliquer };
})();
