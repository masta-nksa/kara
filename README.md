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
assets/                   basis.css (Farben Hell/Dunkel, Schrift), cockpit.css/.js, favicon.svg,
                          challenges.js (eigene Challenges: prüfen, Link, Speicher)
editor/                   Labyrinth-Editor für eigene Challenges
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
- Palette: `befehle` (`vor`, `rechts`, `links`, dazu für den Zähler `zaehlerPlus`,
  `zaehlerMinus`, `zaehlerNull`), `wiederholung` (n-mal), `bis: true` («wiederhole bis Ziel»),
  `verzweigung` mit `bedingungen` (`frei`, `freiLinks`, `freiRechts`, `zaehlerIstNull`),
  `sonst: false` blendet den Sonst-Zweig aus.
- Zähler: eine ganze Zahl, beim Start 0. Sobald eine Aufgabe Zähler-Bausteine anbietet, zeigt
  das Käfer-Feld den aktuellen Wert an.
- `maxTiefe` (Standard 3): wie viele Ebenen Wiederholungen und Verzweigungen ineinander
  stecken dürfen.
- Mehrere Labyrinthe pro Aufgabe: `layouts` (sichtbar) und `verdeckt` (je `{karte, blick}`),
  dazu optional `zufall: {anzahl, raeume}` für zufällig erzeugte, inselfreie Labyrinthe
  (Kartengrösse 2·raeume+1, Ein- und Ausgang als Lücken im Rahmen). Mit `inseln: k` öffnet der
  Generator zusätzlich k Wände, so entstehen Inseln; der Start liegt dann im Inneren. Gelöst ist die Aufgabe
  erst, wenn der Käfer in allen den Ausgang findet. Gescheiterte verdeckte und zufällige
  Labyrinthe werden danach als Reiter sichtbar. «Alle prüfen» prüft ohne Animation.
- `hinweise`: Liste von Tipps, die nacheinander auf Klick erscheinen (statt `hinweis`).
- `kleinsteLoesung`: Anzahl Bausteine der kleinsten bekannten Lösung; erscheint erst nach dem
  Lösen. Die Bausteinlimits lassen bewusst auch weniger kompakte Lösungen zu.
- «wiederhole bis Ziel» erkennt, wenn der Käfer im Kreis läuft (gleicher Ort, gleiche
  Blickrichtung zu Beginn eines Durchlaufs), und bricht dann sofort ab.
- Nebel (Schalter beim Käfer-Feld, Standard aus): Während eines Ablaufs sind nur der Käfer,
  seine vier Nachbarfelder und das Ziel sichtbar.
- Die Prüfung vergleicht das **Ergebnis** (Endfeld, besuchte Felder, Bausteinlimit), nie ein
  Muster. Lösungen und Tests gehören nicht in dieses Repo.

Die Labyrinth-Karten und Bausteinlimits der Levels 1 bis 8 und 10 stammen aus
[Blockly Games](https://github.com/google/blockly-games) (Maze, Apache-Lizenz 2.0); Level 10 hat
den Ausgang im Rahmen. Level 9 («Kreuzungen») und 11 («Jedes Labyrinth») sind eigene,
inselfreie Labyrinthe: Dort führt die Linke-Hand-Regel immer zum Ausgang.

Die Reihe «Inseln und Pledge» (`aufgaben/inseln.json`) hat eigene Labyrinthe mit Inseln:
«Die Insel» (die linke Hand läuft im Kreis, die rechte findet hinaus), «Zwei Inseln» (beide
Hände scheitern; kein Programm mit bis zu 6 Bausteinen löst es) und «Jedes Labyrinth mit
Inseln» (Pledge-Algorithmus; in den gezeigten und verdeckten Labyrinthen scheitern die
Handregeln jeweils mindestens einmal, dazu zehn Zufallslabyrinthe mit Inseln).

## Abschluss und eigene Challenges

Die letzte Reihe («Abschluss und eigene Challenges», `lokal: true` in `reihen.json`) enthält das
Abschluss-Level (`aufgaben/abschluss.json`: 13 × 13, mit und ohne Inseln, alle Bausteine) und
danach die Challenges, die in diesem Browser gespeichert sind.

**Editor** (`editor/`): Raster bearbeiten (Mauer/Weg auch durch Ziehen, Start mit Blickrichtung,
Ausgang am Rand), Grösse 7 bis 15, Zufallslabyrinthe mit und ohne Inseln, bis zu 12 Labyrinthe
pro Challenge, einzelne als «verdeckt» markieren, Titel, Beschreibung, Bausteinlimit. Die
Spielbarkeit (Start, Ausgang am Rand, Weg dazwischen) wird laufend geprüft. Der Entwurf bleibt
im Browser. Bedienung auch per Tastatur (Pfeiltasten, Eingabetaste).

**Teilen ohne Server**: «Link kopieren» erzeugt `baukasten/?reihe=eigene#challenge=<Base64>`.
Wer den Link öffnet, wird gefragt, ob die Challenge in den eigenen Browser übernommen werden
soll; danach verschwindet der `#`-Teil aus der Adresszeile. Derselbe Link zweimal ergibt kein
Duplikat (Kennung aus dem Inhalt). Eingelesene Daten werden streng geprüft (Grösse 5–15,
nur `#.SZ`, genau ein Start und ein Ausgang am Rand, Weg vorhanden, höchstens 12 Labyrinthe,
Texte nur als reiner Text). «Verdeckt» ist eine Spielregel, kein Geheimnis: Wer den Link
entschlüsselt, sieht alle Labyrinthe.

## Im Browser gespeichert (`localStorage`)

| Schlüssel | Inhalt |
| --- | --- |
| `kara.baukasten.v1` | gelöste Aufgaben (grüner Haken) |
| `kara.baukasten.prog.v1` | Stand der Bausteine je Aufgabe; «Alles löschen» leert ihn |
| `kara.baukasten.figur.v1` | eigenes Bild (Easter Egg), nur der 128-px-Ausschnitt |
| `kara.baukasten.nebel` | Nebel ein/aus |
| `kara.challenges.v1` | eigene und übernommene Challenges |
| `kara.editor.entwurf.v1` | Entwurf im Editor |

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
