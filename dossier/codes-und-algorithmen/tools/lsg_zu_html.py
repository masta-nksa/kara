"""lsg.md -> loesungen.html (Handy-Seite im Stil der anderen Kara-Dossiers).

Aufruf (im Ordner dossier/codes-und-algorithmen):  python tools/lsg_zu_html.py
Braucht markdown-it-py. Struktogramm-Textkästen (┌─┐) werden als SVG gezeichnet (tools/word/boxen.py),
Aufgabentitel stammen aus lerndossier.md.
"""
import html, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, "word"))
from boxen import box_svg, pixel_svg
from markdown_it import MarkdownIt

md = MarkdownIt("commonmark", {"breaks": True}).enable("table")

lsg = open(os.path.join(ROOT, "lsg.md"), encoding="utf-8").read().replace("\r", "")
dos = open(os.path.join(ROOT, "lerndossier.md"), encoding="utf-8").read()
titel = {m.group(1): m.group(2).strip() for m in re.finditer(r"\[\[aufgabe:Aufgabe (\S+) [●○]+ — (.*?)\]\]", dos)}


def render(text):
    """Markdown -> HTML; Codeblöcke mit Kasten als SVG, sonst <pre>."""
    out = []
    for tok in md.parse(text):
        pass
    h = md.render(text)
    # Struktogramme: <pre><code>┌...</code></pre> -> SVG
    emoji = {"⬛": "S", "⬜": "W", "🟥": "R", "🟩": "G", "🟦": "B", "❌": "X", "⭕": "O"}

    def box(m):
        raw = html.unescape(m.group(1)).rstrip("\n")
        if "┌" in raw:
            return '<div class="ds-struk">' + box_svg(raw) + "</div>"
        if raw and all(c in emoji or c in " \n" for c in raw):   # Farbbild oder Spielfeld als Grafik
            z = "\n".join("".join(emoji[c] for c in row if c in emoji) for row in raw.split("\n"))
            if "X" in z or "O" in z:
                z = z.replace("W", ".")
            return '<div class="ds-pixel">' + pixel_svg(z, 22) + "</div>"
        return '<pre class="ds-code">' + m.group(1) + "</pre>"
    h = re.sub(r"<pre><code[^>]*>(.*?)</code></pre>", box, h, flags=re.S)
    h = h.replace("<table>", '<div class="ds-scroll"><table class="ds-tab">').replace("</table>", "</table></div>")
    return h


def aufgabe(tid, body):
    t = titel.get(tid, "")
    kopf = f"Aufgabe {tid}" + (f" · {t}" if t else "")
    return f'  <section class="ds-aufgabe">\n    <h3>{html.escape(kopf)}</h3>\n{render(body)}  </section>\n'


teile, lines, i = [], lsg.split("\n"), 0
# Einheiten bilden
units, cur = [], None
def flush():
    global cur
    if cur:
        units.append(cur)
        cur = None
in_code = False
for l in lines:
    if l.startswith("```"):
        in_code = not in_code
        if cur: cur[2].append(l)
        continue
    if in_code:
        if cur: cur[2].append(l)
        continue
    m = re.match(r"^### (A\d+)\s*$", l)
    mb = re.match(r"^\*\*(B\d+\.\d+)\*\*\s*(.*)$", l)
    if re.match(r"^# ", l) or re.match(r"^## ", l):
        flush()
        units.append(("kopf", l, []))
    elif m:
        flush()
        cur = ("aufgabe", m.group(1), [])
    elif mb:
        flush()
        cur = ("aufgabe", mb.group(1), [mb.group(2)])
    elif l.strip() == "---":
        flush()
    elif cur:
        cur[2].append(l)
flush()

body = []
for kind, a, b in units:
    if kind == "kopf":
        if a.startswith("# Lösungen"):
            continue
        txt = re.sub(r"^#+\s*", "", a).replace(": ", " — ", 1)
        body.append(f'  <h2>{html.escape(txt)}</h2>\n')
    else:
        body.append(aufgabe(a, "\n".join(b).strip("\n") + "\n"))

seite = f"""<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lösungen · Codes und Algorithmen</title>
<link rel="icon" href="../../assets/favicon.svg">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../../assets/basis.css">
<link rel="stylesheet" href="../dossier.css">
<style>
.ds-struk{{margin:.6em 0;max-width:420px}}
.ds-struk svg{{display:block;width:100%;height:auto}}
.ds-code{{font-family:"IBM Plex Mono",monospace;font-size:.85em;line-height:1.25;overflow-x:auto;margin:.5em 0}}
.ds h2{{margin-top:1.6em}}
.ds-pixel{{margin:.5em 0}}
.ds-pixel svg{{display:block;max-width:100%}}
.ds-scroll{{overflow-x:auto}}
.ds p,.ds li,.ds td{{overflow-wrap:anywhere}}
.ds-code{{max-width:100%}}
</style>
</head>
<body>
<main class="ds">
  <span class="ds-eyebrow">Dossier · Codes und Algorithmen</span>
  <h1>Lösungen</h1>

{"".join(body)}</main>
<script src="../../assets/zaehler.js"></script>
</body>
</html>
"""
open(os.path.join(ROOT, "loesungen.html"), "w", encoding="utf-8").write(seite)
print("loesungen.html:", len(seite), "Zeichen,", sum(1 for k, _, _ in units if k == "aufgabe"), "Aufgaben")
