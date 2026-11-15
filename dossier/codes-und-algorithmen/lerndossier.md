# Codes und Algorithmen

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

Niveau: ●○○ Grundlage · ●●○ Anwendung · ●●● Transfer. Lösungen per QR-Code am Schluss.
[[/anleitung]]

## Teil A — Schlüsselaufgaben

### 1 Farben und Farbtiefe

**Theorie in Kürze**

- **RGB (additiv):** Bildschirme mischen Licht aus Rot, Grün und Blau. Alle drei zusammen ergeben Weiss, keine ergibt Schwarz.
- **CMYK (subtraktiv):** Drucker mischen Farbstoffe (Cyan, Magenta, Gelb, Schwarz = *Key*). Jede Farbe nimmt Licht weg. Papier ist weiss: **0 % Farbstoff** ergibt Weiss, **100 % Schwarz (K)** ergibt Schwarz.
- **Farbtiefe:** Anzahl Bit pro Farbangabe. Bei *n* Bit gibt es 2ⁿ verschiedene Farben, zum Beispiel 4 Bit = 16 Farben, 8 Bit = 256 Farben, 24 Bit = rund 16,7 Mio. Farben.
- **Farbwert:** Bei 24 Bit hat jeder Kanal 1 Byte (0–255, hexadezimal `00`–`FF`), also 3 Byte, geschrieben `RRGGBB`. Mit weniger Bit wird der Code kürzer: Bei 12 Bit hat jeder Kanal 4 Bit (`0`–`F`), Rot ist dann `F00`.
- **Helligkeit:** Je **grösser** die Kanalwerte, desto **heller** die Farbe, je **kleiner**, desto **dunkler**. Sind alle drei Kanäle **gleich gross**, entsteht ein **Grau**. Mischfarben müssen Sie nicht benennen, aber vergleichen: Ist **jeder** Kanal der einen Farbe grösser als bei der anderen, ist sie heller.
- **Mischwerte:** Ein Code wie `#E31F33` ist praktisch Rot: Nur ein Kanal hat einen hohen Wert, die anderen sind vernachlässigbar.

```
Rot voll aufgedreht:   24 Bit  FF0000     12 Bit  F00     3 Bit  100
```

**Diese sechs Farben müssen Sie erkennen:**

| Farbe | Hexcode | Kanäle (R, G, B) | Woran man sie erkennt |
|---|---|---|---|
| Schwarz | `#000000` | 0, 0, 0 | Bildschirm aus: kein Licht |
| Weiss | `#FFFFFF` | 255, 255, 255 | Papierweiss am Bildschirm: alle drei Lichter voll |
| Rot | `#FF0000` | 255, 0, 0 | Stoppschild: nur Rot leuchtet |
| Grün | `#00FF00` | 0, 255, 0 | Ampel auf Grün: nur Grün leuchtet |
| Blau | `#0000FF` | 0, 0, 255 | Blaue Leuchtdiode: nur Blau leuchtet |
| Grau | `#808080` | 128, 128, 128 | Grauer Beton: alle drei gleich, halbe Stärke |

Eine Mischfarbe, die von links nach rechts heller wird (in jeder Spalte ist jeder Kanal grösser):

```farbleiter
201030 503070 8050A8 B890D8 E8D0F8
```

[[aufgabe:Aufgabe A1 ●○○ — Farben erkennen und vergleichen]]
**a)** Welche Farbe ist es (Schwarz, Weiss, Rot, Grün, Blau oder Grau)?

`#2BE04A` {{9}}   `#F8FAF7` {{9}}   `#1A22EE` {{9}}   `#7C7F7B` {{9}}

**b)** Drucker arbeiten mit CMYK. Wie entstehen Weiss und Schwarz? Tragen Sie die Prozentwerte ein.

Weiss: C {{3}} M {{3}} Y {{3}} K {{3}}   Schwarz: C {{3}} M {{3}} Y {{3}} K {{3}}

**c)** Nummerieren Sie die vier Farben vom dunkelsten (1) bis zum hellsten (4).

`#C09060` {{2}}   `#402030` {{2}}   `#F0E0D0` {{2}}   `#708048` {{2}}

**d)** Was macht eine Farbe heller, was dunkler? Woran erkennt man ein Grau?

[[antwort:1]]

**e)** Reines Blau als 24-Bit-Folge: {{44}}

[[/aufgabe]]

[[aufgabe:Aufgabe A2 ●●○ — Farbtiefe und Hexcode]]
Ein Bild verwendet 12 Bit Farbtiefe, also 4 Bit pro Kanal. Hexcodes haben dann nur drei Ziffern, zum Beispiel `F00`.

**a)** Wie viele verschiedene Farben gibt es bei

6 Bit {{10}}   12 Bit {{10}}   15 Bit {{10}}   30 Bit {{14}}

**b)** Welche Farbe entsteht? Lesen Sie die 12-Bit-Codes Kanal für Kanal.

`F00` {{8}}   `0F0` {{8}}   `888` {{8}}   `FFF` {{8}}

**c)** Rechnen Sie auf 24 Bit um: `F00` → {{9}}   `888` → {{9}}   Was fällt Ihnen auf?

**d)** (●●●) Warum sieht ein 12-Bit-Bild bei 24 Bit praktisch gleich aus?

[[antwort:2]]

[[/aufgabe]]

### 2 Grafikformate

**Theorie in Kürze**

- **Rastergrafik:** Ein Bild besteht aus Pixeln. Gespeichert werden zuerst ein kurzer **Header** (Breite, Höhe, Farbtiefe), dann die Farbe jedes Pixels, zeilenweise von links oben nach rechts unten.
- **Anzahl Pixel = Anzahl Bit der Pixeldaten ÷ Farbtiefe.** Dieselben Bits können je nach Header ein anderes Bild ergeben.
- **Dateigrösse (unkomprimiert):** Sie entsteht aus zwei Dingen, der **Anzahl Pixel** und der **Farbtiefe**. Anzahl Pixel = Breite · Höhe, Bit = Pixel · Farbtiefe, Byte = Bit ÷ 8 (plus Header). Doppelte Kantenlänge heisst vierfache Pixelzahl und damit vierfache Datei.
  Beispiel: 100 × 50 Pixel, 24 Bit → 5000 · 24 = 120 000 Bit = 15 000 Byte.
- **Indizierte Farben:** Das Bild hat eine **Farbtabelle** (Palette) mit den verwendeten Farben (je 24 Bit). Jedes Pixel speichert nur die **Nummer** seiner Farbe. Bei *k* Farben braucht die Nummer so viele Bit, dass 2ⁿ ≥ *k* gilt. Das lohnt sich bei wenigen Farben (GIF: höchstens 256).
  Beispiel: Ein Bild hat nur 4 Farben (Schwarz, Weiss, Rot, Blau). Die Farbtabelle nummeriert sie `00`, `01`, `10`, `11` (2² = 4). Jedes Pixel braucht dann nur **2 Bit** statt 24 Bit. Die Tabelle mit den 4 Farben (4 · 24 Bit) wird einmal gespeichert. Bei 5 bis 8 Farben wären es 3 Bit.
- **Komprimieren:** *Verlustfrei* (GIF, PNG) fasst gleichfarbige Pixelblöcke zusammen («40 × Weiss»), das Bild bleibt exakt gleich. *Verlustbehaftet* (JPG) fasst **Farbverläufe** zusammen und speichert die Farben gröber, denn das Auge sieht Helligkeit schärfer als Farbunterschiede. Dabei geht Information verloren, und jedes erneute Speichern kostet Qualität.
  Faustregel: Foto → JPG, Logo, Screenshot oder Zeichnung mit wenigen Farben → GIF oder PNG.
- **Druckauflösung:** Sie wird in **dpi** (dots per inch) angegeben, 1 Zoll = 2,54 cm. Breite in Zoll = Pixel ÷ dpi. Für guten Druck braucht man etwa 300 dpi, am Bildschirm genügen 72–150 dpi. Druckt man mit weniger Pixeln, werden die fehlenden Pixel erfunden (interpoliert) und das Bild wird unscharf.
- **Vektorgrafik:** Das Bild wird aus geometrischen Objekten (Linie, Rechteck, Kurve) mit Parametern beschrieben und beliebig scharf skaliert.

[[aufgabe:Aufgabe A3 ●○○ — Dieselben Bits, zwei Bilder]]
Eine Bilddatei ist so aufgebaut: Die ersten 3 Bit sind die **Höhe**, die nächsten 4 Bit die **Breite**, die nächsten 2 Bit die **Farbtiefe**. Danach folgen die **Pixeldaten**, zeilenweise von links oben nach rechts unten. Bei 1 Bit Farbtiefe gilt 1 = weiss und 0 = schwarz. Bei 3 Bit steht je 1 Bit für Rot, Grün und Blau (`100` = Rot, `010` = Grün, `001` = Blau, `111` = Weiss, `000` = Schwarz).

Datei a): `100011001100100010010001001111111`

Datei b): `010010011100100010010001001111111`

```raster rechts senkrecht
a) 8x4
b) 8x4
```

**a)** Teilen Sie Datei a) in Header und Pixeldaten auf und zeichnen Sie das Bild in das Raster a).

**b)** Teilen Sie Datei b) in Header und Pixeldaten auf und zeichnen Sie das Bild in das Raster b).

**c)** Wie viele Pixel hat das Bild in a) {{5}}, wie viele in b) {{5}}? Was fällt Ihnen bei den Pixeldaten der beiden Dateien auf?

[[antwort:1]]

[[/aufgabe]]

[[aufgabe:Aufgabe A4 ●●○ — Ein Bild in Bits übersetzen]]
Das folgende Bild ist 4 Pixel breit und 3 Pixel hoch:

```pixel
RRGG
RSSG
BBBB
```

**a)** **Version 1 (typisch):** Codieren Sie jeden Pixel mit 24 Bit, hexadezimal (`FF0000` = Rot, `00FF00` = Grün, `0000FF` = Blau, `000000` = Schwarz). Das Bild braucht {{8}} Bit = {{6}} Byte.

**b)** **Version 2 (sparsam):** Das Bild hat nur wenige Farben. Bits pro Pixel mindestens: {{3}}. Farbtabelle: `00` {{9}} `01` {{9}} `10` {{9}} `11` {{9}}

Pixeldaten als Bitfolge: {{30}}

**c)** Um den wievielten Teil schrumpft die Datei? Faktor: {{5}}

[[/aufgabe]]

[[aufgabe:Aufgabe A5 ●●○ — Dateigrösse und indizierte Farben]]
Ein Logo ist 240 Pixel breit und 100 Pixel hoch und enthält nur 6 verschiedene Farben.

**a)** Ohne Farbtabelle (24 Bit): Das Logo hat {{7}} Pixel und braucht {{8}} Byte.

**b)** Mit indizierten Farben: Bit pro Pixel {{3}}, Pixeldaten {{8}} Byte, Farbtabelle (jede Farbe 24 Bit) {{6}} Byte, Datei insgesamt {{8}} Byte (Header nicht mitgerechnet).

**c)** Um welchen Faktor ist die Datei kleiner geworden? {{6}}

[[/aufgabe]]

[[aufgabe:Aufgabe A6 ●●○ — Druckauflösung (dpi)]]
Ein Foto hat 3600 × 2400 Pixel. Rechnen Sie mit 1 Zoll = 2,54 cm.

**a)** Wie gross (in Zoll und in cm) wird der Ausdruck bei 300 dpi?

**b)** Wie gross wird er bei 150 dpi?

[[antwort:2]]

**c)** Das Foto soll als Abzug von 15 cm × 10 cm bei 300 dpi gedruckt werden. Wie viele Pixel werden mindestens gebraucht? Reicht das Foto?

**d)** Das Foto wird auf 60 cm Breite gedruckt. Wie viele dpi ergeben sich? Ist das noch scharf genug (Druck: 200–600 dpi)?

[[antwort:3]]

**e)** (●●●) Was passiert, wenn man dasselbe Foto auf 120 cm Breite druckt?

> **Tipp:** Zoll = cm ÷ 2,54. Pixel = Zoll · dpi.

[[antwort:1]]

[[/aufgabe]]

[[aufgabe:Aufgabe A7 ●○○ — Verlustbehaftet komprimieren (Theorie)]]
JPG teilt ein Bild in Blöcke von 8 × 8 = 64 Pixeln. Statt der 64 genauen Farbwerte speichert es pro Block nur einen **ähnlichen Farbverlauf**.

[[spalten:64|36]]
**a)** Was bedeutet «verlustbehaftet»? Was geht verloren, und kann man es zurückholen?

**b)** Warum fällt es bei einem Foto kaum auf, wenn statt der 64 Farbwerte nur ein ähnlicher Farbverlauf gespeichert wird?

**c)** Was passiert, wenn man ein JPG mehrmals öffnet und neu speichert?

**d)** Welches Format wählen Sie für ein Foto, welches für ein Logo mit wenigen Farben (JPG oder GIF)? Begründen Sie.
[[||]]
[[feld:6]]
[[/spalten]]

[[/aufgabe]]

### 3 Dateiformate

**Theorie in Kürze**

- **Bits allein bedeuten nichts.** Erst das **Format** sagt, wie man sie in Stücke teilt (Anordnung) und wofür ein Stück steht (Codierung).
- Das Betriebssystem erkennt ein Format in **zwei Schritten**: 1. Es schaut auf die **Endung** (`.png`, `.pdf` …) und wählt danach das passende Programm. 2. Dieses Programm prüft den **Header**, die ersten Bytes der Datei, und sieht so, was wirklich drin ist. Am Anfang steht oft eine feste Bytefolge, die **Magic Number**. Die Endung kann jeder umbenennen, der Header sagt die Wahrheit.
- **Textformate** (z. B. SVG, TXT) sind mit einem Texteditor lesbar, **Binärformate** (z. B. PNG, JPG) brauchen die Beschreibung des Formats.

| Anfang (Hex) | Format |
|---|---|
| `89 50 4E 47` | PNG-Bild |
| `FF D8 FF` | JPG-Bild |
| `25 50 44 46` | PDF-Dokument |
| `50 4B 03 04` | ZIP-Archiv (auch .docx, .xlsx, .pptx) |

Die Tabelle dient zum Nachschlagen: Man muss die Bytefolgen **nicht auswendig kennen**, es gibt noch viele weitere Formate.

[[aufgabe:Aufgabe A8 ●○○ — Endung und Header]]
Benutzen Sie die Tabelle oben. Das Betriebssystem öffnet jede Datei zuerst nach der Endung.

**a)** Das Betriebssystem öffnet jede Datei zuerst nach der Endung. Welche Art Programm startet? Was steckt laut Header wirklich in der Datei? Stimmt die Endung (ja / nein)?

`Urlaub.png` · Anfang `89 50 4E 47 0D 0A` → Programm {{12}} wirklich ein {{12}} stimmt {{5}}

`Zeugnis.pdf` · Anfang `50 4B 03 04 14 00` → Programm {{12}} wirklich ein {{12}} stimmt {{5}}

`Notizen.txt` · Anfang `FF D8 FF E0 00 10` → Programm {{12}} wirklich ein {{12}} stimmt {{5}}

**b)** Beschreiben Sie in zwei Schritten, wie das Betriebssystem herausfindet, was eine Datei ist.

[[antwort:2]]

[[/aufgabe]]

[[aufgabe:Aufgabe A9 ●●○ — Spielstand lesen: Schiffe versenken]]
Ein kleines Spielfeld hat 4 × 4 Felder. Der Spielstand zeigt, worauf bisher geschossen wurde. Jedes Feld hat 2 Bit, die Felder stehen zeilenweise von oben links nach unten rechts: `00` = noch nicht beschossen, `01` = Fehlschuss (Wasser), `10` = Treffer.

Der Spielstand lautet: `00010000001010100100000000000110`

```raster rechts
a) 4x4
```

**a)** Zerlegen Sie die Bitfolge in 16 Felder und zeichnen Sie das Spielfeld (`o` Fehlschuss, `X` Treffer, nicht beschossen leer lassen).

**b)** Es sind {{4}} Schüsse gefallen, davon {{4}} Treffer.

**c)** Bei einem Feld von 10 × 10 braucht der Spielstand {{5}} Bit = {{4}} Byte.

**d)** (●●●) Aus diesem Spielstand weiss man nicht, wo die Schiffe liegen. Wie könnte man die Lage der Schiffe zusätzlich speichern, und wie viele Bit braucht das bei 4 × 4 Feldern?

[[antwort:1]]

[[/aufgabe]]

[[aufgabe:Aufgabe A10 ●●○ — Header lesen: dieselben Bits, zwei Formate]]
Eine Bilddatei besteht aus diesen 24 Bit:

```
001100100010100010001111
```

**Format A:** Breite 4 Bit, Höhe 4 Bit, Farbtiefe 4 Bit, danach die Pixeldaten. Farbcodierung mit 2 Bit: `00` Schwarz, `01` Rot, `10` Grün, `11` Blau.

**Format B:** Farbtiefe 4 Bit, Breite 4 Bit, Höhe 4 Bit, danach die Pixeldaten. Farbcodierung mit 3 Bit (je 1 Bit für Rot, Grün, Blau; `100` = Rot, `010` = Grün, `001` = Blau, `111` = Weiss, `000` = Schwarz).

**a)** Teilen Sie die Bits nach Format A und nach Format B auf, wandeln Sie den Header in Dezimalzahlen um und prüfen Sie, ob die Zahl der Pixelbits passt.

Format A: Breite {{3}} Höhe {{3}} Farbtiefe {{3}} Pixelbits passen? {{6}} Datei {{4}} Bit = {{3}} Byte

Format B: Breite {{3}} Höhe {{3}} Farbtiefe {{3}} Pixelbits passen? {{6}} Datei {{4}} Bit = {{3}} Byte

**b)** Zeichnen Sie beide Bilder. **c)** Warum entstehen aus denselben Bits zwei verschiedene Bilder?

[[antwort:2]]

[[/aufgabe]]

<div style="break-before:page"></div>

### 4 Algorithmen

**Theorie in Kürze**

- Ein **Algorithmus** ist eine genaue Anleitung, die ein Problem in einzelnen Schritten löst. Er muss **ausführbar, eindeutig, allgemein, endlich und korrekt** sein.
- Drei **Bausteine** genügen: **Sequenz** (nacheinander), **Verzweigung** (je nach Bedingung) und **Wiederholung** (mehrmals oder bis eine Bedingung gilt).
- Eine **Variable** ist eine Kiste mit Namen und Wert. `r = r + a` rechnet rechts und legt das Ergebnis links ab, `==` vergleicht nur.
- Beim **Schreibtischtest** führen Sie ein Programm von Hand aus: eine Spalte je Variable, dazu die Bedingung. Testen Sie **Grenzfälle**.

**Die drei Bausteine als Struktogramm** (bei der Wiederholung ist der Rumpf eingerückt):

```nebeneinander
@Sequenz
┌──────────────────────┐
│ vorwärts             │
├──────────────────────┤
│ rechts drehen        │
├──────────────────────┤
│ vorwärts             │
└──────────────────────┘
=====
@Verzweigung
┌────────────────────────────────┐
│        Feld vorne frei?        │
├───────────────┬────────────────┤
│       Ja      │      Nein      │
├───────────────┼────────────────┤
│ vorwärts      │ rechts drehen  │
└───────────────┴────────────────┘
=====
@Wiederholung
┌──────────────────────────┐
│ wiederhole 4-mal         │
├──┬───────────────────────┤
│  │ vorwärts              │
│  ├───────────────────────┤
│  │ rechts drehen         │
└──┴───────────────────────┘
```

[[aufgabe:Aufgabe A11 ●○○ — Kara: Der Käfer findet das Ziel nicht]]
Der Käfer startet auf **S** und blickt nach rechts. Er soll das Ziel **Z** erreichen und merkt nur, ob das Feld vorne oder rechts frei ist. Graue Felder sind Mauern.

```nebeneinander
┌────────────────────────────────────────────────┐
│ wiederhole bis Ziel                            │
├──┬─────────────────────────────────────────────┤
│  │               Feld vorne frei?              │
│  ├──────────────────────┬──────────────────────┤
│  │          Ja          │         Nein         │
│  ├──────────────────────┼──────────────────────┤
│  │ vorwärts             │ rechts drehen        │
└──┴──────────────────────┴──────────────────────┘
=====
!karte
########
#S.....#
#.####.#
#......Z
########
```

**a)** Führen Sie das Struktogramm aus und zeichnen Sie den Weg des Käfers in die Karte ein. Warum erreicht er das Ziel nie?

**b)** Tragen Sie in jedes gelbe Feld einen Baustein aus dem Baukasten ein, so dass der Käfer das Ziel erreicht. Nicht alle Bausteine werden gebraucht, mehrere Lösungen sind möglich. Prüfen Sie mit dem neuen Weg.

```nebeneinander
┌────────────────────────────────────────────────────────────────┐
│ wiederhole bis Ziel                                            │
├──┬─────────────────────────────────────────────────────────────┤
│  │                   ________________________                  │
│  ├──────────────────────────────┬──────────────────────────────┤
│  │              Ja              │             Nein             │
│  ├──────────────────────────────┼──────────────────────────────┤
│  │ ________________________     │   ________________________   │
│  ├──────────────────────────────┼──────────────┬───────────────┤
│  │ ________________________     │      Ja      │      Nein     │
│  │                              ├──────────────┼───────────────┤
│  │                              │ _____________│ ______________│
└──┴──────────────────────────────┴──────────────┴───────────────┘
=====
!baukasten
Befehle: vorwärts | rückwärts | rechts drehen | links drehen | stehen bleiben
Fragen: Feld vorne frei? | Feld rechts frei? | Feld links frei? | Feld hinten frei?
```

[[/aufgabe]]

[[aufgabe:Aufgabe A12 ●○○ — Schreibtischtest: Quersumme]]
Das Programm berechnet die Quersumme einer Zahl. `zahl % 10` ist die letzte Ziffer (Rest bei Division durch 10), `zahl // 10` schneidet die letzte Ziffer ab (ganzzahlig teilen). Die Eingabe ist `zahl = 3846`.

**a)** Führen Sie den Schreibtischtest zu Ende. Jede Prüfung der Bedingung ist eine Zeile, die erste gehört vor den ersten Durchgang.

[[spalten:46|54]]
```
┌──────────────────────────────────────────────┐
│ summe = 0                                    │
├──────────────────────────────────────────────┤
│ solange zahl > 0                             │
├──┬───────────────────────────────────────────┤
│  │ summe = summe + zahl % 10                 │
│  ├───────────────────────────────────────────┤
│  │ zahl = zahl // 10                         │
├──┴───────────────────────────────────────────┤
│ print(summe)                                 │
└──────────────────────────────────────────────┘
```
[[||]]
| Prüfung | zahl | summe | zahl > 0 | Ausgabe |
|---|---|---|---|---|
| 1. | 3846 | 0 | wahr | |
| 2. | | | | |
| 3. | | | | |
| 4. | | | | |
| 5. | | | | |
[[/spalten]]

**b)** Was berechnet das Programm? Antworten Sie in einem Satz.

**c)** Was gibt das Programm für `zahl = 0` aus? Ist das sinnvoll?

[[antwort:2]]

[[/aufgabe]]

[[aufgabe:Aufgabe A13 ●●○ — Fehler im Programm: Countdown]]
Der Countdown soll die Zahlen 10, 9, 8, … 1 ausgeben und dann «Start!». Das Programm hat einen Fehler.

**a)** Führen Sie vier Prüfungen von Hand aus. Was passiert?

[[spalten:46|54]]
```
┌──────────────────────────────────────┐
│ zahl = 10                            │
├──────────────────────────────────────┤
│ solange zahl > 0                     │
├──┬───────────────────────────────────┤
│  │ print(zahl)                       │
├──┴───────────────────────────────────┤
│ print("Start!")                      │
└──────────────────────────────────────┘
```
[[||]]
| Prüfung | zahl | zahl > 0 | Ausgabe |
|---|---|---|---|
| 1. | 10 | wahr | |
| 2. | | | |
| 3. | | | |
| 4. | | | |
[[/spalten]]

**b)** Welche der fünf Anforderungen an einen Algorithmus ist verletzt? Begründen Sie.

[[antwort:2]]

**c)** Reparieren Sie das Programm.

**d)** (●●●) Was gibt das reparierte Programm aus, wenn `zahl` am Anfang 0 ist? Ist das ein sinnvolles Verhalten?

[[antwort:2]]

[[/aufgabe]]

<div style="break-before:page"></div>

## Teil B — Erweiterte Aufgabensammlung

Die Aufgaben sind pro Thema nach Schwierigkeit geordnet. Bearbeiten Sie so viele, wie Sie brauchen.

### B1 Farben und Farbtiefe

[[aufgabe:Aufgabe B1.1 ●○○ — Additiv oder subtraktiv?]]
Kreisen Sie ein: Bildschirm (additiv / subtraktiv), Tintenstrahldrucker (additiv / subtraktiv), Beamer (additiv / subtraktiv), Zeitungsdruck (additiv / subtraktiv). Welche Grundfarben werden jeweils gemischt?

[[antwort:1]]

[[/aufgabe]]

[[aufgabe:Aufgabe B1.2 ●○○ — Heller oder dunkler?]]
Kreisen Sie jeweils die hellere Farbe ein.

**a)** `#202020` oder `#E0E0E0`   **b)** `#0000FF` oder `#000040`   **c)** `#FF0000` oder `#800000`   **d)** `#00FF00` oder `#008000`

Erklären Sie die Regel in einem Satz.

[[antwort:1]]

[[/aufgabe]]

[[aufgabe:Aufgabe B1.3 ●○○ — Grau bauen]]
**a)** Hexcode eines mittleren Grautons: {{10}}   **b)** Wie machen Sie ihn heller, wie dunkler?   **c)** Woran erkennt man an einem Hexcode, ob er ein Grau ist?

[[antwort:2]]

[[/aufgabe]]

[[aufgabe:Aufgabe B1.4 ●●○ — Dezimal nach Hex]]
Schreiben Sie als Hexcode und nennen Sie die Farbe (eine der sechs Grundfarben oder ein Grauton).

**a)** (255, 0, 0) {{8}} {{10}}   **b)** (64, 64, 64) {{8}} {{10}}

**c)** (192, 192, 192) {{8}} {{10}}   **d)** (0, 0, 128) {{8}} {{10}}

[[/aufgabe]]

[[aufgabe:Aufgabe B1.5 ●●○ — Bits zählen]]
Wie viele Bit pro Pixel braucht ein Bild mit

**a)** 2 Farben {{4}}   **b)** 5 Farben {{4}}   **c)** 100 Farben {{4}}   **d)** 256 Farben {{4}}

[[/aufgabe]]

[[aufgabe:Aufgabe B1.6 ●●○ — Dateigrösse]]
Ein unkomprimiertes Bild ist 800 × 600 Pixel gross (1 MB = 1 000 000 Byte).

Bei 24 Bit Farbtiefe: {{10}} Byte = {{7}} MB   Bei 8 Bit Farbtiefe: {{10}} Byte = {{7}} MB

[[/aufgabe]]

[[aufgabe:Aufgabe B1.7 ●●● — Graustufen]]
Ein Graustufenbild hat 256 Stufen. Wie viel kleiner wird die Datei aus B1.6, wenn man nur 1 Byte pro Pixel speichert? Faktor: {{5}}. Was geht dabei verloren?

[[antwort:1]]

[[/aufgabe]]

[[aufgabe:Aufgabe B1.8 ●●● — Gleiche Zahl, andere Helligkeit?]]
`#FF0000`, `#00FF00` und `#0000FF` haben alle einen Kanal mit dem Maximalwert 255. Wirken sie gleich hell? Nummerieren Sie von hell (1) bis dunkel (3) und begründen Sie. (Tipp: Das Auge ist für die drei Farben unterschiedlich empfindlich.)

`#FF0000` {{2}}   `#00FF00` {{2}}   `#0000FF` {{2}}

[[antwort:1]]

[[/aufgabe]]

### B2 Grafikformate

[[aufgabe:Aufgabe B2.1 ●○○ — Raster oder Vektor?]]
Raster (R) oder Vektor (V)? Kreisen Sie ein: Foto (R / V), Firmenlogo (R / V), Stadtplan (R / V), Röntgenbild (R / V), Piktogramm (R / V). Begründen Sie zwei Beispiele in einem Satz.

[[antwort:2]]

[[/aufgabe]]

[[aufgabe:Aufgabe B2.2 ●●○ — SVG lesen]]
Was zeigt dieser Code (Leinwand 300 × 200)? Zeichnen Sie das Bild in die Leinwand und benennen Sie die Flagge.

```
<svg xmlns="http://www.w3.org/2000/svg" width="300px" height="200px" viewBox="0 0 300 200">
  <rect fill="#FFFFFF" x="0"  y="0"  width="300" height="200"/>
  <rect fill="#0000FF" x="0"  y="80" width="300" height="40"/>
  <rect fill="#0000FF" x="80" y="0"  width="40"  height="200"/>
</svg>
```

```raster
Leinwand 6x4
```

Flagge: {{18}}

[[/aufgabe]]

[[aufgabe:Aufgabe B2.3 ●●○ — SVG ändern]]
Ändern Sie den Code aus B2.2 so, dass die Flagge Dänemarks entsteht (weisses Kreuz auf rotem Grund, vereinfacht). Welche Zeilen müssen Sie ändern?

[[antwort:1]]

[[/aufgabe]]

[[aufgabe:Aufgabe B2.4 ●●○ — Welche Auflösung?]]
Ein quadratisches Bild mit 1000 × 1000 Pixeln soll 5 cm breit gedruckt werden. Es ergeben sich {{6}} dpi. Genügt das für guten Druck (300 dpi)? {{6}} Bei genau 300 dpi wäre es {{7}} cm breit.

[[/aufgabe]]

[[aufgabe:Aufgabe B2.5 ●●○ — Poster]]
Ein Poster soll 50 cm × 70 cm gross und bei 300 dpi gedruckt werden. Das Foto braucht {{7}} × {{7}} Pixel, das sind ungefähr {{6}} Megapixel.

[[/aufgabe]]

[[aufgabe:Aufgabe B2.6 ●●○ — Formatwahl]]
Welches Format wählen Sie (JPG, PNG, GIF oder SVG)?

**a)** Ein Katzenfoto für den Klassenchat {{6}}   **b)** Ein Vereinslogo für Visitenkarten und Plakate {{6}}

**c)** Ein Screenshot einer Tabelle für eine Webseite {{6}}   **d)** Ein kurzer Animations-Smiley {{6}}

Begründen Sie zwei Ihrer Wahlen.

[[antwort:2]]

[[/aufgabe]]

[[aufgabe:Aufgabe B2.7 ●●● — Vergrössern]]
Warum wird eine Rastergrafik beim starken Vergrössern unscharf, eine Vektorgrafik aber nicht? Was passiert in jedem Fall mit der Dateigrösse?

[[antwort:2]]

[[/aufgabe]]

[[aufgabe:Aufgabe B2.8 ●●● — Format-Detektiv]]
Ein JPG wird zehnmal gespeichert und dabei jedes Mal neu komprimiert. Was beobachten Sie an der Qualität, und warum?

[[antwort:2]]

[[/aufgabe]]

[[aufgabe:Aufgabe B2.9 ●●○ — Blöcke zusammenfassen]]
Eine Bildzeile hat 100 Pixel mit 1 Bit Farbtiefe: 30 weiss, 10 schwarz, 5 weiss, 10 schwarz, 45 weiss. Ein Block wird als Anzahl (7 Bit) und Farbe (1 Bit) gespeichert.

**a)** Die Zeile braucht ohne Blöcke {{5}} Bit, mit Blöcken {{5}} Bit.   **b)** Wechseln sich Weiss und Schwarz bei jedem Pixel ab, braucht sie mit Blöcken {{5}} Bit.

Was lernen Sie daraus?

[[antwort:1]]

[[/aufgabe]]

[[aufgabe:Aufgabe B2.10 ●●● — Indizierte Farben im Vergleich]]
Ein Bild ist 640 × 480 Pixel gross und enthält 200 verschiedene Farben (Header nicht mitgerechnet).

**a)** Mit 24 Bit pro Pixel {{9}} Byte   **b)** mit Farbtabelle {{9}} Byte   **c)** Faktor {{5}}

**d)** Wie viele Farben könnte man mit derselben Bitzahl pro Pixel höchstens verwenden? {{6}}

[[/aufgabe]]

### B3 Dateiformate

[[aufgabe:Aufgabe B3.1 ●○○ — Bits sagen nichts]]
Die drei Byte `61 62 63` können in einer Textdatei etwas anderes bedeuten als in einer Bilddatei. Nennen Sie je eine mögliche Bedeutung.

In einer Textdatei: {{20}}   In einer Bilddatei: {{20}}

[[/aufgabe]]

[[aufgabe:Aufgabe B3.2 ●●○ — Spielstand lesen: Tic-Tac-Toe (19 Bit)]]
Bit 1: Wer ist am Zug? (1 = Kreuz, 0 = Kreis). Danach 9 Felder à 2 Bit in Leserichtung (oben links bis unten rechts). Das erste Bit eines Feldes sagt, ob es belegt ist (1 = belegt, 0 = leer), das zweite, was darauf steht (1 = Kreuz, 0 = Kreis). Ein leeres Feld ist immer `00`.

```
1111000001100000010
```

```raster rechts
Spielfeld 3x3
```

Zeichnen Sie das Spielfeld (`X` Kreuz, `O` Kreis, leer lassen) und nennen Sie den Spieler am Zug: {{12}}

[[/aufgabe]]

[[aufgabe:Aufgabe B3.3 ●●○ — Spielstand schreiben]]
Schreiben Sie dieses Spielfeld als 19-Bit-Folge. Kreuz hat begonnen und beide haben gleich viele Zeichen gesetzt.

```pixel
OX.
.O.
X..
```

Die Bitfolge lautet: {{26}}

[[/aufgabe]]

[[aufgabe:Aufgabe B3.4 ●●○ — Dateigrösse mit Header]]
Ein Foto hat 3000 × 2000 Pixel bei 24 Bit Farbtiefe, der Header braucht 16 Byte (1 MB = 1 000 000 Byte).

Die Datei ist {{10}} MB gross. Wie stark fällt der Header ins Gewicht? {{18}}

[[/aufgabe]]

[[aufgabe:Aufgabe B3.5 ●●● — 4 gewinnt]]
Bit 1: Wer ist am Zug? (0 = Blau, 1 = Rot). Je Spalte (links nach rechts): 3 Bit Anzahl Steine, dann ein Bit pro Stein von unten nach oben (0 = Blau, 1 = Rot).

```
00100100000100000000000011
```

```raster rechts
Spielfeld 7x6
```

**a)** Zeichnen Sie den Spielstand mit B und R (7 Spalten, 6 Zeilen).

**b)** Spielstand mit 9 Steinen: {{5}} Bit. Bei vollem Brett: {{5}} Bit.

**c)** Wer ist am Zug, und stimmt das mit der Anzahl der Steine überein? {{18}}

[[/aufgabe]]

[[aufgabe:Aufgabe B3.6 ●●● — Eigenes Format]]
Erfinden Sie ein Format für den Spielstand von «Dame» (8 × 8 Brett, gespielt wird nur auf den 32 dunklen Feldern; ein Feld ist leer oder hat einen weissen Stein, schwarzen Stein, weisse Dame oder schwarze Dame; dazu muss man wissen, wer am Zug ist). Ein gutes Format ist **eindeutig, vollständig und sparsam**. Beschreiben Sie es, berechnen Sie die Anzahl Bit und geben Sie ein Beispiel mit Bitfolge.

[[antwort:3]]

[[/aufgabe]]

### B4 Algorithmen

Die Aufgaben führen vom **Lesen** über das **Ergänzen** zum **selbständigen Bauen** von Struktogrammen. In den Käfer-Aufgaben kennt der Käfer die Befehle «vorwärts», «rechts drehen» und «links drehen».

[[aufgabe:Aufgabe B4.1 ●○○ — Fünf Anforderungen]]
Welche Anforderung wird hier verletzt (ausführbar, eindeutig, allgemein, endlich, korrekt)?

**a)** «Rühre, bis es gut aussieht.» {{12}}

**b)** «Zähle alle natürlichen Zahlen auf.» {{12}}

**c)** «Nimm die dritte rote Schraube.» (Es gibt nur zwei rote Schrauben.) {{12}}

**d)** «Rechne 17 + 25 aus.» (als Anleitung zum Addieren allgemein gedacht) {{12}}

[[/aufgabe]]

[[aufgabe:Aufgabe B4.2 ●○○ — Struktogramm lesen: Käfer]]
Der Käfer steht auf einem freien Feld und blickt nach rechts (Osten). Er führt dieses Struktogramm aus:

```nebeneinander
┌────────────────────────────────┐
│ wiederhole 3-mal               │
├──┬─────────────────────────────┤
│  │ vorwärts                    │
│  ├─────────────────────────────┤
│  │ vorwärts                    │
│  ├─────────────────────────────┤
│  │ links drehen                │
└──┴─────────────────────────────┘
=====
!raster
Weg 5x5
```

**a)** Zeichnen Sie den Weg ein und markieren Sie Start (S) und Endfeld (E).

**b)** Der Käfer blickt am Schluss nach {{8}} und hat {{3}} verschiedene Felder besucht.

**c)** Was ändert sich, wenn Sie «3-mal» durch «4-mal» ersetzen?

[[antwort:1]]

[[/aufgabe]]

[[aufgabe:Aufgabe B4.3 ●●○ — Struktogramm ergänzen: Treppe]]
Der Käfer steht oben links und blickt nach rechts. Die Flagge steht 5 Felder weiter rechts und 5 Felder weiter unten. Ergänzen Sie die fehlende Zahl:

```
┌──────────────────────────────────┐
│ wiederhole ___-mal               │
├──┬───────────────────────────────┤
│  │ vorwärts                      │
│  ├───────────────────────────────┤
│  │ rechts drehen                 │
│  ├───────────────────────────────┤
│  │ vorwärts                      │
│  ├───────────────────────────────┤
│  │ links drehen                  │
└──┴───────────────────────────────┘
```

**a)** Welche Zahl gehört in die Lücke? {{4}}   **b)** Aus wie vielen Bausteinen besteht das Struktogramm? {{4}}

**c)** Was ändert sich, wenn die Flagge 8 Felder weiter rechts und 8 Felder weiter unten steht?

**d)** (●●●) Die Flagge steht neu 4 Felder rechts und 6 Felder unten. Passen Sie das Struktogramm an.

[[antwort:2]]

[[/aufgabe]]

[[aufgabe:Aufgabe B4.4 ●●○ — Schreibtischtest mit Liste]]
Das Programm sucht die grösste Zahl.

Führen Sie den Schreibtischtest für `zahlen = [7, 3, 9, 4]` durch.

[[spalten:50|50]]
```
┌──────────────────────────────────────┐
│ max = zahlen[0]                      │
├──────────────────────────────────────┤
│ für jede zahl in zahlen              │
├──┬───────────────────────────────────┤
│  │             zahl > max            │
│  ├─────────────────┬─────────────────┤
│  │        Ja       │       Nein      │
│  ├─────────────────┼─────────────────┤
│  │ max = zahl      │                 │
├──┴─────────────────┴─────────────────┤
│ print(max)                           │
└──────────────────────────────────────┘
```
[[||]]
| zahl | zahl > max | max |
|---|---|---|
| (Start) | | |
| 7 | | |
| 3 | | |
| 9 | | |
| 4 | | |
[[/spalten]]

Was passiert, wenn man `max = 0` setzt und alle Zahlen negativ sind?

[[antwort:1]]

[[/aufgabe]]

[[aufgabe:Aufgabe B4.5 ●●○ — Verzweigung: Briefporto]]
Ein Brief kostet je nach Gewicht (in Gramm) unterschiedlich viel (Preise erfunden):

```
┌────────────────────────────────────────────────────┐
│                   gewicht <= 20                    │
├─────────────────────────┬──────────────────────────┤
│            Ja           │           Nein           │
├─────────────────────────┼──────────────────────────┤
│ preis = 1               │      gewicht <= 100      │
│                         ├────────────┬─────────────┤
│                         │     Ja     │     Nein    │
│                         ├────────────┼─────────────┤
│                         │ preis = 2  │ preis = 5   │
├─────────────────────────┴────────────┴─────────────┤
│ print(preis)                                       │
└────────────────────────────────────────────────────┘
```

**a)** Welcher Preis wird ausgegeben für 5 g {{4}}   20 g {{4}}   21 g {{4}}   100 g {{4}}   101 g {{4}}

**b)** Grenzfälle, die man unbedingt testen muss: {{20}}

**c)** Aus Versehen steht in der ersten Verzweigung `gewicht < 20` statt `gewicht <= 20`. Welcher Testfall deckt den Fehler auf? {{8}}

**d)** Neu kostet ein Brief über 500 g 9 Fr. Ergänzen Sie das Struktogramm.

[[antwort:2]]

[[/aufgabe]]

[[aufgabe:Aufgabe B4.6 ●●○ — Kara-Rasenmäher]]
Der Käfer steht oben links und blickt nach rechts. Der Rasen ist 4 Felder breit und hat 3 Bahnen.

```raster rechts
Rasen 4x3
```

**a)** Zeichnen Sie den Weg ein.

**b)** Zeichnen Sie das Struktogramm. Welches Stück wiederholt sich?

**c)** Was ändert sich im Programm, wenn der Rasen 6 Bahnen hat?

[[antwort:3]]

[[/aufgabe]]

[[aufgabe:Aufgabe B4.7 ●●● — Schreibtischtest: Halbieren]]

**a)** Führen Sie den Schreibtischtest für `n = 100` durch. Jede Prüfung der Bedingung ist eine Zeile, die erste gehört vor den ersten Durchgang.

[[spalten:44|56]]
```
┌──────────────────────────────────┐
│ k = 0                            │
├──────────────────────────────────┤
│ solange n > 1                    │
├──┬───────────────────────────────┤
│  │ n = n // 2                    │
│  ├───────────────────────────────┤
│  │ k = k + 1                     │
├──┴───────────────────────────────┤
│ print(k)                         │
└──────────────────────────────────┘
```
[[||]]
| Prüfung | n | k | n > 1 | Ausgabe |
|---|---|---|---|---|
| 1. | 100 | 0 | wahr | |
| 2. | | | | |
| 3. | | | | |
| 4. | | | | |
| 5. | | | | |
| 6. | | | | |
| 7. | | | | |
[[/spalten]]

**b)** Was berechnet das Programm?

**c)** Was gibt es aus? n = 37 {{5}}   n = 1 {{5}}

**d)** Warum endet die Wiederholung immer? {{40}}

[[/aufgabe]]

[[aufgabe:Aufgabe B4.8 ●●● — Labyrinth]]
Der Käfer startet bei S und blickt nach rechts. Er merkt nur, ob die Felder vorne, links und rechts frei sind. Er führt dieses Struktogramm aus:

```nebeneinander
┌──────────────────────────────────────────────────────────────┐
│ wiederhole bis Ziel                                          │
├──┬───────────────────────────────────────────────────────────┤
│  │                     Feld rechts frei?                     │
│  ├─────────────────────────────┬─────────────────────────────┤
│  │              Ja             │             Nein            │
│  ├─────────────────────────────┼─────────────────────────────┤
│  │ rechts drehen               │       Feld vorne frei?      │
│  ├─────────────────────────────┼──────────────┬──────────────┤
│  │ vorwärts                    │      Ja      │     Nein     │
│  │                             ├──────────────┼──────────────┤
│  │                             │ vorwärts     │ links drehen │
└──┴─────────────────────────────┴──────────────┴──────────────┘
=====
!karte
#######
#S....#
#.###.#
#...#.#
###.#Z#
###...#
#######
```

**a)** Spielen Sie das Struktogramm von Hand durch und zeichnen Sie den Weg in die Karte ein.

**b)** Der Käfer macht {{4}} Schritte vorwärts bis zum Ziel.

**c)** Beschreiben Sie in einem Satz, wie der Käfer an einer Abzweigung entscheidet. {{40}}

```raster rechts
Labyrinth 6x4
```

**d)** Zeichnen Sie ein Labyrinth, in dem diese Regel den Käfer nie zum Ziel führt.

[[/aufgabe]]

[[aufgabe:Aufgabe B4.9 ●●● — Struktogramm entwerfen: gerade Zahlen]]
Entwerfen Sie ein Struktogramm, das die **Summe aller geraden Zahlen von 1 bis n** ausgibt. Die Bausteine: Zuweisung (`summe = 0`), «solange», Verzweigung, `print`. Eine Zahl `i` ist gerade, wenn `i % 2 == 0` gilt (`%` ist der Rest der Division).

**a)** Zeichnen Sie das Struktogramm.

**b)** Testen Sie es mit `n = 7`, `n = 10` und `n = 1` (Schreibtischtest).

**c)** Welche Sonderfälle sollten Sie prüfen?

[[antwort:3]]

[[/aufgabe]]

[[aufgabe:Aufgabe B4.10 ●●● — Vom Problem zum Algorithmus]]
Entwerfen Sie einen Algorithmus «Tisch decken für n Gäste». Gehen Sie in vier Schritten vor: **zerlegen**, **Muster erkennen**, **abstrahieren**, **Algorithmus entwerfen** (als Struktogramm). Prüfen Sie ihn an den Sonderfällen n = 0 und n = 1.

[[antwort:3]]

[[/aufgabe]]

## Lösungen

Die Lösungen aller Aufgaben finden Sie online unter `https://masta-nksa.github.io/kara/dossier/codes-und-algorithmen/loesungen.html`. Scannen Sie den QR-Code und schauen Sie erst hin, wenn eine Aufgabe fertig ist.

```qr
https://masta-nksa.github.io/kara/dossier/codes-und-algorithmen/loesungen.html
```
