# Word-Export im Dossier-Design

Gleiches Design wie die Dossiers in `Algorithmen_FMS` (Calibri, Akzent Petrol `#0F6B63`, Aufgabenboxen mit Balken links, Merksatz- und Anleitungsboxen, Kopf- und Fusszeile «Seite x von y»). Quelle ist Markdown im Dossier-Dialekt:

- `[[aufgabe:Titel]] ... [[/aufgabe]]`, `[[anleitung]]` (Lernziele-Box), `[[merksatz]]`, `[[antwort:n]]` (n Antwortzeilen), `> ` = Merksatzbox (Tipp)
- `<div style="break-before:page"></div>` = Seitenumbruch
- Seite 1: Box «Lernziele», keine Namenszeile, kein «Lektion n».

Einmalig: `pip install pymupdf markdown-it-py` und in diesem Ordner `npm install`.

```bash
python tools/word/make_dossier.py lerndossier.md Lerndossier_Codes_und_Algorithmen.docx "Dossier Informatik · Codes und Algorithmen"
python tools/word/audit.py Lerndossier_Codes_und_Algorithmen
```

`to_dialect.py QUELLE.md ZIEL.md` wandelt schlichtes Markdown (Überschriften `### A1 ★ Titel`, `**B1.1 ★ Titel.** Text`) in diesen Dialekt um. Der Export prüft mit Microsoft Word das Layout (keine Überschrift im letzten Fünftel). Aufgabenboxen werden nie geteilt. Änderungen immer in der `.md` machen.
