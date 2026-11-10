"""Extraction des bases de zonage du classeur « Hypotheses_climatiques_sismiques_complexes.xlsx »
vers les fichiers JavaScript de la calculette climat/.

Usage : python3 outils/extraire_excel.py chemin/vers/classeur.xlsx
Produit : climat/data/zonage.js (départements, groupes vent/neige, catalogue)
          climat/data/communes.js (zonage sismique par commune)
"""
import json, sys, openpyxl

src = sys.argv[1]
wb = openpyxl.load_workbook(src)          # formules (pour les libellés)
wbv = openpyxl.load_workbook(src, data_only=True)

def rows(name, ncol):
    for r in wb[name].iter_rows(min_row=2, max_col=ncol, values_only=True):
        if r[0] is None or (isinstance(r[0], str) and len(r[0]) > 5):
            continue
        yield r

depts = [{"c": r[0], "n": r[1]} for r in rows("Base_Dept", 2)]
codes = {d["c"] for d in depts}

def groupes(name):
    out = []
    for r in rows(name, 6):
        if r[0] not in codes: continue
        out.append({"d": r[0], "g": r[1], "z": r[2], "l": r[3], "c": r[4], "r": r[5] or ""})
    return out

cat = []
for r in wb["Catalogue"].iter_rows(min_row=3, max_col=7, values_only=True):
    if r[0] and str(r[0]).startswith("M"):
        cat.append({"ref": r[0], "fam": r[1], "nom": r[2], "mode": r[3], "val": r[4], "e": r[5], "obs": r[6] or ""})

zon = {"source": src.split("/")[-1], "depts": depts, "vent": groupes("Base_Vent"),
       "neige": groupes("Base_Neige"), "catalogue": cat}
with open("climat/data/zonage.js", "w", encoding="utf-8") as f:
    f.write("/* Généré par outils/extraire_excel.py – ne pas modifier à la main */\n")
    f.write("const ZONAGE = " + json.dumps(zon, ensure_ascii=False, separators=(",", ":")) + ";\n")

lignes = []
for r in wb["Base_Communes"].iter_rows(min_row=2, max_col=4, values_only=True):
    if r[0] and r[2]:
        lignes.append(f"{r[2]};{r[1]};{r[0]};{r[3]}")
with open("climat/data/communes.js", "w", encoding="utf-8") as f:
    f.write("/* Zonage sismique par commune (décret 2010-1255) – INSEE;NOM;DEP;ZONE – généré par outils/extraire_excel.py */\n")
    f.write("const COMMUNES_TXT = " + json.dumps("\n".join(lignes), ensure_ascii=False) + ";\n")
print(len(depts), "départements,", len(zon["vent"]), "groupes vent,", len(zon["neige"]), "groupes neige,",
      len(cat), "matériaux,", len(lignes), "communes")
