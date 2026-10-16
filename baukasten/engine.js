/* ============================================================
   engine.js – Käfer-Interpreter, Prüfung und Programmbaum
   Reine Funktionen, kein DOM: laeuft im Browser (window.BaukastenEngine)
   und unter node (require).

   Programmmodell (Baum):
     {t:"act",  cmd:"vor"|"rechts"|"links"}
     {t:"loop", n:1..99, body:[...]}
     {t:"until", body:[...]}                   wiederhole bis das Zielfeld erreicht ist
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
    unbekannt: "Das Programm enthält einen unbekannten Baustein."
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
    links: { label: "links drehen", kurz: "↺ links", ausfuehren: function (z) { z.d = LINKS[z.d]; } }
  };

  var BEDINGUNGEN = {
    frei: { label: "Feld vorne frei?", kurz: "vorne frei?", pruefen: frei },
    freiLinks: { label: "Feld links frei?", kurz: "links frei?", pruefen: function (z, ctx) { return freiRichtung(z, ctx, LINKS[z.d]); } },
    freiRechts: { label: "Feld rechts frei?", kurz: "rechts frei?", pruefen: function (z, ctx) { return freiRichtung(z, ctx, RECHTS[z.d]); } }
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
      if (b.t === "loop" || b.t === "until") n += zaehleBausteine(b.body);
      else if (b.t === "if") n += zaehleBausteine(b.yes) + zaehleBausteine(b.no);
    });
    return n;
  }

  // Verschachtelungstiefe der Behälter: act = 0, Wiederholung/Verzweigung = 1 + Tiefe des Inhalts.
  function tiefe(liste) {
    var m = 0;
    liste.forEach(function (b) {
      var h = 0;
      if (b.t === "loop" || b.t === "until") h = 1 + tiefe(b.body);
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
  // {ok, fehler:null|"anstoss"|"limit"|"unbekannt", besucht, end, blick, schritte, trace}
  // trace-Ereignisse: {typ:"act"|"loop"|"if"|"fehler", pfad, x, y, d, ...} (Zustand nach dem Ereignis).
  function run(feld, prog, opts) {
    var limit = (opts && opts.limit) || SCHRITTLIMIT;
    var hind = {};
    feld.hindernisse.forEach(function (h) { hind[h[0] + "," + h[1]] = true; });
    var ctx = { cols: feld.cols, rows: feld.rows, hind: hind };
    var zielFeld = (opts && opts.ziel) || null;
    var z = { x: feld.start[0], y: feld.start[1], d: feld.blick, besucht: [[feld.start[0], feld.start[1]]] };
    var trace = [], schritte = 0, ereignisse = 0, fehler = null;

    function ereignis(typ, pfad, extra) {
      if (++ereignisse > EREIGNISLIMIT) throw { code: "limit" };
      var e = { typ: typ, pfad: pfad, x: z.x, y: z.y, d: z.d };
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
        var durchlauf = 0;
        while (!zielFeld || z.x !== zielFeld[0] || z.y !== zielFeld[1]) {
          ereignis("until", pfad, { durchlauf: ++durchlauf });
          for (var u = 0; u < b.body.length; u++) ausfuehren(b.body[u], pfad.concat(["body", u]));
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

  // Wandelt eine Aufgabe mit Zeichenkarte (feld.karte) in die Felddaten um und liefert eine Kopie.
  // Karte: eine Zeichenkette pro Zeile, oberste Zeile zuerst. «#» Mauer, «.» Weg,
  // «S» Start, «Z» Ziel (nur wenn die Aufgabe kein eigenes «ziel» hat). Aufgaben ohne Karte bleiben unverändert.
  function vorbereiten(aufgabe) {
    var a = klonen(aufgabe), f = a.feld;
    if (!f.karte) return a;
    var rows = f.karte.length, cols = f.karte[0].length, hind = [], start = null, ziel = null;
    f.karte.forEach(function (zeile, r) {
      if (zeile.length !== cols) throw new Error("Karte: Zeilen ungleich lang (" + a.id + ").");
      for (var c = 0; c < cols; c++) {
        var ch = zeile.charAt(c), x = c + 1, y = rows - r;
        if (ch === "#") hind.push([x, y]);
        else if (ch === "S") start = [x, y];
        else if (ch === "Z") ziel = [x, y];
        else if (ch !== ".") throw new Error("Karte: unbekanntes Zeichen «" + ch + "» (" + a.id + ").");
      }
    });
    if (!start) throw new Error("Karte ohne Start (" + a.id + ").");
    f.cols = cols; f.rows = rows; f.start = start; f.hindernisse = hind;
    if (!f.blick) f.blick = "E";
    if (!a.ziel) {
      if (!ziel) throw new Error("Karte ohne Ziel (" + a.id + ").");
      a.ziel = { typ: "endfeld", feld: ziel };
    }
    return a;
  }

  function bausteineText(n, max) {
    return max == null ? "Bausteine: " + n : "Bausteine: " + n + " von höchstens " + max;
  }

  // Prüft ein Programm gegen eine Aufgabe. Reihenfolge wie in der Referenz-
  // Simulation: Ablauf (Fehler) -> Bausteinlimit -> Ziel. Zusätzlich: leeres Programm.
  // Ergebnis: {ok, grund, text, bloecke, max, zielErreicht, lauf}
  function pruefe(aufgabe, prog) {
    var max = aufgabe.maxBloecke == null ? null : aufgabe.maxBloecke;
    var n = zaehleBausteine(prog);
    var res = { ok: false, grund: null, text: "", bloecke: n, max: max, zielErreicht: false, lauf: null };
    if (!prog.length) { res.grund = "leer"; res.text = TEXTE.leer; return res; }

    var lauf = run(aufgabe.feld, prog, { ziel: zielfeld(aufgabe.ziel) });
    res.lauf = lauf;
    if (!lauf.ok) { res.grund = lauf.fehler; res.text = TEXTE[lauf.fehler] || TEXTE.unbekannt; return res; }

    var z = aufgabe.ziel;
    var pruef = ZIELTYPEN[z.typ];
    if (!pruef) throw new Error("Unbekannter Zieltyp: " + z.typ);
    var miss = pruef(z, lauf);
    res.zielErreicht = !miss;

    if (max !== null && n > max) {
      res.grund = "bloecke";
      res.text = "Sie haben " + n + " von höchstens " + max + " Bausteinen verwendet.";
      return res;
    }
    if (miss) { res.grund = miss.grund; res.text = miss.text; return res; }
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
    run: run, pruefe: pruefe, bausteineText: bausteineText, vorbereiten: vorbereiten, zielfeld: zielfeld
  };
});
