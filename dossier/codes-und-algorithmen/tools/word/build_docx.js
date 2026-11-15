// JSON-Modell -> Word-Datei (docx-js). Aufruf: node build_docx.js model.json out.docx "Kopfzeile" bilderordner [umbrueche.json]
// Formatierung ueber Word-Formatvorlagen (Absatz- und Zeichenformate), kaum direkte Formatierung: in Word aenderbar.
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, Header, Footer,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType, VerticalAlign, LevelFormat,
  HeightRule, PageNumber, TabStopType, PageBreak, LineRuleType,
  HorizontalPositionRelativeFrom, HorizontalPositionAlign, VerticalPositionRelativeFrom,
  TextWrappingType, TextWrappingSide,
} = require("docx");

const [, , modelPath, outPath, headerText, imgDir, breaksPath] = process.argv;
const BREAKS = new Set(breaksPath && fs.existsSync(breaksPath) ? JSON.parse(fs.readFileSync(breaksPath, "utf8")) : []);
const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));

const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 1134;
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9638
const FONT = "Calibri", MONO = "Consolas";
const ACCENT = "0F6B63", SOFT = "E4F0EE", GRAY = "F2F4F3", LINE = "BFC8C6", INK = "16201F", MUTED = "5A6968";
const BODY = 21; // halbe Punkt = 10.5pt
const YELLOW = "FFF1A6";

const numberingConfigs = [{
  reference: "bullets",
  levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 540, hanging: 270 } } } }],
}];
let numCount = 0;

// ------------------------------------------------------------------ Inline (nur Zeichenformate, keine festen Schriften)
function mkRuns(runs) {
  const out = [];
  // Ausfuellfelder: so breit, wie die Zeile es zulaesst (1.5 bis 3.4 Leerzeichen je Zeichen)
  const tl = (runs || []).reduce((a, r) => a + (r.t ? r.t.length : 0), 0), sf = (runs || []).reduce((a, r) => a + (r.f || 0), 0);
  const fscale = sf ? Math.max(1.5, Math.min(3.4, (165 - tl * 2.2) / sf)) : 1.5;
  for (const r of runs || []) {
    if (r.br) { out.push(new TextRun({ break: 1 })); continue; }
    if (r.f) { out.push(new TextRun({ text: " ".repeat(Math.round(r.f * fscale)), style: "Ausfuellfeld" })); continue; }
    const o = { text: r.t };
    if (r.b) o.bold = true;
    if (r.i) o.italics = true;
    if (r.c) o.style = "Code";
    out.push(new TextRun(o));
  }
  return out.length ? out : [new TextRun({ text: "" })];
}

function plain(runs) { return (runs || []).map((r) => r.t || "").join(""); }

let FORCE_KEEP = false;
let PENDING_FLOAT = null;      // schwebendes Bild, das im naechsten Absatz verankert wird (Text fliesst darum)

function para(runs, o = {}) {
  const kids = mkRuns(runs);
  if (PENDING_FLOAT) { kids.unshift(PENDING_FLOAT); PENDING_FLOAT = null; }
  return new Paragraph({ children: kids, keepNext: o.keepNext || FORCE_KEEP, indent: o.indent });
}

const SEPS = new Set();
const sep = (keep = false) => { const s = new Paragraph({ style: "Trenner", children: [], keepNext: keep }); SEPS.add(s); return s; };

// ------------------------------------------------------------------ Tabellenhilfen
const NOB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const thin = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const allThin = { top: thin, bottom: thin, left: thin, right: thin };
const noBorders = { top: NOB, bottom: NOB, left: NOB, right: NOB };

function fitCells(children) {
  const last = children[children.length - 1];
  if (!last || last instanceof Table) children.push(sep());
  return children;
}

function scaleWidths(weights, total) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let w = weights.map((x) => Math.floor((x / sum) * total));
  w[w.length - 1] += total - w.reduce((a, b) => a + b, 0);
  return w;
}

// ------------------------------------------------------------------ Bilder
function imageRun(b, maxW, floating) {
  const data = fs.readFileSync(path.join(imgDir, b.file));
  let wpx = b.wpx, hpx = b.hpx;
  const capPx = maxW / 15;
  if (wpx > capPx) { hpx = hpx * capPx / wpx; wpx = capPx; }
  const o = { type: "png", data, transformation: { width: Math.round(wpx), height: Math.round(hpx) },
    altText: { title: "Grafik", description: "Grafik zum Dossier", name: b.file } };
  if (floating) {
    o.floating = {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, align: HorizontalPositionAlign.RIGHT },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
      wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.BOTH_SIDES },
      margins: { top: 0, bottom: 57150, left: 171450, right: 0 },
      allowOverlap: false,
    };
  }
  return new ImageRun(o);
}

function imageParagraph(b, maxW) {
  return new Paragraph({ style: "Abbildung", children: [imageRun(b, maxW, false)], keepNext: FORCE_KEEP });
}

// ------------------------------------------------------------------ Tabellen (Markdown)
function mdTable(b, W) {
  const cols = b.head.length;
  const weights = [];
  for (let j = 0; j < cols; j++) {
    const lens = [plain(b.head[j]).length, ...b.rows.map((r) => plain(r[j]).length)];
    const allBlank = b.rows.every((r) => plain(r[j]).trim() === "");
    let w = Math.min(Math.max(...lens), 70);
    w = Math.max(w, 8);
    if (allBlank) w = Math.max(w, 14);
    weights.push(w);
  }
  const widths = scaleWidths(weights, W);
  const keepTable = b.rows.length <= 10;
  const mk = (cells, head, isLast) => {
    const blankRow = !head && cells.some((c) => plain(c).trim() === "");
    return new TableRow({
      tableHeader: head,
      cantSplit: true,
      height: blankRow ? { value: b.rows.length >= 5 ? 340 : 400, rule: HeightRule.ATLEAST } : undefined,
      children: cells.map((c, j) => {
        const blank = !head && plain(c).trim() === "";
        return new TableCell({
          width: { size: widths[j], type: WidthType.DXA },
          borders: allThin,
          shading: head ? { type: ShadingType.CLEAR, fill: SOFT } : blank ? { type: ShadingType.CLEAR, fill: GRAY } : undefined,
          margins: { top: 30, bottom: 30, left: 90, right: 90 },
          verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ style: head ? "Tabellenkopf" : "Tabellentext", children: mkRuns(c), keepNext: (keepTable && !isLast) || FORCE_KEEP })],
        });
      }),
    });
  };
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [mk(b.head, true, false), ...b.rows.map((r, ri) => mk(r, false, ri === b.rows.length - 1))],
  });
}

function linesTable(n, W) {
  const rows = [];
  for (let k = 0; k < n; k++) {
    rows.push(new TableRow({
      height: { value: 520, rule: HeightRule.ATLEAST },
      children: [new TableCell({
        width: { size: W, type: WidthType.DXA },
        borders: { top: NOB, left: NOB, right: NOB, bottom: { style: BorderStyle.SINGLE, size: 4, color: "9AA5A3" } },
        children: [new Paragraph({ style: "Tabellentext", children: [] })],
      })],
    }));
  }
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows });
}

// Antwortflaeche (gelb markiert), z. B. rechts neben den Fragen
function feldTable(n, W) {
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ height: { value: n * 500, rule: HeightRule.ATLEAST }, children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, borders: allThin, shading: { type: ShadingType.CLEAR, fill: "FFF8D6" },
      children: [new Paragraph({ style: "Tabellentext", children: [] })],
    })] })],
  });
}

function namensfeld(W) {
  const widths = scaleWidths([55, 25, 20], W);
  const labels = ["Name", "Klasse", "Datum"];
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ children: labels.map((l, j) => new TableCell({
      width: { size: widths[j], type: WidthType.DXA },
      borders: { top: NOB, left: NOB, right: NOB, bottom: { style: BorderStyle.SINGLE, size: 6, color: "5A6968" } },
      margins: { top: 140, bottom: 20, left: 40, right: 200 },
      children: [new Paragraph({ style: "Tabellentext", children: [new TextRun({ text: l, color: MUTED })] })],
    })) })],
  });
}

function stripsTable(rows, W) {
  const dashed = { style: BorderStyle.DASHED, size: 8, color: "444444" };
  const bd = { top: dashed, bottom: dashed, left: dashed, right: dashed };
  const single = rows.every((r) => r.length === 1);
  const tw = single ? Math.floor(W * 0.78) : Math.floor(W * 0.45);
  const n = single ? 1 : Math.max(...rows.map((r) => r.length));
  const cw = Math.floor(tw / n);
  return new Table({
    width: { size: cw * n, type: WidthType.DXA }, columnWidths: Array(n).fill(cw),
    rows: rows.map((r) => new TableRow({
      height: { value: 600, rule: HeightRule.ATLEAST }, cantSplit: true,
      children: r.map((t) => new TableCell({
        width: { size: cw, type: WidthType.DXA }, borders: bd, verticalAlign: VerticalAlign.CENTER,
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        children: [new Paragraph({ children: [new TextRun({ text: t })], alignment: r.length > 1 ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { before: 0, after: 0 } })],
      })),
    })),
  });
}

// ------------------------------------------------------------------ Boxen
function box(b, W, keepWithNext) {
  const kind = b.kind;
  const prevKeep = FORCE_KEEP;
  FORCE_KEEP = !!keepWithNext;
  const inner = blocks(b.blocks, W - 330);
  FORCE_KEEP = prevKeep;
  const kids = [];
  if (b.title && kind === "aufgabe") {
    kids.push(new Paragraph({ style: "Aufgabentitel", children: [new TextRun({ text: b.title.toUpperCase() })] }));
  }
  kids.push(...inner);
  const accentL = { style: BorderStyle.SINGLE, size: 24, color: ACCENT };
  let borders, fill;
  if (kind === "aufgabe" || kind === "kontrolle") { borders = { top: thin, bottom: thin, right: thin, left: accentL }; }
  else if (kind === "merksatz") { borders = { top: NOB, bottom: NOB, right: NOB, left: accentL }; fill = SOFT; }
  else { borders = { top: NOB, bottom: NOB, right: NOB, left: accentL }; fill = GRAY; } // anleitung
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: W, type: WidthType.DXA }, borders,
      shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
      margins: { top: 120, bottom: 100, left: 200, right: 140 },
      children: fitCells(kids),
    })] })],
  });
}

function codeBox(text, W) {
  const kids = text.split("\n").map((l) => new Paragraph({ style: "Codezeile", children: [new TextRun({ text: l === "" ? " " : l })] }));
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: [W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: W, type: WidthType.DXA },
      borders: { top: thin, bottom: thin, right: thin, left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT } },
      shading: { type: ShadingType.CLEAR, fill: GRAY },
      margins: { top: 100, bottom: 100, left: 200, right: 120 },
      children: kids,
    })] })],
  });
}

function colsTable(b, W) {
  const n = b.cols.length;
  const weights = b.widths && b.widths.length === n ? b.widths : Array(n).fill(1);
  const widths = scaleWidths(weights, W);
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ cantSplit: true, children: b.cols.map((c, j) => new TableCell({
      width: { size: widths[j], type: WidthType.DXA }, borders: noBorders, margins: { top: 40, bottom: 40, left: 40, right: 120 },
      children: fitCells(blocks(c, widths[j] - 160)),
    })) })],
  });
}

// ------------------------------------------------------------------ Blockfolge
const KEEPS = ["image", "table", "box", "cols", "code", "lines", "strips", "checklist", "ul", "ol"];
let pendingBreak = false;
function takeBreak() { const v = pendingBreak; pendingBreak = false; return v; }

function blocks(list, W) {
  const out = [];
  for (let bi = 0; bi < list.length; bi++) {
    const b = list[bi];
    const nxt = list[bi + 1];
    if (b.t === "pagebreak") { pendingBreak = true; continue; }
    if (pendingBreak && !["h1", "h2", "h3", "title"].includes(b.t)) {
      out.push(new Paragraph({ children: [new PageBreak()] }));
      pendingBreak = false;
    }
    switch (b.t) {
      case "title":
        out.push(new Paragraph({ heading: HeadingLevel.TITLE, children: mkRuns(b.runs) }));
        break;
      case "eyebrow":
        out.push(new Paragraph({ style: "Untertitel", children: mkRuns(b.runs) }));
        break;
      case "h1":
      case "h2":
        out.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: mkRuns(b.runs),
          pageBreakBefore: takeBreak() || plain(b.runs).startsWith("Anhang") || BREAKS.has(plain(b.runs)) }));
        break;
      case "h3":
        out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: mkRuns(b.runs),
          pageBreakBefore: takeBreak() || BREAKS.has(plain(b.runs)) }));
        break;
      case "p":
        out.push(para(b.runs, { keepNext: !!nxt && KEEPS.includes(nxt.t) }));
        break;
      case "ul":
        for (const it of b.items) {
          out.push(new Paragraph({ style: "Aufzaehlung", children: mkRuns(it), numbering: { reference: "bullets", level: 0 } }));
        }
        break;
      case "ol": {
        const ref = "num" + (++numCount);
        numberingConfigs.push({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 320 } } } }] });
        for (const it of b.items) {
          out.push(new Paragraph({ style: "Aufzaehlung", children: mkRuns(it), numbering: { reference: ref, level: 0 } }));
        }
        break;
      }
      case "checklist":
        for (const [ci, it] of b.items.entries()) {
          out.push(new Paragraph({
            keepNext: ci < b.items.length - 1,
            children: [new TextRun({ text: "☐", font: "Segoe UI Symbol", size: 24 }), new TextRun({ text: "\t" }), ...mkRuns(it)],
            tabStops: [{ type: TabStopType.LEFT, position: 460 }],
            indent: { left: 460, hanging: 460 },
          }));
        }
        out.push(sep());
        break;
      case "table": out.push(mdTable(b, W), sep()); break;
      case "box": {
        const kw = b.kind === "anleitung" && !!nxt && ["box", "table"].includes(nxt.t);
        out.push(box(b, W, kw), sep(kw));
        break;
      }
      case "code": out.push(codeBox(b.text, W), sep()); break;
      case "lines": out.push(linesTable(b.n, W), sep()); break;
      case "feld": out.push(feldTable(b.n, W)); break;
      case "namensfeld": out.push(namensfeld(W), sep()); break;
      case "strips": out.push(stripsTable(b.rows, W), sep()); break;
      case "cols": out.push(colsTable(b, W), sep()); break;
      case "image":
        if (b.float && nxt && nxt.t === "p") PENDING_FLOAT = imageRun(b, W, true);
        else out.push(imageParagraph(b, W));
        break;
      case "hr":
        out.push(new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 1 } } }));
        break;
      default:
        throw new Error("Unbekannter Block: " + b.t);
    }
  }
  return out;
}

const children = blocks(model, CONTENT_W);
while (children.length && SEPS.has(children[children.length - 1])) children.pop();
if (children[children.length - 1] instanceof Table) {
  children.push(new Paragraph({ style: "Trenner", children: [] }));
}

const P = (id, name, based, run, paragraph, extra = {}) => ({ id, name, basedOn: based || "Normal", next: extra.next || "Normal", quickFormat: true, run, paragraph, ...extra.more });

const doc = new Document({
  creator: "Dossier",
  title: headerText,
  styles: {
    default: { document: { run: { font: FONT, size: BODY, color: INK }, paragraph: { spacing: { before: 0, after: 100, line: 264 } } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 44, bold: true, color: ACCENT }, paragraph: { spacing: { before: 0, after: 60 }, keepNext: true } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 280, after: 100 }, keepNext: true, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 3 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 24, bold: true }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 1 } },
      { id: "Untertitel", name: "Untertitel", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 19, color: MUTED, italics: true },
        paragraph: { spacing: { before: 0, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 6 } } } },
      { id: "Aufgabentitel", name: "Aufgabentitel", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: MONO, size: 17, bold: true, color: ACCENT }, paragraph: { spacing: { before: 0, after: 100 }, keepNext: true } },
      { id: "Aufzaehlung", name: "Aufzählung", basedOn: "Normal", next: "Aufzaehlung", quickFormat: true, run: {}, paragraph: { spacing: { before: 0, after: 60 } } },
      { id: "Tabellentext", name: "Tabellentext", basedOn: "Normal", quickFormat: true, run: { size: 19 }, paragraph: { spacing: { before: 0, after: 0, line: 252 } } },
      { id: "Tabellenkopf", name: "Tabellenkopf", basedOn: "Tabellentext", quickFormat: true, run: { bold: true }, paragraph: { spacing: { before: 0, after: 0, line: 252 } } },
      { id: "Codezeile", name: "Codezeile", basedOn: "Normal", quickFormat: true, run: { font: MONO, size: 17 }, paragraph: { spacing: { before: 0, after: 0, line: 240 } } },
      { id: "Abbildung", name: "Abbildung", basedOn: "Normal", next: "Normal", quickFormat: true, run: {}, paragraph: { spacing: { before: 40, after: 100 } } },
      { id: "Trenner", name: "Trenner", basedOn: "Normal", quickFormat: false, run: { size: 4 }, paragraph: { spacing: { before: 0, after: 60, line: 120 } } },
      { id: "Header", name: "header", basedOn: "Normal", quickFormat: false, run: { size: 16, color: MUTED }, paragraph: { spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } } } },
      { id: "Footer", name: "footer", basedOn: "Normal", quickFormat: false, run: { size: 16, color: MUTED }, paragraph: { spacing: { before: 0, after: 0 }, alignment: AlignmentType.RIGHT } },
    ],
    characterStyles: [
      { id: "Code", name: "Code", quickFormat: true, run: { font: MONO, size: BODY - 2 } },
      { id: "Ausfuellfeld", name: "Ausfüllfeld", quickFormat: true, run: { shading: { type: ShadingType.CLEAR, fill: YELLOW, color: "auto" } } },
    ],
  },
  numbering: { config: numberingConfigs },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN + 150, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 560, footer: 520 } } },
    headers: { default: new Header({ children: [new Paragraph({ style: "Header", children: [new TextRun({ text: headerText })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ style: "Footer",
      children: [new TextRun({ text: "Seite " }), new TextRun({ children: [PageNumber.CURRENT] }),
        new TextRun({ text: " von " }), new TextRun({ children: [PageNumber.TOTAL_PAGES] })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(outPath, buf); console.log("geschrieben:", outPath, Math.round(buf.length / 1024) + " KB"); });
