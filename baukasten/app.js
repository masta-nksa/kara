/* ============================================================
   app.js – Oberfläche des Struktogramm-Baukastens (Käfer)
   Bausteine ziehen (Pointer Events: Maus und Touch) oder antippen /
   per Tastatur wählen, Struktogramm bauen, Käfer ablaufen lassen.
   Interpreter und Prüfung stehen in engine.js (ohne DOM).
   ============================================================ */
(function () {
  "use strict";

  var E = window.BaukastenEngine;
  var C = window.KaraChallenges || null;   // eigene Challenges (assets/challenges.js)
  var SPEICHER = "kara.baukasten.v1";
  var TEMPO = [1100, 700, 420, 220, 90, 35, 10];
  var TEMPO_TEXT = ["sehr langsam", "langsam", "mittel", "schnell", "sehr schnell", "blitzschnell", "Turbo"];
  var TEMPO_NUR_BEWEGUNG = 6;      // ab dieser Stufe kosten nur Bewegungen Zeit (für grosse Labyrinthe)
  var KAMERA_AB = 13, KAMERA_SICHT = 11;   // grössere Karten: Ansicht fährt mit, 11 × 11 Felder sichtbar
  var Z = 40, RAND = 20;                       // Zellgrösse und Randbreite (SVG-Einheiten)
  var SCREEN_DIR = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  var WINKEL = { N: 0, E: 90, S: 180, W: 270 };
  var NS = "http://www.w3.org/2000/svg";

  var $ = function (id) { return document.getElementById(id); };
  var palette = $("palette"), arbeit = $("arbeit"), korb = $("korb");
  var feldBox = $("feld"), meldungBox = $("meldung"), tempoEl = $("tempo");

  var REIHEN = [];                 // aus reihen.json
  var reihe = null, reihenCache = {};
  var aufgaben = [], aktuell = 0, aufg = null;
  var prog = [], undoStack = [];
  var zustand = {};                // pro Aufgabe: {prog, undo}
  var geloest = {};
  var auswahl = null;              // {quelle:"palette",typ,cmd} | {quelle:"block",adr}
  var fokusZiel = null;
  var eingabe = "zeiger";
  var unterdruecke = false;
  var drag = null;
  var sim = { lauf: null, i: 0, laeuft: false, ende: false, timer: 0, winkel: 0 };
  var feldRef = null;

  /* ---------- Helfer ---------------------------------------- */

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function svgEl(tag, attrs, cls) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (cls) n.setAttribute("class", cls);
    return n;
  }
  function adrStr(adr) { return adr.join("/"); }
  function adrParse(s) {
    if (s === "") return [];
    return s.split("/").map(function (t) { return /^\d+$/.test(t) ? Number(t) : t; });
  }
  function nur(liste, f) { return Array.prototype.filter.call(liste, f); }

  var BIS_LABEL = "wiederhole bis Ziel";

  function blockLabel(b) {
    if (b.t === "act") return E.BEFEHLE[b.cmd].label;
    if (b.t === "loop") return "wiederhole " + b.n + "-mal";
    if (b.t === "until") return BIS_LABEL;
    return E.BEDINGUNGEN[b.cond].label;
  }
  function quelleLabel(q) {
    if (q.quelle === "block") return blockLabel(E.blockAt(prog, q.adr));
    if (q.typ === "act") return E.BEFEHLE[q.cmd].label;
    if (q.typ === "loop") return "wiederhole n-mal";
    if (q.typ === "until") return BIS_LABEL;
    return E.BEDINGUNGEN[q.cmd || "frei"].label;
  }
  // Verzweigungen sind standardmässig mit Sonst-Zweig; Aufgaben können «sonst: false» verlangen.
  function neuerBlock(q) { return E.neuerBlock(q.typ, q.cmd, aufg.palette.sonst === false ? false : true); }
  function quelleBlock(q) {
    return q.quelle === "block" ? E.blockAt(prog, q.adr) : neuerBlock(q);
  }
  function istBehaelterMitBody(b) { return b.t === "loop" || b.t === "until"; }

  /* ---------- Fortschritt (localStorage, immer mit try/catch) - */

  var PROG_SPEICHER = "kara.baukasten.prog.v1";

  // Einmalige Übernahme aus dem früheren Baukasten in masta-nksa/checks (gleiche Herkunft
  // masta-nksa.github.io, darum im selben localStorage). Danach getrennte Schlüssel.
  function uebernehmeAlt(neu, alt) {
    try {
      if (localStorage.getItem(neu) === null && localStorage.getItem(alt) !== null) localStorage.setItem(neu, localStorage.getItem(alt));
    } catch (e) { /* ohne Speicher weiter */ }
  }
  uebernehmeAlt(SPEICHER, "checks.baukasten.v1");
  uebernehmeAlt(PROG_SPEICHER, "checks.baukasten.prog.v1");
  var gespeicherteProgramme = {};

  function ladeProgramme() {
    try {
      var d = JSON.parse(localStorage.getItem(PROG_SPEICHER) || "{}");
      if (d && typeof d === "object" && !Array.isArray(d)) gespeicherteProgramme = d;
    } catch (e) { gespeicherteProgramme = {}; }
  }
  // Der aktuelle Stand der Aufgabe bleibt auch nach Seitenwechsel oder Neuladen erhalten.
  function speichereProgramm() {
    if (prog.length) gespeicherteProgramme[aufg.id] = prog; else delete gespeicherteProgramme[aufg.id];
    try { localStorage.setItem(PROG_SPEICHER, JSON.stringify(gespeicherteProgramme)); } catch (e) { /* ohne Speicher weiter */ }
  }
  function gespeichertesProgramm(a) {
    var p = gespeicherteProgramme[a.id];
    return Array.isArray(p) && p.length && E.validiere(p, maxTiefe(a)) === null ? E.klonen(p) : null;
  }

  function ladeFortschritt() {
    try {
      var d = JSON.parse(localStorage.getItem(SPEICHER) || "{}");
      if (d && typeof d.geloest === "object" && d.geloest) geloest = d.geloest;
    } catch (e) { geloest = {}; }
  }
  function speichereFortschritt() {
    try { localStorage.setItem(SPEICHER, JSON.stringify({ geloest: geloest })); } catch (e) { /* ohne Speicher weiter */ }
  }

  /* ---------- Start ----------------------------------------- */

  var rule = $("pixelrule");
  for (var pi = 0; pi < 40; pi++) rule.append(document.createElement("i"));

  var reiheParam = null, aufgabeParam = null;
  try {
    var such = new URLSearchParams(location.search);
    reiheParam = such.get("reihe");
    aufgabeParam = such.get("aufgabe");
  } catch (e) { /* ohne Parameter weiter */ }

  // Adresszeile zeigt Reihe und Aufgabe: Neuladen und Links aus der Übersicht landen am richtigen Ort.
  function adresseSetzen() {
    try {
      var u = new URL(location.href);
      u.searchParams.set("reihe", reihe.id);
      u.searchParams.set("aufgabe", aufg.id);
      history.replaceState(null, "", u.href);
    } catch (e) { /* Adresszeile bleibt, wie sie ist */ }
  }

  function ladeFehler(err, datei) {
    var box = el("div", "oops");
    box.append(el("h2", null, "Der Baukasten kann nicht geladen werden."));
    var p = el("p");
    p.innerHTML = "Die Datei <code>" + datei + "</code> fehlt oder enthält einen Fehler. " +
      "Bitte melden Sie das der Lehrperson.<br><code>" + String(err && err.message ? err.message : err) + "</code>";
    box.append(p);
    $("bk").textContent = "";
    $("bk").append(box);
    console.error("[baukasten]", err);
  }

  function holeJson(datei) {
    return fetch(datei, { cache: "no-cache" })
      .then(function (res) { if (!res.ok) throw new Error(datei + ": HTTP " + res.status); return res.json(); });
  }

  // Eine Reihe kann aus mehreren Dateien bestehen (reihen.json, Feld «dateien»): so lassen sich
  // Reihen später zusammenlegen, ohne die Aufgaben-Dateien anzufassen.
  // Reihen mit «lokal: true» hängen die Challenges aus diesem Browser an (nicht zwischengespeichert,
  // weil sie sich jederzeit ändern können).
  function ladeReihe(r) {
    if (reihenCache[r.id]) return Promise.resolve(reihenCache[r.id]);
    return Promise.all(r.dateien.map(holeJson)).then(function (teile) {
      var liste = [];
      teile.forEach(function (d, i) {
        if (!d || !Array.isArray(d.aufgaben) || !d.aufgaben.length) throw new Error(r.dateien[i] + ": Feld „aufgaben“ fehlt oder ist leer.");
        liste = liste.concat(d.aufgaben.map(E.vorbereiten));
      });
      if (r.lokal && C) {
        C.alle().forEach(function (ch) {
          try { liste.push(E.vorbereiten(C.alsAufgabe(ch))); } catch (e) { console.warn("[baukasten] Challenge übersprungen", e); }
        });
      } else reihenCache[r.id] = liste;
      return liste;
    });
  }

  /* ---------- Challenge per Link übernehmen ----------------- */

  // Ein Link wie baukasten/?reihe=eigene#challenge=… bringt eine Challenge mit. Erst nach Rückfrage
  // wird sie in diesem Browser gespeichert. Der #-Teil wird sofort aus der Adresszeile entfernt.
  function importieren() {
    return new Promise(function (fertig) {
      var hash = location.hash || "";
      if (!C || hash.indexOf("challenge=") < 0) { fertig(); return; }
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* Adresse bleibt */ }
      var d = $("importDialog"), ch = null;
      try { ch = C.dekodieren(hash); } catch (e) {
        $("importText").textContent = "Dieser Link enthält keine gültige Challenge.";
        $("importFehler").textContent = e.message;
        $("importFehler").hidden = false;
        $("importJa").hidden = true;
        $("importNein").textContent = "Schliessen";
      }
      if (ch) {
        var id = C.kennung(ch), schon = !!C.finde(id);
        var verd = ch.layouts.filter(function (l) { return l.verdeckt; }).length;
        $("importText").textContent = "«" + ch.titel + "»: " + ch.layouts.length + (ch.layouts.length === 1 ? " Labyrinth" : " Labyrinthe") +
          (verd ? ", davon " + verd + " verdeckt" : "") + (ch.maxBloecke ? ", höchstens " + ch.maxBloecke + " Bausteine" : "") + ". " +
          (schon ? "Diese Challenge ist schon in Ihrem Browser." : "Möchten Sie sie in Ihren Browser übernehmen? Sie wird nur hier gespeichert.");
        $("importJa").textContent = schon ? "Spielen" : "Hinzufügen und spielen";
        $("importJa").onclick = function () {
          var r = C.hinzufuegen(ch);
          reiheParam = "eigene";
          aufgabeParam = r.id;
          if (!r.gespeichert) importHinweis = "Der Browser erlaubt kein Speichern. Die Challenge ist nicht dauerhaft übernommen.";
          d.close();
        };
      }
      $("importNein").onclick = function () { d.close(); };
      d.addEventListener("close", function () { fertig(); }, { once: true });
      d.showModal();
    });
  }
  var importHinweis = null;

  function zeigeReihe(r) {
    return ladeReihe(r).then(function (liste) {
      reihe = r;
      aufgaben = liste;
      var start = 0;
      if (aufgabeParam) {
        liste.forEach(function (x, i) { if (x.id === aufgabeParam) start = i; });
        aufgabeParam = null;
      }
      reihenAktualisieren();
      baueTabs();
      waehleAufgabe(start);
    }).catch(function (err) { ladeFehler(err, r.dateien.join(", ")); });
  }

  function baueReihen() {
    var box = $("reihen");
    REIHEN.forEach(function (r) {
      var b = el("button", "bk-reihe", r.titel);
      b.type = "button";
      b.dataset.id = r.id;
      b.addEventListener("click", function () { if (r !== reihe) zeigeReihe(r); });
      box.append(b);
    });
  }
  function reihenAktualisieren() {
    Array.prototype.forEach.call($("reihen").querySelectorAll(".bk-reihe"), function (b) {
      b.setAttribute("aria-pressed", b.dataset.id === reihe.id ? "true" : "false");
    });
  }

  // Eigenes Bild gewählt oder entfernt: Feld neu zeichnen, Ablauf zurücksetzen.
  if (window.BaukastenFigur) window.BaukastenFigur.onChange = function () { if (aufg) { renderFeld(); simReset(); } };

  ladeFortschritt();
  ladeProgramme();
  importieren().then(function () { return holeJson("reihen.json"); }).then(function (d) {
    if (!d || !Array.isArray(d.reihen) || !d.reihen.length) throw new Error("reihen.json: Feld „reihen“ fehlt oder ist leer.");
    REIHEN = d.reihen.filter(function (r) { return r && r.id && Array.isArray(r.dateien) && r.dateien.length; });
    reihe = REIHEN[0];
    REIHEN.forEach(function (r) { if (r.id === reiheParam) reihe = r; });
    baueReihen();
    return zeigeReihe(reihe).then(function () { if (importHinweis) meldungZeigen("fehler", null, importHinweis); });
  }).catch(function (err) { ladeFehler(err, "reihen.json"); });

  /* ---------- Aufgabenwahl ---------------------------------- */

  function baueTabs() {
    var ol = $("aufgabenListe");
    ol.textContent = "";
    aufgaben.forEach(function (a, i) {
      var li = el("li");
      var b = el("button", "bk-tab");
      b.type = "button";
      b.dataset.i = i;
      b.append(el("span", null, a.titel));
      b.append(el("span", "haken"));
      b.addEventListener("click", function () { waehleAufgabe(i); });
      li.append(b);
      ol.append(li);
    });
    tabsAktualisieren();
  }

  function tabsAktualisieren() {
    Array.prototype.forEach.call($("aufgabenListe").querySelectorAll(".bk-tab"), function (b, i) {
      var a = aufgaben[i], fertig = !!geloest[a.id];
      b.setAttribute("aria-current", i === aktuell ? "true" : "false");
      b.querySelector(".haken").textContent = fertig ? "✓" : "";
      b.setAttribute("aria-label", a.titel + (fertig ? ", gelöst" : ""));
    });
  }

  function maxTiefe(a) { return (a || aufg).maxTiefe || E.MAX_TIEFE; }

  function startProgramm(a) {
    var p = a.startprogramm ? E.klonen(a.startprogramm) : [];
    return E.validiere(p, maxTiefe(a)) === null ? p : [];
  }

  function waehleAufgabe(i) {
    if (aufg) zustand[aufg.id] = { prog: prog, undo: undoStack };
    aktuell = i;
    aufg = aufgaben[i];
    var z = zustand[aufg.id];
    prog = z ? z.prog : (gespeichertesProgramm(aufg) || startProgramm(aufg));
    undoStack = z ? z.undo : [];
    auswahl = null;
    fokusZiel = null;

    $("aufgabeTitel").textContent = aufg.titel;
    $("aufgabeText").textContent = aufg.text;
    tippStufe = 1;
    $("hinweisBox").open = false;
    renderHinweise();
    challengeLeiste();
    nebelFuerAufgabe();
    layout = { idx: 0, ergebnisse: {}, aufgedeckt: {}, zufall: [] };
    aufg.feld = aufg.felder[0].feld;
    aufg.ziel = aufg.felder[0].ziel;

    tabsAktualisieren();
    adresseSetzen();
    renderPalette();
    var p = aufg.palette;
    $("zaehlwerk").hidden = !((p.befehle || []).some(function (c) { return /^zaehler/.test(c); }) ||
      (p.bedingungen || []).indexOf("zaehlerIstNull") >= 0);
    renderLayouts();
    renderFeld();
    simReset();
    renderBau();
  }

  /* ---------- Hinweise (gestuft: jeder weitere Tipp erst auf Klick) - */

  var tippStufe = 1;
  function hinweisListe() { return aufg.hinweise || (aufg.hinweis ? [aufg.hinweis] : []); }
  function renderHinweise() {
    var liste = hinweisListe(), box = $("hinweisListe");
    $("hinweisBox").hidden = !liste.length;
    box.textContent = "";
    liste.slice(0, tippStufe).forEach(function (t) { box.append(el("p", null, t)); });
    var knopf = $("knopfTipp");
    knopf.hidden = tippStufe >= liste.length;
    knopf.textContent = "Noch ein Tipp (" + (tippStufe + 1) + " von " + liste.length + ")";
  }
  $("knopfTipp").addEventListener("click", function () { tippStufe++; renderHinweise(); });

  /* ---------- Eigene Challenges: Teilen, Bearbeiten, Entfernen ---------- */

  // Jede Aufgabe lässt sich teilen: eingebaute als direkter Link auf die Aufgabe, eigene Challenges
  // als Link mit der ganzen Challenge (für Leute, die sie noch nicht im Browser haben).
  function challengeLeiste() {
    var ch = aufg.challenge && C ? C.finde(aufg.id) : null;
    $("challengeLeiste").hidden = false;
    $("chBearbeiten").hidden = $("chEntfernen").hidden = !ch;
    $("chLink").hidden = true;
    $("chMeldung").hidden = true;
    $("chBearbeiten").href = "../editor/?id=" + encodeURIComponent(aufg.id);
    $("editorLink").hidden = !(reihe && reihe.lokal);
  }
  function chMeldung(text) { $("chMeldung").textContent = text; $("chMeldung").hidden = !text; }
  function aufgabenLink() {
    var u = new URL(location.href);
    u.search = "";
    u.hash = "";
    u.searchParams.set("reihe", reihe.id);
    u.searchParams.set("aufgabe", aufg.id);
    return u.href;
  }
  $("chTeilen").addEventListener("click", function () {
    var ch = aufg.challenge && C ? C.finde(aufg.id) : null;
    var url = ch ? C.link(ch, location.href) : aufgabenLink(), feld = $("chLink");
    feld.value = url;
    feld.hidden = false;
    feld.focus();
    feld.select();
    var fertig = function (ok) {
      chMeldung(!ok ? "Bitte den Link markieren und kopieren."
        : ch ? "Link kopiert. Wer ihn öffnet, kann die Challenge in den eigenen Browser übernehmen."
          : "Link kopiert. Er öffnet genau diese Aufgabe.");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { fertig(true); }, function () { fertig(false); });
    else fertig(false);
  });
  $("chEntfernen").addEventListener("click", function () {
    if (!C || !confirm("«" + aufg.titel.replace(/^★ /, "") + "» aus diesem Browser entfernen?")) return;
    C.entfernen(aufg.id);
    zeigeReihe(reihe);
  });

  /* ---------- Mehrere Labyrinthe ---------------------------- */

  // idx: angezeigtes Labyrinth; ergebnisse: letzte Prüfung je Name; aufgedeckt: verdeckte, die
  // gescheitert sind und darum sichtbar werden; zufall: gescheiterte Zufallslabyrinthe (zum Ansehen).
  var layout = { idx: 0, ergebnisse: {}, aufgedeckt: {}, zufall: [] };
  var MAX_ZUFALL_ZEIGEN = 3;

  function mehrereLayouts() { return aufg.felder.length > 1 || !!aufg.zufall; }
  function sichtbareFelder() {
    return aufg.felder.filter(function (f) { return !f.verdeckt || layout.aufgedeckt[f.name]; }).concat(layout.zufall);
  }
  function kurzName(f) { return f.name.replace("Layout ", "").replace("Verdeckt ", "V").replace("Zufall ", "Z"); }

  function layoutSetzen(i) {
    var liste = sichtbareFelder();
    layout.idx = Math.max(0, Math.min(i, liste.length - 1));
    aufg.feld = liste[layout.idx].feld;
    aufg.ziel = liste[layout.idx].ziel;
    renderLayouts();
    renderFeld();
    simReset();
  }

  function renderLayouts() {
    var box = $("layouts");
    var mehr = mehrereLayouts();
    box.hidden = !mehr;
    $("knopfAlle").hidden = !mehr;
    box.textContent = "";
    if (!mehr) return;
    sichtbareFelder().forEach(function (f, i) {
      var r = layout.ergebnisse[f.name];
      var b = el("button", "bk-lay" + (f.verdeckt ? " verdeckt" : "") + (f.zufall ? " zufall" : ""));
      b.type = "button";
      b.append(el("span", null, kurzName(f)));
      if (r) b.append(el("span", "bk-lay-marke " + (r.ok ? "ok" : "fehl"), r.ok ? "✓" : "✗"));
      b.setAttribute("aria-pressed", i === layout.idx ? "true" : "false");
      b.setAttribute("aria-label", f.name + (r ? (r.ok ? ", geschafft" : ", nicht geschafft: " + r.text) : ""));
      b.title = f.name + (r && !r.ok ? ": " + r.text : "");
      b.addEventListener("click", function () { if (i !== layout.idx) layoutSetzen(i); });
      box.append(b);
    });
    var info = [], verd = aufg.felder.filter(function (f) { return f.verdeckt && !layout.aufgedeckt[f.name]; }).length;
    if (verd) info.push(verd + " verdeckt");
    if (aufg.zufall) info.push(aufg.zufall.anzahl + " zufällig");
    if (info.length) box.append(el("span", "bk-lay-info", "+ " + info.join(", ")));
  }

  // Bei jeder Prüfung neue Zufallslabyrinthe (inselfrei, Ein- und Ausgang im Rahmen).
  function zufallsFelder() {
    var z = aufg.zufall;
    if (!z) return [];
    var seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0, liste = [];
    for (var i = 0; i < z.anzahl; i++) {
      var karte = E.erzeugeLabyrinth(seed + i, z.raeume || 5, z.inseln ? { inseln: z.inseln } : undefined);
      var f = E.layoutVorbereiten(karte, "Zufall " + (i + 1), false, "Zufall");
      f.zufall = true;
      liste.push(f);
    }
    return liste;
  }

  // Prüft in allen Labyrinthen. Gescheiterte verdeckte und zufällige werden sichtbar.
  function pruefenAlle() {
    var aktiv = sichtbareFelder()[layout.idx];
    var extra = zufallsFelder();
    var res = E.pruefe(aufg, prog, extra);
    layout.ergebnisse = {};
    res.ergebnisse.forEach(function (r) { layout.ergebnisse[r.name] = r; });
    res.ergebnisse.forEach(function (r) { if (r.verdeckt && !r.ok) layout.aufgedeckt[r.name] = true; });
    layout.zufall = extra.filter(function (f) { return !layout.ergebnisse[f.name].ok; }).slice(0, MAX_ZUFALL_ZEIGEN);
    var neu = sichtbareFelder().indexOf(aktiv);
    layout.idx = neu >= 0 ? neu : 0;
    renderLayouts();
    return res;
  }

  var GRUND_KURZ = {
    anstoss: "stösst an", kreis: "läuft im Kreis", limit: "läuft zu lange",
    endfeld: "kommt nicht zum Ausgang", fehlend: "verpasst Felder", zusaetzlich: "zu viele Felder"
  };

  function kleinsteText(n) {
    var k = aufg.kleinsteLoesung;
    if (!k) return "";
    if (n < k) return " Das ist kleiner als die kleinste bekannte Lösung mit " + k + " Bausteinen. Stark!";
    if (n === k) return " Das ist die kleinste bekannte Lösung.";
    return " Kleinste bekannte Lösung: " + k + " Bausteine.";
  }

  /* ---------- Palette --------------------------------------- */

  function renderPalette() {
    palette.textContent = "";
    var p = aufg.palette;
    (p.befehle || []).forEach(function (c) {
      if (E.BEFEHLE[c]) palette.append(chip({ typ: "act", cmd: c }, E.BEFEHLE[c].label, "bk-pal-act"));
    });
    if (p.wiederholung) palette.append(chip({ typ: "loop" }, "wiederhole n-mal", "bk-pal-loop"));
    if (p.bis) palette.append(chip({ typ: "until" }, BIS_LABEL, "bk-pal-loop"));
    if (p.verzweigung) {
      (p.bedingungen || ["frei"]).forEach(function (c) {
        if (E.BEDINGUNGEN[c]) palette.append(chip({ typ: "if", cmd: c }, E.BEDINGUNGEN[c].label, "bk-pal-if"));
      });
    }
  }

  function chip(q, text, cls) {
    var b = el("button", "bk-pal " + cls);
    b.type = "button";
    b.dataset.typ = q.typ;
    if (q.cmd) b.dataset.cmd = q.cmd;
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", "Baustein " + text + ". Ziehen, oder antippen und dann eine Ablagestelle wählen.");
    if (q.typ === "if") {
      var s = svgEl("svg", { viewBox: "0 0 26 20", "aria-hidden": "true" });
      s.append(svgEl("line", { x1: 0, y1: 0, x2: 13, y2: 20 }), svgEl("line", { x1: 26, y1: 0, x2: 13, y2: 20 }));
      b.append(s);
    }
    b.append(el("span", null, text));
    return b;
  }

  /* ---------- Struktogramm zeichnen ------------------------- */

  function renderBau() {
    arbeit.textContent = "";
    var baum = el("div", "bk-baum");
    baum.append(renderZone(prog, []));
    // Sehr schmale Anzeige: lieber seitlich scrollen als Wörter zerreissen.
    baum.style.minWidth = (gewicht(prog) * 92 + 30 * E.tiefe(prog)) + "px";
    arbeit.append(baum);
    zaehlerAktualisieren();
    $("knopfRueckgaengig").disabled = !undoStack.length;
    auswahlAnwenden();

    if (fokusZiel) {
      var f = fokusZiel, t = null;
      fokusZiel = null;
      if (f.art === "block") t = arbeit.querySelector('.bk-blk[data-adr="' + adrStr(f.adr) + '"] .bk-main');
      else if (f.art === "slot") t = arbeit.querySelector('.bk-slot[data-liste="' + f.liste + '"][data-idx="' + f.idx + '"]:not(.ungueltig)');
      if (!t) t = palette.querySelector(".bk-pal");
      if (t) t.focus();
    }
  }

  function renderZone(liste, ladr) {
    var zone = el("div", "bk-zone");
    zone.dataset.adr = adrStr(ladr);
    if (!liste.length) { zone.append(slot(ladr, 0, 0, true)); return zone; }
    liste.forEach(function (b, i) {
      zone.append(slot(ladr, i, liste.length, false));
      zone.append(renderBlock(b, ladr.concat([i]), liste.length));
    });
    zone.append(slot(ladr, liste.length, liste.length, false));
    return zone;
  }

  function slotText(ladr, idx, len) {
    var wo = "im Programm";
    if (ladr.length) {
      var pb = E.blockAt(prog, ladr.slice(0, -1)), key = ladr[ladr.length - 1];
      wo = istBehaelterMitBody(pb) ? "in «" + blockLabel(pb) + "»"
        : "im " + (key === "yes" ? "Ja" : "Nein") + "-Zweig von «" + blockLabel(pb) + "»";
    }
    return "Hier einfügen: " + wo + ", Position " + (idx + 1) + " von " + (len + 1);
  }

  function slot(ladr, idx, len, leer) {
    var b = el("button", "bk-slot" + (leer ? " leer" : ""));
    b.type = "button";
    b.disabled = true;
    b.dataset.liste = adrStr(ladr);
    b.dataset.idx = idx;
    b.setAttribute("aria-label", slotText(ladr, idx, len));
    b.append(el("span", "bk-slot-text", leer ? (ladr.length ? "hier ablegen" : "Bausteine hierher ziehen") : "hier einfügen"));
    return b;
  }

  function mainBtn(b, adr, liste, text) {
    var m = el("button", "bk-main", text);
    m.type = "button";
    var i = adr[adr.length - 1];
    m.setAttribute("aria-label", blockLabel(b) + ", Position " + (i + 1) + " von " + liste + ", Ebene " + (adr.length / 2 + 0.5) +
      ". Eingabetaste: zum Verschieben wählen. Entf: löschen.");
    return m;
  }
  function delBtn() {
    var d = el("button", "bk-del nograb", "×");
    d.type = "button";
    d.setAttribute("aria-label", "Baustein löschen");
    d.title = "Baustein löschen";
    return d;
  }

  // Relative Breite einer Liste in einer Verzweigung: Zweige mit verschachtelten Verzweigungen
  // bekommen mehr Platz, damit alle Blätter etwa gleich breit bleiben.
  function gewicht(liste) {
    var m = 1;
    liste.forEach(function (b) {
      var g = 1;
      if (b.t === "loop" || b.t === "until") g = gewicht(b.body);
      else if (b.t === "if") g = gewicht(b.yes) + gewicht(b.no);
      if (g > m) m = g;
    });
    return m;
  }

  function renderBlock(b, adr, laenge) {
    var blk = el("div", "bk-blk bk-" + b.t);
    blk.dataset.adr = adrStr(adr);
    var ebene = Math.min(5, (adr.length - 1) / 2);      // 0 = oberste Ebene; je tiefer, desto kleiner die Schrift
    blk.dataset.ebene = ebene;

    if (b.t === "act") {
      blk.classList.add("grab");
      blk.append(mainBtn(b, adr, laenge, ebene >= 2 && E.BEFEHLE[b.cmd].kurz ? E.BEFEHLE[b.cmd].kurz : blockLabel(b)), delBtn());
      return blk;
    }

    if (b.t === "until") {
      blk.classList.add("bk-loop");
      var kopfU = el("div", "bk-kopf grab");
      kopfU.append(mainBtn(b, adr, laenge, BIS_LABEL), el("span", "bk-spacer"), delBtn());
      blk.append(kopfU);
      var rumpfU = el("div", "bk-rumpf");
      rumpfU.append(el("div", "bk-balken grab"), renderZone(b.body, adr.concat(["body"])));
      blk.append(rumpfU);
      return blk;
    }

    if (b.t === "loop") {
      var kopf = el("div", "bk-kopf grab");
      var inp = el("input", "bk-n nograb");
      inp.type = "number"; inp.min = 1; inp.max = E.MAX_WIEDERHOLUNG; inp.step = 1; inp.value = b.n;
      inp.setAttribute("inputmode", "numeric");
      inp.setAttribute("aria-label", "Anzahl Wiederholungen (1 bis " + E.MAX_WIEDERHOLUNG + ")");
      var vorher = null;
      inp.addEventListener("focus", function () { vorher = JSON.stringify(prog); });
      inp.addEventListener("input", function () {
        var v = inp.value.trim(), n = Number(v);
        var ok = /^\d{1,2}$/.test(v) && n >= 1 && n <= E.MAX_WIEDERHOLUNG;
        inp.classList.toggle("ungueltig", !ok);
        if (ok) {
          E.blockAt(prog, adr).n = n;
          speichereProgramm();
          simReset();
          zaehlerAktualisieren();
        }
      });
      inp.addEventListener("change", function () {
        var bl = E.blockAt(prog, adr);
        inp.classList.remove("ungueltig");
        inp.value = bl.n;
        if (vorher !== null && vorher !== JSON.stringify(prog)) {
          undoStack.push(vorher);
          $("knopfRueckgaengig").disabled = false;
        }
        vorher = null;
      });
      kopf.append(mainBtn(b, adr, laenge, "wiederhole"), inp, el("span", "bk-mal", "-mal"), el("span", "bk-spacer"), delBtn());
      blk.append(kopf);
      var rumpf = el("div", "bk-rumpf");
      var balken = el("div", "bk-balken grab");
      rumpf.append(balken, renderZone(b.body, adr.concat(["body"])));
      blk.append(rumpf);
      return blk;
    }

    // Verzweigung
    var k2 = el("div", "bk-kopf grab");
    var dreieck = svgEl("svg", { viewBox: "0 0 100 100", preserveAspectRatio: "none", "aria-hidden": "true" }, "bk-dreieck");
    dreieck.append(svgEl("line", { x1: 0, y1: 0, x2: 50, y2: 100 }), svgEl("line", { x1: 100, y1: 0, x2: 50, y2: 100 }));
    var bed = E.BEDINGUNGEN[b.cond];
    k2.append(dreieck, mainBtn(b, adr, laenge, ebene >= 2 && bed.kurz ? bed.kurz : bed.label), el("span", "bk-ja", "Ja"), el("span", "bk-nein", "Nein"), delBtn());
    blk.append(k2);
    var aeste = el("div", "bk-aeste");
    aeste.style.gridTemplateColumns = "minmax(0," + gewicht(b.yes) + "fr) minmax(0," + (b.sonst === false ? 1 : gewicht(b.no)) + "fr)";
    var yes = el("div", "bk-ast"), no = el("div", "bk-ast");
    yes.append(renderZone(b.yes, adr.concat(["yes"])));
    if (b.sonst === false) {
      no.classList.add("bk-ast-aus");
      no.append(el("span", "bk-ast-text", "kein Sonst-Zweig"));
    } else no.append(renderZone(b.no, adr.concat(["no"])));
    aeste.append(yes, no);
    blk.append(aeste);
    return blk;
  }

  function zaehlerAktualisieren() {
    var n = E.zaehleBausteine(prog), max = aufg.maxBloecke == null ? null : aufg.maxBloecke;
    var z = $("zaehler");
    z.textContent = E.bausteineText(n, max);
    z.classList.toggle("zu-viele", max !== null && n > max);
  }

  /* ---------- Auswahl (antippen / Tastatur) ----------------- */

  function slotGueltig(s, q) {
    var ladr = adrParse(s.dataset.liste);
    if (q.quelle === "block" && E.istPraefix(q.adr, ladr)) return false;
    return E.kannEinfuegen(prog, ladr, quelleBlock(q), maxTiefe());
  }

  // Gibt es Ablagestellen, die nur wegen der Verschachtelungstiefe nicht angeboten werden?
  function tiefeVerhindert(q) {
    var block = quelleBlock(q);
    return Array.prototype.some.call(arbeit.querySelectorAll(".bk-slot"), function (s) {
      var ladr = adrParse(s.dataset.liste);
      if (q.quelle === "block" && E.istPraefix(q.adr, ladr)) return false;
      return E.zuTief(prog, ladr, block, maxTiefe());
    });
  }

  // Zeigt gültige Ablagestellen; q = Quelle beim Antippen oder Ziehen, sonst null.
  function slotsMarkieren(q, antippbar) {
    Array.prototype.forEach.call(arbeit.querySelectorAll(".bk-slot"), function (s) {
      var ok = q ? slotGueltig(s, q) : true;
      s.classList.toggle("ungueltig", !ok);
      s.classList.remove("heiss");
      s.disabled = !(antippbar && ok);
    });
  }

  function auswahlAnwenden() {
    Array.prototype.forEach.call(palette.querySelectorAll(".bk-pal"), function (c) {
      var an = !!auswahl && auswahl.quelle === "palette" && auswahl.typ === c.dataset.typ && (auswahl.cmd || null) === (c.dataset.cmd || null);
      c.setAttribute("aria-pressed", an ? "true" : "false");
    });
    Array.prototype.forEach.call(arbeit.querySelectorAll(".bk-blk"), function (b) {
      var an = !!auswahl && auswahl.quelle === "block" && b.dataset.adr === adrStr(auswahl.adr);
      b.classList.toggle("gewaehlt", an);
    });
    arbeit.classList.toggle("bk-waehlen", !!auswahl);
    slotsMarkieren(auswahl, !!auswahl);
    var info = $("auswahlInfo");
    info.hidden = !auswahl;
    if (auswahl) {
      $("auswahlText").textContent = "Baustein «" + quelleLabel(auswahl) + "» gewählt. " +
        (auswahl.quelle === "palette"
          ? "Wählen Sie eine gestrichelte Ablagestelle, um ihn einzufügen. Er bleibt gewählt, bis Sie abbrechen."
          : "Wählen Sie eine gestrichelte Ablagestelle, um ihn dorthin zu verschieben.") +
        (tiefeVerhindert(auswahl)
          ? " Manche Stellen fehlen, weil Wiederholungen und Verzweigungen höchstens " + maxTiefe() + " Ebenen tief ineinander stecken dürfen."
          : "");
    }
  }

  function auswaehlen(q, tastatur) {
    auswahl = q;
    auswahlAnwenden();
    if (tastatur) {
      var s = arbeit.querySelector(".bk-slot:not(.ungueltig):not(:disabled)");
      if (s) s.focus();
    }
  }

  function auswahlAufheben() {
    auswahl = null;
    auswahlAnwenden();
  }

  function gleicheQuelle(a, b) {
    if (!a || !b || a.quelle !== b.quelle) return false;
    return a.quelle === "block" ? adrStr(a.adr) === adrStr(b.adr)
      : a.typ === b.typ && (a.cmd || null) === (b.cmd || null);
  }

  function fokusZurueck(q) {
    var t = null;
    if (q.quelle === "block") t = arbeit.querySelector('.bk-blk[data-adr="' + adrStr(q.adr) + '"] .bk-main');
    else t = palette.querySelector('.bk-pal[data-typ="' + q.typ + '"]' + (q.cmd ? '[data-cmd="' + q.cmd + '"]' : ""));
    if (t) t.focus();
  }

  /* ---------- Programm ändern ------------------------------- */

  function aenderung(neu, opts) {
    fokusZiel = (opts && opts.fokus) || null;
    if (auswahl && auswahl.quelle === "block") auswahl = null;
    if (JSON.stringify(neu) !== JSON.stringify(prog)) {
      undoStack.push(JSON.stringify(prog));
      if (undoStack.length > 100) undoStack.shift();
      prog = neu;
    }
    speichereProgramm();
    simReset();
    renderBau();
  }

  function rueckgaengig() {
    if (!undoStack.length) return;
    prog = JSON.parse(undoStack.pop());
    auswahl = null;
    speichereProgramm();
    simReset();
    renderBau();
  }

  function loeschen(adr) {
    var neu = E.entfernen(prog, adr);
    if (!neu) return;
    var l = E.listeAt(neu, adr.slice(0, -1)), i = adr[adr.length - 1], f;
    if (l.length > i) f = { art: "block", adr: adr };
    else if (i > 0) f = { art: "block", adr: adr.slice(0, -1).concat([i - 1]) };
    else if (adr.length > 1) f = { art: "block", adr: adr.slice(0, -2) };
    else f = { art: "palette" };
    aenderung(neu, { fokus: f });
  }

  // Sucht die Adresse des mit _neu markierten Blocks und entfernt die Marke.
  function findeMarke(liste, adr) {
    for (var i = 0; i < liste.length; i++) {
      var b = liste[i], a = adr.concat([i]);
      if (b._neu) { delete b._neu; return a; }
      var keys = istBehaelterMitBody(b) ? ["body"] : b.t === "if" ? ["yes", "no"] : [];
      for (var k = 0; k < keys.length; k++) {
        var r = findeMarke(b[keys[k]], a.concat([keys[k]]));
        if (r) return r;
      }
    }
    return null;
  }

  // Führt Einfügen bzw. Verschieben aus. Liefert false, wenn die Stelle nicht passt.
  function ablegen(q, ladr, idx, tastatur) {
    var neu, fokus = null;
    if (q.quelle === "palette") {
      neu = E.einfuegen(prog, ladr, idx, neuerBlock(q), maxTiefe());
      // Befehle bleiben gewählt (mehrere hintereinander einfügen), Wiederholung/Verzweigung nur einmal.
      if (neu && q.typ !== "act") auswahl = null;
      if (neu && tastatur) fokus = q.typ === "act" ? { art: "slot", liste: adrStr(ladr), idx: idx + 1 } : { art: "block", adr: ladr.concat([idx]) };
    } else {
      var kopie = E.klonen(prog);
      E.blockAt(kopie, q.adr)._neu = true;
      neu = E.verschieben(kopie, q.adr, ladr, idx, maxTiefe());
      if (neu) {
        var a = findeMarke(neu, []);
        neu = E.klonen(neu);
        fokus = a ? { art: "block", adr: a } : null;
      }
    }
    if (!neu) return false;
    aenderung(neu, { fokus: fokus });
    return true;
  }

  /* ---------- Ziehen (Pointer Events) ----------------------- */

  document.addEventListener("keydown", function () { eingabe = "tastatur"; }, true);
  document.addEventListener("pointerdown", function () { eingabe = "zeiger"; }, true);
  document.addEventListener("click", function (e) {
    if (unterdruecke) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener("contextmenu", function (e) {
    if (e.target.closest && e.target.closest(".grab, .bk-pal")) e.preventDefault();
  });

  document.addEventListener("pointerdown", function (e) {
    if (drag || !(e.target instanceof Element)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest(".nograb")) return;
    var pal = e.target.closest(".bk-pal");
    var g = pal || e.target.closest("#arbeit .grab");
    if (!g) return;
    var q = pal
      ? { quelle: "palette", typ: pal.dataset.typ, cmd: pal.dataset.cmd || null }
      : { quelle: "block", adr: adrParse(g.closest(".bk-blk").dataset.adr) };
    drag = {
      q: q, el: g, id: e.pointerId, x0: e.clientX, y0: e.clientY, px: e.clientX, py: e.clientY,
      aktiv: false, touch: e.pointerType !== "mouse", ghost: null, heiss: null, korb: false, scroll: 0, raf: 0
    };
    try { g.setPointerCapture(e.pointerId); } catch (err) { /* ohne Capture weiter */ }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onAbbruch);
  });

  function ziehenStarten() {
    drag.aktiv = true;
    try { window.getSelection().removeAllRanges(); } catch (err) { /* ohne Auswahl weiter */ }
    if (auswahl) { auswahl = null; auswahlAnwenden(); }
    document.body.classList.add("bk-zieht");
    drag.ghost = el("div", "bk-ghost", quelleLabel(drag.q));
    document.body.append(drag.ghost);
    if (drag.q.quelle === "block") {
      var b = arbeit.querySelector('.bk-blk[data-adr="' + adrStr(drag.q.adr) + '"]');
      if (b) b.classList.add("quelle");
    }
    slotsMarkieren(drag.q, false);
  }

  function trefferSuchen() {
    var px = drag.px, py = drag.py - (drag.touch ? 56 : 0);
    var ghost = drag.ghost, gw = ghost.offsetWidth, gh = ghost.offsetHeight;
    ghost.style.transform = drag.touch
      ? "translate(" + (px - gw / 2) + "px," + (py - gh / 2) + "px)"
      : "translate(" + (px + 14) + "px," + (py + 14) + "px)";

    var korbTreffer = false;
    if (drag.q.quelle === "block") {
      [korb, palette].forEach(function (z) {
        var r = z.getBoundingClientRect();
        if (px >= r.left - 6 && px <= r.right + 6 && py >= r.top - 6 && py <= r.bottom + 6) korbTreffer = true;
      });
    }
    var best = null, bd = Infinity, bw = Infinity, max = drag.touch ? 44 : 30;
    if (!korbTreffer) {
      Array.prototype.forEach.call(arbeit.querySelectorAll(".bk-slot:not(.ungueltig)"), function (s) {
        var r = s.getBoundingClientRect();
        if (!r.width) return;
        var dx = Math.max(r.left - px, 0, px - r.right), dy = Math.max(r.top - py, 0, py - r.bottom);
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < bd - 0.5 || (Math.abs(d - bd) <= 0.5 && r.width < bw)) { best = s; bd = d; bw = r.width; }
      });
      if (bd > max) best = null;
    }
    if (drag.heiss !== best) {
      if (drag.heiss) drag.heiss.classList.remove("heiss");
      if (best) best.classList.add("heiss");
      drag.heiss = best;
    }
    if (drag.korb !== korbTreffer) {
      drag.korb = korbTreffer;
      korb.classList.toggle("heiss", korbTreffer);
      palette.classList.toggle("heiss", korbTreffer);
    }
  }

  function scrollSchleife() {
    if (!drag || !drag.aktiv || !drag.scroll) { if (drag) drag.raf = 0; return; }
    window.scrollBy(0, drag.scroll * 14);
    trefferSuchen();
    drag.raf = requestAnimationFrame(scrollSchleife);
  }

  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.px = e.clientX; drag.py = e.clientY;
    if (!drag.aktiv) {
      if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 7) return;
      ziehenStarten();
    }
    e.preventDefault();
    trefferSuchen();
    drag.scroll = e.clientY < 70 ? -1 : (e.clientY > window.innerHeight - 70 ? 1 : 0);
    if (drag.scroll && !drag.raf) drag.raf = requestAnimationFrame(scrollSchleife);
  }

  function ziehenBeenden() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onAbbruch);
    if (drag.raf) cancelAnimationFrame(drag.raf);
    if (drag.ghost) drag.ghost.remove();
    document.body.classList.remove("bk-zieht");
    korb.classList.remove("heiss");
    palette.classList.remove("heiss");
    var b = arbeit.querySelector(".bk-blk.quelle");
    if (b) b.classList.remove("quelle");
    try { drag.el.releasePointerCapture(drag.id); } catch (err) { /* schon frei */ }
    if (drag.aktiv) slotsMarkieren(auswahl, !!auswahl);
  }

  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    ziehenBeenden();
    drag = null;
    if (!d.aktiv) return;                       // kein Ziehen: normaler Klick folgt
    unterdruecke = true;
    setTimeout(function () { unterdruecke = false; }, 60);
    if (d.korb && d.q.quelle === "block") {
      loeschen(d.q.adr);
    } else if (d.heiss) {
      ablegen(d.q, adrParse(d.heiss.dataset.liste), Number(d.heiss.dataset.idx), false);
    }
  }

  function onAbbruch(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    ziehenBeenden();
    var aktiv = drag.aktiv;
    drag = null;
    if (aktiv) { unterdruecke = true; setTimeout(function () { unterdruecke = false; }, 60); }
  }

  /* ---------- Klicks, Tastatur ------------------------------ */

  document.addEventListener("click", function (e) {
    if (!(e.target instanceof Element)) return;
    var t = e.target, tastatur = e.detail === 0;

    var s = t.closest(".bk-slot");
    if (s) {
      if (!s.disabled && auswahl) {
        ablegen(auswahl, adrParse(s.dataset.liste), Number(s.dataset.idx), tastatur);
      }
      return;
    }
    var d = t.closest("#arbeit .bk-del");
    if (d) { loeschen(adrParse(d.closest(".bk-blk").dataset.adr)); return; }

    var pal = t.closest(".bk-pal");
    if (pal) {
      var qp = { quelle: "palette", typ: pal.dataset.typ, cmd: pal.dataset.cmd || null };
      if (gleicheQuelle(auswahl, qp)) auswahlAufheben(); else auswaehlen(qp, tastatur);
      return;
    }
    var g = t.closest("#arbeit .grab");
    if (g && !t.closest(".nograb")) {
      var qb = { quelle: "block", adr: adrParse(g.closest(".bk-blk").dataset.adr) };
      if (gleicheQuelle(auswahl, qb)) auswahlAufheben(); else auswaehlen(qb, tastatur);
      return;
    }
    if (auswahl && !t.closest(".bk-auswahl, #knopfRueckgaengig")) auswahlAufheben();
  });

  $("knopfAbbrechen").addEventListener("click", function (e) {
    e.stopPropagation();
    var q = auswahl;
    auswahlAufheben();
    if (q && e.detail === 0) fokusZurueck(q);
  });
  $("knopfRueckgaengig").addEventListener("click", rueckgaengig);
  $("knopfNeu").addEventListener("click", function () { auswahl = null; aenderung(startProgramm(aufg), { fokus: { art: "palette" } }); });

  function nachbar(liste, aktuellEl, richtung) {
    var i = liste.indexOf(aktuellEl);
    var n = liste[i + richtung];
    if (n) n.focus();
  }

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;

    if (e.key === "Escape") {
      if (drag && drag.aktiv) { onAbbruch(null); e.preventDefault(); return; }
      if (auswahl) { var q = auswahl; auswahlAufheben(); fokusZurueck(q); e.preventDefault(); }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z" && !t.matches("input")) {
      e.preventDefault();
      rueckgaengig();
      return;
    }
    if (t.matches("input")) return;

    var s = t.closest(".bk-slot");
    if (s) {
      var slots = nur(arbeit.querySelectorAll(".bk-slot"), function (x) { return !x.disabled && !x.classList.contains("ungueltig"); });
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); nachbar(slots, s, 1); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); nachbar(slots, s, -1); }
      return;
    }
    var m = t.closest("#arbeit .bk-main");
    if (m) {
      var mains = Array.prototype.slice.call(arbeit.querySelectorAll(".bk-main"));
      if (e.key === "ArrowDown") { e.preventDefault(); nachbar(mains, m, 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); nachbar(mains, m, -1); }
      else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        loeschen(adrParse(m.closest(".bk-blk").dataset.adr));
      }
      return;
    }
    var c = t.closest(".bk-pal");
    if (c) {
      var chips = Array.prototype.slice.call(palette.querySelectorAll(".bk-pal"));
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); nachbar(chips, c, 1); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); nachbar(chips, c, -1); }
    }
  });

  /* ---------- Käfer-Feld ------------------------------------ */

  function zx(x) { return RAND + (x - 1) * Z; }
  function zy(y) { return (aufg.feld.rows - y) * Z + 2; }
  function mx(x) { return zx(x) + Z / 2; }
  function my(y) { return zy(y) + Z / 2; }

  // Freie Felder je Zeile als Bereiche, z. B. «Zeile 6: Spalte 2 bis 4».
  function freieFelderText(f) {
    var teile = [];
    for (var y = f.rows; y >= 1; y--) {
      var bereiche = [], von = 0;
      for (var x = 1; x <= f.cols + 1; x++) {
        var frei = x <= f.cols && !f.hindernisse.some(function (h) { return h[0] === x && h[1] === y; });
        if (frei && !von) von = x;
        if (!frei && von) { bereiche.push(von === x - 1 ? "Spalte " + von : "Spalte " + von + " bis " + (x - 1)); von = 0; }
      }
      if (bereiche.length) teile.push("Zeile " + y + ": " + bereiche.join(", "));
    }
    return teile.join("; ");
  }

  function feldBeschreibung() {
    var f = aufg.feld, z = aufg.ziel;
    var t = "Käfer-Feld mit " + f.cols + " Spalten und " + f.rows + " Zeilen. Start in Spalte " + f.start[0] + ", Zeile " + f.start[1] +
      ", Blick nach " + E.BLICK_TEXT[f.blick] + ". ";
    if (f.karte) {
      t += "Labyrinth, freie Felder je Zeile von oben nach unten: " + freieFelderText(f) + ". ";
    } else if (f.hindernisse.length) {
      t += "Hindernisse: " + f.hindernisse.map(function (h) { return "Spalte " + h[0] + ", Zeile " + h[1]; }).join("; ") + ". ";
    }
    if (z.typ === "endfeld") t += "Ziel: Spalte " + z.feld[0] + ", Zeile " + z.feld[1] + ".";
    else {
      t += "Markierte Felder: " + z.felder.map(function (h) { return "Spalte " + h[0] + ", Zeile " + h[1]; }).join("; ") + ".";
      if (z.endfeld) t += " Endfeld: Spalte " + z.endfeld[0] + ", Zeile " + z.endfeld[1] + ".";
    }
    return t;
  }

  function renderFeld() {
    var f = aufg.feld, z = aufg.ziel;
    var W = RAND + f.cols * Z + 4, H = f.rows * Z + RAND + 4;
    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": feldBeschreibung() });
    var x, y;

    // Alles, was zum Feld gehört, liegt in «welt»; die Achsen liegen getrennt, damit sie bei der
    // mitfahrenden Ansicht (grosse Karten) am Rand stehen bleiben und nur seitlich mitlaufen.
    var welt = svgEl("g", {}, "bk-welt"), achseX = svgEl("g", {}, "bk-achsen"), achseY = svgEl("g", {}, "bk-achsen");
    var rahmen = svgEl("g"), rahmenX = svgEl("g"), rahmenY = svgEl("g");
    rahmen.append(welt); rahmenX.append(achseX); rahmenY.append(achseY);
    svg.append(rahmen, rahmenX, rahmenY);

    for (y = 1; y <= f.rows; y++) {
      for (x = 1; x <= f.cols; x++) {
        welt.append(svgEl("rect", { x: zx(x), y: zy(y), width: Z, height: Z }, "bk-zelle"));
      }
    }
    for (x = 1; x <= f.cols; x++) {
      var tx = svgEl("text", { x: mx(x), y: f.rows * Z + 2 + 14 }, "bk-achse");
      tx.textContent = x;
      achseX.append(tx);
    }
    for (y = 1; y <= f.rows; y++) {
      var ty = svgEl("text", { x: RAND / 2, y: my(y) + 3.5 }, "bk-achse");
      ty.textContent = y;
      achseY.append(ty);
    }

    var spurFlaechen = svgEl("g"), ziel = svgEl("g"), spurLinien = svgEl("g"), hind = svgEl("g"), marken = svgEl("g");
    welt.append(spurFlaechen);

    var st = svgEl("text", { x: zx(f.start[0]) + 3, y: zy(f.start[1]) + 9 }, "bk-start");
    st.textContent = "Start";
    welt.append(st);

    function flagge(feld) {
      var cx = mx(feld[0]), cy = my(feld[1]);
      ziel.append(svgEl("line", { x1: cx - 7, y1: cy - 12, x2: cx - 7, y2: cy + 12 }, "bk-flaggenmast"));
      ziel.append(svgEl("polygon", { points: (cx - 7) + "," + (cy - 12) + " " + (cx + 11) + "," + (cy - 6) + " " + (cx - 7) + "," + cy }, "bk-flagge"));
    }
    if (z.typ === "endfeld") {
      ziel.append(svgEl("rect", { x: zx(z.feld[0]) + 3, y: zy(z.feld[1]) + 3, width: Z - 6, height: Z - 6 }, "bk-zielzelle"));
      flagge(z.feld);
    } else if (z.typ === "besucht") {
      z.felder.forEach(function (c) {
        ziel.append(svgEl("rect", { x: zx(c[0]) + 3, y: zy(c[1]) + 3, width: Z - 6, height: Z - 6 }, "bk-zielzelle"));
        ziel.append(svgEl("circle", { cx: mx(c[0]) + 11, cy: my(c[1]) + 11, r: 2.5 }, "bk-zielpunkt"));
      });
      if (z.endfeld) flagge(z.endfeld);
    }

    welt.append(spurLinien, hind);
    var nebel = nebelBauen(welt, f);
    welt.append(ziel);
    // Hindernisse als Steinblöcke; Form und Helligkeit variieren leicht von Feld zu Feld.
    var RISSE = [
      "M{a} {b} l5 6 l-3 5 l6 7", "M{c} {b} l-4 7 l5 4 l-2 8", "M{a} {d} l7 -3 l3 5 l8 -2"
    ];
    f.hindernisse.forEach(function (h) {
      var x0 = zx(h[0]), y0 = zy(h[1]), v = (h[0] * 31 + h[1] * 17) % 3;
      var g = svgEl("g", {}, "bk-stein bk-stein" + v);
      g.append(
        svgEl("rect", { x: x0 + 1.5, y: y0 + 1.5, width: Z - 3, height: Z - 3, rx: 6 }, "bk-stein-block"),
        svgEl("path", { d: "M" + (x0 + 7) + " " + (y0 + 6) + " H" + (x0 + Z - 12) }, "bk-stein-licht"),
        svgEl("path", { d: "M" + (x0 + 6) + " " + (y0 + 7) + " V" + (y0 + 14) }, "bk-stein-licht"),
        svgEl("path", { d: RISSE[v].replace("{a}", x0 + 12).replace("{b}", y0 + 10).replace("{c}", x0 + 26).replace("{d}", y0 + 28) }, "bk-stein-riss")
      );
      hind.append(g);
    });
    welt.append(marken);

    var k = svgEl("g", {}, "bk-kaefer");
    k.append(svgEl("circle", { cx: 0, cy: 0, r: 19 }, "bk-treffer"));   // unsichtbare Klickfläche (Versteck)
    var bildUrl = window.BaukastenFigur && window.BaukastenFigur.bild();
    var bildGruppe = null;
    if (bildUrl) {
      // Eigenes Bild: bleibt aufrecht, nur der Zeiger am Rand dreht sich mit der Blickrichtung.
      bildGruppe = svgEl("g", {}, "bk-kaefer bk-kaefer-bild");
      bildGruppe.append(svgEl("image", { href: bildUrl, x: -16, y: -16, width: 32, height: 32 }));
      welt.append(bildGruppe);
      k.append(
        svgEl("circle", { cx: 0, cy: 0, r: 16.5 }, "bild-ring"),
        svgEl("polygon", { points: "0,-24 -6,-16 6,-16" }, "koerper")
      );
    } else k.append(
      svgEl("line", { x1: -7, y1: -4, x2: -13, y2: -8 }, "bein"), svgEl("line", { x1: 7, y1: -4, x2: 13, y2: -8 }, "bein"),
      svgEl("line", { x1: -8, y1: 2, x2: -14, y2: 2 }, "bein"), svgEl("line", { x1: 8, y1: 2, x2: 14, y2: 2 }, "bein"),
      svgEl("line", { x1: -7, y1: 8, x2: -13, y2: 12 }, "bein"), svgEl("line", { x1: 7, y1: 8, x2: 13, y2: 12 }, "bein"),
      svgEl("line", { x1: -2, y1: -16, x2: -6, y2: -21 }, "fuehler"), svgEl("line", { x1: 2, y1: -16, x2: 6, y2: -21 }, "fuehler"),
      svgEl("ellipse", { cx: 0, cy: 1, rx: 8.5, ry: 12 }, "koerper"),
      svgEl("circle", { cx: 0, cy: -12, r: 5.5 }, "koerper"),
      svgEl("line", { x1: 0, y1: -8, x2: 0, y2: 12 }, "naht")
    );
    welt.append(k);

    feldBox.textContent = "";
    feldBox.append(svg);
    feldRef = {
      svg: svg, spurFlaechen: spurFlaechen, spurLinien: spurLinien, marken: marken, kaefer: k, bild: bildGruppe, nebel: nebel,
      welt: welt, achseX: achseX, achseY: achseY, rahmen: rahmen, rahmenX: rahmenX, rahmenY: rahmenY,
      W: W, H: H, kamera: f.cols > KAMERA_AB || f.rows > KAMERA_AB, kameraAn: false
    };
    if (feldRef.kamera) kameraVorbereiten(svg);
    $("nebelSchalter").hidden = !f.karte;

    var info = "Feld " + f.cols + " × " + f.rows + ". Start: Spalte " + f.start[0] + ", Zeile " + f.start[1] +
      ", Blick nach " + E.BLICK_TEXT[f.blick] + ". ";
    info += z.typ === "endfeld" ? "Ziel: das Feld mit der Flagge."
      : "Ziel: alle gestrichelt markierten Felder besuchen" + (z.endfeld ? ", Ende auf dem Feld mit der Flagge." : ".");
    if (mehrereLayouts()) info = "Labyrinth «" + sichtbareFelder()[layout.idx].name + "». " + info;
    $("feldInfo").textContent = info;
  }

  function winkelNeu(alt, d) {
    var ziel = WINKEL[d], mod = ((alt % 360) + 360) % 360;
    return alt + ((ziel - mod + 540) % 360) - 180;
  }

  /* ---------- Nebel: nur der Käfer und seine Nachbarfelder sind sichtbar ---------- */

  // Nebel je Aufgabe: Standard aus der Aufgabe («nebel: true»), die eigene Wahl wird je Aufgabe gemerkt.
  var NEBEL_SPEICHER = "kara.baukasten.nebel.v2", nebelNr = 0;
  var nebelAn = false, nebelWahl = {};
  try {
    var nw = JSON.parse(localStorage.getItem(NEBEL_SPEICHER) || "{}");
    if (nw && typeof nw === "object" && !Array.isArray(nw)) nebelWahl = nw;
  } catch (e) { /* Standard je Aufgabe */ }
  function nebelFuerAufgabe() {
    nebelAn = typeof nebelWahl[aufg.id] === "boolean" ? nebelWahl[aufg.id] : !!aufg.nebel;
    $("nebel").checked = nebelAn;
  }
  $("nebel").addEventListener("change", function () {
    nebelAn = $("nebel").checked;
    nebelWahl[aufg.id] = nebelAn;
    try { localStorage.setItem(NEBEL_SPEICHER, JSON.stringify(nebelWahl)); } catch (e) { /* nur für diese Seite */ }
    nebelSetzen();
  });

  function nebelBauen(svg, f) {
    var id = "bk-nebel-" + (++nebelNr);
    var defs = svgEl("defs"), maske = svgEl("mask", { id: id, maskUnits: "userSpaceOnUse" });
    maske.append(svgEl("rect", { x: 0, y: 0, width: RAND + f.cols * Z + 4, height: f.rows * Z + RAND + 4, fill: "#fff" }));
    var loecher = svgEl("g");
    maske.append(loecher);
    defs.append(maske);
    var decke = svgEl("rect", { x: RAND, y: 2, width: f.cols * Z, height: f.rows * Z, mask: "url(#" + id + ")" }, "bk-nebel");
    decke.style.display = "none";
    svg.append(defs, decke);
    return { decke: decke, loecher: loecher };
  }

  // Nebel, sobald eingeschaltet: auch vor dem Start ist nur die Umgebung des Käfers sichtbar.
  // x, y: neuer Ort des Käfers. Der Ort wird immer gemerkt, auch wenn der Nebel aus ist; sonst
  // stünde das Loch nach dem Einschalten an einer alten Stelle. Ohne x, y gilt der gemerkte Ort.
  function nebelSetzen(x, y) {
    if (x != null) nebelOrt = [Math.round(x), Math.round(y)];
    if (!feldRef || !feldRef.nebel) return;
    var n = feldRef.nebel, aktiv = nebelAn && !!aufg.feld.karte;
    n.decke.style.display = aktiv ? "" : "none";
    if (!aktiv) return;
    n.loecher.textContent = "";
    [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (v) {
      n.loecher.append(svgEl("rect", { x: zx(nebelOrt[0] + v[0]), y: zy(nebelOrt[1] + v[1]), width: Z, height: Z, fill: "#000" }));
    });
  }
  var nebelOrt = [1, 1];

  /* ---------- Mitfahrende Ansicht für grosse Karten ---------------------------
     Vor dem Start und nach «Zurücksetzen» zeigt das Feld die ganze Karte (Überblick). Sobald der
     Käfer läuft, zeigt es einen Ausschnitt von KAMERA_SICHT × KAMERA_SICHT Feldern, der dem Käfer
     folgt. Die Achsen bleiben am Rand und laufen nur in ihrer Richtung mit. */

  function kameraVorbereiten(svg) {
    var r = feldRef, f = aufg.feld;
    r.vx = Math.min(KAMERA_SICHT, f.cols);
    r.vy = Math.min(KAMERA_SICHT, f.rows);
    r.VW = RAND + r.vx * Z + 4;
    r.VH = r.vy * Z + RAND + 4;
    var id = "bk-kam-" + (++nebelNr), defs = svgEl("defs");
    function clip(name, x, y, w, h) {
      var c = svgEl("clipPath", { id: id + name, clipPathUnits: "userSpaceOnUse" });
      c.append(svgEl("rect", { x: x, y: y, width: w, height: h }));
      defs.append(c);
      return "url(#" + id + name + ")";
    }
    r.clipWelt = clip("w", RAND, 2, r.vx * Z, r.vy * Z);
    r.clipX = clip("x", RAND, 0, r.vx * Z, r.VH);
    r.clipY = clip("y", 0, 2, RAND, r.vy * Z);
    svg.insertBefore(defs, svg.firstChild);
    kameraAn(false);
  }

  // an = true: Ausschnitt um den Käfer; false: ganze Karte
  function kameraAn(an) {
    var r = feldRef;
    if (!r || !r.kamera) return;
    r.kameraAn = an;
    r.svg.setAttribute("viewBox", an ? "0 0 " + r.VW + " " + r.VH : "0 0 " + r.W + " " + r.H);
    r.svg.classList.toggle("bk-kamera", an);
    [[r.rahmen, r.clipWelt], [r.rahmenX, r.clipX], [r.rahmenY, r.clipY]].forEach(function (p) {
      if (an) p[0].setAttribute("clip-path", p[1]); else p[0].removeAttribute("clip-path");
    });
    if (!an) {
      [r.welt, r.achseX, r.achseY].forEach(function (g) { g.style.transition = "none"; g.style.transform = ""; });
      void r.svg.getBoundingClientRect();
      [r.welt, r.achseX, r.achseY].forEach(function (g) { g.style.transition = ""; });
    }
  }

  function kameraFolgen(x, y, ohneAnim) {
    var r = feldRef, f = aufg.feld;
    if (!r || !r.kamera || !r.kameraAn) return;
    var ox = Math.max(0, Math.min((f.cols - r.vx) * Z, mx(x) - (RAND + r.vx * Z / 2)));
    var oy = Math.max(0, Math.min((f.rows - r.vy) * Z, my(y) - (2 + r.vy * Z / 2)));
    var teile = [[r.welt, -ox, -oy], [r.achseX, -ox, (r.vy - f.rows) * Z], [r.achseY, 0, -oy]];
    teile.forEach(function (t) {
      if (ohneAnim) t[0].style.transition = "none";
      t[0].style.transform = "translate(" + t[1] + "px," + t[2] + "px)";
    });
    if (ohneAnim) {
      void r.svg.getBoundingClientRect();
      teile.forEach(function (t) { t[0].style.transition = ""; });
    }
  }

  function kaeferSetzen(x, y, winkel, ohneAnim) {
    nebelSetzen(x, y);
    kameraFolgen(x, y, ohneAnim);
    var g = feldRef.kaefer;
    if (ohneAnim) g.style.transition = "none";
    var b = feldRef.bild;
    if (b && ohneAnim) b.style.transition = "none";
    g.style.transform = "translate(" + mx(x) + "px," + my(y) + "px) rotate(" + winkel + "deg)";
    if (b) b.style.transform = "translate(" + mx(x) + "px," + my(y) + "px)";
    if (ohneAnim) { void g.getBoundingClientRect(); g.style.transition = ""; if (b) b.style.transition = ""; }
  }

  function spurFlaeche(x, y) {
    feldRef.spurFlaechen.append(svgEl("circle", { cx: mx(x), cy: my(y), r: 3.5 }, "bk-spurpunkt"));
  }

  /* ---------- Ablauf ---------------------------------------- */

  function dauerSetzen(ms) { feldRef.svg.style.setProperty("--dauer", ms + "ms"); }
  function tempoMs() { return TEMPO[Number(tempoEl.value) - 1] || 420; }

  function schrittInfo(text, live) {
    var s = $("schrittInfo");
    s.setAttribute("aria-live", live ? "polite" : "off");
    s.textContent = text;
  }

  function markiere(pfad, fehler) {
    Array.prototype.forEach.call(arbeit.querySelectorAll(".bk-blk.aktiv"), function (b) { b.classList.remove("aktiv", "fehler"); });
    if (!pfad) return;
    var b = arbeit.querySelector('.bk-blk[data-adr="' + adrStr(pfad) + '"]');
    if (b) { b.classList.add("aktiv"); if (fehler) b.classList.add("fehler"); }
  }

  function meldungZeigen(art, titel, text, knopf) {
    meldungBox.textContent = "";
    meldungBox.className = "bk-meldung " + art;
    if (titel) meldungBox.append(el("strong", null, titel));
    if (text) meldungBox.append(el("p", null, text));
    if (knopf) meldungBox.append(knopf);
    meldungBox.hidden = false;
  }
  function meldungVerbergen() { meldungBox.hidden = true; meldungBox.textContent = ""; }

  function knoepfe() {
    $("knopfStart").textContent = sim.laeuft ? "Pause" : (sim.lauf && !sim.ende ? "Weiter" : "Start");
  }

  function simReset() {
    clearTimeout(sim.timer);
    sim.laeuft = false; sim.lauf = null; sim.i = 0; sim.ende = false;
    if (feldRef) {
      var f = aufg.feld;
      feldRef.spurFlaechen.textContent = "";
      feldRef.spurLinien.textContent = "";
      feldRef.marken.textContent = "";
      feldRef.kaefer.classList.remove("fehler");
      kameraAn(false);
      spurFlaeche(f.start[0], f.start[1]);
      sim.winkel = WINKEL[f.blick];
      dauerSetzen(300);
      kaeferSetzen(f.start[0], f.start[1], sim.winkel, true);
    }
    markiere(null);
    $("zaehlwert").textContent = "0";
    schrittInfo("", false);
    meldungVerbergen();
    knoepfe();
  }

  function simBereit() {
    if (sim.lauf) return true;
    if (!prog.length) { meldungZeigen("fehler", null, E.TEXTE.leer); return false; }
    if (arbeit.querySelector(".bk-n.ungueltig")) {
      meldungZeigen("fehler", null, "Bitte geben Sie bei «wiederhole» eine ganze Zahl von 1 bis " + E.MAX_WIEDERHOLUNG + " ein.");
      return false;
    }
    sim.lauf = E.run(aufg.feld, prog, { ziel: E.zielfeld(aufg.ziel) });
    sim.i = 0;
    sim.ende = false;
    nebelSetzen(aufg.feld.start[0], aufg.feld.start[1]);
    if (feldRef && feldRef.kamera) { kameraAn(true); kameraFolgen(aufg.feld.start[0], aufg.feld.start[1], true); }
    return true;
  }

  function anwenden(ev) {
    markiere(ev.pfad, ev.typ === "fehler");
    if (ev.zaehler != null) $("zaehlwert").textContent = ev.zaehler;
    var text = "";
    if (ev.typ === "act") {
      sim.winkel = winkelNeu(sim.winkel, ev.d);
      if (ev.bewegt) {
        feldRef.spurLinien.append(svgEl("line", { x1: mx(ev.von[0]), y1: my(ev.von[1]), x2: mx(ev.x), y2: my(ev.y) }, "bk-spurlinie"));
        spurFlaeche(ev.x, ev.y);
      }
      kaeferSetzen(ev.x, ev.y, sim.winkel, false);
      text = E.BEFEHLE[ev.cmd].label + (/^zaehler/.test(ev.cmd) ? " → Zähler: " + ev.zaehler : "");
    } else if (ev.typ === "loop") {
      text = "wiederhole " + ev.n + "-mal – Durchlauf " + ev.durchlauf + " von " + ev.n;
    } else if (ev.typ === "until") {
      text = BIS_LABEL + " – Durchlauf " + ev.durchlauf;
    } else if (ev.typ === "if") {
      text = E.BEDINGUNGEN[ev.cond || "frei"].label + " → " + (ev.ja ? "Ja" : "Nein");
    } else if (ev.code === "kreis") {
      feldRef.kaefer.classList.add("fehler");
      text = "Der Käfer läuft im Kreis.";
    } else {
      var dr = SCREEN_DIR[ev.d], cx = mx(ev.x), cy = my(ev.y), h = Z / 2;
      var ex = cx + dr[0] * h, ey = cy + dr[1] * h;
      feldRef.marken.append(svgEl("line", {
        x1: ex + dr[1] * h, y1: ey + dr[0] * h, x2: ex - dr[1] * h, y2: ey - dr[0] * h
      }, "bk-stosslinie"));
      feldRef.kaefer.classList.add("fehler");
      kaeferSetzen(ev.x + (dr[0] * 0.3), ev.y - (dr[1] * 0.3), sim.winkel, false);
      setTimeout(function () { if (sim.lauf) kaeferSetzen(ev.x, ev.y, sim.winkel, false); }, 180);
      text = "Der Käfer stösst an.";
    }
    schrittInfo(text, !sim.laeuft);
  }

  function simSchritt(auto) {
    var tr = sim.lauf.trace;
    if (sim.i >= tr.length) { abschluss(); return; }
    anwenden(tr[sim.i++]);
    if (auto && Number(tempoEl.value) >= TEMPO_NUR_BEWEGUNG) {
      while (sim.i < tr.length && tr[sim.i].typ !== "act" && tr[sim.i].typ !== "fehler") anwenden(tr[sim.i++]);
    }
    if (sim.i >= tr.length) {
      if (auto) sim.timer = setTimeout(abschluss, tempoMs()); else abschluss();
      return;
    }
    if (auto) sim.timer = setTimeout(tick, tempoMs());
  }
  function tick() { if (sim.laeuft) simSchritt(true); }

  function abschluss() {
    sim.laeuft = false;
    sim.ende = true;
    knoepfe();
    $("schrittInfo").setAttribute("aria-live", "polite");
    bewerten(mehrereLayouts() ? pruefenAlle() : E.pruefe(aufg, prog));
  }

  function bewerten(res) {
    if (res.ok) {
      geloest[aufg.id] = Math.min(res.bloecke, geloest[aufg.id] || res.bloecke);
      speichereFortschritt();
      tabsAktualisieren();
      var knopf = null;
      if (aktuell < aufgaben.length - 1) {
        knopf = el("button", "bk-knopf primaer", "Nächste Aufgabe");
        knopf.type = "button";
        knopf.addEventListener("click", function () { waehleAufgabe(aktuell + 1); window.scrollTo({ top: 0, behavior: "smooth" }); });
      }
      var wo = res.ergebnisse.length > 1
        ? "Der Käfer findet in allen " + res.ergebnisse.length + " Labyrinthen zum Ausgang" +
          (aufg.zufall ? ", davon " + aufg.zufall.anzahl + " zufällig erzeugt" : "") + ". "
        : "Der Käfer hat die Aufgabe gelöst. ";
      meldungZeigen("ok", "Geschafft", wo + E.bausteineText(res.bloecke, res.max) + "." + kleinsteText(res.bloecke) +
        (knopf ? "" : " Das war die letzte Aufgabe."), knopf);
    } else if (res.grund === "bloecke" && res.zielErreicht) {
      meldungZeigen("fehler", "Fast", "Der Käfer löst die Aufgabe, aber: " + res.text + " Geht es mit weniger?");
    } else if (res.grund === "layouts") {
      var fehl = res.ergebnisse.filter(function (r) { return !r.ok; });
      var liste = fehl.slice(0, 6).map(function (r) { return r.name + " (" + (GRUND_KURZ[r.grund] || r.text) + ")"; }).join(", ") +
        (fehl.length > 6 ? " und " + (fehl.length - 6) + " weitere" : "");
      var neuSichtbar = fehl.some(function (r) { return r.verdeckt || r.zufall; });
      meldungZeigen("fehler", null, res.text + " Nicht geschafft: " + liste + "." +
        (neuSichtbar ? " Gescheiterte verdeckte und zufällige Labyrinthe sind jetzt oben als Reiter zu sehen." : ""));
    } else {
      meldungZeigen("fehler", null, res.text);
    }
  }

  $("knopfAlle").addEventListener("click", function () {
    if (sim.laeuft) pause();
    if (!prog.length) { meldungZeigen("fehler", null, E.TEXTE.leer); return; }
    if (arbeit.querySelector(".bk-n.ungueltig")) {
      meldungZeigen("fehler", null, "Bitte geben Sie bei «wiederhole» eine ganze Zahl von 1 bis " + E.MAX_WIEDERHOLUNG + " ein.");
      return;
    }
    bewerten(pruefenAlle());
  });

  function pause() {
    clearTimeout(sim.timer);
    sim.laeuft = false;
    knoepfe();
    $("schrittInfo").setAttribute("aria-live", "polite");
  }

  $("knopfStart").addEventListener("click", function () {
    if (sim.laeuft) { pause(); return; }
    if (sim.ende) simReset();
    if (!simBereit()) return;
    meldungVerbergen();
    sim.laeuft = true;
    dauerSetzen(Math.min(380, Math.round(tempoMs() * 0.8)));
    $("schrittInfo").setAttribute("aria-live", "off");
    knoepfe();
    simSchritt(true);
  });

  $("knopfSchritt").addEventListener("click", function () {
    if (sim.laeuft) pause();
    if (sim.ende) simReset();
    if (!simBereit()) return;
    meldungVerbergen();
    dauerSetzen(300);
    knoepfe();
    simSchritt(false);
  });

  $("knopfReset").addEventListener("click", function () { simReset(); });

  tempoEl.addEventListener("input", function () {
    tempoEl.setAttribute("aria-valuetext", TEMPO_TEXT[Number(tempoEl.value) - 1]);
    if (sim.laeuft && feldRef) dauerSetzen(Math.min(380, Math.round(tempoMs() * 0.8)));
  });
})();
