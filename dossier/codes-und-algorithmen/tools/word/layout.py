"""Layout-Check fuer die Word-Dateien: keine neue Ueberschrift im letzten Fuenftel einer Seite."""
import os, re, subprocess
import pymupdf

HERE = os.path.dirname(os.path.abspath(__file__))
PS = os.path.join(HERE, "docx2pdf.ps1")

# Seitenraender wie in build_docx.js (Twips): oben 1134+150, unten 1134
TOP_PT = (1134 + 150) / 20
BOTTOM_MARGIN_PT = 1134 / 20
FRACTION = 0.8   # eine Ueberschrift darf nur in den oberen vier Fuenfteln beginnen


def to_pdf(docx, pdf):
    subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PS, docx, pdf],
                   check=True, capture_output=True)


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def late_headings(pdf):
    """Liefert Liste (Seite, Text) der Ueberschriften (12 und 14 pt), die im letzten Fuenftel beginnen."""
    out = []
    doc = pymupdf.open(pdf)
    for pno, page in enumerate(doc, 1):
        h = page.rect.height
        bottom = h - BOTTOM_MARGIN_PT
        limit = TOP_PT + (bottom - TOP_PT) * FRACTION
        for b in page.get_text("dict")["blocks"]:
            for line in b.get("lines", []):
                spans = [s for s in line["spans"] if s["text"].strip()]
                if not spans:
                    continue
                size = spans[0]["size"]
                bold = bool(spans[0]["flags"] & 16) or "Bold" in spans[0]["font"]
                if bold and 11.5 <= size <= 14.5 and line["bbox"][1] > limit:
                    out.append((pno, norm("".join(s["text"] for s in spans))))
    return out
