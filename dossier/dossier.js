/* ============================================================
   dossier.js – zeichnet Struktogramme und Schreibtisch-Tabellen
   für das Dossier. Programme im Format des Baukastens; Werte der
   ausgefüllten Zeilen rechnet engine.js aus.
   ============================================================ */
(function () {
  "use strict";

  var E = window.BaukastenEngine;

  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function dreieck() {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 100 100");
    s.setAttribute("preserveAspectRatio", "none");
    s.setAttribute("aria-hidden", "true");
    [0, 100].forEach(function (x) {
      var l = document.createElementNS(ns, "line");
      l.setAttribute("x1", x); l.setAttribute("y1", 0);
      l.setAttribute("x2", 50); l.setAttribute("y2", 100);
      s.append(l);
    });
    return s;
  }

  function folge(liste) {
    var f = el("div", "sg-folge");
    if (!liste.length) f.append(el("div", "sg-a sg-leer"));
    liste.forEach(function (b) { f.append(baustein(b)); });
    return f;
  }

  // Käfer-Befehle und -Bedingungen tragen die Namen aus der Engine («vorwärts», «Feld links frei?»);
  // in der Zahlenwelt steht der Python-Text selbst.
  function befehl(cmd) { return E.BEFEHLE[cmd] ? E.BEFEHLE[cmd].label : cmd; }
  function bedingung(c) { return E.BEDINGUNGEN[c] ? E.BEDINGUNGEN[c].label : c; }

  function rumpf(kopf, body) {
    var w = el("div", "sg-w");
    w.append(el("div", "sg-kopf", kopf));
    var r = el("div", "sg-rumpf");
    r.append(el("div", "sg-balken"), folge(body));
    w.append(r);
    return w;
  }

  function baustein(b) {
    if (b.t === "while") return rumpf("solange " + (E.BEDINGUNGEN[b.cond] ? E.BEDINGUNGEN[b.cond].solange : b.cond), b.body);
    if (b.t === "until") return rumpf("wiederhole bis Ziel", b.body);
    // n darf ein Platzhalter sein (z. B. «___»), den die Lernenden ausfüllen
    if (b.t === "loop") return rumpf("wiederhole " + b.n + "-mal", b.body);
    if (b.t === "if") {
      var v = el("div", "sg-v"), k = el("div", "sg-vkopf");
      k.append(dreieck(), el("span", "sg-bed", bedingung(b.cond)), el("span", "sg-ja", "Ja"), el("span", "sg-nein", "Nein"));
      var aeste = el("div", "sg-aeste");
      aeste.append(folge(b.yes), folge(b.no));
      v.append(k, aeste);
      return v;
    }
    // cmd "" ist eine leere Anweisung zum Ausfüllen
    var a = el("div", b.cmd ? "sg-a" : "sg-a sg-leer", befehl(b.cmd)), kommentar = E.printKommentar(b.cmd);
    if (kommentar) a.append(el("span", "sg-kommentar", kommentar));
    return a;
  }

  // data-prog: Programmbaum als JSON
  document.querySelectorAll(".struktogramm").forEach(function (s) {
    s.append(folge(JSON.parse(s.dataset.prog)));
  });

  function kopfzeile(spalten, bedingung) {
    var tr = el("tr");
    tr.append(el("th", null, "Prüfung"));
    spalten.forEach(function (n) { tr.append(el("th", "ds-code", n)); });
    tr.append(el("th", bedingung === "Bedingung" ? "ds-bed" : "ds-code", bedingung), el("th", null, "Ausgabe"));
    var t = el("thead");
    t.append(tr);
    return t;
  }

  // Unveränderte Werte bleiben leer, wie im Baukasten.
  function zeileWerte(zeilen, i, spalten) {
    var z = zeilen[i], vor = i ? zeilen[i - 1].werte : {};
    return spalten.map(function (n) {
      return !i || vor[n] !== z.werte[n] ? (z.werte[n] === undefined ? "" : String(z.werte[n])) : "";
    }).concat([z.ja ? "wahr" : "falsch", z.ausgabe.join(", ")]);
  }

  // data-spalten: Variablen; data-von + data-eingabe: Programm, dessen Lauf die Zeilen liefert.
  // data-vorgabe: so viele Zeilen ausgefüllt (ohne Angabe alle); data-zeilen: Anzahl Zeilen.
  document.querySelectorAll(".schreibtisch").forEach(function (t) {
    var spalten = t.dataset.spalten.split(","), d = t.dataset, zeilen = [];
    if (d.von) {
      zeilen = E.runZahlen(JSON.parse(d.eingabe), JSON.parse(document.getElementById(d.von).dataset.prog)).zeilen;
    }
    var vorgabe = d.vorgabe === undefined ? zeilen.length : Number(d.vorgabe);
    var anzahl = d.zeilen ? Number(d.zeilen) : zeilen.length;
    var tab = el("table"), body = el("tbody");
    tab.append(kopfzeile(spalten, d.bedingung || (zeilen[0] && zeilen[0].bedingung) || "Bedingung"));
    for (var i = 0; i < anzahl; i++) {
      var tr = el("tr");
      tr.append(el("th", null, (i + 1) + "."));
      var werte = i < vorgabe ? zeileWerte(zeilen, i, spalten) : spalten.concat(["", ""]).map(function () { return ""; });
      werte.forEach(function (w) { tr.append(el("td", null, w)); });
      body.append(tr);
    }
    tab.append(body);
    t.append(tab);
  });

  // Käfer-Karte als Bild: data-karte (Zeilen mit «|» getrennt, oben zuerst; # Mauer, . Weg, S Start, Z Ziel),
  // data-blick (N, E, S, W), data-zelle (mm je Feld, Standard 5.5). Mit data-von (id eines Struktogramms)
  // zeichnet die Engine den Weg des Käfers ein; ohne bleibt die Karte leer zum Einzeichnen.
  var SVG = "http://www.w3.org/2000/svg", ZELLE = 14;
  function svgEl(name, attr) {
    var e = document.createElementNS(SVG, name);
    for (var k in attr) e.setAttribute(k, attr[k]);
    return e;
  }
  document.querySelectorAll(".karte").forEach(function (box) {
    var d = box.dataset, k = E.karteLesen(d.karte.split("|"), d.blick, "Karte"), feld = k.feld;
    var cols = feld.cols, rows = feld.rows, zelle = Number(d.zelle || 5.5);
    var s = svgEl("svg", { viewBox: "0 0 " + cols * ZELLE + " " + rows * ZELLE, role: "img", "aria-label": d.beschreibung || "Karte" });
    s.style.width = cols * zelle + "mm";
    d.karte.split("|").forEach(function (zeile, r) {
      for (var c = 0; c < cols; c++) {
        var ch = zeile.charAt(c);
        s.append(svgEl("rect", { x: c * ZELLE, y: r * ZELLE, width: ZELLE, height: ZELLE, fill: ch === "#" ? "#c4c4c4" : "#fff", stroke: "#777", "stroke-width": ".5" }));
        if (ch === "Z") {
          var z = svgEl("text", { x: c * ZELLE + ZELLE / 2, y: r * ZELLE + 11, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: "#000" });
          z.textContent = "Z";
          s.append(z);
        }
      }
    });
    function mitte(p) { return [(p[0] - 0.5) * ZELLE, (rows - p[1] + 0.5) * ZELLE]; }
    if (d.von) {
      var lauf = E.run(feld, JSON.parse(document.getElementById(d.von).dataset.prog), k.zielFeld ? { ziel: k.zielFeld } : undefined);
      var punkte = [feld.start];
      lauf.trace.forEach(function (e) {
        var q = punkte[punkte.length - 1];
        if (e.typ === "act" && (q[0] !== e.x || q[1] !== e.y)) punkte.push([e.x, e.y]);
      });
      s.append(svgEl("polyline", { points: punkte.map(function (p) { return mitte(p).join(","); }).join(" "), fill: "none", stroke: "#0F6B63", "stroke-width": 2, "stroke-linejoin": "round" }));
    }
    // Start: Dreieck in Blickrichtung
    var m = mitte(feld.start), r = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[feld.blick], q = [-r[1], r[0]];
    function pt(a, b) { return (m[0] + r[0] * a + q[0] * b) + "," + (m[1] + r[1] * a + q[1] * b); }
    s.append(svgEl("polygon", { points: [pt(5, 0), pt(-4, -4.5), pt(-4, 4.5)].join(" "), fill: "#000" }));
    box.append(s);
  });

  var knopf = document.getElementById("drucken");
  if (knopf) knopf.addEventListener("click", function () { window.print(); });
})();
