"""Seitenaudit fuer die erzeugten PDFs (pdf/*.pdf): freie Flaeche am Seitenende, Ueberschriften und Aufgaben je Seite.

Aufruf: python tools/word/audit.py L1_Dossier L2_Dossier ...   (ohne Argumente: alle PDFs)
Gemeldet werden Seiten mit mehr als 25 % freier Inhaltsflaeche (ausser der letzten Seite) und
Ueberschriften im letzten Fuenftel. Die Liste der Inhalte je Seite hilft bei der Beurteilung der Zusammengehoerigkeit.
"""
import glob, os, re, sys
import pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
TOP = (1134 + 150) / 20
BOT_MARGIN = 1134 / 20


def page_info(page):
    h = page.rect.height
    bottom = h - BOT_MARGIN
    used = TOP
    items = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            sp = [s for s in l["spans"] if s["text"].strip()]
            if not sp or l["bbox"][1] > bottom + 5:
                continue
            used = max(used, l["bbox"][3])
            text = re.sub(r"\s+", " ", "".join(s["text"] for s in sp)).strip()
            bold = bool(sp[0]["flags"] & 16) or "Bold" in sp[0]["font"]
            if (bold and 11.5 <= sp[0]["size"] <= 14.5) or text.startswith("AUFGABE") or text.startswith("TAKE-AWAY"):
                items.append((round(100 * (l["bbox"][1] - TOP) / (bottom - TOP)), text[:44]))
    for im in page.get_image_info():
        if im["bbox"][3] <= bottom + 5:
            used = max(used, im["bbox"][3])
    for dr in page.get_drawings():
        r = dr["rect"]
        if r.y1 <= bottom + 5 and r.y0 >= TOP - 5:
            used = max(used, r.y1)
    free = 100 * (bottom - used) / (bottom - TOP)
    return round(free), items


def main(names):
    pdfs = [os.path.join(HERE, "pdf", n + ".pdf") for n in names] if names else sorted(glob.glob(os.path.join(HERE, "pdf", "*.pdf")))
    for f in pdfs:
        d = pymupdf.open(f)
        print(f"\n=== {os.path.basename(f)}  ({len(d)} Seiten)")
        for i, p in enumerate(d, 1):
            free, items = page_info(p)
            flag = "  <-- LEER" if (free > 25 and i < len(d)) else ""
            print(f"S.{i}: frei {free:3d} %{flag}")
            for pos, t in items:
                late = "  (!) letztes Fuenftel" if pos > 80 and not t.startswith(("AUFGABE", "TAKE")) else ""
                print(f"      {pos:3d} %  {t}{late}")


if __name__ == "__main__":
    main(sys.argv[1:])
