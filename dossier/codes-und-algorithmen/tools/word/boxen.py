"""Grafiken fuer das Dossier als SVG: Struktogramm-Textkaesten, Kaefer-Karten (wie in Kara), Baukasten,
Farbleiter, leere Zeichenraster, Farbbilder (Pixel)."""

_SEG = {  # Kastenzeichen -> Richtungen (links, rechts, oben, unten)
    "─": "LR", "│": "UD", "┌": "RD", "┐": "LD", "└": "RU", "┘": "LU",
    "├": "UDR", "┤": "UDL", "┬": "LRD", "┴": "LRU", "┼": "LRUD",
}
YELLOW = "#FFF1A6"
FONT = 'font-family="Arial"'
PIXEL = {"R": "#FF0000", "G": "#00FF00", "B": "#0000FF", "S": "#000000", "W": "#FFFFFF"}


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _wrap(w, h, inner):
    return (f'<svg viewBox="0 0 {w:.1f} {h:.1f}" style="display:block;width:100%;height:auto;max-width:{w:.0f}px">'
            + inner + "</svg>")


# ---------------------------------------------------------------- Struktogramm
def box_parts(text, cw=5.9, lh=16.5, fs=10, slot_h=1.25):
    """Struktogramm-Textkasten (┌─┐│├┤┬┴┼└┘) -> (SVG-Inhalt, Breite, Hoehe). Luecken aus ___ werden gelbe, hoehere Felder."""
    rows = text.split("\n")
    ncol = max(len(r) for r in rows)
    hs = [lh * slot_h if "___" in r else lh for r in rows]
    w, h = ncol * cw, sum(hs)
    bg, lines, texts = [], [], []
    y = 0.0
    for ri, row in enumerate(rows):
        rh = hs[ri]
        cy = y + rh / 2
        for ci, ch in enumerate(row):
            d = _SEG.get(ch)
            if not d:
                continue
            cx = (ci + 0.5) * cw
            if "L" in d: lines.append(f'<line x1="{cx - cw / 2:.1f}" y1="{cy:.1f}" x2="{cx:.1f}" y2="{cy:.1f}"/>')
            if "R" in d: lines.append(f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{cx + cw / 2:.1f}" y2="{cy:.1f}"/>')
            if "U" in d: lines.append(f'<line x1="{cx:.1f}" y1="{cy - rh / 2:.1f}" x2="{cx:.1f}" y2="{cy:.1f}"/>')
            if "D" in d: lines.append(f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{cx:.1f}" y2="{cy + rh / 2:.1f}"/>')
        ci = 0
        while ci < len(row):
            if row[ci] in _SEG:
                ci += 1
                continue
            a = ci
            while ci < len(row) and row[ci] not in _SEG:
                ci += 1
            span = row[a:ci]
            s = span.strip()
            if not s:
                continue
            lead = len(span) - len(span.lstrip())
            if set(s) == {"_"}:   # Luecke zum Ausfuellen: grosses gelbes Feld
                x0, x1 = (a + lead) * cw, (a + lead + len(s)) * cw
                bg.append(f'<rect x="{x0 - 2:.1f}" y="{y + 4:.1f}" width="{x1 - x0 + 4:.1f}" height="{rh - 8:.1f}" fill="{YELLOW}"/>')
                continue
            base = y + rh * 0.66
            if lead <= 1:
                texts.append(f'<text x="{(a + lead) * cw:.1f}" y="{base:.1f}" {FONT} font-size="{fs}">{esc(s)}</text>')
            else:
                texts.append(f'<text x="{(a + ci) / 2 * cw:.1f}" y="{base:.1f}" text-anchor="middle" {FONT} font-size="{fs}">{esc(s)}</text>')
        y += rh
    inner = ("".join(bg)
             + '<g stroke="currentColor" stroke-width="1.1" stroke-linecap="square" fill="none">' + "".join(lines) + "</g>"
             + '<g fill="currentColor">' + "".join(texts) + "</g>")
    return inner, w, h


def box_svg(text):
    inner, w, h = box_parts(text)
    return _wrap(w, h, inner)


# ---------------------------------------------------------------- Karte
def karte_parts(text, cell_px=21):
    """Kaefer-Karte im Stil von Kara (dossier.js): grau = Mauer, weiss = Weg, Z = Ziel, schwarzes Dreieck = Kaefer auf S.
    Zeilen oben zuerst; erste Zeile optional «blick: N|E|S|W» (Standard E)."""
    ls = text.strip("\n").split("\n")
    blick = "E"
    if ls[0].lower().startswith("blick:"):
        blick, ls = ls[0].split(":")[1].strip().upper(), ls[1:]
    Z = 14
    rows, cols = len(ls), max(len(r) for r in ls)
    out, start = [], None
    for r, zeile in enumerate(ls):
        for c in range(cols):
            ch = zeile[c] if c < len(zeile) else "#"
            fill = "#c4c4c4" if ch == "#" else "#ffffff"
            out.append(f'<rect x="{c * Z}" y="{r * Z}" width="{Z}" height="{Z}" fill="{fill}" stroke="#777777" stroke-width=".5"/>')
            if ch == "Z":
                out.append(f'<text x="{c * Z + Z / 2}" y="{r * Z + 11}" text-anchor="middle" {FONT} font-size="11" font-weight="700" fill="#000000">Z</text>')
            if ch == "S":
                start = (c, r)
    if start:
        mx, my = (start[0] + 0.5) * Z, (start[1] + 0.5) * Z
        rr = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "W": (-1, 0)}[blick]
        q = (-rr[1], rr[0])
        pt = lambda a, b: f"{mx + rr[0] * a + q[0] * b:.1f},{my + rr[1] * a + q[1] * b:.1f}"
        out.append(f'<polygon points="{pt(5, 0)} {pt(-4, -4.5)} {pt(-4, 4.5)}" fill="#000000"/>')
    k = cell_px / Z
    return f'<g transform="scale({k:.4f})">' + "".join(out) + "</g>", cols * cell_px, rows * cell_px


def karte_svg(text, cell_px=21):
    inner, w, h = karte_parts(text, cell_px)
    return _wrap(w, h, inner)


# ---------------------------------------------------------------- Raster (leere Zeichenflaeche)
def raster_parts(text, cell=20, gap=26, stack=False):
    """Leere Zeichenraster nebeneinander (oder untereinander mit stack=True): Zeilen «a) 6x4»."""
    x, y, out, maxw, maxh = 0, 0, [], 0, 0
    for line in text.strip("\n").split("\n"):
        cap, dim = line.rsplit(" ", 1)
        cols, rows = [int(v) for v in dim.lower().split("x")]
        out.append(f'<text x="{x}" y="{y + 12}" {FONT} font-size="12" font-weight="700" fill="currentColor">{esc(cap)}</text>')
        for r in range(rows):
            for c in range(cols):
                out.append(f'<rect x="{x + c * cell}" y="{y + 18 + r * cell}" width="{cell}" height="{cell}" fill="#ffffff" stroke="#555555" stroke-width=".8"/>')
        maxw = max(maxw, x + cols * cell)
        maxh = max(maxh, y + 18 + rows * cell)
        if stack:
            y += 18 + rows * cell + 12
        else:
            x += cols * cell + gap
    return "".join(out), maxw, maxh + 2


def raster_svg(text, cell=20, gap=26, stack=False):
    inner, w, h = raster_parts(text, cell, gap, stack)
    return _wrap(w, h, inner)


# ---------------------------------------------------------------- Pixelbild / Spielfeld
def pixel_parts(text, cell=26):
    """Farbbild oder Spielfeld: R G B S W = Rot Gruen Blau Schwarz Weiss, «.» = leer, andere Zeichen als Text (X, O)."""
    ls = text.strip("\n").split("\n")
    cols = max(len(r) for r in ls)
    out = []
    for r, row in enumerate(ls):
        for c, ch in enumerate(row):
            fill = PIXEL.get(ch, "#ffffff")
            out.append(f'<rect x="{c * cell}" y="{r * cell}" width="{cell}" height="{cell}" fill="{fill}" stroke="#555555" stroke-width=".8"/>')
            if ch not in PIXEL and ch not in ". ":
                out.append(f'<text x="{c * cell + cell / 2}" y="{r * cell + cell * 0.7}" text-anchor="middle" {FONT} font-size="{cell * 0.62:.0f}" font-weight="700" fill="#000000">{esc(ch)}</text>')
    return "".join(out), cols * cell, len(ls) * cell


def pixel_svg(text, cell=26):
    inner, w, h = pixel_parts(text, cell)
    return _wrap(w, h, inner)


# ---------------------------------------------------------------- Mehrere Grafiken nebeneinander
def row_svg(text, gap=26, cap_h=20):
    """Mehrere Grafiken nebeneinander. Teile durch eine Zeile ===== getrennt; optional erste Zeile @Beschriftung;
    danach Struktogramm-Textkasten oder, mit erster Zeile !karte / !raster / !pixel, die entsprechende Grafik."""
    built, has_cap = [], False
    for blk in text.split("\n=====\n"):
        ls = blk.strip("\n").split("\n")
        cap = None
        if ls[0].startswith("@"):
            cap, ls = ls[0][1:].strip(), ls[1:]
            has_cap = True
        kind = "box"
        if ls[0].startswith("!"):
            kind, ls = ls[0][1:].strip(), ls[1:]
        body = "\n".join(ls)
        fn = {"box": box_parts, "karte": karte_parts, "raster": raster_parts, "pixel": pixel_parts, "baukasten": baukasten_parts}[kind]
        built.append((cap, *fn(body)))
    top = cap_h if has_cap else 0
    x, inner, maxh = 0.0, [], 0.0
    for cap, svg, w, h in built:
        if cap:
            inner.append(f'<text x="{x + 1:.1f}" y="{cap_h - 7}" {FONT} font-size="12" font-weight="700" fill="currentColor">{esc(cap)}</text>')
        inner.append(f'<g transform="translate({x:.1f},{top})">{svg}</g>')
        x += w + gap
        maxh = max(maxh, h)
    return _wrap(x - gap, top + maxh + 2, "".join(inner))


# ---------------------------------------------------------------- Baukasten, Farbleiter
def baukasten_svg(text, width=560):
    """Baukasten: Gruppen «Titel: Eintrag | Eintrag | ...» als ausschneidbare Kaertchen (gestrichelt)."""
    fills = {0: ("#F2F4F3", "#444444"), 1: ("#E4F0EE", "#0F6B63")}
    out, y = [], 4
    for gi, line in enumerate(text.strip("\n").split("\n")):
        title, items = line.split(":", 1)
        items = [i.strip() for i in items.split("|") if i.strip()]
        fill, stroke = fills[gi % 2]
        out.append(f'<text x="2" y="{y + 16}" {FONT} font-size="12" font-weight="700" fill="currentColor">{esc(title.strip())}</text>')
        x, rowy = 74, y
        for it in items:
            pw = len(it) * 6.3 + 20
            if x + pw > width:
                x, rowy = 74, rowy + 32
            out.append(f'<rect x="{x:.1f}" y="{rowy}" width="{pw:.1f}" height="24" rx="3" fill="{fill}" stroke="{stroke}" stroke-width="1" stroke-dasharray="4 3"/>')
            out.append(f'<text x="{x + pw / 2:.1f}" y="{rowy + 16}" text-anchor="middle" {FONT} font-size="11.5" fill="currentColor">{esc(it)}</text>')
            x += pw + 8
        y = rowy + 40
    return _wrap(width, y, "".join(out))


def leiter_svg(text, bw=72, bh=34):
    """Farbleiter: Hexcodes (ohne #) als Farbfelder nebeneinander; «RRGGBB:Text» beschriftet mit Text statt dem Code."""
    codes = text.split()
    w = len(codes) * (bw + 8) - 8
    out = []
    for k, c in enumerate(codes):
        code, _, label = c.partition(":")
        x = k * (bw + 8)
        out.append(f'<rect x="{x}" y="1" width="{bw}" height="{bh}" fill="#{code}" stroke="#555555" stroke-width=".8"/>')
        out.append(f'<text x="{x + bw / 2}" y="{bh + 16}" text-anchor="middle" {FONT} font-size="11" fill="currentColor">{esc(label or code)}</text>')
    return _wrap(w, bh + 22, "".join(out))


def baukasten_parts(text, w=112, ih=18, gap=5, colgap=10):
    """Baukasten schmal: Gruppen «Titel: a | b | c» als Spalten nebeneinander (neben ein Struktogramm)."""
    fills = {0: ("#F2F4F3", "#444444"), 1: ("#E4F0EE", "#0F6B63")}
    out, maxy = [], 0
    for gi, line in enumerate(text.strip("\n").split("\n")):
        title, items = line.split(":", 1)
        items = [i.strip() for i in items.split("|") if i.strip()]
        fill, stroke = fills[gi % 2]
        x, y = gi * (w + colgap), 0
        out.append(f'<text x="{x + 1}" y="12" {FONT} font-size="11" font-weight="700" fill="currentColor">{esc(title.strip())}</text>')
        y = 18
        for it in items:
            out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{ih}" rx="3" fill="{fill}" stroke="{stroke}" stroke-width="1" stroke-dasharray="4 3"/>')
            out.append(f'<text x="{x + w / 2}" y="{y + ih * 0.7:.1f}" text-anchor="middle" {FONT} font-size="10" fill="currentColor">{esc(it)}</text>')
            y += ih + gap
        maxy = max(maxy, y)
    ng = len(text.strip("\n").split("\n"))
    return "".join(out), ng * w + (ng - 1) * colgap, maxy
