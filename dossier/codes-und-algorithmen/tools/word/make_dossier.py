"""Erzeugt ein Word-Dossier im festen Dossier-Design (Vorbild: Algorithmen_FMS/tools/word).

Aufruf:  python make_dossier.py QUELLE.md ZIEL.docx "Kopfzeile" [--no-layout]

Die Quelle ist Markdown im Dossier-Dialekt ([[aufgabe:Titel]] ... [[/aufgabe]], [[anleitung]], [[merksatz]],
[[antwort:n]], <div style="break-before:page"></div>). Braucht: node + npm install (docx), pymupdf, markdown-it-py.
Der Layout-Check braucht Microsoft Word (wandelt in PDF um und setzt Umbrüche vor Überschriften im letzten Fünftel).
"""
import json, os, re, shutil, subprocess, sys, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from md2model import convert
import layout

IMG = os.path.join(HERE, "img")
PDFS = os.path.join(HERE, "pdf")
for d in (IMG, PDFS):
    os.makedirs(d, exist_ok=True)


def strip_overrides(path):
    tmp = path + ".tmp"
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "word/numbering.xml":
                data = re.sub(rb'<w:lvlOverride w:ilvl="\d+"><w:startOverride w:val="\d+"/></w:lvlOverride>', b"", data)
            zout.writestr(item, data)
    shutil.move(tmp, path)


def build(jp, docx, header, bp):
    r = subprocess.run(["node", "build_docx.js", jp, docx, header, IMG, bp], cwd=HERE,
                       capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        raise SystemExit(r.stderr.strip()[:800])
    strip_overrides(docx)


args = [a for a in sys.argv[1:] if not a.startswith("--")]
md, docx, header = args[0], os.path.abspath(args[1]), args[2]
do_layout = "--no-layout" not in sys.argv
tag = os.path.splitext(os.path.basename(docx))[0]

blocks = convert(md, IMG, tag)
jp = os.path.join(HERE, tag + ".json")
json.dump(blocks, open(jp, "w", encoding="utf-8"), ensure_ascii=False)
bp = os.path.join(HERE, tag + ".breaks.json")
breaks = []
json.dump(breaks, open(bp, "w", encoding="utf-8"), ensure_ascii=False)
build(jp, docx, header, bp)
note = ""
if do_layout:
    pdf = os.path.join(PDFS, tag + ".pdf")
    for _ in range(8):
        layout.to_pdf(docx, pdf)
        late = [t for _, t in layout.late_headings(pdf) if t not in breaks]
        if not late:
            break
        breaks += late
        json.dump(breaks, open(bp, "w", encoding="utf-8"), ensure_ascii=False)
        build(jp, docx, header, bp)
    else:
        note = " (Layout nicht stabil)"
    note = (f", {len(breaks)} Seitenumbruch/-brüche vor Überschriften" if breaks else ", keine Überschrift im letzten Fünftel") + note
print(os.path.basename(docx) + note)
