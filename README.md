# Kara – Käfer programmieren

Den Käfer mit Struktogramm-Bausteinen programmieren: kurze Aufgaben auf freiem Feld,
dann Labyrinthe. Reines HTML/CSS/JS ohne Build-Schritt und ohne Bibliotheken; es wird
nichts gesendet, der Fortschritt bleibt im Browser.

**Live:** <https://masta-nksa.github.io/kara/>

Hervorgegangen aus dem Struktogramm-Baukasten in
[masta-nksa/checks](https://github.com/masta-nksa/checks) (Verlauf übernommen).

## Aufbau

```
index.html                Cockpit: Übersicht der Reihen mit Fortschritt
assets/                   basis.css (Farben Hell/Dunkel, Schrift), cockpit.css/.js, favicon.svg
baukasten/                der Baukasten
  index.html, app.js      Oberfläche (Bausteine ziehen, Käfer-Feld, Ablauf)
  engine.js               Interpreter, Prüfung und Programmbaum (reine Funktionen, ohne DOM)
  figur.js                eigenes Bild statt Käfer (Easter Egg, siehe unten)
  reihen.json             die Reihen, in der Reihenfolge des Cockpits
  aufgaben/*.json         die Aufgaben je Reihe
```

Aufruf einer Reihe bzw. Aufgabe: `baukasten/?reihe=labyrinth&aufgabe=lab3`.
Die Adresszeile folgt der gewählten Aufgabe, Neuladen bleibt also am selben Ort.

## Reihen (`baukasten/reihen.json`)

```json
{
  "reihen": [
    { "id": "grundlagen", "titel": "Käfer-Grundlagen", "untertitel": "…",
      "dateien": ["aufgaben/grundlagen.json"] }
  ]
}
```

Eine Reihe kann mehrere Aufgaben-Dateien zusammenfassen (`dateien`). So lassen sich Reihen
umordnen oder zusammenlegen, ohne die Aufgaben anzufassen. Aufgaben-IDs müssen über alle
Reihen eindeutig sein (der Fortschritt hängt an der ID).

## Aufgaben (`baukasten/aufgaben/*.json`)

- Jede Aufgabe: Feld, Palette, Bausteinlimit, Ziel. **Keine Lösungen.**
- Feld entweder mit `cols`, `rows`, `start`, `blick`, `hindernisse` oder als Zeichenkarte
  (`feld.karte`, oberste Zeile zuerst: `#` Mauer, `.` Weg, `S` Start, `Z` Ziel).
- Palette: `befehle`, `wiederholung` (n-mal), `bis: true` («wiederhole bis Ziel»),
  `verzweigung` mit `bedingungen` (`frei`, `freiLinks`, `freiRechts`), `sonst: false`
  blendet den Sonst-Zweig aus.
- `maxTiefe` (Standard 3): wie viele Ebenen Wiederholungen und Verzweigungen ineinander
  stecken dürfen.
- Die Prüfung vergleicht das **Ergebnis** (Endfeld, besuchte Felder, Bausteinlimit), nie ein
  Muster. Lösungen und Tests gehören nicht in dieses Repo.

Die Labyrinth-Karten und Bausteinlimits der Levels 1 bis 10 stammen aus
[Blockly Games](https://github.com/google/blockly-games) (Maze, Apache-Lizenz 2.0).

## Im Browser gespeichert (`localStorage`)

| Schlüssel | Inhalt |
| --- | --- |
| `kara.baukasten.v1` | gelöste Aufgaben (grüner Haken) |
| `kara.baukasten.prog.v1` | Stand der Bausteine je Aufgabe; «Alles löschen» leert ihn |
| `kara.baukasten.figur.v1` | eigenes Bild (Easter Egg), nur der 128-px-Ausschnitt |

Checks und Kara liegen unter derselben Adresse `masta-nksa.github.io` und teilen sich darum
den `localStorage`. Beim ersten Besuch übernimmt Kara einmalig den Stand aus dem früheren
Baukasten (`checks.baukasten.*`); danach sind die beiden getrennt.

## Easter Egg

**Dreifachklick auf den Käfer** (drei Klicks innerhalb von 0,7 s) öffnet das Figur-Menü:
«Foto aufnehmen» (Kamera-Vorschau mit Auslöser; der Browser fragt zuerst nach der Erlaubnis)
oder «Bild wählen», danach Zuschneiden in einem runden Ausschnitt. Gespeichert wird nur der
Ausschnitt; das Foto wird nicht gesendet und danach verworfen. «Zurück zum Käfer» entfernt das Bild.

## GitHub Pages

Settings → Pages → Source: «Deploy from a branch», Branch `main`, Ordner `/ (root)`.
Repo öffentlich. Die leere Datei `.nojekyll` im Root muss bestehen bleiben.

## Lokal testen

```
python -m http.server 8000
```
… und `http://localhost:8000/` öffnen.
