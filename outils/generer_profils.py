"""Génère commun/data/profils.js
- IPE, HEA, HEB, HEM : données dimensionnelles complètes issues de eurocodepy
  (i_profiles_euro.json, LGPL-3.0, P. Cachim) – recoupées avec le classeur poutre-poteau (écarts < 3 %).
- IPN, UPN, UPE : classeur « Calculette_poutre-poteau_v5.xlsm » (feuille Admin, table T_PROFILES).
Usage : python3 outils/generer_profils.py i_profiles_euro.json Calculette_poutre-poteau_v5.xlsm
"""
import json, re, sys, openpyxl
src_json, src_xl = sys.argv[1], sys.argv[2]
out = []
for e in json.load(open(src_json)):
    m = re.match(r'(IPE|HEA|HEB|HEM)(\d+)', e['Section']); 
    if not m: continue
    fam, s = m.group(1), int(m.group(2))
    out.append({"f": fam, "s": s, "n": f"{fam} {s}", "h": round(e['h']*10, 1), "b": round(e['b']*10, 1),
        "tw": round(e['tw']*10, 2), "tf": round(e['tf']*10, 2), "r": round(e['r']*10, 1), "m": e['m'],
        "A": e['A'], "Avz": e['Av_z'], "Iy": e['Iy'], "Wely": e['Wel_y'], "Wply": e['Wpl_y'], "iy": e['iy'],
        "Iz": e['Iz'], "Welz": e['Wel_z'], "Wplz": e['Wpl_z'], "iz": e['iz'], "It": e['IT'], "Iw": e['Iw'], "src": "eurocodepy"})
wb = openpyxl.load_workbook(src_xl, data_only=True)
for r in [[c.value for c in row] for row in wb['Admin']['T1:AI108']][1:]:
    s, fam = r[0], r[1]
    if fam not in ('IPN', 'UPN', 'UPE'): continue
    h, A, Iy, Iz = r[15], r[11], r[6], r[7]
    out.append({"f": fam, "s": s, "n": f"{fam} {s}", "h": h, "b": r[4], "m": r[3], "A": A, "Avz": r[10],
        "Iy": Iy, "Wely": round(Iy/(h/20), 1), "Wply": r[5], "iy": round((Iy/A)**.5, 2), "Iz": Iz, "iz": round((Iz/A)**.5, 2),
        "It": r[8], "Iw": r[9]*1000, "ay": r[12], "az": r[13], "aLT": r[14], "src": "classeur"})
ordre = {"IPE": 0, "HEA": 1, "HEB": 2, "HEM": 3, "IPN": 4, "UPN": 5, "UPE": 6}
out.sort(key=lambda p: (ordre[p['f']], p['s']))
with open("commun/data/profils.js", "w", encoding="utf-8") as f:
    f.write("/* Profilés laminés – unités : mm, kg/m, cm², cm³, cm⁴, cm⁶ (Iw).\n"
            "   IPE/HEA/HEB/HEM : eurocodepy (LGPL-3.0, © P. Cachim) ; IPN/UPN/UPE : classeur poutre-poteau v5.\n"
            "   Généré par outils/generer_profils.py – ne pas modifier à la main. */\n")
    f.write("const PROFILS = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(len(out), "profilés")
