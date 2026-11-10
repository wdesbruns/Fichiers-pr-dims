/* =====================================================================
   CONNEXION « BARRIÈRE DE POLITESSE »
   ---------------------------------------------------------------------
   Site statique (GitHub Pages) : cette connexion évite l'accès fortuit
   mais n'est PAS une sécurité forte (pas de serveur). Ne pas y mettre
   de données confidentielles et ne pas réutiliser un vrai mot de passe.
   Pour une vraie protection : Cloudflare Pages + Cloudflare Access.
   ===================================================================== */
const CALC_SEL = "calculettes|";
const CALC_CLE = "calculettes.session";
const CALC_DUREE_H = 12;          // durée de session (« Rester connecté » : 30 jours)

async function calcEmpreinte(u, p) {
  const d = new TextEncoder().encode(CALC_SEL + String(u).trim().toLowerCase() + "|" + p);
  const b = await crypto.subtle.digest("SHA-256", d);
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function calcLire(store) {
  try { const s = JSON.parse(store.getItem(CALC_CLE)); return s && s.exp > Date.now() ? s : null; }
  catch (e) { return null; }
}

function calcSession() {
  let s = null;
  try { s = calcLire(sessionStorage) || calcLire(localStorage); } catch (e) {}
  return s;
}

async function calcConnexion(u, p, memoriser) {
  const h = await calcEmpreinte(u, p);
  const ok = (typeof CALC_UTILISATEURS !== "undefined" ? CALC_UTILISATEURS : [])
    .find(x => x.u.toLowerCase() === String(u).trim().toLowerCase() && x.h === h);
  if (!ok) return false;
  const duree = (memoriser ? 30 * 24 : CALC_DUREE_H) * 3600e3;
  const s = JSON.stringify({ u: ok.u, exp: Date.now() + duree });
  try { (memoriser ? localStorage : sessionStorage).setItem(CALC_CLE, s); } catch (e) {}
  return true;
}

function calcDeconnexion(racine) {
  try { localStorage.removeItem(CALC_CLE); } catch (e) {}
  try { sessionStorage.removeItem(CALC_CLE); } catch (e) {}
  location.href = (racine || "") + "index.html";
}

/* À appeler en tête de chaque page protégée : calcProteger("../") */
function calcProteger(racine) {
  if (calcSession()) return;
  document.documentElement.style.visibility = "hidden";
  location.replace((racine || "") + "index.html?retour=" + encodeURIComponent(location.pathname + location.search));
}
