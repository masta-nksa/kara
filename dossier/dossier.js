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

  function baustein(b) {
    if (b.t === "while") {
      var w = el("div", "sg-w");
      w.append(el("div", "sg-kopf", "solange " + b.cond));
      var r = el("div", "sg-rumpf");
      r.append(el("div", "sg-balken"), folge(b.body));
      w.append(r);
      return w;
    }
    if (b.t === "if") {
      var v = el("div", "sg-v"), k = el("div", "sg-vkopf");
      k.append(dreieck(), el("span", "sg-bed", b.cond), el("span", "sg-ja", "Ja"), el("span", "sg-nein", "Nein"));
      var aeste = el("div", "sg-aeste");
      aeste.append(folge(b.yes), folge(b.no));
      v.append(k, aeste);
      return v;
    }
    var a = el("div", "sg-a", b.cmd), kommentar = E.printKommentar(b.cmd);
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

  var knopf = document.getElementById("drucken");
  if (knopf) knopf.addEventListener("click", function () { window.print(); });
})();
