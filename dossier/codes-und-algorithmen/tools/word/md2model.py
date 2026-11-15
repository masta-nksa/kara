"""Markdown (Dossier-Dialekt mit [[Marken]], Inline-HTML und SVG) -> JSON-Modell fuer den docx-Builder."""
import json, os, re, sys
from html.parser import HTMLParser
import pymupdf
from markdown_it import MarkdownIt

ACCENT = "#0f6b63"
INK = "#16201f"


# ------------------------------------------------------------------ SVG
def expand_patterns(svg):
    """MuPDF kennt weder <pattern>-Fuellungen noch zuverlaessig clipPath: Muster als Einzelelemente ausschreiben."""
    for m in list(re.finditer(r'<defs><pattern id="(\w+)"([^>]*)>(.*?)</pattern></defs>', svg, re.S)):
        pid, attrs, content = m.group(1), m.group(2), m.group(3)
        num = lambda k, s, d=0.0: float(re.search(rf'(?<![\w-]){k}="([-\d.]+)"', s).group(1)) if re.search(rf'(?<![\w-]){k}="([-\d.]+)"', s) else d
        w, h, px, py = num("width", attrs), num("height", attrs), num("x", attrs), num("y", attrs)
        svg = svg.replace(m.group(0), "")
        rm = re.search(rf'<rect ([^>]*?)fill="url\(#{pid}\)"([^>]*?)/>', svg)
        if not rm:
            continue
        rattrs = rm.group(1) + rm.group(2)
        rx, ry, rw, rh = (num(k, rattrs) for k in ("x", "y", "width", "height"))
        els = []
        if "<circle" in content:
            cx, cy, r = num("cx", content), num("cy", content), num("r", content, 2)
            fill = re.search(r'fill="([^"]+)"', content).group(1)
            fo = num("fill-opacity", content, 1)
            k = 0
            while True:
                x = px + cx + k * w
                if x > rx + rw:
                    break
                j = 0
                while True:
                    y = py + cy + j * h
                    if y > ry + rh:
                        break
                    if x >= rx and y >= ry:
                        els.append(f'<circle cx="{x:g}" cy="{y:g}" r="{r:g}" fill="{fill}" fill-opacity="{fo:g}"/>')
                    j += 1
                k += 1
        else:  # Gitterlinien
            so = num("stroke-opacity", content, 1)
            x = px
            while x <= rx + rw:
                if x > rx:
                    els.append(f'<line x1="{x:g}" y1="{ry:g}" x2="{x:g}" y2="{ry + rh:g}" stroke="currentColor" stroke-opacity="{so:g}"/>')
                x += w
            y = py
            while y <= ry + rh:
                if y > ry:
                    els.append(f'<line x1="{rx:g}" y1="{y:g}" x2="{rx + rw:g}" y2="{y:g}" stroke="currentColor" stroke-opacity="{so:g}"/>')
                y += h
        outline = rm.group(0).replace(f'fill="url(#{pid})"', 'fill="none"')
        svg = svg.replace(rm.group(0), "".join(els) + outline)
    return svg


def render_svg(svg, path, outdir):
    s = expand_patterns(svg)
    s = s.replace("var(--accent)", ACCENT).replace("currentColor", INK)
    s = re.sub(r'style="display:block;width:100%;height:auto[^"]*"', "", s)
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', s)
    w, h = float(m.group(1)), float(m.group(2))
    s = s.replace("<svg ", f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" ', 1)
    tmp = path + ".svg"
    open(tmp, "w", encoding="utf-8").write(s)
    d = pymupdf.open(tmp)
    pix = d[0].get_pixmap(matrix=pymupdf.Matrix(3, 3), alpha=False)
    pix.save(path)
    os.remove(tmp)
    return w, h


from boxen import box_svg, row_svg, karte_svg, baukasten_svg, leiter_svg, raster_svg, pixel_svg


# ------------------------------------------------------------------ Inline
def inline_runs(children):
    runs, b, i = [], 0, 0
    for t in children or []:
        ty = t.type
        if ty == "strong_open":
            b += 1
        elif ty == "strong_close":
            b -= 1
        elif ty == "em_open":
            i += 1
        elif ty == "em_close":
            i -= 1
        elif ty == "text":
            # {{n}} = Ausfuellfeld (gelb, n Zeichen breit)
            parts = re.split(r"\{\{(\d*)\}\}", t.content)
            for k, part in enumerate(parts):
                if k % 2 == 0:
                    if part:
                        runs.append({"t": part, "b": b > 0, "i": i > 0})
                else:
                    runs.append({"f": int(part or 8)})
        elif ty == "code_inline":
            runs.append({"t": t.content, "b": b > 0, "i": i > 0, "c": True})
        elif ty in ("softbreak", "hardbreak"):
            runs.append({"br": True})
        elif ty == "link_open" or ty == "link_close" or ty == "html_inline":
            pass
    return runs


class Node:
    def __init__(self, tag, attrs=None):
        self.tag, self.attrs, self.children = tag, dict(attrs or []), []


class Tree(HTMLParser):
    VOID = {"img", "br"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        n = Node(tag, attrs)
        self.stack[-1].children.append(n)
        if tag not in self.VOID:
            self.stack.append(n)

    def handle_endtag(self, tag):
        for k in range(len(self.stack) - 1, 0, -1):
            if self.stack[k].tag == tag:
                del self.stack[k:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def node_runs(node, b=False, i=False):
    runs = []
    for c in node.children:
        if isinstance(c, str):
            if c.strip() or c:
                runs.append({"t": c, "b": b, "i": i})
        elif c.tag in ("b", "strong"):
            runs += node_runs(c, True, i)
        elif c.tag in ("i", "em"):
            runs += node_runs(c, b, True)
        elif c.tag == "br":
            runs.append({"br": True})
        else:
            runs += node_runs(c, b, i)
    return runs


def node_text(node):
    return "".join(c if isinstance(c, str) else node_text(c) for c in node.children).strip()


# ------------------------------------------------------------------ Konverter
class Converter:
    def __init__(self, outdir, tag):
        self.outdir, self.tag, self.img_n = outdir, tag, 0
        self.md = MarkdownIt("commonmark").enable("table")
        os.makedirs(outdir, exist_ok=True)

    # --- Bilder
    def image_block(self, svg):
        self.img_n += 1
        fn = f"{self.tag}_img{self.img_n:02d}.png"
        w, h = render_svg(svg, os.path.join(self.outdir, fn), self.outdir)
        mw = re.search(r"max-width:(\d+)px", svg)
        disp = float(mw.group(1)) if mw else max(w, 150) * 1.0
        return {"t": "image", "file": fn, "wpx": disp, "hpx": disp * h / w}

    # --- HTML-Block
    def html_blocks(self, html):
        imgs = []

        def repl(m):
            imgs.append(m.group(0))
            return f'<img data-i="{len(imgs) - 1}">'

        html = re.sub(r"<svg\b.*?</svg>", repl, html, flags=re.S)
        tr = Tree()
        tr.feed(html)
        blocks = self.nodes_to_blocks(tr.root.children, imgs)
        # aufeinanderfolgende Streifen zusammenfassen
        out = []
        for b in blocks:
            if b["t"] == "strips" and out and out[-1]["t"] == "strips" and len(b["rows"]) == 1 and len(b["rows"][0]) == 1 and len(out[-1]["rows"][0]) == 1:
                out[-1]["rows"].append(b["rows"][0])
            else:
                out.append(b)
        return out

    def nodes_to_blocks(self, nodes, imgs):
        blocks = []
        for n in nodes:
            if isinstance(n, str):
                if n.strip():
                    blocks.append({"t": "p", "runs": [{"t": n.strip()}]})
                continue
            style = n.attrs.get("style", "")
            if n.tag == "div" and "break-before:page" in style.replace(" ", ""):
                blocks.append({"t": "pagebreak"})   # manueller Seitenumbruch (wirkt auch im HTML-Druck)
            elif n.tag == "img":
                blocks.append(self.image_block(imgs[int(n.attrs["data-i"])]))
            elif n.tag == "div" and "display:flex" in style.replace(" ", ""):
                cols = [c for c in n.children if not isinstance(c, str)]
                if cols and all("dashed" in c.attrs.get("style", "") for c in cols):
                    blocks.append({"t": "strips", "rows": [[node_text(c) for c in cols]]})
                else:
                    wd = [re.search(r"width:\s*([\d.]+)%", c.attrs.get("style", "")) for c in cols]
                    widths = [float(m.group(1)) for m in wd] if all(wd) else None
                    blocks.append({"t": "cols", "widths": widths,
                                   "cols": [self.nodes_to_blocks(c.children, imgs) for c in cols]})
            elif n.tag == "div" and "dashed" in style:
                blocks.append({"t": "strips", "rows": [[node_text(n)]]})
            elif n.tag == "div":
                blocks += self.nodes_to_blocks(n.children, imgs)
            elif n.tag == "p":
                inner_imgs = [c for c in n.children if not isinstance(c, str) and c.tag == "img"]
                runs = node_runs(n)
                if runs:
                    blocks.append({"t": "p", "runs": runs})
                for c in inner_imgs:
                    blocks.append(self.image_block(imgs[int(c.attrs["data-i"])]))
            elif n.tag in ("ol", "ul"):
                items = [node_runs(li) for li in n.children if not isinstance(li, str) and li.tag == "li"]
                blocks.append({"t": "ol" if n.tag == "ol" else "ul", "items": items})
            elif n.tag in ("b", "strong", "i", "em"):
                blocks.append({"t": "p", "runs": node_runs(Node("x") if False else _wrap(n))})
        return blocks

    # --- Markdown-Token
    def md_blocks(self, text):
        toks = self.md.parse(text)
        blocks, _ = self.parse_tokens(toks, 0, None)
        return blocks

    def parse_tokens(self, toks, i, end):
        blocks = []
        while i < len(toks):
            t = toks[i]
            if end and t.type == end:
                return blocks, i + 1
            ty = t.type
            if ty == "heading_open":
                lvl = int(t.tag[1])
                runs = inline_runs(toks[i + 1].children)
                blocks.append({"t": f"h{lvl}", "runs": runs})
                i += 3
            elif ty == "paragraph_open":
                blocks.append({"t": "p", "runs": inline_runs(toks[i + 1].children)})
                i += 3
            elif ty in ("bullet_list_open", "ordered_list_open"):
                close = ty.replace("_open", "_close")
                items = []
                i += 1
                while toks[i].type != close:
                    assert toks[i].type == "list_item_open"
                    inner, i = self.parse_tokens(toks, i + 1, "list_item_close")
                    runs = []
                    for b in inner:
                        if b["t"] == "p":
                            runs += ([{"br": True}] if runs else []) + b["runs"]
                    items.append(runs)
                i += 1
                blocks.append({"t": "ul" if ty.startswith("bullet") else "ol", "items": items})
            elif ty == "table_open":
                head, rows, cur, is_head = [], [], None, False
                i += 1
                while toks[i].type != "table_close":
                    k = toks[i].type
                    if k == "thead_open":
                        is_head = True
                    elif k == "thead_close":
                        is_head = False
                    elif k == "tr_open":
                        cur = []
                    elif k == "tr_close":
                        (head if is_head else rows).append(cur) if not is_head else head.extend(cur)
                    elif k in ("th_open", "td_open"):
                        cur.append(inline_runs(toks[i + 1].children))
                    i += 1
                i += 1
                blocks.append({"t": "table", "head": head, "rows": rows})
            elif ty == "blockquote_open":
                inner, i = self.parse_tokens(toks, i + 1, "blockquote_close")
                blocks.append({"t": "box", "kind": "merksatz", "title": None, "blocks": inner})
            elif ty in ("fence", "code_block"):
                info_full = (t.info or "").strip()
                parts = info_full.split()
                info = parts[0] if parts else ""
                flags = parts[1:]
                body = t.content.rstrip("\n")
                if info == "nebeneinander":
                    blocks.append(self.image_block(row_svg(body)))
                elif info == "karte":
                    blocks.append(self.image_block(karte_svg(body)))
                elif info == "farbleiter":
                    blocks.append(self.image_block(leiter_svg(body, 48, 22) if "klein" in flags else leiter_svg(body)))
                elif info == "raster":
                    blocks.append(self.image_block(raster_svg(body, stack="senkrecht" in flags)))
                elif info == "pixel":
                    blocks.append(self.image_block(pixel_svg(body)))
                elif info == "baukasten":
                    blocks.append(self.image_block(baukasten_svg(body)))
                elif "┌" in t.content:   # Struktogramm-Textkasten: als Grafik zeichnen
                    blocks.append(self.image_block(box_svg(body)))
                else:
                    blocks.append({"t": "code", "text": t.content.rstrip("\n")})
                if "rechts" in flags and blocks and blocks[-1].get("t") == "image":
                    blocks[-1]["float"] = "right"
                i += 1
            elif ty == "html_block":
                blocks += self.html_blocks(t.content)
                i += 1
            elif ty == "hr":
                blocks.append({"t": "hr"})
                i += 1
            else:
                i += 1
        return blocks, i

    # --- Marken
    OPEN = re.compile(r"^\[\[(anleitung|aufgabe|merksatz|checkliste|kontrolle|spalten)(?::(.*))?\]\]\s*$")
    SINGLE = re.compile(r"^\[\[(namensfeld|antwort|feld)(?::(\d+))?\]\]\s*$")

    def parse(self, lines):
        blocks, buf, i = [], [], 0

        def flush():
            nonlocal buf
            if any(l.strip() for l in buf):
                blocks.extend(self.md_blocks("\n".join(buf)))
            buf = []

        while i < len(lines):
            line = lines[i]
            mo = self.OPEN.match(line.strip())
            ms = self.SINGLE.match(line.strip())
            if mo:
                flush()
                name, arg = mo.group(1), mo.group(2)
                j = i + 1
                while j < len(lines) and lines[j].strip() != f"[[/{name}]]":
                    j += 1
                inner = self.parse(lines[i + 1:j])
                if name == "spalten":
                    seg, cur = [], []
                    for l in lines[i + 1:j]:
                        if l.strip() == "[[||]]":
                            seg.append(cur)
                            cur = []
                        else:
                            cur.append(l)
                    seg.append(cur)
                    widths = [float(x) for x in arg.split("|")] if arg else None
                    blocks.append({"t": "cols", "widths": widths, "cols": [self.parse(s) for s in seg]})
                    i = j + 1
                    continue
                if name == "checkliste":
                    items = []
                    for b in inner:
                        if b["t"] == "ul":
                            items += b["items"]
                    blocks.append({"t": "checklist", "items": items})
                else:
                    blocks.append({"t": "box", "kind": name, "title": arg, "blocks": inner})
                i = j + 1
            elif ms:
                flush()
                if ms.group(1) == "feld":
                    blocks.append({"t": "feld", "n": int(ms.group(2) or 4)})
                elif ms.group(1) == "namensfeld":
                    blocks.append({"t": "namensfeld"})
                else:
                    blocks.append({"t": "lines", "n": int(ms.group(2) or 2)})
                i += 1
            else:
                buf.append(line)
                i += 1
        flush()
        return blocks


def _wrap(n):
    w = Node("x")
    w.children = [n]
    return w


def convert(md_path, outdir, tag):
    text = open(md_path, encoding="utf-8").read()
    # @@-Marken wurden schon beim Bauen aufgeloest; hier nur Markdown
    c = Converter(outdir, tag)
    blocks = c.parse(text.split("\n"))
    # erster Block: Titel, danach kursive Zeile = Eyebrow
    if blocks and blocks[0]["t"] == "h1":
        blocks[0]["t"] = "title"
        if len(blocks) > 1 and blocks[1]["t"] == "p" and all(r.get("i") for r in blocks[1]["runs"] if "t" in r):
            blocks[1]["t"] = "eyebrow"
    return blocks


if __name__ == "__main__":
    md_path, outdir, tag, out_json = sys.argv[1:5]
    blocks = convert(md_path, outdir, tag)
    json.dump(blocks, open(out_json, "w", encoding="utf-8"), ensure_ascii=False)
    print(tag, len(blocks), "Blöcke,", sum(1 for _ in os.listdir(outdir) if _.startswith(tag)), "Bilder")
