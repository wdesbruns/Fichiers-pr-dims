from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.comments import Comment
from openpyxl.utils import get_column_letter
import sys
OUT=sys.argv[1]
wb=Workbook()
F=lambda **k: Font(name="Arial", size=k.pop("size",10), **k)
BLEU=F(color="0000FF"); NOIR=F(); GRAS=F(bold=True); VERT=F(color="008000")
TITRE=F(bold=True,size=14,color="114088"); ENT=F(bold=True,color="FFFFFF")
FENT=PatternFill("solid",fgColor="114088"); FJ=PatternFill("solid",fgColor="FFF2CC"); FEX=PatternFill("solid",fgColor="E2EFDA"); FLOT=PatternFill("solid",fgColor="DDEBF7")
fin=Side(style="thin",color="BFBFBF"); BORD=Border(left=fin,right=fin,top=fin,bottom=fin)
EUR='#,##0.00 "€";-#,##0.00 "€";-'; PCT='0.0%'; H='0.00 "h"'
def entete(ws,row,cols,widths):
    for i,(c,w) in enumerate(zip(cols,widths),1):
        x=ws.cell(row=row,column=i,value=c); x.font=ENT; x.fill=FENT; x.alignment=Alignment(wrap_text=True,vertical="center"); x.border=BORD
        ws.column_dimensions[get_column_letter(i)].width=w
    ws.row_dimensions[row].height=32
def st(ws,cell,val,font=NOIR,fill=None,fmt=None,wrap=False):
    c=ws[cell]; c.value=val; c.font=font; c.border=BORD
    if fill: c.fill=fill
    if fmt: c.number_format=fmt
    if wrap: c.alignment=Alignment(wrap_text=True,vertical="top")
    return c

# ---------------- Lisez-moi ----------------
ws=wb.active; ws.title="Lisez-moi"
L=["Base de prix FIP – modèle v0 (installation générale)","",
"Objet : bibliothèque de prix pour les estimations APS / APD et, à terme, la génération des DPGF / DQE et du CCTP par l'utilitaire FIP.",
"Lots : TUY tuyauterie · SUP supportage · CAL calorifuge · CM structure métallique · CHA chaudronnerie (réservoirs, cuves) · EIA électricité, instrumentation, automatisme · GC génie civil · GEN généraux de chantier.","",
"LÉGENDE",
"Cellules jaunes, texte bleu : valeurs à saisir (prix, temps, taux, coefficients).",
"Texte noir : formules – ne pas modifier.",
"Ligne verte « EXEMPLE » : valeurs FICTIVES montrant le format attendu ; à remplacer ou supprimer.","",
"ONGLETS",
"Paramètres : taux horaires par catégorie de main d'œuvre, coefficients de frais et de marge (→ coefficient de vente K), aléas et fourchettes par phase.",
"Ouvrages élémentaires : fourniture + main d'œuvre (heures × taux) + matériel + sous-traitance = déboursé sec ; prix de vente = déboursé sec × K.",
"Ouvrages composés : un ouvrage « métier » (ex. 1 ml de tuyauterie DN100 posée) = somme de composants élémentaires × quantités.",
"Ratios APS : prix globaux par unité d'œuvre (€/ml, €/kg, €/m³…) avec fourchette basse / moyenne / haute, issus des affaires passées.",
"Articles CCTP : texte type de chaque ouvrage (prescriptions, normes, contrôles), lié par son code ; trames à relire et compléter.",
"Indices : actualisation des prix (indice de référence à la date de valeur / indice actuel).","",
"RÈGLES",
"1. Un code unique par ouvrage (ex. TUY-T-100 = tube DN100). Ne pas réutiliser un code supprimé.",
"2. Toujours renseigner la source (devis, affaire, catalogue) et la date de valeur : sans date, un prix n'est pas actualisable.",
"3. Prix hors taxes, rendus chantier France métropolitaine, sauf mention contraire en remarque.",
"4. CONFIDENTIEL : une fois rempli, ce fichier se range sur le réseau / SharePoint FIP. Ne jamais le déposer dans le dépôt GitHub des calculettes (site public).",
"5. L'utilitaire de chiffrage lira ce fichier tel quel : ne pas renommer les onglets ni les colonnes."]
for i,t in enumerate(L,1):
    c=ws.cell(row=i,column=1,value=t); c.font=TITRE if i==1 else (GRAS if t in("LÉGENDE","ONGLETS","RÈGLES") else NOIR); c.alignment=Alignment(wrap_text=True)
ws.column_dimensions["A"].width=130
ws["A7"].fill=FJ; ws["A7"].font=BLEU; ws["A9"].fill=FEX

# ---------------- Paramètres ----------------
P=wb.create_sheet("Paramètres")
P["A1"]="Paramètres de la base"; P["A1"].font=TITRE
P["A2"]="Date de valeur des prix"; P["A2"].font=GRAS; st(P,"B2",None,BLEU,FJ,"dd/mm/yyyy")
P["C2"]="à renseigner (ex. 01/01/2027)"; P["C2"].font=F(italic=True,color="7F7F7F")
entete(P,4,["Code","Catégorie de main d'œuvre","Taux horaire (€/h)","Remarque"],[10,44,18,60])
MO=[("TUY","Tuyauteur / soudeur"),("CM","Monteur charpentier"),("CHA","Chaudronnier"),("CAL","Calorifugeur"),("ELE","Électricien"),("INS","Instrumentiste / automaticien"),("GC","Compagnon génie civil"),("ETU","Études / ingénierie"),("ENC","Encadrement de chantier")]
for i,(c,n) in enumerate(MO,5):
    st(P,f"A{i}",c); st(P,f"B{i}",n); st(P,f"C{i}",None,BLEU,FJ,EUR); st(P,f"D{i}","taux chargé (salaire + charges + frais de déplacement éventuels)" if i==5 else None,F(italic=True,color="7F7F7F"))
nMO=4+len(MO)
r=nMO+2
entete(P,r,["Code","Coefficient","Valeur","Remarque"],[10,44,18,60])
CO=[("FC","Frais de chantier",None,"% du déboursé sec"),("FG","Frais généraux",None,"% du déboursé sec + frais de chantier"),("MB","Marge bénéficiaire",None,"% du prix de revient"),
    ("AL_APS","Aléas en APS",None,"provision appliquée sur l'estimation APS"),("AL_APD","Aléas en APD",None,"provision appliquée sur l'estimation APD"),
    ("FO_APS","Fourchette d'estimation APS (±)",None,"précision attendue, typiquement ±20 à 30 %"),("FO_APD","Fourchette d'estimation APD (±)",None,"précision attendue, typiquement ±10 à 15 %")]
for j,(c,n,v,rq) in enumerate(CO,r+1):
    st(P,f"A{j}",c); st(P,f"B{j}",n); st(P,f"C{j}",v,BLEU,FJ,PCT); st(P,f"D{j}",rq,F(italic=True,color="7F7F7F"))
rK=r+1+len(CO)
st(P,f"A{rK}","K",GRAS); st(P,f"B{rK}","Coefficient de vente K = (1+FC)·(1+FG)·(1+MB)",GRAS)
st(P,f"C{rK}",f"=(1+C{r+1})*(1+C{r+2})*(1+C{r+3})",GRAS,None,'0.000')
st(P,f"D{rK}","prix de vente = déboursé sec × K (formule)",F(italic=True,color="7F7F7F"))
KREF=f"Paramètres!$C${rK}"; MO_RNG=(f"Paramètres!$A$5:$A${nMO}",f"Paramètres!$C$5:$C${nMO}")
P.freeze_panes="A5"

# ---------------- Ouvrages élémentaires ----------------
O=wb.create_sheet("Ouvrages élémentaires")
cols=["Code","Lot","Sous-lot","Désignation","Unité","Fourniture (€/u)","Temps MO (h/u)","Catégorie MO","Taux MO (€/h)","Main d'œuvre (€/u)","Matériel (€/u)","Sous-traitance (€/u)","Déboursé sec (€/u)","Prix de vente (€/u)","Source","Date de valeur","Réf. article CCTP","Remarques"]
entete(O,1,cols,[13,7,18,52,7,14,12,11,12,14,12,14,15,15,22,13,13,30])
DN=[25,50,80,100,150,200,250,300]
items=[]
def add(code,lot,sl,d,u,mo,cctp): items.append((code,lot,sl,d,u,mo,cctp))
for d in DN: add(f"TUY-T-{d:03d}","TUY","Tubes acier carbone",f"Tube acier P235GH / P265GH sch 40 – DN{d}, fourni posé (hors soudures)","ml","TUY","TUY-01")
for d in [25,50,80,100,150]: add(f"TUY-X-{d:03d}","TUY","Tubes inox",f"Tube inox 316L sch 10S – DN{d}, fourni posé (hors soudures)","ml","TUY","TUY-01")
for d in DN: add(f"TUY-S-{d:03d}","TUY","Soudures",f"Soudure bout à bout acier carbone – DN{d}","u","TUY","TUY-02")
for d in DN: add(f"TUY-C-{d:03d}","TUY","Accessoires",f"Coude 90° 3D acier – DN{d}","u","TUY","TUY-01")
for d in DN: add(f"TUY-B-{d:03d}","TUY","Accessoires",f"Bride à collerette PN16 + joint + boulonnerie – DN{d}","u","TUY","TUY-01")
for d in [25,50,80,100,150,200]: add(f"TUY-V-{d:03d}","TUY","Robinetterie",f"Vanne à boisseau sphérique / papillon PN16 – DN{d}","u","TUY","TUY-03")
for c,d,u in [("TUY-RX","Contrôle radiographique d'une soudure","u"),("TUY-EH","Épreuve hydraulique d'une ligne","ml"),("TUY-PT","Peinture anticorrosion des tuyauteries","m²"),("TUY-NT","Rinçage et nettoyage des lignes","ml")]: add(c,"TUY","Essais et finitions",d,u,"TUY","TUY-04")
for c,d,u in [("SUP-KG","Supportage acier façonné, fourni posé (profilés, platines, soudures)","kg"),("SUP-ET","Étrier (U-bolt) galvanisé avec écrous","u"),("SUP-PA","Patin glissant avec plaque PTFE","u"),("SUP-PF","Point fixe soudé","u"),("SUP-CH","Fixation par 4 chevilles (platine)","u"),("SUP-TF","Fixation par 4 tiges filetées traversantes + contre-plaque","u"),("SUP-CR","Crapaud / pince-poutre","u"),("SUP-CO","Collier de tuyauterie","u")]: add(c,"SUP","Supportage",d,u,"TUY","SUP-01")
for d in [50,100,150,200]: add(f"CAL-L-{d:03d}","CAL","Calorifuge",f"Calorifuge laine de roche ép. 50 mm + tôle aluminium – DN{d}","ml","CAL","CAL-01")
for c,d,u in [("CAL-AC","Calorifuge d'accessoire (coude, vanne, bride) – boîte démontable","u"),("CAL-TR","Traçage électrique autorégulant","ml")]: add(c,"CAL","Calorifuge",d,u,"CAL","CAL-01")
for c,d,u in [("CM-CH","Charpente acier S235/S275, fournie posée (hors protection)","kg"),("CM-GA","Galvanisation à chaud","kg"),("CM-PE","Peinture anticorrosion (système selon classe de corrosivité)","m²"),("CM-CB","Caillebotis pressé galvanisé maille 30×30, fourni posé","m²"),("CM-TL","Tôle larmée 5/7 galvanisée, fournie posée","m²"),("CM-GC","Garde-corps 3 lisses + plinthe","ml"),("CM-EC","Échelle à crinoline","ml"),("CM-ES","Escalier acier (par marche)","u"),("CM-AN","Ancrage par cheville ou scellement chimique","u")]: add(c,"CM","Structure métallique",d,u,"CM","CM-01")
for c,d,u in [("CHA-RV","Réservoir acier vertical, fond plat, fourni posé","m³"),("CHA-RI","Cuve inox","kg"),("CHA-PQ","Piquage (par DN moyen)","u"),("CHA-TH","Trou d'homme","u"),("CHA-PL","Plateforme et échelle de réservoir","kg"),("CHA-ES","Épreuve et contrôles de réservoir","u")]: add(c,"CHA","Chaudronnerie",d,u,"CHA","CHA-01")
for c,d,u,m in [("EIA-CP","Câble de puissance (section moyenne)","ml","ELE"),("EIA-CI","Câble d'instrumentation","ml","INS"),("EIA-CC","Chemin de câbles","ml","ELE"),("EIA-TP","Transmetteur de pression","u","INS"),("EIA-NV","Capteur de niveau","u","INS"),("EIA-DB","Débitmètre","u","INS"),("EIA-VA","Vanne automatique (actionneur)","u","INS"),("EIA-ES","Entrée / sortie automate (point)","u","INS"),("EIA-AR","Armoire / coffret","u","ELE"),("EIA-MT","Mise à la terre et équipotentialité","forfait","ELE"),("EIA-MS","Essais et mise en service","h","INS")]: add(c,"EIA","Électricité, instrumentation, automatisme",d,u,m,"EIA-01")
for c,d,u in [("GC-TE","Terrassement en déblai","m³"),("GC-RE","Remblai compacté","m³"),("GC-BP","Béton de propreté","m³"),("GC-BA","Béton armé (semelles, massifs)","m³"),("GC-FE","Armatures","kg"),("GC-CO","Coffrage","m²"),("GC-DA","Dallage béton","m²"),("GC-MA","Massif de support ou de pompe","u"),("GC-RT","Rétention béton","m³"),("GC-CA","Carottage","u")]: add(c,"GC","Génie civil",d,u,"GC","GC-01")
for c,d,u,m in [("GEN-IC","Installation et repli de chantier","forfait","ENC"),("GEN-ET","Études d'exécution","h","ETU"),("GEN-EC","Échafaudage","m²","ENC"),("GEN-LV","Moyens de levage (grue, nacelle)","j","ENC"),("GEN-DO","Dossier des ouvrages exécutés","forfait","ETU")]: add(c,"GEN","Généraux",d,u,m,"GEN-01")
# ligne exemple
r=2
ex=("EXEMPLE","TUY","Tubes acier carbone","EXEMPLE – tube DN100 sch 40 fourni posé (VALEURS FICTIVES)","ml")
for col,v in zip("ABCDE",ex): st(O,f"{col}{r}",v,NOIR,FEX)
vals={"F":38.0,"G":0.6,"H":"TUY","K":2.0,"L":0,"O":"exemple (fictif)","P":None,"Q":"TUY-01","R":"ligne à supprimer"}
def formules(rr,fill=None):
    st(O,f"I{rr}",f'=IFERROR(INDEX({MO_RNG[1]},MATCH(H{rr},{MO_RNG[0]},0)),0)',GRAS if False else NOIR,fill,EUR)
    st(O,f"J{rr}",f"=G{rr}*I{rr}",NOIR,fill,EUR)
    st(O,f"M{rr}",f"=F{rr}+J{rr}+K{rr}+L{rr}",NOIR,fill,EUR)
    st(O,f"N{rr}",f"=M{rr}*{KREF}",NOIR,fill,EUR)
for col in "FGHKLOPQR":
    fmt={"F":EUR,"G":H,"K":EUR,"L":EUR,"P":"dd/mm/yyyy"}.get(col)
    st(O,f"{col}{r}",vals[col],BLEU,FEX,fmt)
formules(r,FEX)
r=3
for (code,lot,sl,d,u,mo,cctp) in items:
    for col,v in zip("ABCDE",(code,lot,sl,d,u)): st(O,f"{col}{r}",v)
    for col in "FGKLOP": st(O,f"{col}{r}",None,BLEU,FJ,{"F":EUR,"G":H,"K":EUR,"L":EUR,"P":"dd/mm/yyyy"}.get(col))
    st(O,f"H{r}",mo,BLEU,FJ); st(O,f"Q{r}",cctp,BLEU); st(O,f"R{r}",None,BLEU)
    formules(r); r+=1
nO=r-1
O.freeze_panes="E2"; O.auto_filter.ref=f"A1:R{nO}"
dv=DataValidation(type="list",formula1='"TUY,SUP,CAL,CM,CHA,EIA,GC,GEN"',allow_blank=True); O.add_data_validation(dv); dv.add(f"B2:B{nO+200}")
dvu=DataValidation(type="list",formula1='"ml,m²,m³,kg,u,h,j,forfait,t"',allow_blank=True); O.add_data_validation(dvu); dvu.add(f"E2:E{nO+200}")
dvm=DataValidation(type="list",formula1=f"={MO_RNG[0]}",allow_blank=True); O.add_data_validation(dvm); dvm.add(f"H2:H{nO+200}")
O["I1"].comment=Comment("Taux lu dans Paramètres selon la catégorie de main d'œuvre (colonne H).","FIP")
O["N1"].comment=Comment("Prix de vente = déboursé sec × K (onglet Paramètres).","FIP")

# ---------------- Ouvrages composés ----------------
C=wb.create_sheet("Ouvrages composés")
C["A1"]="Ouvrages composés – synthèse"; C["A1"].font=TITRE
entete(C,2,["Code composé","Désignation","Unité","Déboursé sec (€/u)","Prix de vente (€/u)","Réf. article CCTP","Remarques"],[16,58,8,16,16,14,40])
COMP=[("TUY-L-100","Tuyauterie acier DN100 posée, accessoires, soudures et supportage compris","ml","TUY-01"),("TUY-L-050","Tuyauterie acier DN50 posée, accessoires, soudures et supportage compris","ml","TUY-01"),("CM-PF","Plateforme de maintenance (charpente + caillebotis + garde-corps)","m²","CM-01")]
for i,(c,d,u,a) in enumerate(COMP,3):
    st(C,f"A{i}",c,BLEU); st(C,f"B{i}",d,BLEU); st(C,f"C{i}",u,BLEU)
    st(C,f"D{i}",f"=SUMIF($A$12:$A$400,A{i},$H$12:$H$400)",NOIR,None,EUR); st(C,f"E{i}",f"=D{i}*{KREF}",NOIR,None,EUR); st(C,f"F{i}",a,BLEU); st(C,f"G{i}",None,BLEU)
C["A10"]="Composition (une ligne par composant ; quantité de composant pour 1 unité de l'ouvrage composé)"; C["A10"].font=GRAS
entete(C,11,["Code composé","Code composant (onglet Ouvrages élémentaires)","Désignation du composant","Unité","Quantité / u","Déboursé sec composant (€/u)","","Déboursé sec partiel (€)"],[16,58,52,8,14,16,4,16])
OE="'Ouvrages élémentaires'"
compo=[("TUY-L-100","TUY-T-100",1.0),("TUY-L-100","TUY-S-100",None),("TUY-L-100","TUY-C-100",None),("TUY-L-100","TUY-B-100",None),("TUY-L-100","SUP-KG",None),("TUY-L-100","TUY-EH",1.0),("TUY-L-100","TUY-PT",None),
       ("TUY-L-050","TUY-T-050",1.0),("TUY-L-050","TUY-S-050",None),("TUY-L-050","TUY-C-050",None),("TUY-L-050","SUP-KG",None),("TUY-L-050","TUY-EH",1.0),
       ("CM-PF","CM-CH",None),("CM-PF","CM-CB",1.0),("CM-PF","CM-GC",None),("CM-PF","CM-GA",None)]
for i,(a,b,q) in enumerate(compo,12):
    st(C,f"A{i}",a,BLEU); st(C,f"B{i}",b,BLEU)
    st(C,f"C{i}",f'=IFERROR(INDEX({OE}!$D:$D,MATCH(B{i},{OE}!$A:$A,0)),"code inconnu")')
    st(C,f"D{i}",f'=IFERROR(INDEX({OE}!$E:$E,MATCH(B{i},{OE}!$A:$A,0)),"")')
    st(C,f"E{i}",q,BLEU,FJ,'0.000'); st(C,f"F{i}",f'=IFERROR(INDEX({OE}!$M:$M,MATCH(B{i},{OE}!$A:$A,0)),0)',NOIR,None,EUR)
    st(C,f"H{i}",f"=E{i}*F{i}",NOIR,None,EUR)
C["A30"]="Quantités par unité à renseigner (ex. pour 1 ml de DN100 : nombre de soudures, coudes et brides au prorata, kg de supportage) – ratios à établir sur des affaires de référence."; C["A30"].font=F(italic=True,color="7F7F7F")
C.freeze_panes="A3"

# ---------------- Ratios APS ----------------
R=wb.create_sheet("Ratios APS")
entete(R,1,["Code","Lot","Désignation (unité d'œuvre globale)","Unité","Ratio bas (€/u)","Ratio moyen (€/u)","Ratio haut (€/u)","Source (affaires)","Date de valeur","Remarques"],[12,7,58,8,15,15,15,30,13,34])
RAT=[("R-TUY-AC","TUY","Tuyauterie acier carbone posée, tout compris, DN moyen ≤ 100","ml"),("R-TUY-AC2","TUY","Tuyauterie acier carbone posée, tout compris, DN 150 à 300","ml"),("R-TUY-IX","TUY","Tuyauterie inox posée, tout compris","ml"),
     ("R-SUP","SUP","Supportage de tuyauterie (acier façonné posé)","kg"),("R-SUP-U","SUP","Support standard (type ST) posé","u"),("R-CAL","CAL","Calorifuge laine de roche + tôle, DN moyen","ml"),
     ("R-CM","CM","Charpente acier fournie posée, protection comprise","kg"),("R-CM-PF","CM","Plateforme de maintenance complète","m²"),
     ("R-CHA","CHA","Réservoir acier vertical posé","m³"),("R-EIA-IO","EIA","Électricité / instrumentation / automatisme, par point d'E/S","u"),("R-EIA-PU","EIA","Alimentation électrique d'un récepteur (moteur, pompe)","u"),
     ("R-GC-BA","GC","Génie civil béton armé (massifs, semelles), tout compris","m³"),("R-GC-RT","GC","Rétention béton","m³"),("R-GEN","GEN","Frais de chantier et études, en % du montant des travaux","%")]
for i,(c,l,d,u) in enumerate(RAT,2):
    for col,v in zip("ABCD",(c,l,d,u)): st(R,f"{col}{i}",v)
    for col in "EFGHIJ": st(R,f"{col}{i}",None,BLEU,FJ,EUR if col in "EFG" else ("dd/mm/yyyy" if col=="I" else None))
R.freeze_panes="D2"; R.auto_filter.ref=f"A1:J{len(RAT)+1}"

# ---------------- Articles CCTP ----------------
A=wb.create_sheet("Articles CCTP")
entete(A,1,["Code article","Lot","Titre","Prescriptions (texte type)","Normes et référentiels","Contrôles et essais","État"],[11,7,30,80,45,45,12])
ART=[("TUY-01","TUY","Tuyauteries – fourniture et pose","Les tuyauteries sont réalisées en tubes et accessoires conformes aux classes de tuyauterie du projet (matériau, épaisseur, PN). Les assemblages sont soudés ou brides selon les plans. Les pentes, points hauts (évents) et points bas (purges) sont réalisés selon les isométriques.","Code de construction de la tuyauterie du projet (NF EN 13480 ou CODETI) ; directive 2014/68/UE (DESP) si applicable","Contrôle visuel, contrôles non destructifs selon la catégorie, épreuve hydraulique, rinçage"),
     ("TUY-02","TUY","Soudage","Soudage par des soudeurs qualifiés selon des modes opératoires qualifiés.","NF EN ISO 9606-1 (qualification des soudeurs) ; NF EN ISO 15614-1 (qualification des modes opératoires)","Taux de contrôle des soudures selon le code de construction"),
     ("TUY-03","TUY","Robinetterie","Robinetterie conforme aux fiches techniques du projet (type, PN, matériaux, manœuvre).","Normes produits de robinetterie industrielle","Essais en usine fournis ; vérification au montage"),
     ("TUY-04","TUY","Essais, nettoyage, peinture","Épreuve hydraulique, rinçage, séchage ; protection anticorrosion selon le système défini.","NF EN ISO 12944 (protection par peinture)","PV d'épreuve ; contrôle des épaisseurs de peinture"),
     ("SUP-01","SUP","Supportage des tuyauteries","Supports conformes au cahier de supportage (types, configurations, repères). Fixations sur l'ouvrage selon les descentes de charges.","NF EN 1090-2 (exécution des structures acier) ; NF EN 1993-1-1 et 1-8","Contrôle dimensionnel et visuel ; couple de serrage"),
     ("CAL-01","CAL","Calorifuge","Isolation thermique des tuyauteries et accessoires, revêtement de protection en tôle ; boîtes démontables sur les accessoires.","NF DTU 45.2 (isolation thermique des circuits, appareils et accessoires)","Contrôle d'épaisseur et d'étanchéité du revêtement"),
     ("CM-01","CM","Structure métallique","Fourniture, fabrication et montage de la charpente selon les plans et notes de calcul ; classe d'exécution à préciser.","NF EN 1090-2 ; NF EN 1993 ; NF EN ISO 1461 (galvanisation) ; NF EN ISO 12944","Contrôles de fabrication selon la classe d'exécution ; réception"),
     ("CHA-01","CHA","Chaudronnerie – réservoirs et cuves","Réservoirs conçus et fabriqués selon le code applicable (stockage aérien ou équipement sous pression).","NF EN 14015 (réservoirs de stockage aériens) ou code d'appareil à pression selon le cas","Épreuve, contrôles des soudures, dossier de construction"),
     ("EIA-01","EIA","Électricité, instrumentation, automatisme","Distribution électrique, câblage, instrumentation et automatisme selon les schémas et listes d'instruments du projet.","NF C 15-100 ou NF C 13-200 selon le cas ; zones ATEX : directive 2014/34/UE et NF EN 60079","Essais de continuité et d'isolement, boucles d'instrumentation, mise en service"),
     ("GC-01","GC","Génie civil","Terrassements, béton armé et ouvrages divers selon plans et notes de calcul.","NF EN 206 (béton) ; NF EN 1992 (calcul des ouvrages en béton) ; NF DTU 21","Contrôles de réception des fonds de fouille, du ferraillage et du béton"),
     ("GEN-01","GEN","Dispositions générales","Installation de chantier, études d'exécution, dossier des ouvrages exécutés (DOE).","Documents du marché","Réception des travaux")]
for i,a in enumerate(ART,2):
    for col,v in zip("ABCDEF",a): st(A,f"{col}{i}",v,BLEU if col in "DEF" else NOIR,FJ if col in "DEF" else None,wrap=True)
    st(A,f"G{i}","à relire",BLEU,FJ)
    A.row_dimensions[i].height=60
A.freeze_panes="C2"

# ---------------- Indices ----------------
I=wb.create_sheet("Indices")
entete(I,1,["Code","Indice (libellé exact de la publication)","Lots concernés","Valeur à la date de valeur","Date","Valeur actuelle","Date","Coefficient d'actualisation"],[10,46,16,16,12,16,12,16])
IND=[("I-MO","Main d'œuvre (indice de coût horaire du travail du secteur)","tous"),("I-AC","Produits sidérurgiques (acier)","TUY, SUP, CM, CHA"),("I-IX","Aciers inoxydables","TUY, CHA"),("I-BT","Indice bâtiment / travaux publics du lot","GC"),("I-EL","Matériel électrique","EIA")]
for i,(c,n,l) in enumerate(IND,2):
    st(I,f"A{i}",c); st(I,f"B{i}",n,BLEU,FJ); st(I,f"C{i}",l)
    for col in "DEFG": st(I,f"{col}{i}",None,BLEU,FJ,"dd/mm/yyyy" if col in "EG" else "0.0")
    st(I,f"H{i}",f'=IF(AND(ISNUMBER(D{i}),ISNUMBER(F{i}),D{i}<>0),F{i}/D{i},"")',NOIR,None,'0.000')
I["A9"]="Indices INSEE / FNTP / FFB à choisir selon les lots ; prix actualisé = prix × coefficient d'actualisation."; I["A9"].font=F(italic=True,color="7F7F7F")
wb.save(OUT); print("ok",len(items),"ouvrages")
