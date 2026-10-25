# Hinweise für die Arbeit an diesem Repo

Fachliche Doku (Aufbau, Aufgabenformat, Statistik, `localStorage`): siehe `README.md`.
Diese Datei sammelt Arbeitsweise, Konventionen und den aktuellen Stand.

## Projekt

- Kara: Käfer mit Struktogramm-Bausteinen programmieren. Live: <https://masta-nksa.github.io/kara/>
- Hervorgegangen aus `algorithmen/baukasten/` in `masta-nksa/checks`. Dort bleibt die alte Kopie
  unverändert stehen; weiterentwickelt wird nur hier.
- Statisch: HTML/CSS/JS ohne Build, ohne Bibliotheken. GitHub Pages aus `main`, Root;
  `.nojekyll` muss bleiben. Pages-Einstellungen und neue Repos richtet die Lehrperson selbst ein.

## Konventionen

- Oberfläche auf Deutsch (Schweiz, «ss» statt «ß»), Anrede «Sie», Anführungszeichen «…».
- Code-Namen ebenfalls deutsch (`vorbereiten`, `pruefe`, `nebelSetzen` …), Kommentare knapp.
- **Keine Lösungen und keine Tests im Repo.** Die Prüfung vergleicht nur das Ergebnis
  (Endfeld, besuchte Felder, Bausteinlimit), nie ein Muster. Prüfskripte nur im Scratchpad.
- `engine.js` bleibt frei von DOM (UMD: `window.BaukastenEngine` bzw. `require`).
  Befehle, Bedingungen und Zieltypen sind Tabellen (`BEFEHLE`, `BEDINGUNGEN`, `ZIELTYPEN`).
- Programmbaum: `{t:"act",cmd}`, `{t:"loop",n,body}`, `{t:"until",body}`,
  `{t:"if",cond,yes,no}`.
- Generator `erzeugeLabyrinth(seed, raeume | [nx, ny], {inseln})` ist geseedet: Bestehende Seeds
  in den Aufgaben müssen dieselben Karten ergeben. Änderungen am Generator nur abwärtskompatibel.
- Neue Labyrinth-Aufgaben: Karten mit Skript prüfen (Inseln zählen, Handregeln/Pledge laufen
  lassen, kleinste Lösung per Suche), Werte in `kleinsteLoesung` eintragen, Limits grosszügig.
- Aufgaben-IDs sind über alle Reihen eindeutig (Fortschritt hängt an der ID).
- `localStorage`-Schlüssel beginnen mit `kara.`; bei Formatwechsel Version hochzählen (`.v2`).
- Statistik (GoatCounter, Code `nksa`) **nur in Kara**, nicht in `checks` einbauen.

## Ablauf

- Entwicklung auf Branch `claude/great-newton-a6bhbk`, jeweils frisch von `main`
  (`git fetch origin main && git checkout -B claude/great-newton-a6bhbk FETCH_HEAD`).
- Commit, Push, Pull Request; gemergt wird, wenn die Lehrperson es sagt.
- Ist auf diesem Branch noch ein PR offen, neue Arbeit auf einem eigenen Branch von `main`
  beginnen (z. B. `claude/algorithmen-ct`), sonst landet sie im offenen PR.
- Vor grösseren Erweiterungen zuerst einen Plan vorlegen und besprechen.

## Testen

```
python3 -m http.server 8123          # im Repo-Root
fuser -k 8123/tcp                    # Server beenden (nicht pkill -f)
```

Browser-Tests mit Playwright (global installiert, `require(npm root -g + "/playwright")`),
Chromium unter `/opt/pw-browsers/chromium`. Bewährt: alle Aufgaben laden, Programme einfügen und
«Alle prüfen», Editor-Link in zweitem Kontext importieren, Nebel/Kamera-Positionen, Handy-Breite
(kein horizontales Scrollen), Zähler mit abgefangenen Anfragen an `nksa.goatcounter.com`
(`localStorage["kara.zaehler.test"]="1"` schaltet das Zählen lokal ein).
Auf dem Windows-Rechner der Lehrperson gibt es kein Playwright: dort mit `python -m http.server
8123` und dem eingebauten Browser der Desktop-App testen (Programme über
`localStorage["kara.baukasten.prog.v1"]` einfügen). Läuft der Bereich im Hintergrund, bremst der
Browser die Animation stark; dann mit «Einzelschritt» oder «Alle prüfen» prüfen.

## Stand (Oktober 2026)

Reihen: Grundlagen · Algorithmen (alg-…) · Computational Thinking (ct-…) · Labyrinth (lab1–lab11) ·
Inseln und Pledge (insel1, insel2, pledge) ·
Abschluss und eigene Challenges (Abschluss-Level + lokale Challenges aus dem Editor).
Fertig: Steine, Verschachtelungstiefe, Easter Egg (eigenes Foto), Programme bleiben erhalten,
mehrere/verdeckte/zufällige Labyrinthe, Zähler-Bausteine, Nebel mit Gedächtnis, grosse Karten
mit Kamera, Tempo-Stufen, Editor mit Teilen per Base64-Link, Teilen-Link bei jeder Aufgabe,
GoatCounter-Statistik. Seit 18.10.2026: Nebel auch mit mitfahrender Kamera (Masken-Bereich
explizit), Level 10 «Mehr Kreuzungen» mit Linke-Hand-Tipp nur im Hinweis, Editor mit
geschlossenem Rand, Start nur innen, Ziel auch im Inneren. Ebenfalls seit 18.10.2026: alle
Labyrinthe einheitlich mit Start im Inneren und Ausgang als einzige Lücke im Rand (Levels 1–9
und 11, Abschluss, Zufall in lab11 mit `startInnen`); «Spirale» und «Abzweigungen» mit
umgedrehtem, gespiegeltem Weg. Neue Karten so halten.

Offen aus der Rückmeldung der Lehrperson (18.10.2026): Begriffe Labyrinth/Irrgarten
(Labyrinth im engen Sinn ohne Verzweigungen). Texte nicht ohne Entscheid umbenennen.

Offen, nicht entschieden: ob der Baukasten-Eintrag in `checks` auf Kara verlinken soll.
Nur auf ausdrücklichen Wunsch ändern.

Seit 25.10.2026: Reihen «Algorithmen» und «Computational Thinking» zu zwei Papier-Dossiers der
Lehrperson (L2_Dossier_kompakt, CT_Dossier im OneDrive-Ordner Algorithmen_FMS/word); Papier und
Kara zeigen dieselben Felder, bei Änderungen beides anpassen. Kara-Texte verweisen nie aufs
Dossier (auch nicht auf «Lektion 1»): Die Aufgaben müssen für sich allein lösbar sein. «Käfer-Grundlagen» bleibt
unverändert (wird in einem anderen Fach genutzt); die Algorithmen-Reihe hat Kopien mit eigenen
IDs. Neu in der Engine: «wiederhole solange …» (`while`, Abbruch «endet nie»), Bedingung
`zaehlerNichtNull`, Ziel `alleWege`, `felderWort`. Die CT-Reihe ist nach den vier Denkfiguren
gegliedert (`abschnitte` in reihen.json): Lernpfad mit Blume je Denkfigur (auch im Cockpit),
Etikett, Vorher-Frage zur Strategie, Strategie nur als erster Tipp (nie offen in der Aufgabe) und
Reflexionsfrage erst nach dem Lösen (Auswahl, Schlüssel statt Klartext), Zusatzaufgaben mit ★. Vorbild: Kursmodus von masta-nksa/turtle. Die Algorithmen-Reihe
ist ebenso gegliedert: Bausteine und die fünf Anforderungen (je eigene Blume, sechs Farben), mit
den Aufgaben «Nur rechts» (ausführbar) und «Biege ab» (eindeutig). Die Lehrperson rechnet mit fünf Anforderungen
(mit Korrektheit); L1-Dossier und Algorithmus-Check in `checks` nennen noch vier.
