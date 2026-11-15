"""Einmalig: lerndossier.md (schlichtes Markdown) -> Dossier-Dialekt (Aufgabenboxen, Antwortzeilen, Lernziele)."""
import re, sys

src, dst = sys.argv[1], sys.argv[2]
lines = open(src, encoding="utf-8").read().replace("\r", "").split("\n")

BREAK = '<div style="break-before:page"></div>'

HEAD = """# Codes und Algorithmen

*Informatik · Lerndossier*

[[anleitung]]
**Lernziele**

**Farben**

- Sie können erklären, was man unter RGB-Codierung versteht, und können solche Codierungen den entsprechenden Farben ungefähr zuordnen.
- Sie können erklären, was man unter CMYK-Codierung versteht, und kennen eine Anwendung.
- Sie können den Begriff Farbtiefe erklären, sowie was die entsprechende Bitanzahl konkret bedeutet.

**Dateiformat**

- Sie können den Unterschied zwischen einem Raster- und einem Vektorgrafikformat erklären.
- Sie wissen, was man unter der Auflösung eines Bildes versteht, und können daraus die richtigen Schlüsse ziehen für die notwendige Grösse eines Bildes abhängig von seinem Verwendungszweck.
- Sie können erklären, wie die Begriffe «Dateiinhalt» und «Dateiformat» zusammenhängen.
- Sie können erklären, wofür ein «Datei-Header» oftmals dient, und was der Unterschied zur «Dateiendung» ist.
- Sie können ein gegebenes Spielformat interpretieren.

**Algorithmen**

- Sie nennen die fünf Anforderungen an einen Algorithmus und die drei Bausteine.
- Sie führen ein Programm mit Variablen von Hand aus und finden Fehler.
- Sie lesen und zeichnen Struktogramme und bauen Programme für den Käfer.

Teil A enthält Schlüsselaufgaben zu jedem Thema (★ bis ★★), Teil B eine erweiterte Sammlung mit steigendem Niveau (★ bis ★★★). ★ Grundlage · ★★ Anwendung · ★★★ Transfer. Die Lösungen erreichen Sie über den QR-Code am Schluss: Schauen Sie erst hin, wenn eine Aufgabe fertig ist.
[[/anleitung]]
"""

TAIL = f"""{BREAK}

## Lösungen

Die Lösungen aller Aufgaben finden Sie online. Scannen Sie den QR-Code.

<div style="border:1px dashed #444;padding:4mm">QR-Code zu den Lösungen (wird nach der Veröffentlichung eingesetzt)</div>

Adresse: `https://<BENUTZER>.github.io/<REPOSITORY>/lsg/` (Platzhalter)
"""

# --- Anfang und Ende abschneiden
i0 = next(i for i, l in enumerate(lines) if l.startswith("# Teil A"))
iL = next(i for i, l in enumerate(lines) if l.startswith("## Lösungen"))
body = lines[i0:iL]

out = HEAD.split("\n")


def antwort_n(text):
    t = text
    if re.search(r"[Zz]eichn", t):
        return 0
    if re.search(r"Warum|Begründ|Erklär|Beschreib|Formulier|Was passiert|Was ändert|Was beobacht|Wie könnte|Lohnt|Was lernen|Was fällt", t):
        return 2
    return 1


state = {"run": 0}


def flush_run(res):
    r = state["run"]
    if r:
        res += [f"[[antwort:{r // 2 + 1}]]", ""]
    state["run"] = 0


def close_task(buf, kind):
    """Aufgabeninhalt (Zeilen) -> Blöcke mit Antwortzeilen."""
    res, i, n_sub = [], 0, 0
    # Blöcke bilden
    blocks = []     # (typ, zeilen)
    while i < len(buf):
        l = buf[i]
        if l.strip() == "":
            i += 1
            continue
        if l.startswith("```"):
            j = i + 1
            while not buf[j].startswith("```"):
                j += 1
            blocks.append(("code", buf[i:j + 1]))
            i = j + 1
        elif l.startswith("|"):
            j = i
            while j < len(buf) and buf[j].startswith("|"):
                j += 1
            blocks.append(("table", buf[i:j]))
            i = j
        elif l.startswith(">"):
            j = i
            while j < len(buf) and buf[j].startswith(">"):
                j += 1
            blocks.append(("quote", buf[i:j]))
            i = j
        elif re.match(r"^\s+\d\. ", l):
            j = i
            while j < len(buf) and re.match(r"^\s+\d\. ", buf[j]):
                j += 1
            blocks.append(("olist", [x.strip() for x in buf[i:j]]))
            i = j
        else:
            blocks.append(("p", [l]))
            i += 1
    # Ausgabe
    has_sub = any(b[0] == "p" and re.match(r"^\(?[a-f]\) ", b[1][0]) for b in blocks)
    for k, (typ, ls) in enumerate(blocks):
        nxt = blocks[k + 1] if k + 1 < len(blocks) else None
        if typ == "p":
            t = ls[0].replace("**Aufgabe:** ", "")
            m = re.match(r"^([a-f])\) (.*)$", t)
            if m:
                res += [f"**{m.group(1)})** {m.group(2)}", ""]
                n = antwort_n(m.group(2))
                if n and nxt and nxt[0] in ("table", "code", "olist"):
                    n = 0
                if n == 2:
                    flush_run(res)
                    res += ["[[antwort:2]]", ""]
                elif n == 1:
                    state["run"] += 1
                else:
                    flush_run(res)
            else:
                res += [t, ""]
                if (not has_sub) and k == len(blocks) - 1 and not (nxt) :
                    pass
        elif typ == "olist":
            res += [x for x in ls] + [""]
            if k == len(blocks) - 1 or True:
                pass
        else:
            res += ls + [""]
    flush_run(res)
    # Aufgaben ohne Teilfragen: Antwortzeilen am Ende (ausser reine Zeichen-/Tabellenaufgaben)
    if not has_sub:
        joined = " ".join(" ".join(b[1]) for b in blocks if b[0] == "p")
        last = blocks[-1][0] if blocks else ""
        if last != "table" and last != "quote":
            n = antwort_n(joined)
            if kind == "B":
                n = n if n else 0
            if n:
                res += [f"[[antwort:{n}]]", ""]
        elif last == "quote":
            pass
    # Höchstens 4 Antwortzeilen je Aufgabe (sonst werden die Boxen zu gross für eine halbe Seite)
    idx = [k for k, x in enumerate(res) if x.startswith("[[antwort:")]
    vals = [int(res[k][10:-2]) for k in idx]
    while sum(vals) > 4 and max(vals) > 1:
        vals[vals.index(max(vals))] -= 1
    for k, v in zip(idx, vals):
        res[k] = f"[[antwort:{v}]]"
    return res


i = 0
task = None            # (kind, title, buf)


def flush():
    global task
    if task:
        kind, title, buf = task
        out.append(f"[[aufgabe:{title}]]")
        out.extend(close_task(buf, kind))
        out.append("[[/aufgabe]]")
        out.append("")
        task = None


while i < len(body):
    l = body[i]
    in_code = False
    if task and l.startswith("```"):
        j = i
        task[2].append(l)
        i += 1
        while not body[i].startswith("```"):
            task[2].append(body[i])
            i += 1
        task[2].append(body[i])
        i += 1
        continue
    if l.startswith("```"):
        out.append(l)
        i += 1
        while not body[i].startswith("```"):
            out.append(body[i])
            i += 1
        out.append(body[i])
        i += 1
        continue
    if l.strip() == "---":
        flush()
        i += 1
        continue
    m = re.match(r"^# Teil A", l)
    if m:
        flush()
        out += ["## Teil A — Schlüsselaufgaben", ""]
        i += 1
        continue
    if l.startswith("# Teil B"):
        flush()
        out += [BREAK, "", "## Teil B — Erweiterte Aufgabensammlung", ""]
        i += 1
        continue
    if l.startswith("## "):
        flush()
        out += ["### " + l[3:], ""]
        i += 1
        continue
    if l.startswith("### Theorie in Kürze"):
        flush()
        out += ["**Theorie in Kürze**", ""]
        i += 1
        continue
    m = re.match(r"^### (A\d+) (★+) (.*)$", l)
    if m:
        flush()
        task = ("A", f"Aufgabe {m.group(1)} {m.group(2)} — {m.group(3)}", [])
        i += 1
        continue
    m = re.match(r"^\*\*(B\d+\.\d+) (★+) (.*?)\.?\*\*\s*(.*)$", l)
    if m:
        flush()
        title = m.group(3).rstrip(".")
        buf = [m.group(4)] if m.group(4) else []
        task = ("B", f"Aufgabe {m.group(1)} {m.group(2)} — {title}", buf)
        i += 1
        continue
    if task is not None:
        task[2].append(l)
    else:
        out.append(l)
    i += 1
flush()
out += TAIL.split("\n")

text = "\n".join(out)
text = re.sub(r"\| Befehle \| Fragen \|\n\|---\|---\|\n(?:\|.*\|\n?)+", "**Befehle:** vorwärts · rückwärts · rechts drehen · links drehen · stehen bleiben\n\n**Fragen:** Feld vorne frei? · Feld rechts frei? · Feld links frei? · Feld hinten frei?\n", text)
text = re.sub(r"\n{3,}", "\n\n", text)
open(dst, "w", encoding="utf-8").write(text)
print("ok", len(text.split("\n")), "Zeilen")
