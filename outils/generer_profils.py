"""Génère commun/data/profils.js
- IPE, HEA, HEB, HEM : données dimensionnelles complètes issues de eurocodepy
  (i_profiles_euro.json, LGPL-3.0, P. Cachim) – recoupées avec le classeur poutre-poteau (écarts < 3 %).
- IPN, UPN, UPE : caractéristiques du classeur « Calculette_poutre-poteau_v5.xlsm » (feuille Admin) ;
  dimensions h, b, tw, tf, r lues (sans exécution) dans structuralcodes/geometry/profiles/_ipn.py,
  _upn.py, _upe.py (fib structuralcodes, Apache-2.0) – contrôle : aires recalculées à ±3 % du classeur.
Usage : python3 outils/generer_profils.py i_profiles_euro.json Calculette_poutre-poteau_v5.xlsm dossier_profiles_structuralcodes
"""
import ast, json, re, sys, os, openpyxl
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from proprietes_cornieres import cornieres
src_json, src_xl, src_sc = sys.argv[1], sys.argv[2], sys.argv[3]
def params(fn):
    t = ast.parse(open(f"{src_sc}/{fn}").read())
    for n in ast.walk(t):
        if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "parameters":
            return ast.literal_eval(n.value)
DIMS = {**params("_ipn.py"), **params("_upn.py"), **params("_upe.py")}
ANG = {**params("_l.py"), **params("_li.py")}
src_tubes = os.path.dirname(src_json)
out = []
for e in json.load(open(src_json)):
    m = re.match(r'(IPE|HEA|HEB|HEM)(\d+)', e['Section']); 
    if not m: continue
    fam, s = m.group(1), int(m.group(2))
    out.append({"f": fam, "s": s, "n": f"{fam} {s}", "h": round(e['h']*10, 1), "b": round(e['b']*10, 1),
        "tw": round(e['tw']*10, 2), "tf": round(e['tf']*10, 2), "r": round(e['r']*10, 1), "m": e['m'],
        "A": e['A'], "Avz": e['Av_z'], "Avy": e['Av_y'], "Iy": e['Iy'], "Wely": e['Wel_y'], "Wply": e['Wpl_y'], "iy": e['iy'],
        "Iz": e['Iz'], "Welz": e['Wel_z'], "Wplz": e['Wpl_z'], "iz": e['iz'], "It": e['IT'], "Iw": e['Iw'], "src": "eurocodepy"})
wb = openpyxl.load_workbook(src_xl, data_only=True)
for r in [[c.value for c in row] for row in wb['Admin']['T1:AI108']][1:]:
    s, fam = r[0], r[1]
    if fam not in ('IPN', 'UPN', 'UPE'): continue
    h, A, Iy, Iz = r[15], r[11], r[6], r[7]
    d = DIMS.get(f"{fam}{s}", {})
    out.append({"f": fam, "s": s, "n": f"{fam} {s}", "h": h, "b": d.get("b", r[4]), "tw": d.get("tw"), "tf": d.get("tf"),
        "r": d.get("r1", d.get("r")), "pente": {"IPN": 14, "UPN": 8 if s <= 300 else 5, "UPE": 0}[fam], "m": r[3], "A": A, "Avz": r[10],
        "Iy": Iy, "Wely": round(Iy/(h/20), 1), "Wply": r[5], "iy": round((Iy/A)**.5, 2), "Iz": Iz, "iz": round((Iz/A)**.5, 2),
        "It": r[8], "Iw": r[9]*1000, "ay": r[12], "az": r[13], "aLT": r[14], "src": "classeur"})
# --- axe faible des IPN / UPN / UPE : W_el,z seulement (géométrie à épaisseur d'aile moyenne, ≈ +3 %) ;
#     W_pl,z non fourni (approximation trop optimiste avec ailes inclinées) → calcul élastique en axe faible
for p in out:
    if p["f"] not in ("IPN", "UPN", "UPE") or not p.get("tw"): continue
    h, b, tw, tf = p["h"], p["b"], p["tw"], p["tf"]
    if p["f"] == "IPN":
        p["Welz"] = round(p["Iz"] / (b / 20), 2)
    else:
        rects = [(h * tw, tw / 2, tw, h), (2 * (b - tw) * tf, tw + (b - tw) / 2, b - tw, 2 * tf)]   # (aire, x, largeur, hauteur)
        A = sum(r[0] for r in rects); xs = sum(r[0] * r[1] for r in rects) / A
        p["Welz"] = round(p["Iz"] / ((b - xs) / 10), 2)
    p["Avy"] = round(2 * b * tf / 100, 2)
# --- cornières (L égales, LI inégales) : caractéristiques calculées (outils/proprietes_cornieres.py)
for k, d in ANG.items():
    m = re.match(r"L(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)", k)
    h, b, t = float(m.group(1)), float(m.group(2)), float(m.group(3))
    c = cornieres(h, b, t, d.get("r1", 0), d.get("r2", 0))
    fam = "L" if h == b else "LI"
    nom = f"L {k[1:]}".replace(".", ",")
    out.append({"f": fam, "s": h * 1000 + b + t / 100, "n": nom, "h": h, "b": b, "t": t, "tw": t, "tf": t, "r": d.get("r1"),
        "m": round(c["m"], 2), "A": round(c["A"], 2), "Avz": round(h * t / 100, 2), "Avy": round(b * t / 100, 2),
        "Iy": round(c["Iy"], 2), "Iz": round(c["Iz"], 2), "Iu": round(c["Iu"], 2), "Iv": round(c["Iv"], 2), "alpha": round(c["alpha"], 2),
        "Wu": round(c["Wu"], 3), "Wv": round(c["Wv"], 3), "Wely": round(c["Wely"], 3), "Welz": round(c["Welz"], 3),
        "iu": round(c["iu"], 3), "iv": round(c["iv"], 3), "iy": round(c["iy"], 3), "iz": round(c["iz"], 3),
        "ey": round(c["ey"], 3), "ez": round(c["ez"], 3), "It": round(c["It"], 3), "Iw": 0, "src": "structuralcodes+calcul"})
# --- tubes CHS / RHS / SHS (eurocodepy)
for fam in ("CHS", "SHS", "RHS"):
    for e in json.load(open(f"{src_tubes}/{fam.lower()}_profiles_euro.json")):
        nm = e["Section"][3:].replace("_", ",")
        out.append({"f": fam, "s": e["h"] * 1000 + e["b"] * 10 + e["tw"], "n": f"{fam} {nm}", "h": round(e["h"] * 10, 1), "b": round(e["b"] * 10, 1),
            "t": round(e["tw"] * 10, 2), "tw": round(e["tw"] * 10, 2), "tf": round(e["tf"] * 10, 2), "r": round(e["r"] * 10, 2), "m": e["m"],
            "A": e["A"], "Avz": e["Av_z"], "Avy": e["Av_y"], "Iy": e["Iy"], "Wely": e["Wel_y"], "Wply": e["Wpl_y"], "iy": e["iy"],
            "Iz": e["Iz"], "Welz": e["Wel_z"], "Wplz": e["Wpl_z"], "iz": e["iz"], "It": e["IT"], "Iw": 0, "src": "eurocodepy"})
ordre = {"IPE": 0, "HEA": 1, "HEB": 2, "HEM": 3, "IPN": 4, "UPN": 5, "UPE": 6, "L": 7, "LI": 8, "SHS": 9, "RHS": 10, "CHS": 11}
out.sort(key=lambda p: (ordre[p['f']], p['s']))
with open("commun/data/profils.js", "w", encoding="utf-8") as f:
    f.write("/* Profilés laminés – unités : mm, kg/m, cm², cm³, cm⁴, cm⁶ (Iw).\n"
            "   IPE/HEA/HEB/HEM : eurocodepy (LGPL-3.0, © P. Cachim) ; IPN/UPN/UPE : caractéristiques du classeur poutre-poteau v5,\n"
            "   dimensions h, b, tw, tf, r : fib structuralcodes (Apache-2.0). Ailes inclinées IPN 14 %, UPN 8 % (5 % au-delà de 300).\n"
            "   Cornières L/LI : dimensions structuralcodes, caractéristiques calculées (outils/proprietes_cornieres.py).\n"
            "   Tubes CHS/SHS/RHS : eurocodepy (LGPL-3.0).\n"
            "   Généré par outils/generer_profils.py – ne pas modifier à la main. */\n")
    f.write("const PROFILS = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(len(out), "profilés")
