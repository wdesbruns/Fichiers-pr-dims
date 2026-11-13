/* =====================================================================
   RÉFÉRENTIEL — fiches vulgarisées (normes, notions, formules)
   Chaque fiche : id (ancre), titre, theme, bref (2-3 lignes), corps (HTML), refs, calc (calculettes concernées)
   ===================================================================== */
const FICHES = [
/* ---------------- NORMES ---------------- */
{ id: "normes", theme: "Normes", titre: "Les textes utilisés par les calculettes",
  bref: "Les Eurocodes donnent les règles européennes ; l'Annexe nationale (AN) fixe les valeurs propres à la France. Les deux se lisent toujours ensemble.",
  corps: `<table><tr><th>Texte</th><th>Sujet</th><th>Calculettes</th></tr>
  <tr><td>NF EN 1990 + AN</td><td>Bases de calcul : états limites, combinaisons d'actions, coefficients γ et ψ</td><td>P1, P2, S1</td></tr>
  <tr><td>NF EN 1991-1-1 + AN</td><td>Poids propres, charges d'exploitation des planchers</td><td>P1, C1</td></tr>
  <tr><td>NF EN 1991-1-3 + AN</td><td>Neige (cartes, coefficients de forme)</td><td>C1, S1, P1</td></tr>
  <tr><td>NF EN 1991-1-4 + AN</td><td>Vent (pression, coefficients de pression et de force)</td><td>C1, S1, P1, P2</td></tr>
  <tr><td>Recommandations CNC2M N0380 (2017)</td><td>Application de l'EN 1991-1-4 aux structures métalliques</td><td>C1</td></tr>
  <tr><td>NF EN 1993-1-1 + AN</td><td>Calcul des structures en acier : résistance, flambement, déversement, flèches</td><td>P1, P2, S1</td></tr>
  <tr><td>NF EN 1993-1-8 + AN</td><td>Assemblages : boulons, pinces, soudures</td><td>S1</td></tr>
  <tr><td>NF EN 1998-1 + AN, arrêté du 22/10/2010</td><td>Séisme : zonage, spectre, éléments non structuraux</td><td>C1, S1</td></tr>
  <tr><td>CODETI, NF EN 13480-3, ASME B31.3</td><td>Tuyauteries : contraintes admissibles, flexibilité</td><td>T1, S1</td></tr></table>
  <p>Une <b>Annexe nationale</b> ne réécrit pas la norme : elle choisit les « paramètres déterminés au niveau national » (valeurs de vent, coefficients partiels, cartes…). Quand l'AN dit « valeur recommandée », c'est la valeur proposée dans la norme européenne.</p>`,
  refs: "Catalogue AFNOR ; NF EN 1990 §1.1." },

/* ---------------- BASES DE CALCUL ---------------- */
{ id: "etats-limites", theme: "Bases de calcul", titre: "ELU, ELS : vérifier la résistance et l'usage",
  bref: "ELU (état limite ultime) : la structure ne doit pas rompre ni flamber. ELS (état limite de service) : elle ne doit pas trop se déformer ni vibrer.",
  corps: `<p>À l'<b>ELU</b>, on majore les charges (coefficients γ<sub>F</sub> : 1,35 sur le permanent, 1,5 sur le variable) et on minore la résistance du matériau (γ<sub>M</sub>). En France, pour l'acier, γ<sub>M0</sub> = γ<sub>M1</sub> = 1,0 et γ<sub>M2</sub> = 1,25 (boulons).</p>
  <p>À l'<b>ELS</b>, on prend les charges réelles (non majorées) et on compare les déplacements à des limites (L/150, L/200…) fixées pour le confort, l'aspect ou le bon fonctionnement (tuyauteries, bardages).</p>
  <div class="form">Vérification ELU : E<sub>d</sub> ≤ R<sub>d</sub> &nbsp;⇔&nbsp; taux = E<sub>d</sub> / R<sub>d</sub> ≤ 100 %</div>`,
  refs: "NF EN 1990 §3.3, §3.4, §6.4, §6.5 ; NF EN 1993-1-1/NA §6.1.", calc: "P1, P2, S1" },
{ id: "combinaisons", theme: "Bases de calcul", titre: "Les combinaisons d'actions",
  bref: "On ne fait pas agir toutes les charges à leur maximum en même temps : une action variable « dominante » à 100 %, les autres réduites par un coefficient ψ₀.",
  corps: `<div class="form">ELU (6.10) : 1,35·G + 1,5·Q<sub>1</sub> + Σ 1,5·ψ<sub>0,i</sub>·Q<sub>i</sub> &nbsp;(et 1,0·G si le permanent est favorable)<br>
  ELS caractéristique : G + Q<sub>1</sub> + Σ ψ<sub>0,i</sub>·Q<sub>i</sub><br>Situation sismique : G + ψ<sub>2</sub>·Q + A<sub>Ed</sub></div>
  <p>Exemple : avec du vent (ψ<sub>0</sub> = 0,6) et de la neige (ψ<sub>0</sub> = 0,5), on étudie « neige dominante + 0,6 × vent » et « vent dominant + 0,5 × neige ». Les calculettes génèrent toutes les combinaisons et retiennent la plus défavorable pour chaque vérification.</p>
  <p>Les directions de vent (±X, ±Y) ne se cumulent pas entre elles : ce sont des cas exclusifs.</p>`,
  refs: "NF EN 1990 §6.4.3.2 (éq. 6.10), §6.5.3, Tableau A1.1 + AN (ψ), Tableau A1.2(B).", calc: "P1, P2, S1" },
{ id: "charges", theme: "Bases de calcul", titre: "Les actions : G, Q, S, W, T, E",
  bref: "G : permanent (poids propres). Q : exploitation. S : neige. W : vent. T : température (dilatation, frottement). E : séisme.",
  corps: `<ul><li><b>G</b> : poids des profilés, des tuyaux pleins, du calorifuge, des équipements.</li>
  <li><b>Q</b> : charges d'exploitation des planchers (catégories A à E), personnel d'entretien.</li>
  <li><b>S</b> : neige au sol s<sub>k</sub> × coefficient de forme μ (voir <a href="#neige">Neige</a>).</li>
  <li><b>W</b> : vent q<sub>p</sub> × coefficient de pression ou de force (voir <a href="#vent">Vent</a>).</li>
  <li><b>T</b> : pour un support de tuyauterie, le frottement μ·G quand le tuyau se dilate, et les efforts des points fixes (voir <a href="#supportage">Supportage</a>).</li>
  <li><b>E</b> : séisme (voir <a href="#seisme">Séisme</a>). <b>EP</b> : épreuve hydraulique (tuyauteries pleines d'eau), cas temporaire.</li></ul>`,
  refs: "NF EN 1990 §4.1 ; NF EN 1991-1-1 Tab. 6.2 + AN.", calc: "toutes" },
{ id: "taux", theme: "Bases de calcul", titre: "Taux de travail, taux cible et couleurs",
  bref: "Le taux de travail = sollicitation / résistance. Vert ≤ taux cible, jaune entre le taux cible et 100 %, rouge au-delà de 100 %.",
  corps: `<p>Le <b>taux cible</b> (90 % par défaut) laisse une marge en APS/APD : les charges et la géométrie évoluent souvent en phase d'exécution. Un taux jaune n'est pas faux, mais il faudra peut-être reprendre le profilé.</p>
  <p>Le <b>critère dimensionnant</b> est celui qui a le plus fort taux (résistance, stabilité, déplacement…) : c'est lui qu'il faut améliorer.</p>`,
  refs: "Pratique FIP (prédimensionnement).", calc: "P1, P2, S1, T1" },

/* ---------------- CLIMAT ---------------- */
{ id: "vent", theme: "Actions climatiques", titre: "Le vent : de la carte à la pression q_p",
  bref: "La carte donne une vitesse de référence. On la corrige selon le terrain (rugosité), la hauteur et le relief, puis on la transforme en pression.",
  corps: `<div class="form">v<sub>b</sub> = c<sub>dir</sub>·c<sub>season</sub>·v<sub>b,0</sub> &nbsp;(zone 1 à 4 : 22 à 28 m/s)<br>
  v<sub>m</sub>(z) = c<sub>r</sub>(z)·c<sub>o</sub>(z)·v<sub>b</sub> avec c<sub>r</sub> = k<sub>r</sub>·ln(z/z<sub>0</sub>)<br>
  q<sub>p</sub>(z) = [1 + 7·I<sub>v</sub>(z)]·½·ρ·v<sub>m</sub>²(z) &nbsp;(ρ = 1,225 kg/m³)</div>
  <ul><li><b>Rugosité</b> (catégories 0 à IV) : plus le terrain est lisse (mer, plaine), plus le vent est fort au sol. On prend la plus lisse rencontrée autour du site.</li>
  <li><b>Hauteur z</b> : le vent augmente avec la hauteur (profil logarithmique). En dessous de z<sub>min</sub>, la valeur est constante.</li>
  <li><b>Turbulence I<sub>v</sub></b> : les rafales ; le terme 7·I<sub>v</sub> transforme le vent moyen en vent de pointe.</li>
  <li><b>Relief c<sub>o</sub></b> : 1 en terrain sans relief marqué ; procédure 1 de l'AN (altitude du site par rapport aux points à 500 m et 1 000 m) ; au-delà de 1,15, étude spécifique.</li></ul>
  <p><b>Ordres de grandeur</b> : à 10 m de hauteur, q<sub>p</sub> ≈ 0,5 kN/m² (zone 1, terrain bocager) à 1,5 kN/m² (zone 4, bord de mer).</p>`,
  refs: "NF EN 1991-1-4 §4.2 à §4.5 + AN (Tab. 4.1 NA, 4.12 à 4.14-NA, 4.20-NA).", calc: "C1 → S1, P1, P2" },
{ id: "coef-vent", theme: "Actions climatiques", titre: "Coefficients de pression et de force",
  bref: "La pression q_p ne suffit pas : le vent pousse ou aspire selon la forme. Les coefficients c_pe, c_pi (bâtiments) et c_f (objets, profilés) traduisent cette forme.",
  corps: `<div class="form">Paroi : w = q<sub>p</sub>(z<sub>e</sub>)·(c<sub>pe</sub> − c<sub>pi</sub>) &nbsp;&nbsp; Objet, barre : F = c<sub>f</sub>·q<sub>p</sub>(z<sub>e</sub>)·A<sub>ref</sub></div>
  <ul><li><b>c<sub>pe</sub></b> (extérieur) : positif = pression (face au vent, zone D), négatif = dépression/aspiration (côtés, toiture, arrière). Les zones A, B, C, F, G… se mesurent avec e = min(b ; 2h).</li>
  <li><b>c<sub>pe,10</sub> / c<sub>pe,1</sub></b> : pour les surfaces ≥ 10 m² ou ≤ 1 m². En charpente on utilise c<sub>pe,10</sub> (CNC2M §7).</li>
  <li><b>c<sub>pi</sub></b> (intérieur) : +0,2 et −0,3 si la perméabilité des façades n'est pas connue (AN).</li>
  <li><b>c<sub>f</sub></b> des profilés : l'AN donne des valeurs par forme (cornière, U, I, H, tubes) selon l'angle du vent ; un tube rond (tuyau) a c<sub>f</sub> ≤ 1,2.</li>
  <li><b>Toitures isolées</b> (auvents) : c<sub>f</sub> dépend de l'encombrement φ dessous (0 vide, 1 encombré).</li></ul>`,
  refs: "NF EN 1991-1-4 §5.2, §7.2 (Tab. 7.1 à 7.4), §7.3 (Tab. 7.6, 7.7), §7.4 (Tab. 7.9), §7.7 + AN (fig. 7.39 à 7.50 NA) ; CNC2M N0380 §5 à §8.", calc: "C1, S1" },
{ id: "neige", theme: "Actions climatiques", titre: "La neige",
  bref: "La carte donne la neige au sol s_k (selon la zone et l'altitude). Sur une toiture, on la multiplie par un coefficient de forme μ qui dépend de la pente.",
  corps: `<div class="form">s = μ<sub>i</sub>·C<sub>e</sub>·C<sub>t</sub>·s<sub>k</sub> &nbsp;&nbsp; μ<sub>1</sub> = 0,8 (α ≤ 30°) ; 0,8·(60 − α)/30 (30° à 60°) ; 0 (α ≥ 60°)</div>
  <ul><li><b>s<sub>k</sub></b> : zones A1 à E, majorée avec l'altitude au-delà de 200 m.</li>
  <li><b>Toiture à deux versants</b> : trois cas, la neige non déplacée (i) et la neige soufflée d'un côté (ii, iii : moitié sur un versant).</li>
  <li><b>C<sub>e</sub></b> = 1,0 (1,25 si le site est abrité en permanence) ; <b>C<sub>t</sub></b> = 1,0 (AN).</li>
  <li><b>Faible pente</b> (écoulement &lt; 5 %) : +0,1 à +0,2 kN/m² (pluie sur neige, AN).</li>
  <li><b>s<sub>Ad</sub></b> : neige exceptionnelle, situation accidentelle.</li></ul>
  <p>Sur une tuyauterie extérieure, S1 prend 0,8 × s<sub>k</sub> sur le diamètre calorifugé (pratique courante, pas de règle explicite dans la norme).</p>`,
  refs: "NF EN 1991-1-3 §5.2, §5.3, Tab. 5.2, fig. 5.2-5.3 + AN (5.2(6), 5.2(7), 5.2(8)).", calc: "C1 → S1, P1" },
{ id: "seisme", theme: "Actions climatiques", titre: "Le séisme pour les équipements et supports",
  bref: "En zone sismique, un support ou une tuyauterie (élément « non structural ») reçoit une force horizontale égale à une fraction de son poids, amplifiée selon sa hauteur dans le bâtiment.",
  corps: `<div class="form">F<sub>a</sub> = S<sub>a</sub>·W<sub>a</sub>·γ<sub>a</sub>/q<sub>a</sub> &nbsp; avec S<sub>a</sub> = α·S·[3·(1 + z/H)/(1 + (1 − T<sub>a</sub>/T<sub>1</sub>)²) − 0,5] ≥ α·S</div>
  <ul><li><b>α = a<sub>g</sub>/g</b> : accélération du sol (zone 1 à 5 et catégorie d'importance).</li><li><b>S</b> : amplification due au sol (classes A à E).</li>
  <li><b>z/H</b> : position de l'équipement dans le bâtiment (plus haut = plus sollicité).</li><li><b>q<sub>a</sub></b> : capacité à dissiper (1 à 2) ; γ<sub>a</sub> : importance (1 à 1,5).</li></ul>
  <p>S1 combine les directions 100 % / 30 % (X et Y) avec le poids (G + ψ<sub>2</sub>·Q + E).</p>`,
  refs: "NF EN 1998-1 §4.3.5 (éq. 4.24, 4.25) + AN ; arrêté du 22 octobre 2010 modifié ; §4.3.3.5.2 (combinaison des directions).", calc: "C1 → S1" },

/* ---------------- ACIER ---------------- */
{ id: "classes", theme: "Calcul acier", titre: "Classes de section : la section peut-elle plastifier ?",
  bref: "Une paroi mince et large se voile (cloque) avant que l'acier ne plastifie. La classe (1 à 4) dit jusqu'où on peut exploiter la section.",
  corps: `<ul><li><b>Classe 1 et 2</b> : la section peut plastifier entièrement → résistance plastique (W<sub>pl</sub>).</li>
  <li><b>Classe 3</b> : seule la fibre extrême atteint f<sub>y</sub> → résistance élastique (W<sub>el</sub>).</li>
  <li><b>Classe 4</b> : voilement local avant f<sub>y</sub> → section efficace réduite (non traité par les calculettes : choisir une paroi plus épaisse).</li></ul>
  <div class="form">Critère : élancement de paroi c/t comparé à 9ε, 10ε, 14ε (parois comprimées en console) ou 72ε, 83ε, 124ε (âmes fléchies), ε = √(235/f<sub>y</sub>)</div>
  <p>Les cornières sont au mieux de classe 3 (calcul élastique).</p>`,
  refs: "NF EN 1993-1-1 §5.5, Tableau 5.2.", calc: "P1, P2, S1, BD" },
{ id: "resistance", theme: "Calcul acier", titre: "Résistance d'une section (N, M, V)",
  bref: "On compare les efforts (effort normal N, moments M, effort tranchant V) à ce que la section peut reprendre, puis on cumule.",
  corps: `<div class="form">N<sub>Rd</sub> = A·f<sub>y</sub>/γ<sub>M0</sub> &nbsp; M<sub>Rd</sub> = W·f<sub>y</sub>/γ<sub>M0</sub> &nbsp; V<sub>Rd</sub> = A<sub>v</sub>·(f<sub>y</sub>/√3)/γ<sub>M0</sub><br>
  Cumul prudent (critère linéaire) : N<sub>Ed</sub>/N<sub>Rd</sub> + M<sub>y,Ed</sub>/M<sub>y,Rd</sub> + M<sub>z,Ed</sub>/M<sub>z,Rd</sub> ≤ 1</div>
  <p>W = W<sub>pl</sub> (classe 1-2) ou W<sub>el</sub> (classe 3). Le critère linéaire est simple et sécuritaire ; les formules plastiques de la norme donneraient un peu plus de résistance.</p>`,
  refs: "NF EN 1993-1-1 §6.2.3 à §6.2.10, §6.2.1(7).", calc: "P1, P2, S1" },
{ id: "flambement", theme: "Calcul acier", titre: "Le flambement : une barre comprimée qui se dérobe",
  bref: "Une barre longue et mince comprimée se courbe brusquement bien avant que l'acier n'atteigne sa limite. Plus elle est longue et souple, plus la charge admissible chute.",
  corps: `<div class="form">N<sub>cr</sub> = π²·E·I / L<sub>cr</sub>² &nbsp; λ̄ = √(A·f<sub>y</sub>/N<sub>cr</sub>) &nbsp; N<sub>b,Rd</sub> = χ·A·f<sub>y</sub>/γ<sub>M1</sub></div>
  <ul><li><b>L<sub>cr</sub></b> (longueur de flambement) dépend des liaisons aux extrémités : L pour une barre articulée aux deux bouts, <b>2L pour une console</b> (encastrée en pied, libre en tête), 0,7L encastrée-articulée.</li>
  <li><b>χ</b> ≤ 1 : coefficient de réduction, lu sur une courbe (a<sub>0</sub>, a, b, c, d) qui dépend de la forme et de la fabrication (tubes formés à froid : c).</li>
  <li>Élancement usuel maximal L<sub>cr</sub>/i ≈ 200 pour une barre comprimée.</li></ul>
  <p>S1 prend volontairement L<sub>cr</sub> = 2L pour les montants et consoles (prudent en APS).</p>`,
  refs: "NF EN 1993-1-1 §6.3.1, Tab. 6.1 et 6.2.", calc: "P2, S1" },
{ id: "deversement", theme: "Calcul acier", titre: "Le déversement : une poutre qui se couche",
  bref: "Une poutre fléchie dont la semelle comprimée n'est pas tenue latéralement peut se dérober de côté en tournant. C'est le « flambement latéral » des poutres.",
  corps: `<div class="form">λ̄<sub>LT</sub> = √(W<sub>y</sub>·f<sub>y</sub>/M<sub>cr</sub>) &nbsp; M<sub>b,Rd</sub> = χ<sub>LT</sub>·W<sub>y</sub>·f<sub>y</sub>/γ<sub>M1</sub></div>
  <p>M<sub>cr</sub> (moment critique) augmente avec l'inertie latérale I<sub>z</sub>, la rigidité de torsion I<sub>t</sub> et de gauchissement I<sub>w</sub>, et diminue avec la longueur entre maintiens. Les profilés en H et les tubes déversent peu ; les IPE longs sans maintien déversent beaucoup.</p>`,
  refs: "NF EN 1993-1-1 §6.3.2 ; M<sub>cr</sub> : formule à 3 facteurs (C<sub>1</sub>, C<sub>2</sub>, z<sub>g</sub>).", calc: "P1, P2, S1" },
{ id: "torsion", theme: "Calcul acier", titre: "Torsion : pourquoi les tubes sont meilleurs",
  bref: "Un profilé ouvert (U, I, cornière) est très souple en torsion ; un tube fermé est des centaines de fois plus rigide. Un tuyau décalé de l'axe d'un montant le fait tourner.",
  corps: `<ul><li><b>Torsion de Saint-Venant</b> : rigidité G·I<sub>t</sub>. I<sub>t</sub> d'un UPN 100 ≈ 2,8 cm⁴, d'un tube carré 100×100×4 ≈ 360 cm⁴.</li>
  <li><b>Gauchissement</b> : les profilés ouverts se gondolent en tournant. Si une extrémité est bloquée (platine soudée), cela ajoute de la rigidité et des contraintes σ<sub>w</sub> = B·ω/I<sub>w</sub>.</li></ul>
  <div class="form">Rotation d'une console tordue par un couple T : φ = T·L / (G·I<sub>t</sub>) ; avec gauchissement bloqué en pied : φ = T/(G·I<sub>t</sub>)·[L − a·tanh(L/a)], a = √(E·I<sub>w</sub>/G·I<sub>t</sub>)</div>
  <p>Conséquence pratique : un point fixe ou un frottement sur un tuyau décalé tord le support. Préférer un tube, un U ou réduire l'excentricité.</p>`,
  refs: "NF EN 1993-1-1 §6.2.7 ; théorie de Vlassov.", calc: "S1" },
{ id: "deplacements", theme: "Calcul acier", titre: "Flèches et déplacements (ELS)",
  bref: "Même résistant, un élément trop souple pose problème : tuyau qui fait des points bas, bardage qui fissure, vibrations. On limite donc les déformations.",
  corps: `<div class="form">Poutre sur 2 appuis, charge répartie : f = 5·q·L⁴ / (384·E·I) &nbsp; Console : f = q·L⁴ / (8·E·I)</div>
  <ul><li>Poutres : L/200 à L/350 selon l'usage (AN Tab. 7.1).</li><li>Poteaux de bâtiment industriel : H/150 en tête (parois non fragiles).</li>
  <li>Supports de tuyauterie : min(L/150 ; 5 mm) au point d'appui du tuyau (pratique, modifiable).</li>
  <li>Fréquence propre d'un plancher : ≥ 2,6 à 5 Hz selon l'usage (vibrations).</li></ul>`,
  refs: "NF EN 1993-1-1 §7.2 + AN (Tab. 7.1, §7.2.2, §7.2.3) ; NF EN 1990 A1.4.", calc: "P1, P2, S1" },
{ id: "assemblages", theme: "Calcul acier", titre: "Boulons, tiges filetées, pinces, chevilles",
  bref: "Une fixation travaille en traction (arrachement) et en cisaillement (glissement). On vérifie chacune et leur combinaison ; les trous doivent être assez loin des bords.",
  corps: `<div class="form">F<sub>t,Rd</sub> = 0,9·f<sub>ub</sub>·A<sub>s</sub>/γ<sub>M2</sub> &nbsp; F<sub>v,Rd</sub> = α<sub>v</sub>·f<sub>ub</sub>·A<sub>s</sub>/γ<sub>M2</sub> (α<sub>v</sub> = 0,6 pour 4.6, 5.6, 8.8)<br>
  Interaction : F<sub>v,Ed</sub>/F<sub>v,Rd</sub> + F<sub>t,Ed</sub>/(1,4·F<sub>t,Rd</sub>) ≤ 1 &nbsp; Pince latérale e<sub>2</sub> ≥ 1,2·d<sub>0</sub></div>
  <ul><li><b>A<sub>s</sub></b> : section résistante filetée (M12 : 84,3 mm² ; M16 : 157 mm²).</li>
  <li><b>Groupe de 4 fixations</b> : la traction la plus forte = N/4 + M<sub>1</sub>/(2·a<sub>2</sub>) + M<sub>2</sub>/(2·a<sub>1</sub>) (prudent).</li>
  <li><b>Chevilles</b> : leur résistance dépend du béton, des distances aux bords et de l'entraxe : vérification par le logiciel du fabricant (Hilti PROFIS, Fischer).</li>
  <li><b>Crapauds</b> (pince-poutre) : ils tiennent par serrage ; le glissement le long de la poutre est souvent la limite.</li></ul>`,
  refs: "NF EN 1993-1-8 §3.6, Tab. 3.3 (pinces), Tab. 3.4 (résistances), Tab. 2.1 + AN (γ<sub>M2</sub> = 1,25).", calc: "S1" },
{ id: "platines", theme: "Calcul acier", titre: "Platines : encastrement parfait ou semi-rigide ?",
  bref: "Une platine chevillée n'empêche jamais totalement la rotation : la platine fléchit, les chevilles s'allongent. On la modélise par un ressort.",
  corps: `<div class="form">Pied de poteau « rigide » si S<sub>j,ini</sub> ≥ 30·E·I/L (ossature non contreventée) ; S1 prend S<sub>j</sub> = 10·E·I/L (semi-rigide, prudent)</div>
  <p>Effet : les déplacements augmentent (critère ELS plus sévère) ; les efforts dans la barre changent peu. Pour un vrai encastrement, il faut une platine épaisse avec raidisseurs.</p>`,
  refs: "NF EN 1993-1-8 §5.2.2.5(2) (classification des pieds de poteaux).", calc: "S1" },
{ id: "modelisation", theme: "Calcul acier", titre: "Comment S1 modélise un support",
  bref: "Le support est découpé en barres (poutres 3D) reliées entre elles ; les tuyaux appliquent leurs charges par des bras rigides (excentricités). Le calcul est élastique au 1er ordre.",
  corps: `<ul><li>Méthode des déplacements (comme Robot), 6 degrés de liberté par nœud.</li><li>Cas de charge élémentaires (G, T, S, W, E…) calculés une fois puis combinés.</li>
  <li>Hypothèses prudentes : L<sub>cr</sub> = 2L, platines semi-rigides, critère linéaire, c<sub>f</sub> maximal, composantes de descente de charges non concomitantes.</li>
  <li>Non traité : effets du 2<sup>e</sup> ordre (P-Δ), déversement des cornières, composante verticale du séisme. Pour affiner : Robot.</li></ul>`,
  refs: "Hypothèses détaillées dans la note de calcul S1 (« Hypothèses et limites »).", calc: "S1" },

/* ---------------- TUYAUTERIE ---------------- */
{ id: "portee", theme: "Tuyauterie", titre: "Portée entre supports d'une tuyauterie",
  bref: "Un tuyau entre deux supports est une poutre : il ne doit ni trop travailler (contrainte), ni trop fléchir (points bas, vidange), ni vibrer.",
  corps: `<div class="form">Contrainte : σ = P·D/(4·e) + M/Z ≤ f &nbsp; (pression + flexion) <br>Flèche (tuyau continu) : f ≈ q·L⁴/(185·E·I) &nbsp; Fréquence propre ≥ 4 Hz (usuel)</div>
  <ul><li><b>f</b> : contrainte admissible du matériau à chaud (R<sub>p0,2,t</sub>/1,5 ; R<sub>m</sub>/2,4).</li><li>Le tuyau est chargé <b>plein</b> (fluide ou eau d'épreuve) + calorifuge.</li>
  <li>Ordre de grandeur : DN100 acier plein d'eau ≈ 5 à 6 m entre supports.</li></ul>`,
  refs: "CODETI Div. 1 ; NF EN 13480-3 §5, §12 ; ASME B31.3 §302.", calc: "T1" },
{ id: "supportage", theme: "Tuyauterie", titre: "Glissant, guidé, point fixe : la dilatation",
  bref: "Un tuyau chaud s'allonge (≈ 1,2 mm par mètre pour 100 °C). Les supports le laissent glisser (glissant), le guident (guidé) ou le bloquent (point fixe).",
  corps: `<div class="form">Allongement : Δ = α·ΔT·L (acier α ≈ 12·10⁻⁶ /K) &nbsp; Frottement sur un support : F = μ·G (μ = 0,3 acier/acier ; 0,1 PTFE)</div>
  <ul><li><b>Glissant</b> : posé, libre dans le plan horizontal. Sur un montant vertical il est impossible (le tuyau tomberait).</li>
  <li><b>Guidé</b> : libre dans l'axe, bloqué latéralement (butées).</li>
  <li><b>Point fixe</b> : bloqué ; il reprend le frottement de toute la ligne qui se dilate vers lui, plus la réaction de la lyre, du coude ou du compensateur.</li></ul>
  <div class="form">Estimation APS d'un point fixe : F<sub>x</sub> ≈ μ·q·L<sub>r</sub> + 12·E·I·Δ/L<sub>b</sub>³ (coude, méthode de la console guidée) ou c·Δ + P·A<sub>eff</sub> (compensateur, point fixe principal)</div>
  <p>Les vraies valeurs viennent de l'étude de flexibilité (CAESAR II, ROHR2).</p>`,
  refs: "NF EN 13480-3 §12, §13 ; ASME B31.3 §319 ; EJMA (compensateurs) ; méthode de la console guidée (M.W. Kellogg).", calc: "S1" },
{ id: "entraxes", theme: "Tuyauterie", titre: "Entraxes entre tuyauteries",
  bref: "Deux tuyaux voisins doivent garder un jeu pour le calorifuge, les brides, le montage et les mouvements.",
  corps: `<div class="form">E ≥ (D<sub>1</sub> + D<sub>2</sub>)/2 + e<sub>cal,1</sub> + e<sub>cal,2</sub> + J &nbsp; (J = 50 à 100 mm)</div><p>Prévoir plus si brides décalées ou fortes dilatations latérales.</p>`,
  refs: "Règle de l'art (piping design).", calc: "S1" },
];
