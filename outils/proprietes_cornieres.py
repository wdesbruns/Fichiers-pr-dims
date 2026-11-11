"""Caractéristiques des cornières à partir des dimensions normalisées (h, b, t, r1).
Section = deux rectangles + congé de racine − congés d'extrémité (carré − quart de cercle).
Repère : talon à l'origine, aile h selon z, aile b selon y. Unités : mm → cm."""
import math

def cornieres(h, b, t, r1, r2=0):
    pieces = [  # (A, cy, cz, Iy_propre, Iz_propre)  y horizontal, z vertical
        (b * t, b / 2, t / 2, b * t**3 / 12, t * b**3 / 12),
        ((h - t) * t, t / 2, t + (h - t) / 2, t * (h - t)**3 / 12, (h - t) * t**3 / 12),
    ]
    # congé de racine : carré r1×r1 moins quart de cercle, coin en (t, t)
    Ac = r1 * r1 * (1 - math.pi / 4)
    d = r1 * (10 - 3 * math.pi) / (12 - 3 * math.pi)        # centroïde du congé depuis le coin
    pieces.append((Ac, t + d, t + d, 0.0075 * r1**4, 0.0075 * r1**4))
    if r2:  # congés d'extrémité d'aile (matière retirée)
        A2 = r2 * r2 * (1 - math.pi / 4); d2 = r2 * (10 - 3 * math.pi) / (12 - 3 * math.pi)
        pieces.append((-A2, b - d2, t - d2, 0, 0)); pieces.append((-A2, t - d2, h - d2, 0, 0))
    A = sum(p[0] for p in pieces)
    yc = sum(p[0] * p[1] for p in pieces) / A
    zc = sum(p[0] * p[2] for p in pieces) / A
    Iy = sum(p[3] + p[0] * (p[2] - zc)**2 for p in pieces)  # autour de l'axe y (horizontal) : fonction de z
    Iz = sum(p[4] + p[0] * (p[1] - yc)**2 for p in pieces)
    Iyz = sum(p[0] * (p[1] - yc) * (p[2] - zc) for p in pieces)
    Im, R = (Iy + Iz) / 2, math.hypot((Iy - Iz) / 2, Iyz)
    Iu, Iv = Im + R, Im - R
    alpha = 0.5 * math.atan2(-2 * Iyz, Iy - Iz)              # angle des axes principaux
    pts = [(0, 0), (b, 0), (b, t), (t, h), (0, h)]
    ca, sa = math.cos(alpha), math.sin(alpha)
    def proj(p):  # coordonnées dans le repère principal (u : grand axe)
        y, z = p[0] - yc, p[1] - zc
        return (y * ca + z * sa, -y * sa + z * ca)
    P = [proj(p) for p in pts]
    vmax = max(abs(q[1]) for q in P); umax = max(abs(q[0]) for q in P)
    It = (b + h - t) * t**3 / 3
    return dict(A=A / 100, ey=yc / 10, ez=zc / 10, Iy=Iy / 1e4, Iz=Iz / 1e4, Iu=Iu / 1e4, Iv=Iv / 1e4,
                alpha=math.degrees(alpha), Wu=Iu / vmax / 1e3, Wv=Iv / umax / 1e3,
                iu=math.sqrt(Iu / A) / 10, iv=math.sqrt(Iv / A) / 10, iy=math.sqrt(Iy / A) / 10, iz=math.sqrt(Iz / A) / 10,
                Wely=Iy / (h - zc) / 1e3, Welz=Iz / (b - yc) / 1e3, It=It / 1e4, m=A * 7.85e-3)

if __name__ == "__main__":
    for dims in [(50, 50, 5, 7, 3.5), (100, 100, 10, 12, 6), (120, 80, 8, 11, 5.5)]:
        p = cornieres(*dims)
        print(dims, {k: round(v, 3) for k, v in p.items()})
