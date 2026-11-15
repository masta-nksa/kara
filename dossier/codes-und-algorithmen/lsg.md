# Lösungen zum Lerndossier Codes und Algorithmen

Zeichenhilfe: ⬛ schwarz · ⬜ weiss · 🟥 rot · 🟩 grün · 🟦 blau · ⭕ Kreis · ❌ Kreuz

---

# Teil A: Schlüsselaufgaben

## 1 Farben und Farbtiefe

### A1

a)

| Code | Kanäle (R, G, B) | Farbe |
|---|---|---|
| `#2BE04A` | 43, 224, 74 | Grün (nur der Grün-Kanal ist hoch) |
| `#F8FAF7` | 248, 250, 247 | Weiss (alle Kanäle fast voll) |
| `#1A22EE` | 26, 34, 238 | Blau (nur der Blau-Kanal ist hoch) |
| `#7C7F7B` | 124, 127, 123 | Grau (alle Kanäle fast gleich, mittel) |

b) Weiss: C = 0 %, M = 0 %, Y = 0 %, K = 0 %, also kein Farbstoff, das Papier bleibt weiss. Schwarz: C = M = Y = 0 %, K = 100 %, also nur der schwarze Farbstoff K.

c) Reihenfolge vom dunkelsten zum hellsten: `#402030` = **1**, `#708048` = **2**, `#C09060` = **3**, `#F0E0D0` = **4**. Von Farbe zu Farbe wird jeder Kanal grösser (Rot 64, 112, 192, 240, Grün 32, 128, 144, 224, Blau 48, 72, 96, 208), deshalb ist die Reihenfolge eindeutig.

d) **Regel:** Je **grösser** die Kanalwerte, desto **heller** die Farbe, je **kleiner**, desto **dunkler**. Sind alle drei Kanäle **gleich gross** (R = G = B), ist die Farbe ein **Grau**: `000000` ist Schwarz, `FFFFFF` ist Weiss, dazwischen liegen die Graustufen.
*Achtung:* Eine Mischung ist nicht automatisch heller. Der Vergleich ist nur eindeutig, wenn jeder Kanal grösser ist: `#111100` (17, 17, 0) ist dunkler als `#FF0000` (255, 0, 0), obwohl der Grün-Kanal grösser ist.
e) Reines Blau: `000000000000000011111111` (Rot 0, Grün 0, Blau 255).

### A2

a) 6 Bit: 2⁶ = **64**. 12 Bit: 2¹² = **4096**. 15 Bit: 2¹⁵ = **32 768**. 30 Bit: 2³⁰ = **1 073 741 824**.
b) `F00`: Rot 15 (voll), Grün 0, Blau 0 → **Rot**. `0F0` → **Grün**. `888`: alle Kanäle gleich (8 von 15, etwa die Hälfte) → **Grau**. `FFF`: alle Kanäle voll → **Weiss**.
c) Jede Ziffer wird verdoppelt: `F00` → `FF0000` (Rot, 255), `888` → `888888` (136, 136, 136). Das Rot bleibt Rot und das Grau bleibt Grau, denn die Kanäle bleiben im selben Verhältnis. Aus `F` (15) wird `FF` (255), aus `8` wird `88` (136).
d) Ein 4-Bit-Wert *v* wird zu *v* · 17 (0 bis 255). Dabei bleiben die Verhältnisse zwischen den Kanälen praktisch gleich, und der grösste Wert `F` wird zu `FF`. Das Bild hat darum dieselben Farben, nur feiner abgestuft.

## 2 Grafikformate

### A3

a) Datei a): Header `100 | 0110 | 01` → Höhe 4, Breite 6, Farbtiefe 1 Bit. Pixeldaten (24 Bit): `100100 010010 001001 111111`. Es sind 6 · 4 · 1 = 24 Bit, das passt. 1 = weiss, 0 = schwarz:

```
⬜⬛⬛⬜⬛⬛
⬛⬜⬛⬛⬜⬛
⬛⬛⬜⬛⬛⬜
⬜⬜⬜⬜⬜⬜
```

b) Datei b): Header `010 | 0100 | 11` → Höhe 2, Breite 4, Farbtiefe 3 Bit. Pixeldaten: `100 100 010 010 | 001 001 111 111`. Es sind 4 · 2 · 3 = 24 Bit, das passt.

```
🟥🟥🟩🟩
🟦🟦⬜⬜
```

c) In a) sind es **24 Pixel** (24 Bit ÷ 1 Bit), in b) **8 Pixel** (24 Bit ÷ 3 Bit). Die **Pixeldaten sind in beiden Dateien dieselben 24 Bit**. Nur der Header (Höhe, Breite, Farbtiefe) sagt, wie man sie in Pixel aufteilt, darum entstehen zwei verschiedene Bilder. Anzahl Pixel = Anzahl Bit der Pixeldaten ÷ Farbtiefe, und das muss zu Breite · Höhe passen.

### A4

a) 12 Pixel × 24 Bit = **288 Bit = 36 Byte**. Die Pixeldaten lauten zeilenweise:

```
FF0000 FF0000 00FF00 00FF00
FF0000 000000 000000 00FF00
0000FF 0000FF 0000FF 0000FF
```

b) Es gibt 4 Farben, also genügen **2 Bit** pro Pixel (2² = 4). Farbtabelle: `00` Schwarz, `01` Rot, `10` Grün, `11` Blau.

```
01 01 10 10
01 00 00 10
11 11 11 11
```

Pixeldaten: `010110100100001011111111` (12 × 2 = 24 Bit = 3 Byte).
c) 288 Bit ÷ 24 Bit = Die Datei wird **12-mal kleiner**.

### A5

a) 240 · 100 = **24 000 Pixel**. Unkomprimiert: 24 000 · 24 Bit = 576 000 Bit = **72 000 Byte = 72 kB**.
b) 6 Farben: 2² = 4 genügt nicht, 2³ = 8 → **3 Bit** pro Pixel. Pixeldaten: 24 000 · 3 = 72 000 Bit = 9000 Byte. Farbtabelle: 6 · 24 = 144 Bit = 18 Byte. Zusammen **9018 Byte**.
c) 72 000 ÷ 9018 ≈ 7,98, die Datei ist also **fast 8-mal kleiner** (fast das Verhältnis 24 Bit : 3 Bit, die kleine Farbtabelle fällt kaum ins Gewicht).

### A6

a) 3600 ÷ 300 = 12 Zoll, 2400 ÷ 300 = 8 Zoll, also **30,48 cm × 20,32 cm**.
b) 3600 ÷ 150 = 24 Zoll, 2400 ÷ 150 = 16 Zoll, also **60,96 cm × 40,64 cm**. Halbe Auflösung heisst doppelte Kantenlänge.
c) 15 cm = 5,906 Zoll, 5,906 · 300 ≈ **1772 Pixel**. 10 cm = 3,937 Zoll, 3,937 · 300 ≈ **1181 Pixel**. Das sind etwa 2,1 Megapixel. Das Foto (3600 × 2400) **reicht reichlich**.
d) 60 cm = 23,62 Zoll, 3600 ÷ 23,62 ≈ **152 dpi**. Das liegt unter den üblichen 200–600 dpi für Druck. Aus einigem Abstand (Poster an der Wand) ist es noch brauchbar, aus der Nähe sieht man die Pixel.
e) 120 cm = 47,24 Zoll, 3600 ÷ 47,24 ≈ **76 dpi**. Es sind zu wenig Pixel: Das Programm muss Pixel erfinden (interpolieren), das Bild wird unscharf oder verpixelt. Echte Bildinformation kommt nicht dazu.

### A7

a) Beim Speichern wird **Information in den Farben weggelassen**: Es wird nur ein ähnlicher Farbverlauf gespeichert, nicht die genauen Werte. Das Weggelassene ist **dauerhaft verloren** und lässt sich nicht zurückholen.
b) In Fotos ändern sich die Farben meist sanft. Ein ähnlicher Verlauf liegt deshalb sehr nah an den echten Werten, und das Auge sieht den kleinen Unterschied nicht. Dafür wird die Datei viel kleiner.
c) Bei jedem Speichern geht weitere Information verloren. Die Qualität nimmt ab (Blöcke, Farbränder).
d) **Foto → JPG:** Farbverläufe lassen sich gut zusammenfassen, die Datei wird klein. **Logo mit wenigen Farben → GIF:** Es braucht nur eine kleine Farbtabelle, die Farben und scharfen Kanten bleiben exakt. Als JPG entstünden unscharfe Ränder.

## 3 Dateiformate

### A8

a)

| Dateiname | Programm nach Endung | Wirklich ein … | Endung stimmt? |
|---|---|---|---|
| Urlaub.png | Bildbetrachter | PNG-Bild (`89 50 4E 47`) | ja |
| Zeugnis.pdf | PDF-Programm | ZIP-Archiv, z. B. ein Office-Dokument (`50 4B 03 04`) | nein |
| Notizen.txt | Texteditor | JPG-Bild (`FF D8 FF`) | nein |

b) **Schritt 1:** Das Betriebssystem schaut auf die **Endung** und startet das dazu passende Programm. **Schritt 2:** Das Programm prüft den **Header** (Magic Number) und sieht, was wirklich in der Datei steckt. Die Endung kann jeder umbenennen, der Header lässt sich nicht so leicht fälschen.

### A9

a) 16 Felder zu je 2 Bit:

```
00  01  00  00
00  10  10  10
01  00  00  00
00  00  01  10
```

```
·  o  ·  ·
·  X  X  X
o  ·  ·  ·
·  ·  o  X
```

b) Beschossen sind alle Felder ausser `00`: 3 Fehlschüsse und 4 Treffer, also **7 Schüsse**, davon **4 Treffer**.
c) 10 · 10 = 100 Felder, 100 · 2 = **200 Bit = 25 Byte**.
d) Man kann ein zweites Feld speichern, in dem jedes Feld **1 Bit** hat (`1` = Schiff, `0` = Wasser). Bei 4 × 4 sind das **16 Bit**. Zusammen mit dem Spielstand sind es 32 + 16 = 48 Bit.

### A10

**Format A** (Breite 4, Höhe 4, Farbtiefe 4 Bit): `0011 | 0010 | 0010 | 100010001111`
**Format B** (Farbtiefe 4, Breite 4, Höhe 4 Bit): `0011 | 0010 | 0010 | 100010001111`

a)

| | Breite | Höhe | Farbtiefe | Pixelbits passen? | Datei (Bit / Byte) |
|---|---|---|---|---|---|
| Format A | 3 | 2 | 2 Bit | 3 · 2 · 2 = 12, vorhanden 12: passt | 24 Bit = 3 Byte |
| Format B | 2 | 2 | 3 Bit | 2 · 2 · 3 = 12, vorhanden 12: passt | 24 Bit = 3 Byte |

Pixel nach Format A (je 2 Bit): `10 00 10 | 00 11 11`. Pixel nach Format B (je 3 Bit): `100 010 001 111`.
b)

```
Format A:      Format B:
🟩⬛🟩          🟥🟩
⬛🟦🟦          🟦⬜
```

c) Die Bits sind dieselben, aber das Format legt fest, **in welcher Reihenfolge** die Header-Angaben stehen und **wie die Pixelbits gedeutet werden** (2-Bit-Farbtabelle oder 3-Bit-RGB). Ohne die Beschreibung des Formats sind Bits bedeutungslos.

## 4 Algorithmen

### A11

a) Der Käfer fährt nach rechts bis zur Wand, dreht nach rechts (unten), fährt bis zur Wand, dreht wieder, fährt nach links, dreht und fährt nach oben, dreht und ist wieder auf **S**, blickt nach rechts. Er läuft im Kreis um den Wandblock und beginnt von vorn.

```
########
#→→→→→↓#
#↑####↓#
#↑←←←←←Z
########
```

Der Käfer **prüft nur das Feld vorne** und kann sich **nur nach rechts drehen**. Auf dem Feld unten rechts blickt er nach unten, vorne ist Wand, also dreht er nach rechts (nach links im Bild). Das Ziel Z liegt aber auf seiner **linken** Seite. Das Programm kann nie nach links abbiegen und merkt auch nicht, dass dort das Ziel ist. Er erreicht Z nie (Kara meldet: «Der Käfer läuft im Kreis»): Das Programm wird **nie fertig** (die Anforderung «endlich» ist verletzt).
b) Es gibt mindestens zwei Lösungen (beide Seiten der Wand folgen). Nicht gebraucht werden «rückwärts», «stehen bleiben» und «Feld hinten frei?».

**Lösung 1: Wand rechts behalten (Rechte-Hand-Regel):**

```
┌────────────────────────────────────────────────────────────┐
│ wiederhole bis Ziel                                        │
├──┬─────────────────────────────────────────────────────────┤
│  │                    Feld rechts frei?                    │
│  ├────────────────────────────┬────────────────────────────┤
│  │             Ja             │            Nein            │
│  ├────────────────────────────┼────────────────────────────┤
│  │ rechts drehen              │      Feld vorne frei?      │
│  ├────────────────────────────┼─────────────┬──────────────┤
│  │ vorwärts                   │      Ja     │     Nein     │
│  │                            ├─────────────┼──────────────┤
│  │                            │ vorwärts    │ links drehen │
└──┴────────────────────────────┴─────────────┴──────────────┘
```

Probe: Auf S blickt er nach rechts, rechts von ihm (unten) ist frei → rechts drehen, vorwärts. Auf dem Feld darunter blickt er nach unten: rechts (links im Bild) ist Wand, vorne frei → vorwärts. Auf dem untersten Feld links ist vorne Wand und rechts Wand → links drehen. Jetzt blickt er nach rechts, rechts ist Wand, vorne frei → vorwärts, bis er auf Z steht.

```
########
#S·····#
#↓####·#
#→→→→→→Z
########
```

(S: rechts drehen, dann vorwärts nach unten.)

**Lösung 2: Wand links behalten (Linke-Hand-Regel):** Die Rollen von links und rechts sind vertauscht.

```
┌────────────────────────────────────────────────────────────┐
│ wiederhole bis Ziel                                        │
├──┬─────────────────────────────────────────────────────────┤
│  │                     Feld links frei?                    │
│  ├────────────────────────────┬────────────────────────────┤
│  │             Ja             │            Nein            │
│  ├────────────────────────────┼────────────────────────────┤
│  │ links drehen               │      Feld vorne frei?      │
│  ├────────────────────────────┼─────────────┬──────────────┤
│  │ vorwärts                   │      Ja     │     Nein     │
│  │                            ├─────────────┼──────────────┤
│  │                            │ vorwärts    │ rechts drehen│
└──┴────────────────────────────┴─────────────┴──────────────┘
```

Probe: Der Käfer fährt oben nach rechts (links von ihm ist Wand, vorne frei). Am Ende der Zeile ist vorne Wand und links Wand → rechts drehen (nach unten). Er fährt nach unten. Auf dem untersten rechten Feld ist **links der Ausgang frei** → links drehen, vorwärts auf A.

```
########
#S→→→→↓#
#·####↓#
#·····→Z
########
```

**Nicht** richtig sind Lösungen, bei denen vorne vor rechts geprüft wird (er läuft wieder im Kreis), oder bei denen «rückwärts» oder «stehen bleiben» statt Drehen eingesetzt wird (er kommt nicht voran).

### A12

a) Schreibtischtest:

| Prüfung | zahl | summe | zahl > 0 | Ausgabe |
|---|---|---|---|---|
| 1. | 3846 | 0 | wahr | |
| 2. | 384 | 6 | wahr | |
| 3. | 38 | 10 | wahr | |
| 4. | 3 | 18 | wahr | |
| 5. | 0 | 21 | falsch | 21 |

b) Das Programm zählt alle **Ziffern** der Zahl zusammen (Quersumme): 3 + 8 + 4 + 6 = 21.
c) Bei `zahl = 0` ist die Bedingung sofort falsch, es gibt keinen Durchgang. Ausgegeben wird **0**. Das ist sinnvoll, denn die Quersumme von 0 ist 0 (Grenzfall).

### A13

a) Die Zahl ändert sich nie:

| Prüfung | zahl | zahl > 0 | Ausgabe |
|---|---|---|---|
| 1. | 10 | wahr | 10 |
| 2. | 10 | wahr | 10 |
| 3. | 10 | wahr | 10 |
| 4. | 10 | wahr | 10 |

Das Programm gibt endlos «10» aus und erreicht «Start!» nie.
b) **endlich** ist verletzt: Der Algorithmus kommt nie zu einem Ende, weil die Bedingung immer wahr bleibt.
c) In der Schleife muss die Zahl kleiner werden:

```
┌──────────────────────────────────────┐
│ zahl = 10                            │
├──────────────────────────────────────┤
│ solange zahl > 0                     │
├──┬───────────────────────────────────┤
│  │ print(zahl)                       │
│  ├───────────────────────────────────┤
│  │ zahl = zahl - 1                   │
├──┴───────────────────────────────────┤
│ print("Start!")                      │
└──────────────────────────────────────┘
```

d) Bei `zahl = 0` ist die Bedingung sofort falsch, es wird nur «Start!» ausgegeben. Das ist sinnvoll: Es gibt nichts herunterzuzählen.

---

# Teil B: Erweiterte Aufgabensammlung

## B1 Farben und Farbtiefe

**B1.1** Bildschirm: RGB, additiv (Licht). Tintenstrahldrucker: CMYK, subtraktiv. Beamer: RGB, additiv (er strahlt Licht aus). Zeitungsdruck: CMYK, subtraktiv.

**B1.2** Die hellere Farbe ist: (a) `#E0E0E0`, (b) `#0000FF`, (c) `#FF0000`, (d) `#00FF00`. Regel: Bei gleicher Farbe ist die mit den **grösseren Kanalwerten heller**, die mit den kleineren dunkler.

**B1.3** a) Zum Beispiel `808080` (128, 128, 128). b) Alle drei Kanäle **erhöhen** macht heller (z. B. `C0C0C0`), alle drei **senken** macht dunkler (z. B. `404040`). c) Ein Hexcode ist ein Grau, wenn **alle drei Kanäle gleich** sind (R = G = B).

**B1.4** a) `FF0000`, Rot. b) `404040`, dunkles Grau. c) `C0C0C0`, helles Grau. d) `000080`, Blau zur Hälfte aufgedreht, also dunkles Blau.
Rechnung: 64 = `40`, 128 = `80`, 192 = `C0`, 255 = `FF`.

**B1.5** a) 1 Bit. b) 3 Bit (2² = 4 genügt nicht, 2³ = 8). c) 7 Bit (2⁶ = 64 zu wenig, 2⁷ = 128). d) 8 Bit.

**B1.6** 800 · 600 · 3 Byte = **1 440 000 Byte = 1,44 MB**. Bei 8 Bit (1 Byte pro Pixel): 480 000 Byte = **0,48 MB**.

**B1.7** Mit 1 Byte pro Pixel wird die Datei **dreimal kleiner**, also 0,48 MB statt 1,44 MB. Verloren geht die Farbinformation: Es sind nur noch Grautöne möglich, Rot, Grün und Blau lassen sich nicht mehr unterscheiden.

**B1.8** Nein, sie wirken **nicht gleich hell**. Die Reihenfolge von hell nach dunkel lautet **Grün, Rot, Blau**: Das Auge ist für Grün am empfindlichsten und für Blau am wenigsten. Nach der Definition der relativen Helligkeit (WCAG) zählt Grün mit dem Gewicht 0,7152, Rot mit 0,2126 und Blau mit 0,0722 (gerechnet mit linearisierten Werten). Quelle: [WCAG, relative luminance](https://www.w3.org/TR/WCAG2/relative-luminance.html)

## B2 Grafikformate

**B2.1** Foto: Raster (fotografische Farbverläufe). Firmenlogo: Vektor (muss beliebig skalierbar sein). Stadtplan: meist Vektor (Linien, Flächen, Beschriftung). Röntgenbild: Raster (Helligkeit pro Bildpunkt). Piktogramm: Vektor (einfache Formen).

**B2.2** Weisser Hintergrund, ein blaues Kreuz: waagrechter Balken von y = 80 bis 120 über die ganze Breite, senkrechter Balken von x = 80 bis 120 über die ganze Höhe. Es ist die **Flagge Finnlands**.

**B2.3** Erste Zeile: `fill="#FF0000"` (roter Grund). Zweite und dritte Zeile: `fill="#FFFFFF"` (weisses Kreuz). Das Kreuz sitzt auch bei Dänemark nach links verschoben, die Koordinaten können (vereinfacht) gleich bleiben.

**B2.4** 5 cm = 1,969 Zoll, 1000 ÷ 1,969 ≈ **508 dpi**. Das ist mehr als die nötigen 300 dpi, es genügt also reichlich. Bei genau 300 dpi: 1000 ÷ 300 = 3,33 Zoll ≈ **8,47 cm**.

**B2.5** 50 cm = 19,69 Zoll, also etwa 19,69 · 300 ≈ **5906 Pixel**. 70 cm = 27,56 Zoll, also etwa **8268 Pixel**. Das sind rund 5906 · 8268 ≈ **48,8 Megapixel**.

**B2.6** a) JPG (Foto, Farbverläufe, kleine Datei). b) SVG (Vektor, beliebig skalierbar, scharf auf Karte und Plakat). c) PNG (verlustfrei, scharfe Kanten, Text bleibt lesbar). d) GIF (kann Animationen).

**B2.7** Bei einer Rastergrafik werden fehlende Pixel **erfunden** (interpoliert), das Bild wird unscharf oder verpixelt. Bei einer Vektorgrafik werden nur die Parameter (z. B. Koordinaten) mit dem Vergrösserungsfaktor multipliziert, das Bild bleibt scharf. Die **Vektordatei bleibt gleich gross**. Speichert man ein Rasterbild wirklich vergrössert, wächst die Datei mit der Pixelzahl (Faktor 2 bei der Kantenlänge heisst Faktor 4 bei der Datei), ohne dass neue Bildinformation entsteht.

**B2.8** Die Qualität **nimmt mit jedem Speichern ab** (Generationsverlust), es entstehen Blöcke und Farbränder. Das liegt daran, dass JPG **verlustbehaftet** komprimiert: Bei jedem Speichern geht Information verloren, die nicht zurückkommt.

**B2.9** a) Ohne Blöcke: 100 Bit. Mit Blöcken: 5 Blöcke · (7 + 1) Bit = **40 Bit**, also 2,5-mal weniger. b) Bei jedem Pixel ein Farbwechsel gibt 100 Blöcke · 8 Bit = **800 Bit**, das ist **8-mal mehr** als ohne Blöcke. Blockcodierung lohnt sich nur bei langen gleichfarbigen Abschnitten.

**B2.10** a) 640 · 480 = 307 200 Pixel, mal 3 Byte = **921 600 Byte**. b) 200 Farben: 2⁷ = 128 sind zu wenig, 2⁸ = 256 → 8 Bit = 1 Byte pro Pixel, also 307 200 Byte. Dazu die Farbtabelle: 200 · 3 Byte = 600 Byte. Zusammen **307 800 Byte**. c) 921 600 ÷ 307 800 ≈ 2,99, also **etwa dreimal kleiner**. d) Mit 8 Bit höchstens 2⁸ = **256 Farben**.

## B3 Dateiformate

**B3.1** Mögliche Bedeutungen von `61 62 63`:
- Textdatei (ASCII): die Zeichen `abc`.
- Bilddatei (24 Bit): ein einzelner Pixel mit RGB (97, 98, 99), ein dunkles Grau.
- Tabelle: die Zahl 6 382 179 in einer Zelle (0x616263).

**B3.2** Bit 1 = `1`: **Kreuz** ist am Zug. Dann `11 10 00 | 00 11 00 | 00 00 10`.

```
❌ ⭕ ⬜
⬜ ❌ ⬜
⬜ ⬜ ⭕
```

Zwei Kreuze und zwei Kreise: Kreuz hat begonnen, also ist Kreuz wieder dran.

**B3.3** Kreuz hat begonnen, beide haben 2 Zeichen: Kreuz ist am Zug, also `1`. Kreis = `10`, Kreuz = `11`, leer = `00`.

`1 | 10 11 00 | 00 10 00 | 11 00 00` = **`1101100001000110000`** (19 Bit)

**B3.4** 3000 · 2000 · 3 Byte = 18 000 000 Byte. Mit Header: **18 000 016 Byte ≈ 18,0 MB**. Der Header macht 16 Byte aus, das sind rund **0,00009 %** der Datei, also kaum etwas.

**B3.5** Die Folge `00100100000100000000000011` wird so zerlegt:

| Teil | Bits | Bedeutung |
|---|---|---|
| Zug | `0` | **Blau** ist am Zug |
| Spalte 1 | `010` `01` | 2 Steine: unten Blau, darüber Rot |
| Spalte 2 | `000` | leer |
| Spalte 3 | `001` `0` | 1 Stein: Blau |
| Spalte 4 | `000` | leer |
| Spalte 5 | `000` | leer |
| Spalte 6 | `000` | leer |
| Spalte 7 | `001` `1` | 1 Stein: Rot |

a) Spielstand (unten beginnend, Spalten 1 bis 7):

```
. . . . . . .
. . . . . . .
. . . . . . .
. . . . . . .
R . . . . . .
B . B . . . R
```

b) Bits = 1 + 7 · 3 + Anzahl Steine. Bei 9 Steinen: 1 + 21 + 9 = **31 Bit**. Bei vollem Brett (42 Steine): 1 + 21 + 42 = **64 Bit**.
c) Blau hat 2 Steine, Rot hat 2: Beide haben gleich viele, also ist der Spieler an der Reihe, der angefangen hat. Hier **Blau**. Das stimmt mit Bit 1 überein.

**B3.6** Musterlösung:
- **Format:** Bit 1: wer ist am Zug (0 = weiss, 1 = schwarz). Danach die 32 dunklen Felder in Leserichtung (oben links bis unten rechts), je Feld 3 Bit: `000` leer, `001` weisser Stein, `010` schwarzer Stein, `011` weisse Dame, `100` schwarze Dame.
- **Bits:** 5 Zustände brauchen 3 Bit (2² = 4 genügt nicht, 2³ = 8). Zusammen 1 + 32 · 3 = **97 Bit**. Jede Stellung hat so genau eine Bitfolge (vollständig), und jede Bitfolge ergibt höchstens eine Stellung (eindeutig). Die Brettgrösse und die Regeln müssen nicht gespeichert werden.
- **Beispiel:** Anfangsstellung, weiss beginnt: `0`, dann 12 · `010` (die obersten 12 Felder, schwarze Steine), 8 · `000` (die mittleren 8 Felder leer), 12 · `001` (die untersten 12 Felder, weisse Steine).
- **Zum Vergleichen:** Jedes andere Format ist dann besser, wenn es weniger als 97 Bit braucht und trotzdem eindeutig und vollständig bleibt.

## B4 Algorithmen

**B4.1** a) **eindeutig** (was ist «gut»?). b) **endlich** (kein Ende). c) **ausführbar** (die dritte Schraube gibt es nicht). d) **allgemein** (er löst nur einen Einzelfall).

**B4.2** a) Der Käfer fährt 2 Felder nach Osten, dreht links (Norden), fährt 2 Felder, dreht links (Westen) und fährt 2 Felder. (E = Endfeld, S = Start)

```
E ← ←
· · ↑
S → ↑
```

b) Er blickt am Schluss nach **Süden** (nach der dritten Linksdrehung). Er hat **7 verschiedene Felder** besucht (Start und Endfeld eingeschlossen). Das Endfeld liegt 2 Felder oberhalb des Startfelds.
c) Mit «4-mal» kommt der Käfer wieder auf dem **Startfeld** an und blickt wieder nach Osten: Er hat ein Quadrat gefahren (8 Randfelder eines 3 × 3-Feldes).

**B4.3** a) **5**: Eine Stufe bringt den Käfer 1 Feld nach rechts und 1 Feld nach unten.

```
┌──────────────────────────────────┐
│ wiederhole 5-mal                 │
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

b) **5 Bausteine**: 1 Wiederholung und 4 Anweisungen (je nach Zählweise 5).
c) Nur die Zahl ändert sich: «wiederhole 8-mal». Der Aufbau bleibt gleich.
d) Erst 4 Stufen (4 rechts, 4 unten), dann zeigt der Käfer nach Osten und muss noch 2 Felder nach unten. Er dreht nach rechts (Süden) und fährt 2 Felder:

```
┌──────────────────────────────────┐
│ wiederhole 4-mal                 │
├──┬───────────────────────────────┤
│  │ vorwärts                      │
│  ├───────────────────────────────┤
│  │ rechts drehen                 │
│  ├───────────────────────────────┤
│  │ vorwärts                      │
│  ├───────────────────────────────┤
│  │ links drehen                  │
├──┴───────────────────────────────┤
│ rechts drehen                    │
├──────────────────────────────────┤
│ wiederhole 2-mal                 │
├──┬───────────────────────────────┤
│  │ vorwärts                      │
└──┴───────────────────────────────┘
```

**B4.4** Schreibtischtest:

| zahl | zahl > max | max |
|---|---|---|
| (Start) | | 7 |
| 7 | falsch | 7 |
| 3 | falsch | 7 |
| 9 | wahr | 9 |
| 4 | falsch | 9 |

Ausgabe: **9**. Mit `max = 0` und lauter negativen Zahlen bleibt `max` bei 0. Das Programm gibt 0 aus, obwohl 0 nicht in der Liste steht: Es ist **nicht korrekt**. Der Start mit dem ersten Listenelement vermeidet das.

**B4.5** a)

| gewicht | 5 | 20 | 21 | 100 | 101 |
|---|---|---|---|---|---|
| preis | 1 | 1 | 2 | 2 | 5 |

b) Grenzfälle sind die Gewichte an den Grenzen: **20 und 21**, **100 und 101** (jeweils auf und knapp über der Grenze).
c) Der Fall **20 g**: Erwartet wird 1 Fr., das fehlerhafte Programm gibt 2 Fr. aus, weil `20 < 20` falsch ist.
d) Ergänztes Struktogramm:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        gewicht <= 20                                         │
├──────────────────────────────────────────────┬───────────────────────────────────────────────┤
│                      Ja                      │                      Nein                     │
├──────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ preis = 1                                    │                 gewicht <= 100                │
│                                              ├───────────────────────┬───────────────────────┤
│                                              │           Ja          │          Nein         │
│                                              ├───────────────────────┼───────────────────────┤
│                                              │ preis = 2             │     gewicht <= 500    │
│                                              │                       ├───────────┬───────────┤
│                                              │                       │     Ja    │    Nein   │
│                                              │                       ├───────────┼───────────┤
│                                              │                       │ preis = 5 │ preis = 9 │
├──────────────────────────────────────────────┴───────────────────────┴───────────┴───────────┤
│ print(preis)                                                                                 │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**B4.6** a) Der Käfer fährt Bahn um Bahn: 3 Felder vorwärts, am Rand wenden (rechts, vorwärts, rechts), 3 Felder zurück, am anderen Rand wenden (links, vorwärts, links), 3 Felder vorwärts. Er mäht so jedes Feld.
b) Struktogramm:

```
┌────────────────────────────────┐
│ wiederhole 3-mal               │
├──┬─────────────────────────────┤
│  │ vorwärts                    │
├──┴─────────────────────────────┤
│ rechts drehen                  │
├────────────────────────────────┤
│ vorwärts                       │
├────────────────────────────────┤
│ rechts drehen                  │
├────────────────────────────────┤
│ wiederhole 3-mal               │
├──┬─────────────────────────────┤
│  │ vorwärts                    │
├──┴─────────────────────────────┤
│ links drehen                   │
├────────────────────────────────┤
│ vorwärts                       │
├────────────────────────────────┤
│ links drehen                   │
├────────────────────────────────┤
│ wiederhole 3-mal               │
├──┬─────────────────────────────┤
│  │ vorwärts                    │
└──┴─────────────────────────────┘
```

Es wiederholt sich das Stück **Bahn + Wende** (die Wenden wechseln zwischen rechts und links).
c) Bei 6 Bahnen gibt es 6 Bahnen und 5 Wenden. Das Struktogramm lautet:

```
┌──────────────────────────────────┐
│ wiederhole 2-mal                 │
├──┬───────────────────────────────┤
│  │ Bahn: 3-mal vorwärts          │
│  ├───────────────────────────────┤
│  │ rechts drehen                 │
│  ├───────────────────────────────┤
│  │ vorwärts                      │
│  ├───────────────────────────────┤
│  │ rechts drehen                 │
│  ├───────────────────────────────┤
│  │ Bahn: 3-mal vorwärts          │
│  ├───────────────────────────────┤
│  │ links drehen                  │
│  ├───────────────────────────────┤
│  │ vorwärts                      │
│  ├───────────────────────────────┤
│  │ links drehen                  │
├──┴───────────────────────────────┤
│ Bahn: 3-mal vorwärts             │
├──────────────────────────────────┤
│ rechts drehen                    │
├──────────────────────────────────┤
│ vorwärts                         │
├──────────────────────────────────┤
│ rechts drehen                    │
├──────────────────────────────────┤
│ Bahn: 3-mal vorwärts             │
└──────────────────────────────────┘
```

Der Aufbau bleibt gleich, nur die Anzahl der Wiederholungen ändert sich.

**B4.7** a) Schreibtischtest für `n = 100`:

| Prüfung | n | k | n > 1 | Ausgabe |
|---|---|---|---|---|
| 1. | 100 | 0 | wahr | |
| 2. | 50 | 1 | wahr | |
| 3. | 25 | 2 | wahr | |
| 4. | 12 | 3 | wahr | |
| 5. | 6 | 4 | wahr | |
| 6. | 3 | 5 | wahr | |
| 7. | 1 | 6 | falsch | 6 |

b) Das Programm zählt, **wie oft man n halbieren kann**, bis 1 erreicht ist (jeweils abgerundet). Es berechnet den ganzzahligen Zweierlogarithmus, denn 2⁶ = 64 ≤ 100 < 128 = 2⁷.
c) `n = 37`: 37 → 18 → 9 → 4 → 2 → 1, das sind **5** Halbierungen. `n = 1`: Die Bedingung ist von Anfang an falsch, es wird **0** ausgegeben.
d) In jedem Durchgang wird `n` mindestens halbiert (ganzzahlig) und damit kleiner. Irgendwann ist `n = 1` und die Bedingung `n > 1` falsch: Die Wiederholung ist **endlich**.

**B4.8** a) Der Käfer blickt zuerst nach rechts. Rechts von ihm ist das Feld frei, also biegt er sofort nach unten ab:

```
#######
#S....#
#↓###.#
#→→↓#.#
###↓#Z#
###→→↑#
#######
```

Der Käfer geht von S zwei Felder nach unten, dann zwei Felder nach rechts, zwei Felder nach unten, zwei Felder nach rechts und zuletzt ein Feld nach oben zum Ziel Z. Der Befehlsablauf lautet: `R V V L V V R V V L V V L V` (R = rechts drehen, L = links drehen, V = vorwärts).
b) Der Käfer macht **9 Schritte vorwärts**.
c) Der Käfer **biegt immer nach rechts ab, wenn rechts frei ist**. Sonst geht er geradeaus, und wenn vorne zu ist, dreht er nach links (Rechte-Hand-Regel).
d) Die Regel führt den Käfer an der Wand entlang. Steht das Ziel **in der Mitte eines offenen Raums**, wo keine Wand angrenzt, fährt er nur dem Rand entlang und erreicht es nie. Beispiel:

```
#######
#S....#
#.....#
#..Z..#
#.....#
#.....#
#######
```

**B4.9** a) Struktogramm:

```
┌──────────────────────────────────────────┐
│ summe = 0                                │
├──────────────────────────────────────────┤
│ i = 1                                    │
├──────────────────────────────────────────┤
│ solange i <= n                           │
├──┬───────────────────────────────────────┤
│  │               i % 2 == 0              │
│  ├───────────────────┬───────────────────┤
│  │         Ja        │        Nein       │
│  ├───────────────────┼───────────────────┤
│  │ summe = summe + i │                   │
│  ├───────────────────┴───────────────────┤
│  │ i = i + 1                             │
├──┴───────────────────────────────────────┤
│ print(summe)                             │
└──────────────────────────────────────────┘
```

b) Schreibtischtests: `n = 7`: gerade Zahlen 2, 4, 6, Summe **12**. `n = 10`: 2 + 4 + 6 + 8 + 10 = **30**. `n = 1`: keine gerade Zahl, Ausgabe **0**.
c) Sonderfälle: `n = 1` (keine gerade Zahl), `n = 2` (genau eine), `n = 0` (leere Summe, Ausgabe 0) und ein ungerades `n` gegen ein gerades `n` am Ende der Zahlenreihe.

**B4.10** Musterlösung:
- **Zerlegen:** Teller, Besteck, Glas, Serviette pro Gast.
- **Muster erkennen:** Für jeden Gast sind die Handlungen gleich.
- **Abstrahieren:** Gast = ein Platz am Tisch. Farbe der Servietten oder Form der Teller sind unwichtig.
- **Algorithmus:**

```
┌──────────────────────────────────────────┐
│ wiederhole n-mal                         │
├──┬───────────────────────────────────────┤
│  │ Teller hinstellen                     │
│  ├───────────────────────────────────────┤
│  │ Besteck links und rechts legen        │
│  ├───────────────────────────────────────┤
│  │ Glas rechts oben stellen              │
└──┴───────────────────────────────────────┘
```

- **Sonderfälle:** n = 0: nichts passiert (korrekt). n = 1: ein Gedeck (korrekt). Der Algorithmus ist endlich, eindeutig, allgemein, ausführbar und korrekt.
