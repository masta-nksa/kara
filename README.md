# Kara – Käfer programmieren

Den Käfer mit Struktogramm-Bausteinen programmieren: kurze Aufgaben auf freiem Feld,
Algorithmen und Computational Thinking, dann Labyrinthe, Inseln und eigene Challenges.
Reines HTML/CSS/JS ohne Build-Schritt und ohne Bibliotheken. Fortschritt, Programme und Challenges bleiben im Browser; gesendet werden
nur anonyme Seitenaufrufe an GoatCounter (siehe «Nutzungsstatistik»).

**Live:** <https://masta-nksa.github.io/kara/>

Hervorgegangen aus dem Struktogramm-Baukasten in
[masta-nksa/checks](https://github.com/masta-nksa/checks) (Verlauf übernommen).

## Aufbau

```
index.html                Cockpit: Übersicht der Reihen mit Fortschritt
assets/                   basis.css (Farben Hell/Dunkel, Schrift), cockpit.css/.js, favicon.svg,
                          blume.js (Fortschritt je Abschnitt als Blume),
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
«Link zum Teilen kopieren» bei jeder Aufgabe liefert genau diesen Link; bei eigenen Challenges
den Link mit der ganzen Challenge (siehe unten).
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

Der Baukasten zeigt oben einen schmalen Lernpfad wie im Turtle-Kurs: Titel und Stand der Reihe,
darunter die Aufgaben als Stationen auf einer Linie (✓ gelöst, Ring = aktuelle Aufgabe,
★ Zusatzaufgabe etwas erhöht und gestrichelt; Titel beim Darüberfahren). Auf dem Handy lassen sich
die Stationen waagrecht wischen. Die Aufgabenkarte nennt den Ort («Reihe · Abschnitt · 2 von 10»);
weiter geht es über die Stationen oder nach dem Lösen mit «Nächste Aufgabe». Andere Reihen sind im
Baukasten bewusst nicht verlinkt: Jede Reihe steht für sich und wird über die Übersicht geöffnet.

Mit `abschnitte` (Liste von `{id, titel, text}`, optional `etikett` wie «Anforderung: allgemein»;
Standard «Denkfigur: …») gliedern sich die Stationen in Abschnitte; `abschnitteTitel` ist der Titel
der aufklappbaren Erklärungen (offen, solange in der Reihe noch nichts gelöst ist), `kastenTitel`
der Vorsatz des Strategie-Tipps (Standard «So hilft «…»:»). Je Abschnitt zeigt eine kleine Blume
den Fortschritt: Aufgabe gelöst, Vorher-Frage und Reflexion richtig beantwortet öffnen je ein
Blatt; Zusatzaufgaben geben kleinere, gestrichelte Blätter; sind alle Pflichtblätter offen, füllt
sich die Mitte. Mit `denkfiguren` (gleiches Format) und `denkfigurenTitel` zeigt der Pfad statt
dessen eine Blume je Denkfigur, und die Erklärungen gelten den Denkfiguren. Ein Blatt öffnet sich,
wenn eine Aufgabe, in der diese Denkfigur entscheidend war, gelöst und reflektiert ist. Die
Denkfiguren sind anfangs verborgen («?»): Name und Erklärung erscheinen erst, wenn zwei solche
Aufgaben gelöst und reflektiert sind (`FREISCHALTEN` in app.js); vorher nennt die Rückmeldung nach
der Reflexion nur die Begründung. Das Cockpit zeigt dieselben Blumen, verborgene ohne Namen.

## Aufgaben (`baukasten/aufgaben/*.json`)

- Jede Aufgabe: Feld, Palette, Bausteinlimit, Ziel. **Keine Lösungen.**
- Feld entweder mit `cols`, `rows`, `start`, `blick`, `hindernisse` oder als Zeichenkarte
  (`feld.karte`, oberste Zeile zuerst: `#` Mauer, `.` Weg, `S` Start, `Z` Ziel).
- Palette: `befehle` (`vor`, `rechts`, `links`, dazu für den Zähler `zaehlerPlus`,
  `zaehlerMinus`, `zaehlerNull`), `wiederholung` (n-mal), `bis: true` («wiederhole bis Ziel»),
  `solange` mit einer Liste von Bedingungen («wiederhole solange Feld vorne frei», je Bedingung ein
  Baustein), `verzweigung` mit `bedingungen` (`frei`, `freiLinks`, `freiRechts`, `zaehlerIstNull`,
  `zaehlerNichtNull`), `sonst: false` blendet den Sonst-Zweig aus.
- «wiederhole solange …» prüft die Bedingung vor jedem Durchlauf. Steht der Käfer zu Beginn eines
  Durchlaufs wieder gleich da (Ort, Blick, Zähler) und gilt die Bedingung noch, endet die Schleife
  nie: Der Lauf bricht mit «Die Wiederholung endet nie» ab.
- Zähler: eine ganze Zahl, beim Start 0. Sobald eine Aufgabe Zähler-Bausteine anbietet, zeigt
  das Käfer-Feld den aktuellen Wert an.
- `maxTiefe` (Standard 3): wie viele Ebenen Wiederholungen und Verzweigungen ineinander
  stecken dürfen.
- Mehrere Labyrinthe pro Aufgabe: `layouts` (sichtbar) und `verdeckt` (je `{karte, blick}`),
  dazu optional `zufall: {anzahl, raeume}` für zufällig erzeugte, inselfreie Labyrinthe
  (Kartengrösse 2·raeume+1, Ein- und Ausgang als Lücken im Rahmen). Mit `inseln: k` öffnet der
  Generator zusätzlich k Wände, so entstehen Inseln; der Start liegt dann im Inneren. Dasselbe ohne
  Inseln mit `startInnen: true` (nutzen Level 11 und der Editor). Gelöst ist die Aufgabe
  erst, wenn der Käfer in allen den Ausgang findet. Gescheiterte verdeckte und zufällige
  Labyrinthe werden danach als Reiter sichtbar. «Alle prüfen» prüft ohne Animation.
- Für Reihen mit Abschnitten: `abschnitt` (id des Abschnitts; Etikett über der Aufgabe),
  `zusatz: true` (★, gestrichelt, zählt nicht als Pflicht; «Nächste Aufgabe» überspringt sie),
  `denkfigur` (Strategie-Tipp: erscheint als erster Hinweis, nicht offen in der Aufgabe),
  `strategie` (Frage «Vorher: Wie gehen Sie vor?», gleich bei der Aufgabe) und `frage`
  («Nachher: Reflexion», erscheint erst nach dem Lösen unter der Erfolgsmeldung; «Nächste
  Aufgabe» geht erst nach richtiger Antwort weiter, sonst kommt ein Hinweis; die
  Antwort nennt, was die Lösung gezeigt hat, z. B. das gefundene Muster). In Reihen mit
  `denkfiguren` dazu `denkfiguren: [{id, warum}]`: Nach der Reflexion erscheint, welche
  Denkfiguren entscheidend waren und weshalb. Beide Fragen: `{text, antworten: [...],
  richtig, erklaerung}`. `richtig` ist ein Schlüssel aus `frageSchluessel(id, Nummer)` bzw.
  `frageSchluessel(id + "/strategie", Nummer)` (engine.js), keine Klartext-Antwort.
- `code`: Programmtext, der unter dem Aufgabentext mit Zeilen und Einrückung erscheint (z. B.
  «Vom Code zum Struktogramm»).
- Unter dem Struktogramm zeigt «Als Code anzeigen» dasselbe Programm als Python-ähnlichen Code
  (`alsCode` in engine.js): Prosa, Diagramm und Code als drei Beschreibungen desselben Algorithmus.
- `hinweise`: Liste von Tipps, die nacheinander auf Klick erscheinen (statt `hinweis`).
- `kleinsteLoesung`: Anzahl Bausteine der kleinsten bekannten Lösung; erscheint erst nach dem
  Lösen. Die Bausteinlimits lassen bewusst auch weniger kompakte Lösungen zu.
- Ziel `{"typ": "alleWege"}`: Der Käfer muss jedes Feld ohne Mauer befahren (Rasenmäher). Gilt
  auch für `layouts` und `verdeckt`; die Karten brauchen dann kein `Z`. Das Feld zeigt dann Rasen:
  hohes Gras wiegt sich leicht (nicht bei «Bewegung reduzieren»), befahrene Felder werden kurz
  gemäht; «Zurücksetzen» lässt das Gras wieder wachsen. Der Rasen liegt unter dem Nebel.
- `felderWort`: Wie die Felder einer Aufgabe mit mehreren Karten heissen, als Einzahl, Mehrzahl
  und Mehrzahl im Dativ, z. B. `["Garten", "Gärten", "Gärten"]` («Der Käfer schafft 2 von 3
  Gärten»). Ohne Angabe: Labyrinth.
- «wiederhole bis Ziel» erkennt, wenn der Käfer im Kreis läuft (gleicher Ort, gleiche
  Blickrichtung zu Beginn eines Durchlaufs), und bricht dann sofort ab.
- Nebel (Schalter direkt unter «Käfer-Feld»): Ist er eingeschaltet, sind nur der Käfer, seine vier
  Nachbarfelder und das Ziel sichtbar, auch schon vor dem Start. Was der Käfer seit dem Start
  gesehen hat, bleibt aufgedeckt (leicht abgedunkelt). Erreicht er das Ziel, verschwindet der
  Nebel; «Zurücksetzen» deckt wieder alles zu. Standard je Aufgabe mit
  `nebel: true` (Level 11, «Zwei Inseln», «Jedes Labyrinth mit Inseln», Abschluss), sonst aus;
  die eigene Wahl merkt sich der Browser je Aufgabe.
- Grosse Karten (mehr als 13 Felder breit oder hoch): Vor dem Start zeigt das Feld die ganze
  Karte, während des Ablaufs einen Ausschnitt von 11 × 11 Feldern, der dem Käfer folgt.
- Tempo hat sieben Stufen; ab «blitzschnell» kosten nur Bewegungen Zeit.
- Der Generator kann rechteckige Labyrinthe: `raeume` als `[Breite, Höhe]`, z. B. `[12, 7]`
  ergibt 25 × 15.
- Die Prüfung vergleicht das **Ergebnis** (Endfeld, besuchte Felder, Bausteinlimit), nie ein
  Muster. Lösungen und Tests gehören nicht in dieses Repo.

In allen Labyrinthen liegt der Start im Inneren und der Ausgang (`Z`) als einzige Lücke im
sonst geschlossenen Rand: Es geht darum, aus dem Labyrinth herauszufinden, ein Eingang am Rand
wäre ein leicht zu findender Ausgang. Die Labyrinth-Karten und Bausteinlimits der Levels 1 bis 8
und 10 stammen aus [Blockly Games](https://github.com/google/blockly-games) (Maze,
Apache-Lizenz 2.0), angepasst: In den Levels 1 bis 5 und 8 ist der Gang verschoben oder bis an
den Rand verlängert; in «Spirale» (6) und «Abzweigungen» (7) ist der Weg umgedreht und
gespiegelt (Start beim früheren Ziel, gleiche Bedingung und kleinste Lösung wie im Original).
Level 9 («Kreuzungen») und 11 («Jedes Labyrinth») sind eigene,
inselfreie Labyrinthe: Dort führt die Linke-Hand-Regel auch vom Start im Inneren immer zum Ausgang. Level 10 heisst bewusst
«Mehr Kreuzungen» und verrät die Strategie nicht im Aufgabentext, sondern erst im Hinweis
(«Folgen Sie der linken Wand …»); den Begriff «Wandfolger» nennt erst «Die Insel».

Die Reihe «Inseln und Pledge» (`aufgaben/inseln.json`) hat eigene Labyrinthe mit Inseln:
«Die Insel» (die linke Hand läuft im Kreis, die rechte findet hinaus), «Zwei Inseln» (beide
Hände scheitern; kein Programm mit bis zu 6 Bausteinen löst es) und «Jedes Labyrinth mit
Inseln» (Pledge-Algorithmus; in den gezeigten und verdeckten Labyrinthen scheitern die
Handregeln jeweils mindestens einmal, dazu zehn Zufallslabyrinthe mit Inseln).

Die Reihen «Algorithmen» (`aufgaben/algorithmen.json`) und «Computational Thinking»
(`aufgaben/ct.json`) begleiten zwei Papier-Dossiers: Zuerst wird eine Lektion lang auf Papier
gearbeitet, in der nächsten Lektion folgen dieselben Felder in Kara. Die Aufgabentexte in Kara
verweisen nicht aufs Dossier: Beides lässt sich unabhängig voneinander lösen. «Algorithmen» ist in die
Bausteine und die fünf Anforderungen gegliedert (`abschnitte`): Beschreiben (Zum Ziel, Das Quadrat,
Hindernisse umgehen, Bis zur Wand, ★ Die Treppe, ★ Vom Code zum Struktogramm; die ersten sind
Kopien der Grundlagen mit eigenen IDs `alg-…`, die Reihe «Käfer-Grundlagen» bleibt unverändert,
weil sie auch in einem anderen Fach genutzt wird), ausführbar («Nur rechts», ★ Nur links),
eindeutig («Biege ab», «Bei der Kreuzung»: eine vage Wegbeschreibung passt auf vier Wege),
allgemein («Drei Räume», ★ Vorne rechts mit wechselnder Blickrichtung, ★ Treppen jeder Grösse),
endlich («Hört nie auf», ★ Gleich weit) und korrekt («Den Fehler finden», «Räume, die Sie nicht
sehen» mit verdeckten Sonderfällen, ★ Räume mit Säulen).

«Computational Thinking» macht den Käfer zum Rasenmäher (Ziel `alleWege`). Die Aufgaben steigen
an: einfach (kleiner Rasen, zwei gleiche Rasenstücke, um den Teich), mittel (Bahn und Wende mit
4 Bahnen und Tor, sodass «Bahn, Wende rechts, Bahn, Wende links» ohne Rest aufgeht, drei Gärten,
Mähen im Nebel, ★ Teiche jeder Grösse) und anspruchsvoll (unbekannte Gärten mit Sonderfällen,
★ krumme Gärten, ★ irgendwo im Garten). Die Denkfiguren (zerlegen, Muster erkennen,
abstrahieren, Algorithmus entwerfen) kommen in vielen Aufgaben vor; welche entscheidend waren,
zeigt sich erst nach dem Lösen und der Reflexion.

In beiden Reihen nennt jede Aufgabe ihren Abschnitt bzw. ihre Stufe, fragt vorher nach der passenden Strategie
und nach dem Lösen in einer Reflexionsfrage, was das Programm gezeigt hat. Die Strategie selbst
steht nur als Tipp im Hinweis. Die Zusatzaufgaben werden immer offener: zuletzt alle Bausteine, kein
Limit, kein Tipp.

## Abschluss und eigene Challenges

Die letzte Reihe («Abschluss und eigene Challenges», `lokal: true` in `reihen.json`) enthält das
Abschluss-Level (`aufgaben/abschluss.json`: 21 × 21 und 25 × 15, mit und ohne Inseln, Start immer im Inneren, alle Bausteine) und
danach die Challenges, die in diesem Browser gespeichert sind.

**Editor** (`editor/`): Raster bearbeiten (Mauer/Weg auch durch Ziehen, Start mit Blickrichtung,
Ziel), Grösse 7 bis 21, Zufallslabyrinthe mit und ohne Inseln, bis zu 12 Labyrinthe
pro Challenge, einzelne als «verdeckt» markieren, Titel, Beschreibung, Bausteinlimit. Der Rand
bleibt Mauer, der Start liegt immer im Inneren. Das Ziel ist meist ein Ausgang am Rand (Lücke
in der Mauer), darf aber auch im Inneren liegen; dann hilft die Handregel unter Umständen nicht.
Die Spielbarkeit (Start innen, Rand geschlossen, Weg zum Ziel) wird laufend geprüft
(`karteGrund(karte, true)`). Der Entwurf bleibt
im Browser. Bedienung auch per Tastatur (Pfeiltasten, Eingabetaste).

**Teilen ohne Server**: «Link kopieren» erzeugt `baukasten/?reihe=eigene#challenge=<Base64>`.
Wer den Link öffnet, wird gefragt, ob die Challenge in den eigenen Browser übernommen werden
soll; danach verschwindet der `#`-Teil aus der Adresszeile. Derselbe Link zweimal ergibt kein
Duplikat (Kennung aus dem Inhalt). Eingelesene Daten werden streng geprüft (Grösse 5–25,
nur `#.SZ`, genau ein Start und ein Ziel, Weg vorhanden; ältere Links mit Start am Rand
oder offenem Rand bleiben gültig, höchstens 12 Labyrinthe,
Texte nur als reiner Text). «Verdeckt» ist eine Spielregel, kein Geheimnis: Wer den Link
entschlüsselt, sieht alle Labyrinthe.

## Nutzungsstatistik (GoatCounter)

`assets/zaehler.js` meldet Aufrufe anonym an <https://nksa.goatcounter.com> (ohne Cookies, ohne
Kennung im Browser; GoatCounter speichert keine IP-Adressen). Gesendet werden Pfad, Seitentitel,
Herkunftsseite und Bildschirmgrösse.

| Pfad | Bedeutung |
| --- | --- |
| `/kara/` | Cockpit |
| `/kara/editor/` | Labyrinth-Editor |
| `/kara/baukasten/<reihe>/<aufgabe>` | Aufgabe geöffnet (eigene Challenges: `…/eigene/challenge`) |
| `/kara/baukasten/geloest/<reihe>/<aufgabe>` | Ereignis: Aufgabe gelöst |
| `/kara/baukasten/challenge-uebernommen` | Ereignis: Challenge per Link übernommen |

Nicht gezählt wird lokal (localhost, file:) und in Browsern, die einmal eine Seite mit
`?zaehler=aus` geöffnet haben (z. B. für die eigenen Aufrufe der Lehrperson); `?zaehler=an`
hebt das wieder auf (Schlüssel `kara.zaehler.aus`).

## Im Browser gespeichert (`localStorage`)

| Schlüssel | Inhalt |
| --- | --- |
| `kara.baukasten.v1` | gelöste Aufgaben (grüner Haken) |
| `kara.baukasten.prog.v1` | Stand der Bausteine je Aufgabe; «Alles löschen» leert ihn |
| `kara.baukasten.figur.v1` | eigenes Bild (Easter Egg), nur der 128-px-Ausschnitt |
| `kara.baukasten.nebel.v2` | Nebel ein/aus, je Aufgabe (nur wenn selbst umgeschaltet) |
| `kara.baukasten.fragen.v1` | richtig beantwortete Fragen (`{aufgabenId: 1}` für die Reflexion, `{"aufgabenId/strategie": 1}` für die Vorher-Frage) |
| `kara.challenges.v1` | eigene und übernommene Challenges |
| `kara.editor.entwurf.v1` | Entwurf im Editor |
| `kara.zaehler.aus` | Statistik für diesen Browser abgeschaltet (`?zaehler=aus`) |

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
Lokal wird nichts gezählt.
