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

## Stand (Oktober 2026)

Reihen: Grundlagen · Labyrinth (lab1–lab11) · Inseln und Pledge (insel1, insel2, pledge) ·
Abschluss und eigene Challenges (Abschluss-Level + lokale Challenges aus dem Editor).
Fertig: Steine, Verschachtelungstiefe, Easter Egg (eigenes Foto), Programme bleiben erhalten,
mehrere/verdeckte/zufällige Labyrinthe, Zähler-Bausteine, Nebel mit Gedächtnis, grosse Karten
mit Kamera, Tempo-Stufen, Editor mit Teilen per Base64-Link, Teilen-Link bei jeder Aufgabe,
GoatCounter-Statistik.

Offen, nicht entschieden: ob der Baukasten-Eintrag in `checks` auf Kara verlinken soll.
Nur auf ausdrücklichen Wunsch ändern.
