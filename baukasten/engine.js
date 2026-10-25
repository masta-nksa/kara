/* ============================================================
   engine.js – Käfer-Interpreter, Prüfung und Programmbaum
   Reine Funktionen, kein DOM: laeuft im Browser (window.BaukastenEngine)
   und unter node (require).

   Programmmodell (Baum):
     {t:"act",  cmd:"vor"|"rechts"|"links"}
     {t:"loop", n:1..99, body:[...]}
     {t:"until", body:[...]}                   wiederhole bis das Zielfeld erreicht ist
     {t:"while", cond:..., body:[...]}         wiederhole solange die Bedingung gilt
     {t:"if",   cond:"frei"|"freiLinks"|"freiRechts", yes:[...], no:[...], sonst?:false}
       sonst:false = Verzweigung ohne Sonst-Zweig («no» bleibt leer)

   Erweiterbar (Stufe 2/3): neue Befehle in BEFEHLE, neue Bedingungen in
   BEDINGUNGEN, neue Ziel-Typen in ZIELTYPEN eintragen. Der Interpreter und
   die Oberfläche lesen diese Tabellen, nichts ist fest verdrahtet.
   Prüfung vergleicht das Ergebnis (Endfeld, besuchte Felder, Bausteinlimit),
   nie ein Muster – im Quelltext steht deshalb keine Lösung.
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BaukastenEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var SCHRITTLIMIT = 5000;
  var MAX_TIEFE = 3;          // höchstens drei ineinander steckende Wiederholungen/Verzweigungen
  var MAX_WIEDERHOLUNG = 99;
  var EREIGNISLIMIT = 100000; // Schutz gegen leere Wiederholungen, die keine Schritte zählen

  var DIRS = { N: [0, 1], E: [1, 0], S: [0, -1], W: [-1, 0] };
  var RECHTS = { N: "E", E: "S", S: "W", W: "N" };
  var LINKS = { E: "N", S: "E", W: "S", N: "W" };
  var BLICK_TEXT = { N: "oben", E: "rechts", S: "unten", W: "links" };

  var TEXTE = {
    anstoss: "Der Käfer stösst an ein Hindernis oder den Rand.",
    limit: "Das Programm läuft zu lange (mehr als " + SCHRITTLIMIT + " Schritte) und wurde angehalten.",
    leer: "Das Struktogramm ist leer. Ziehen Sie zuerst Bausteine hinein.",
    unbekannt: "Das Programm enthält einen unbekannten Baustein.",
    endlos: "Die Wiederholung endet nie: Zu Beginn eines Durchlaufs steht der Käfer wieder am gleichen Ort, schaut in die gleiche Richtung, und die Bedingung gilt immer noch.",
    kreis: "Der Käfer läuft im Kreis: Er steht wieder am gleichen Ort, schaut in die gleiche Richtung und hat das Ziel nicht erreicht."
  };

  /* ---------- Tabellen (erweiterbar) ----------------------- */

  function freiRichtung(z, ctx, d) {
    var nx = z.x + DIRS[d][0], ny = z.y + DIRS[d][1];
    return nx >= 1 && nx <= ctx.cols && ny >= 1 && ny <= ctx.rows && !ctx.hind[nx + "," + ny];
  }
  function frei(z, ctx) { return freiRichtung(z, ctx, z.d); }

  // ausfuehren(z, ctx) liefert "anstoss" bei Fehler, sonst nichts.
  var BEFEHLE = {
    vor: {
      label: "vorwärts", kurz: "vor",
      ausfuehren: function (z, ctx) {
        if (!frei(z, ctx)) return "anstoss";
        z.x += DIRS[z.d][0]; z.y += DIRS[z.d][1];
        z.besucht.push([z.x, z.y]);
      }
    },
    rechts: { label: "rechts drehen", kurz: "↻ rechts", ausfuehren: function (z) { z.d = RECHTS[z.d]; } },
    links: { label: "links drehen", kurz: "↺ links", ausfuehren: function (z) { z.d = LINKS[z.d]; } },
    // Zähler (z. B. für den Pledge-Algorithmus): eine ganze Zahl, beim Start 0
    zaehlerPlus: { label: "Zähler + 1", kurz: "Zähler +1", ausfuehren: function (z) { z.zaehler++; } },
    zaehlerMinus: { label: "Zähler − 1", kurz: "Zähler −1", ausfuehren: function (z) { z.zaehler--; } },
    zaehlerNull: { label: "Zähler auf 0", kurz: "Zähler := 0", ausfuehren: function (z) { z.zaehler = 0; } }
  };

  // solange: Text für «wiederhole solange …»
  var BEDINGUNGEN = {
    frei: { label: "Feld vorne frei?", kurz: "vorne frei?", solange: "Feld vorne frei", pruefen: frei },
    freiLinks: { label: "Feld links frei?", kurz: "links frei?", solange: "Feld links frei", pruefen: function (z, ctx) { return freiRichtung(z, ctx, LINKS[z.d]); } },
    freiRechts: { label: "Feld rechts frei?", kurz: "rechts frei?", solange: "Feld rechts frei", pruefen: function (z, ctx) { return freiRichtung(z, ctx, RECHTS[z.d]); } },
    zaehlerIstNull: { label: "Zähler = 0?", kurz: "Zähler = 0?", solange: "Zähler = 0", pruefen: function (z) { return z.zaehler === 0; } },
    zaehlerNichtNull: { label: "Zähler ≠ 0?", kurz: "Zähler ≠ 0?", solange: "Zähler ≠ 0", pruefen: function (z) { return z.zaehler !== 0; } }
  };

  function gleich(a, b) { return a[0] === b[0] && a[1] === b[1]; }
  function feldMenge(felder) {
    var m = {};
    felder.forEach(function (f) { m[f[0] + "," + f[1]] = true; });
    return m;
  }

  // Jede Prüfung liefert null (erfüllt) oder {grund, text}.
  var ZIELTYPEN = {
    endfeld: function (ziel, lauf) {
      return gleich(ziel.feld, lauf.end) ? null
        : { grund: "endfeld", text: "Der Käfer ist nicht auf dem Zielfeld angekommen." };
    },
    besucht: function (ziel, lauf) {
      var braucht = feldMenge(ziel.felder), hat = feldMenge(lauf.besucht), k;
      for (k in braucht) {
        if (!hat[k]) return { grund: "fehlend", text: "Der Käfer hat nicht alle markierten Felder besucht." };
      }
      if (ziel.nurDiese) {
        for (k in hat) {
          if (!braucht[k]) return { grund: "zusaetzlich", text: "Der Käfer hat Felder besucht, die nicht markiert sind." };
        }
      }
      if (ziel.endfeld && !gleich(ziel.endfeld, lauf.end)) {
        return { grund: "endfeld", text: "Der Käfer endet nicht auf dem richtigen Feld." };
      }
      return null;
    }
  };

  /* ---------- Programmbaum --------------------------------- */

  function klonen(x) { return JSON.parse(JSON.stringify(x)); }

  function zaehleBausteine(prog) {
    var n = 0;
    prog.forEach(function (b) {
      n += 1;
      if (b.t === "loop" || b.t === "until" || b.t === "while") n += zaehleBausteine(b.body);
      else if (b.t === "if") n += zaehleBausteine(b.yes) + zaehleBausteine(b.no);
    });
    return n;
  }

  // Verschachtelungstiefe der Behälter: act = 0, Wiederholung/Verzweigung = 1 + Tiefe des Inhalts.
  function tiefe(liste) {
    var m = 0;
    liste.forEach(function (b) {
      var h = 0;
      if (b.t === "loop" || b.t === "until" || b.t === "while") h = 1 + tiefe(b.body);
      else if (b.t === "if") h = 1 + Math.max(tiefe(b.yes), tiefe(b.no));
      if (h > m) m = h;
    });
    return m;
  }

  // Liefert eine Fehlermeldung (String) oder null, wenn das Programm gültig aufgebaut ist.
  // maxTiefe: Obergrenze der Verschachtelung der Aufgabe (Standard MAX_TIEFE).
  function validiere(prog, maxTiefe) {
    var grenze = maxTiefe || MAX_TIEFE;
    if (!Array.isArray(prog)) return "Programm ist keine Liste.";
    var fehler = null;
    (function pruefen(liste) {
      liste.forEach(function (b) {
        if (fehler) return;
        if (!b || typeof b !== "object") { fehler = "Ungültiger Baustein."; return; }
        if (b.t === "act") {
          if (!BEFEHLE[b.cmd]) fehler = "Unbekannter Befehl: " + b.cmd;
        } else if (b.t === "loop") {
          if (typeof b.n !== "number" || b.n % 1 !== 0 || b.n < 1 || b.n > MAX_WIEDERHOLUNG) fehler = "Wiederholungszahl ausserhalb 1 bis " + MAX_WIEDERHOLUNG + ".";
          else if (!Array.isArray(b.body)) fehler = "Wiederholung ohne Inhalt.";
          else pruefen(b.body);
        } else if (b.t === "until") {
          if (!Array.isArray(b.body)) fehler = "Wiederholung ohne Inhalt.";
          else pruefen(b.body);
        } else if (b.t === "while") {
          if (!BEDINGUNGEN[b.cond]) fehler = "Unbekannte Bedingung: " + b.cond;
          else if (!Array.isArray(b.body)) fehler = "Wiederholung ohne Inhalt.";
          else pruefen(b.body);
        } else if (b.t === "if") {
          if (!BEDINGUNGEN[b.cond]) fehler = "Unbekannte Bedingung: " + b.cond;
          else if (!Array.isArray(b.yes) || !Array.isArray(b.no)) fehler = "Verzweigung ohne Zweige.";
          else if (b.sonst === false && b.no.length) fehler = "Verzweigung ohne Sonst-Zweig darf dort keine Bausteine haben.";
          else { pruefen(b.yes); pruefen(b.no); }
        } else fehler = "Unbekannter Bausteintyp: " + b.t;
      });
    })(prog);
    if (!fehler && tiefe(prog) > grenze) fehler = "Zu tief verschachtelt (höchstens " + grenze + ").";
    return fehler;
  }

  // cmd: Befehl (act) bzw. Bedingung (if). sonst === false: Verzweigung ohne Sonst-Zweig.
  function neuerBlock(typ, cmd, sonst) {
    if (typ === "act") return { t: "act", cmd: cmd };
    if (typ === "loop") return { t: "loop", n: 2, body: [] };
    if (typ === "until") return { t: "until", body: [] };
    if (typ === "while") return { t: "while", cond: cmd || "frei", body: [] };
    var b = { t: "if", cond: cmd || "frei", yes: [], no: [] };
    if (sonst === false) b.sonst = false;
    return b;
  }

  /* Adressen: Blockadresse [i] oder [i,"body",j,"yes",k] (endet auf eine Zahl),
     Listenadresse [] (Hauptfolge) oder [i,"body"] (endet auf einen Schlüssel). */

  function listeAt(prog, adr) {
    var l = prog;
    for (var k = 0; k < adr.length; k += 2) {
      var b = l[adr[k]];
      if (!b) return null;
      l = b[adr[k + 1]];
      if (!Array.isArray(l)) return null;
    }
    return l;
  }

  function blockAt(prog, adr) {
    var l = listeAt(prog, adr.slice(0, -1));
    return l ? l[adr[adr.length - 1]] : undefined;
  }

  function istPraefix(a, b) {
    if (a.length > b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  // Würde der Block die erlaubte Verschachtelung überschreiten? (Nur Tiefe, nicht die übrigen Regeln.)
  function zuTief(prog, ladr, block, maxTiefe) {
    return ladr.length / 2 + tiefe([block]) > (maxTiefe || MAX_TIEFE);
  }

  function kannEinfuegen(prog, ladr, block, maxTiefe) {
    if (!listeAt(prog, ladr)) return false;
    if (ladr.length && ladr[ladr.length - 1] === "no") {
      var vater = blockAt(prog, ladr.slice(0, -1));
      if (vater && vater.sonst === false) return false;
    }
    return !zuTief(prog, ladr, block, maxTiefe);
  }

  function einfuegen(prog, ladr, idx, block, maxTiefe) {
    if (!kannEinfuegen(prog, ladr, block, maxTiefe)) return null;
    var neu = klonen(prog);
    var l = listeAt(neu, ladr);
    if (idx < 0 || idx > l.length) return null;
    l.splice(idx, 0, klonen(block));
    return neu;
  }

  function entfernen(prog, badr) {
    var neu = klonen(prog);
    var l = listeAt(neu, badr.slice(0, -1));
    if (!l || !l[badr[badr.length - 1]]) return null;
    l.splice(badr[badr.length - 1], 1);
    return neu;
  }

  // Verschiebt einen Block (samt Inhalt). Ziel-Adressen beziehen sich auf das
  // Programm VOR dem Verschieben. Ein Block darf nicht in sich selbst landen.
  function verschieben(prog, badr, ladr, idx, maxTiefe) {
    if (istPraefix(badr, ladr)) return null;
    var block = blockAt(prog, badr);
    if (!block || !kannEinfuegen(prog, ladr, block, maxTiefe)) return null;
    var neu = klonen(prog);
    var quelle = listeAt(neu, badr.slice(0, -1));
    var qi = badr[badr.length - 1];
    var marke = { t: "_marke" };
    var geholt = quelle[qi];
    quelle[qi] = marke;                       // Platzhalter: alle Adressen bleiben gültig
    var ziel = listeAt(neu, ladr);
    if (idx < 0 || idx > ziel.length) return null;
    ziel.splice(idx, 0, geholt);
    (function raeumen(l) {
      var i = l.indexOf(marke);
      if (i >= 0) { l.splice(i, 1); return true; }
      return l.some(function (b) {
        return (b.body && raeumen(b.body)) || (b.yes && raeumen(b.yes)) || (b.no && raeumen(b.no));
      });
    })(neu);
    return neu;
  }

  /* ---------- Interpreter ---------------------------------- */

  // Führt das Programm aus und liefert den vollständigen Ablauf:
  // {ok, fehler:null|"anstoss"|"kreis"|"limit"|"unbekannt", besucht, end, blick, schritte, trace}
  // trace-Ereignisse: {typ:"act"|"loop"|"if"|"fehler", pfad, x, y, d, ...} (Zustand nach dem Ereignis).
  function run(feld, prog, opts) {
    var limit = (opts && opts.limit) || SCHRITTLIMIT;
    var hind = {};
    feld.hindernisse.forEach(function (h) { hind[h[0] + "," + h[1]] = true; });
    var ctx = { cols: feld.cols, rows: feld.rows, hind: hind };
    var zielFeld = (opts && opts.ziel) || null;
    var z = { x: feld.start[0], y: feld.start[1], d: feld.blick, zaehler: 0, besucht: [[feld.start[0], feld.start[1]]] };
    var trace = [], schritte = 0, ereignisse = 0, fehler = null;

    function ereignis(typ, pfad, extra) {
      if (++ereignisse > EREIGNISLIMIT) throw { code: "limit" };
      var e = { typ: typ, pfad: pfad, x: z.x, y: z.y, d: z.d, zaehler: z.zaehler };
      for (var k in extra) e[k] = extra[k];
      trace.push(e);
    }

    function ausfuehren(b, pfad) {
      if (++schritte > limit) throw { code: "limit" };
      if (b.t === "act") {
        var cmd = BEFEHLE[b.cmd];
        if (!cmd) throw { code: "unbekannt" };
        var vorher = [z.x, z.y];
        if (cmd.ausfuehren(z, ctx) === "anstoss") {
          ereignis("fehler", pfad, { code: "anstoss", ziel: [z.x + DIRS[z.d][0], z.y + DIRS[z.d][1]] });
          throw { code: "anstoss" };
        }
        ereignis("act", pfad, { cmd: b.cmd, von: vorher, bewegt: vorher[0] !== z.x || vorher[1] !== z.y });
      } else if (b.t === "loop") {
        for (var i = 0; i < b.n; i++) {
          ereignis("loop", pfad, { durchlauf: i + 1, n: b.n });
          for (var j = 0; j < b.body.length; j++) ausfuehren(b.body[j], pfad.concat(["body", j]));
        }
      } else if (b.t === "until") {
        // Zu Beginn jedes Durchlaufs bestimmen Ort, Blickrichtung und Zähler den weiteren Ablauf vollständig
        // (alle anderen Bausteine sind ohne Gedächtnis). Kommt ein Zustand wieder, läuft der Käfer im Kreis.
        var durchlauf = 0, gesehen = {};
        while (!zielFeld || z.x !== zielFeld[0] || z.y !== zielFeld[1]) {
          var zust = z.x + "," + z.y + "," + z.d + "," + z.zaehler;
          if (gesehen[zust]) {
            ereignis("fehler", pfad, { code: "kreis" });
            throw { code: "kreis" };
          }
          gesehen[zust] = true;
          ereignis("until", pfad, { durchlauf: ++durchlauf });
          for (var u = 0; u < b.body.length; u++) ausfuehren(b.body[u], pfad.concat(["body", u]));
        }
      } else if (b.t === "while") {
        // Wie bei «bis Ziel»: Kommt zu Beginn eines Durchlaufs ein Zustand wieder, endet die Schleife nie.
        var bedW = BEDINGUNGEN[b.cond];
        if (!bedW) throw { code: "unbekannt" };
        var dw = 0, gesW = {};
        for (;;) {
          var jaW = bedW.pruefen(z, ctx);
          ereignis("while", pfad, { durchlauf: dw + 1, ja: jaW, cond: b.cond });
          if (!jaW) break;
          var zw = z.x + "," + z.y + "," + z.d + "," + z.zaehler;
          if (gesW[zw]) {
            ereignis("fehler", pfad, { code: "endlos" });
            throw { code: "endlos" };
          }
          gesW[zw] = true;
          dw++;
          for (var w = 0; w < b.body.length; w++) ausfuehren(b.body[w], pfad.concat(["body", w]));
        }
      } else if (b.t === "if") {
        var bed = BEDINGUNGEN[b.cond];
        if (!bed) throw { code: "unbekannt" };
        var ja = bed.pruefen(z, ctx);
        ereignis("if", pfad, { ja: ja, cond: b.cond });
        var zweig = ja ? b.yes : b.no, key = ja ? "yes" : "no";
        for (var k = 0; k < zweig.length; k++) ausfuehren(zweig[k], pfad.concat([key, k]));
      } else {
        throw { code: "unbekannt" };
      }
    }

    try {
      for (var i = 0; i < prog.length; i++) ausfuehren(prog[i], [i]);
    } catch (e) {
      if (!e || !e.code) throw e;
      fehler = e.code;
    }
    return {
      ok: !fehler, fehler: fehler, besucht: z.besucht, end: [z.x, z.y], blick: z.d,
      schritte: schritte, trace: trace
    };
  }

  /* ---------- Prüfung -------------------------------------- */

  // Zielfeld für «wiederhole bis Ziel»: das Endfeld der Aufgabe.
  function zielfeld(ziel) {
    if (!ziel) return null;
    if (ziel.typ === "endfeld") return ziel.feld;
    return ziel.endfeld || null;
  }

  /* ---------- Aufgaben vorbereiten ------------------------- */

  // Zeichenkarte -> Felddaten. Karte: eine Zeichenkette pro Zeile, oberste Zeile zuerst.
  // «#» Mauer, «.» Weg, «S» Start, «Z» Ziel. Liefert {feld, zielFeld}.
  function karteLesen(karte, blick, wo) {
    if (!Array.isArray(karte) || !karte.length) throw new Error("Karte fehlt (" + wo + ").");
    var rows = karte.length, cols = karte[0].length, hind = [], start = null, ziel = null;
    karte.forEach(function (zeile, r) {
      if (typeof zeile !== "string" || zeile.length !== cols) throw new Error("Karte: Zeilen ungleich lang (" + wo + ").");
      for (var c = 0; c < cols; c++) {
        var ch = zeile.charAt(c), x = c + 1, y = rows - r;
        if (ch === "#") hind.push([x, y]);
        else if (ch === "S") start = [x, y];
        else if (ch === "Z") ziel = [x, y];
        else if (ch !== ".") throw new Error("Karte: unbekanntes Zeichen «" + ch + "» (" + wo + ").");
      }
    });
    if (!start) throw new Error("Karte ohne Start (" + wo + ").");
    return { feld: { karte: karte, cols: cols, rows: rows, start: start, hindernisse: hind, blick: blick || "E" }, zielFeld: ziel };
  }

  // Ziel «alleWege»: alle Felder ohne Mauer besuchen (z. B. Rasenmäher). Wird zu «besucht».
  function alleWege(feld) {
    var mauer = feldMenge(feld.hindernisse), l = [];
    for (var x = 1; x <= feld.cols; x++) for (var y = 1; y <= feld.rows; y++) if (!mauer[x + "," + y]) l.push([x, y]);
    return { typ: "besucht", felder: l, alleWege: true };
  }

  // Ein Layout (Karte mit Start und Ziel) für die Prüfung vorbereiten: {name, feld, ziel, verdeckt}.
  // zielTyp «alleWege»: Ziel sind alle Wegfelder, die Karte braucht dann kein «Z».
  function layoutVorbereiten(layout, name, verdeckt, wo, zielTyp) {
    var k = karteLesen(layout.karte, layout.blick, wo);
    if (zielTyp === "alleWege") return { name: layout.name || name, feld: k.feld, ziel: alleWege(k.feld), verdeckt: !!verdeckt };
    if (!k.zielFeld) throw new Error("Karte ohne Ziel (" + wo + ").");
    return { name: layout.name || name, feld: k.feld, ziel: { typ: "endfeld", feld: k.zielFeld }, verdeckt: !!verdeckt };
  }

  // Liefert eine vorbereitete Kopie der Aufgabe. Jede Aufgabe bekommt «felder»: die Layouts, gegen
  // die geprüft wird (sichtbare zuerst, dann verdeckte). «feld» und «ziel» zeigen auf das erste Layout.
  //  - Aufgabe mit «layouts» (und optional «verdeckt»): mehrere Karten.
  //  - Aufgabe mit «feld.karte»: eine Karte; «ziel» ergibt sich aus «Z», falls nicht angegeben.
  //  - sonst: Feld mit cols/rows/start/hindernisse und eigenem «ziel» (unverändert).
  function vorbereiten(aufgabe) {
    var a = klonen(aufgabe);
    var zt = a.ziel && a.ziel.typ;
    if (Array.isArray(a.layouts) && a.layouts.length) {
      a.felder = a.layouts.map(function (l, i) { return layoutVorbereiten(l, "Layout " + (i + 1), false, a.id + ", Layout " + (i + 1), zt); })
        .concat((a.verdeckt || []).map(function (l, i) { return layoutVorbereiten(l, "Verdeckt " + (i + 1), true, a.id + ", verdeckt " + (i + 1), zt); }));
    } else if (a.feld && a.feld.karte) {
      var k = karteLesen(a.feld.karte, a.feld.blick, a.id);
      if (zt === "alleWege") a.ziel = alleWege(k.feld);
      if (!a.ziel) {
        if (!k.zielFeld) throw new Error("Karte ohne Ziel (" + a.id + ").");
        a.ziel = { typ: "endfeld", feld: k.zielFeld };
      }
      a.felder = [{ name: "Layout 1", feld: k.feld, ziel: a.ziel, verdeckt: false }];
    } else {
      a.felder = [{ name: "Layout 1", feld: a.feld, ziel: a.ziel, verdeckt: false }];
    }
    a.feld = a.felder[0].feld;
    a.ziel = a.felder[0].ziel;
    return a;
  }

  /* ---------- Zufallslabyrinthe ---------------------------- */

  // Kleiner Zufallsgenerator mit Startzahl (mulberry32): gleiche Startzahl, gleiches Labyrinth.
  function zufall(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Perfektes Labyrinth (jeder Ort auf genau einem Weg erreichbar, also ohne Inseln) mit
  // raeume × raeume Räumen, Kartengrösse 2·raeume+1. Eingang (Start) und Ausgang (Ziel) sind
  // Lücken im Rahmen auf zwei verschiedenen Seiten. Verfahren: zufälliges Prim, das viele
  // Abzweigungen erzeugt. Liefert ein Layout {karte, blick}.
  // opt.inseln = k: danach k zusätzliche Wände zwischen Räumen öffnen. Jede Öffnung schliesst einen
  // Rundgang, so entstehen freistehende Wandstücke (Inseln). Der Start liegt dann in einem Raum im
  // Inneren mit zufälliger Blickrichtung, der Ausgang bleibt eine Lücke im Rahmen.
  // Ohne opt ist das Ergebnis für jede Startzahl dasselbe wie bisher.
  // raeume: Zahl (quadratisch) oder [Breite, Höhe] in Räumen, z. B. [12, 7] ergibt 25 × 15.
  function erzeugeLabyrinth(seed, raeume, opt) {
    var r = zufall(seed), nx, ny, x, y;
    if (Array.isArray(raeume)) { nx = raeume[0]; ny = raeume[1]; } else { nx = ny = raeume || 5; }
    var gx = 2 * nx + 1, gy = 2 * ny + 1;
    var m = [];
    for (y = 0; y < gy; y++) { m.push([]); for (x = 0; x < gx; x++) m[y].push("#"); }
    var drin = {}, rand = [];
    function rein(cx, cy) {
      drin[cx + "," + cy] = true;
      m[2 * cy + 1][2 * cx + 1] = ".";
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (v) {
        var ax = cx + v[0], ay = cy + v[1];
        if (ax >= 0 && ay >= 0 && ax < nx && ay < ny && !drin[ax + "," + ay]) rand.push([ax, ay, cx, cy]);
      });
    }
    rein(Math.floor(r() * nx), Math.floor(r() * ny));
    while (rand.length) {
      var e = rand.splice(Math.floor(r() * rand.length), 1)[0];
      if (drin[e[0] + "," + e[1]]) continue;
      m[e[1] + e[3] + 1][e[0] + e[2] + 1] = ".";      // Wand zwischen den beiden Räumen öffnen
      rein(e[0], e[1]);
    }
    // Lücke im Rahmen als [Zeile, Spalte]; oben/unten wählt eine Spalte, links/rechts eine Zeile.
    function luecke(seite) {
      var k = 2 * Math.floor(r() * (seite % 2 === 0 ? nx : ny)) + 1;
      return seite === 0 ? [0, k] : seite === 1 ? [k, gx - 1] : seite === 2 ? [gy - 1, k] : [k, 0];
    }
    // Mit Inseln oder startInnen liegt der Start in einem Raum im Inneren.
    if (opt && (opt.inseln || opt.startInnen)) {
      var zu = [];
      for (y = 1; y < gy - 1; y++) for (x = 1; x < gx - 1; x++) {
        if ((x % 2) !== (y % 2) && m[y][x] === "#") zu.push([y, x]);   // Wand genau zwischen zwei Räumen
      }
      for (var i = 0; i < opt.inseln && zu.length; i++) {
        var w = zu.splice(Math.floor(r() * zu.length), 1)[0];
        m[w[0]][w[1]] = ".";
      }
      var sy = 2 * Math.floor(r() * ny) + 1, sx = 2 * Math.floor(r() * nx) + 1, blickI = "NESW".charAt(Math.floor(r() * 4));
      var zi = luecke(Math.floor(r() * 4));
      m[sy][sx] = "S";
      m[zi[0]][zi[1]] = "Z";
      return { karte: m.map(function (z) { return z.join(""); }), blick: blickI };
    }
    // Seiten: 0 oben, 1 rechts, 2 unten, 3 links. Blick des Käfers zeigt vom Eingang ins Labyrinth.
    var seiteS = Math.floor(r() * 4), seiteZ = (seiteS + 1 + Math.floor(r() * 3)) % 4;
    var s = luecke(seiteS), zl = luecke(seiteZ);
    m[s[0]][s[1]] = "S";
    m[zl[0]][zl[1]] = "Z";
    return { karte: m.map(function (z) { return z.join(""); }), blick: ["S", "W", "N", "E"][seiteS] };
  }

  /* ---------- Konzeptfragen -------------------------------- */

  // Die richtige Antwort steht nicht im Klartext in der Aufgabe, sondern als Schlüssel
  // (FNV-1a über Aufgaben-ID und Antwortnummer). Eine Spielregel, kein Geheimnis.
  function frageSchluessel(id, i) {
    var s = "kara:" + id + ":" + i, h = 0x811c9dc5;
    for (var k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 0x01000193) >>> 0; }
    return ("0000000" + h.toString(16)).slice(-8);
  }
  // art «strategie»: die Frage vor dem Lösen (Schlüssel über «id/strategie»), sonst die Reflexion danach.
  function frageRichtig(aufgabe, i, art) {
    var f = art === "strategie" ? aufgabe.strategie : aufgabe.frage;
    return !!(f && f.richtig === frageSchluessel(art === "strategie" ? aufgabe.id + "/strategie" : aufgabe.id, i));
  }

  function bausteineText(n, max) {
    return max == null ? "Bausteine: " + n : "Bausteine: " + n + " von höchstens " + max;
  }

  // Prüft ein Programm in einem Layout: {ok, grund, text, lauf}.
  function pruefeLayout(f, prog) {
    var lauf = run(f.feld, prog, { ziel: zielfeld(f.ziel) });
    if (!lauf.ok) return { ok: false, grund: lauf.fehler, text: TEXTE[lauf.fehler] || TEXTE.unbekannt, lauf: lauf };
    var pruef = ZIELTYPEN[f.ziel.typ];
    if (!pruef) throw new Error("Unbekannter Zieltyp: " + f.ziel.typ);
    var miss = pruef(f.ziel, lauf);
    return miss ? { ok: false, grund: miss.grund, text: miss.text, lauf: lauf } : { ok: true, grund: "ok", text: "", lauf: lauf };
  }

  // Prüft ein Programm gegen eine (vorbereitete) Aufgabe in allen ihren Layouts, dazu in den
  // optionalen «extra»-Layouts (z. B. Zufallslabyrinthe). Reihenfolge: leeres Programm ->
  // Ablauf/Ziel je Layout -> Bausteinlimit. Ergebnis:
  // {ok, grund, text, bloecke, max, zielErreicht, lauf, ergebnisse:[{name, verdeckt, zufall, ok, grund, text, lauf}]}
  // Mit nur einem Layout entsprechen grund/text/lauf genau diesem Layout.
  function pruefe(aufgabe, prog, extra) {
    var max = aufgabe.maxBloecke == null ? null : aufgabe.maxBloecke;
    var n = zaehleBausteine(prog);
    var res = { ok: false, grund: null, text: "", bloecke: n, max: max, zielErreicht: false, lauf: null, ergebnisse: [] };
    if (!prog.length) { res.grund = "leer"; res.text = TEXTE.leer; return res; }

    var felder = (aufgabe.felder || [{ name: "Layout 1", feld: aufgabe.feld, ziel: aufgabe.ziel }]).concat(extra || []);
    res.ergebnisse = felder.map(function (f) {
      var r = pruefeLayout(f, prog);
      r.name = f.name; r.verdeckt = !!f.verdeckt; r.zufall = !!f.zufall;
      return r;
    });
    var fehl = res.ergebnisse.filter(function (r) { return !r.ok; });
    res.lauf = res.ergebnisse[0].lauf;
    res.zielErreicht = !fehl.length;

    // Ablauffehler in einem einzigen Layout gehen vor dem Bausteinlimit (wie bisher).
    if (felder.length === 1 && fehl.length && fehl[0].lauf && !fehl[0].lauf.ok) {
      res.grund = fehl[0].grund; res.text = fehl[0].text; return res;
    }
    if (max !== null && n > max) {
      res.grund = "bloecke";
      res.text = "Sie haben " + n + " von höchstens " + max + " Bausteinen verwendet.";
      return res;
    }
    if (fehl.length) {
      if (felder.length === 1) { res.grund = fehl[0].grund; res.text = fehl[0].text; return res; }
      res.grund = "layouts";
      // felderWort: Einzahl, Mehrzahl, Mehrzahl im Dativ, z. B. ["Garten", "Gärten", "Gärten"]; Standard Labyrinth.
      var wort = (aufgabe.felderWort || ["Labyrinth", "Labyrinthe", "Labyrinthen"])[2];
      res.text = "Der Käfer schafft " + (felder.length - fehl.length) + " von " + felder.length + " " + wort + ".";
      return res;
    }
    res.ok = true; res.grund = "ok"; res.text = "Geschafft. Der Käfer hat die Aufgabe gelöst.";
    return res;
  }

  return {
    SCHRITTLIMIT: SCHRITTLIMIT, MAX_TIEFE: MAX_TIEFE, MAX_WIEDERHOLUNG: MAX_WIEDERHOLUNG,
    BLICK_TEXT: BLICK_TEXT, TEXTE: TEXTE,
    BEFEHLE: BEFEHLE, BEDINGUNGEN: BEDINGUNGEN, ZIELTYPEN: ZIELTYPEN,
    klonen: klonen, zaehleBausteine: zaehleBausteine, tiefe: tiefe, validiere: validiere,
    neuerBlock: neuerBlock, listeAt: listeAt, blockAt: blockAt, istPraefix: istPraefix,
    kannEinfuegen: kannEinfuegen, zuTief: zuTief, einfuegen: einfuegen, entfernen: entfernen, verschieben: verschieben,
    run: run, pruefe: pruefe, pruefeLayout: pruefeLayout, bausteineText: bausteineText, vorbereiten: vorbereiten,
    zielfeld: zielfeld, karteLesen: karteLesen, layoutVorbereiten: layoutVorbereiten, alleWege: alleWege,
    zufall: zufall, erzeugeLabyrinth: erzeugeLabyrinth, frageSchluessel: frageSchluessel, frageRichtig: frageRichtig
  };
});
