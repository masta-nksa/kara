/* ============================================================
   editor.js – Labyrinth-Editor
   Raster bearbeiten (Mauer/Weg, Start mit Blickrichtung, Ausgang am
   Rand), mehrere Labyrinthe pro Challenge, Speichern im Browser und
   Teilen als Link. Prüfung und Link: assets/challenges.js.
   Der Entwurf bleibt im Browser, auch wenn die Seite verlassen wird.
   ============================================================ */
(function () {
  "use strict";

  var E = window.BaukastenEngine, C = window.KaraChallenges;
  var ENTWURF = "kara.editor.entwurf.v1";
  var PFEIL = { N: "▲", E: "▶", S: "▼", W: "◀" };
  var BLICK_TEXT = { N: "oben", E: "rechts", S: "unten", W: "links" };
  var DREHEN = { N: "E", E: "S", S: "W", W: "N" };

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var rule = $("pixelrule");
  for (var i = 0; i < 40; i++) rule.append(document.createElement("i"));

  /* ---------- Entwurf ---------------------------------------- */

  // Layout im Editor: {g: Zeilen als Arrays von Zeichen, blick, verdeckt}
  function leeresLayout(groesse) {
    var g = [], r, c;
    for (r = 0; r < groesse; r++) {
      g.push([]);
      for (c = 0; c < groesse; c++) g[r].push(r === 0 || c === 0 || r === groesse - 1 || c === groesse - 1 ? "#" : ".");
    }
    g[1][1] = "S";
    g[groesse - 2][groesse - 1] = "Z";
    return { g: g, blick: "E", verdeckt: false };
  }
  function ausKarte(karte, blick, verdeckt) {
    return { g: karte.map(function (z) { return z.split(""); }), blick: blick, verdeckt: !!verdeckt };
  }
  function karteVon(l) { return l.g.map(function (z) { return z.join(""); }); }

  function neuerEntwurf() {
    return { titel: "", text: "", maxBloecke: null, layouts: [leeresLayout(11)], aktiv: 0, ersetzt: null };
  }

  var entwurf = null;
  function entwurfSpeichern() {
    try {
      localStorage.setItem(ENTWURF, JSON.stringify({
        titel: entwurf.titel, text: entwurf.text, maxBloecke: entwurf.maxBloecke, aktiv: entwurf.aktiv, ersetzt: entwurf.ersetzt,
        layouts: entwurf.layouts.map(function (l) { return { karte: karteVon(l), blick: l.blick, verdeckt: l.verdeckt }; })
      }));
    } catch (e) { /* ohne Speicher: Entwurf gilt nur, solange die Seite offen ist */ }
  }
  function entwurfLaden() {
    try {
      var d = JSON.parse(localStorage.getItem(ENTWURF) || "null");
      if (!d || !Array.isArray(d.layouts) || !d.layouts.length) return null;
      var layouts = d.layouts.filter(function (l) {
        return l && Array.isArray(l.karte) && l.karte.length >= C.GRENZEN.min && l.karte.length <= C.GRENZEN.max &&
          l.karte.every(function (z) { return typeof z === "string" && /^[#.SZ]+$/.test(z) && z.length === l.karte.length; }) &&
          "NESW".indexOf(l.blick) >= 0;
      }).map(function (l) { return ausKarte(l.karte, l.blick, l.verdeckt); });
      if (!layouts.length) return null;
      return {
        titel: typeof d.titel === "string" ? d.titel.slice(0, 60) : "", text: typeof d.text === "string" ? d.text.slice(0, 400) : "",
        maxBloecke: typeof d.maxBloecke === "number" ? d.maxBloecke : null, layouts: layouts,
        aktiv: Math.min(Math.max(0, d.aktiv | 0), layouts.length - 1), ersetzt: typeof d.ersetzt === "string" ? d.ersetzt : null
      };
    } catch (e) { return null; }
  }
  function ausChallenge(ch) {
    return {
      titel: ch.titel, text: ch.text, maxBloecke: ch.maxBloecke, aktiv: 0, ersetzt: ch.id,
      layouts: ch.layouts.map(function (l) { return ausKarte(l.karte, l.blick, l.verdeckt); })
    };
  }

  /* ---------- Raster ----------------------------------------- */

  function aktivesLayout() { return entwurf.layouts[entwurf.aktiv]; }

  function zellText(ch, l) { return ch === "S" ? PFEIL[l.blick] : ch === "Z" ? "⚑" : ""; }
  function zellLabel(r, c, ch, l) {
    var was = ch === "#" ? "Mauer" : ch === "S" ? "Start, Blick nach " + BLICK_TEXT[l.blick] : ch === "Z" ? "Ausgang" : "Weg";
    return "Zeile " + (r + 1) + ", Spalte " + (c + 1) + ": " + was;
  }

  function renderRaster() {
    var l = aktivesLayout(), n = l.g.length, box = $("raster");
    box.style.setProperty("--g", n);
    box.textContent = "";
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var ch = l.g[r][c];
        var b = el("button", "ed-zelle" + (ch === "#" ? " wand" : ch === "S" ? " start" : ch === "Z" ? " ziel" : ""), zellText(ch, l));
        b.type = "button";
        b.dataset.r = r;
        b.dataset.c = c;
        b.tabIndex = r === 0 && c === 0 ? 0 : -1;
        b.setAttribute("aria-label", zellLabel(r, c, ch, l));
        box.append(b);
      }
    }
    $("groesse").value = String(n);
    $("verdeckt").checked = l.verdeckt;
    statusZeigen();
  }

  function zelleAktualisieren(r, c) {
    var l = aktivesLayout(), ch = l.g[r][c];
    var b = $("raster").querySelector('.ed-zelle[data-r="' + r + '"][data-c="' + c + '"]');
    if (!b) return;
    b.className = "ed-zelle" + (ch === "#" ? " wand" : ch === "S" ? " start" : ch === "Z" ? " ziel" : "");
    b.textContent = zellText(ch, l);
    b.setAttribute("aria-label", zellLabel(r, c, ch, l));
  }

  function grundVon(l) { return C.karteGrund(karteVon(l)); }

  function statusZeigen() {
    var grund = grundVon(aktivesLayout()), s = $("status");
    s.textContent = grund ? "Noch nicht spielbar: " + grund : "Spielbar: Vom Start führt ein Weg zum Ausgang.";
    s.className = "ed-status " + (grund ? "fehl" : "ok");
    renderReiter();
    entwurfSpeichern();
  }

  function renderReiter() {
    var box = $("reiter");
    box.textContent = "";
    entwurf.layouts.forEach(function (l, i) {
      var ok = !grundVon(l);
      var b = el("button", l.verdeckt ? "verdeckt" : null);
      b.type = "button";
      b.append(el("span", null, (l.verdeckt ? "V" : "") + (i + 1)), el("span", ok ? "ok" : "fehl", ok ? "✓" : "✗"));
      b.setAttribute("aria-pressed", i === entwurf.aktiv ? "true" : "false");
      b.setAttribute("aria-label", "Labyrinth " + (i + 1) + (l.verdeckt ? ", verdeckt" : "") + (ok ? ", spielbar" : ", noch nicht spielbar"));
      b.addEventListener("click", function () { entwurf.aktiv = i; renderRaster(); });
      box.append(b);
    });
    $("knopfWeg").disabled = entwurf.layouts.length < 2;
    $("knopfNeu").disabled = $("knopfKopie").disabled = entwurf.layouts.length >= C.GRENZEN.layouts;
  }

  /* ---------- Werkzeuge -------------------------------------- */

  function werkzeug() { return document.querySelector('input[name="werkzeug"]:checked').value; }
  function amRand(l, r, c) { var n = l.g.length; return r === 0 || c === 0 || r === n - 1 || c === n - 1; }
  function finde(l, ch) {
    for (var r = 0; r < l.g.length; r++) for (var c = 0; c < l.g.length; c++) if (l.g[r][c] === ch) return [r, c];
    return null;
  }

  // Mauer/Weg: beim Ziehen gilt der Wert, der beim ersten Feld entstanden ist.
  var malen = null;   // {wert}
  function setzeWand(r, c, wert) {
    var l = aktivesLayout();
    if (l.g[r][c] === "S" || l.g[r][c] === "Z" || l.g[r][c] === wert) return;
    l.g[r][c] = wert;
    zelleAktualisieren(r, c);
  }

  function anwenden(r, c, erstes) {
    var l = aktivesLayout(), ch = l.g[r][c], w = werkzeug();
    if (w === "wand") {
      if (erstes) malen = { wert: ch === "#" ? "." : "#" };
      if (malen) setzeWand(r, c, malen.wert);
      return;
    }
    if (w === "start") {
      if (ch === "S") l.blick = DREHEN[l.blick];
      else {
        if (ch === "Z") { meldung("Hier liegt der Ausgang. Wählen Sie ein anderes Feld.", true); return; }
        var s = finde(l, "S");
        if (s) { l.g[s[0]][s[1]] = "."; zelleAktualisieren(s[0], s[1]); }
        l.g[r][c] = "S";
      }
      zelleAktualisieren(r, c);
      return;
    }
    if (!amRand(l, r, c)) { meldung("Der Ausgang muss am Rand liegen: in der äussersten Zeile oder Spalte.", true); return; }
    if (ch === "S") { meldung("Hier liegt der Start. Wählen Sie ein anderes Randfeld.", true); return; }
    var z = finde(l, "Z");
    if (z) { l.g[z[0]][z[1]] = "#"; zelleAktualisieren(z[0], z[1]); }
    l.g[r][c] = "Z";
    zelleAktualisieren(r, c);
  }

  function zelleAus(e) {
    var t = document.elementFromPoint(e.clientX, e.clientY);
    return t && t.closest ? t.closest(".ed-zelle") : null;
  }
  var raster = $("raster");
  raster.addEventListener("pointerdown", function (e) {
    var z = e.target.closest(".ed-zelle");
    if (!z) return;
    e.preventDefault();
    meldung("");
    anwenden(+z.dataset.r, +z.dataset.c, true);
    if (werkzeug() === "wand") raster.setPointerCapture(e.pointerId);
    else statusZeigen();
  });
  raster.addEventListener("pointermove", function (e) {
    if (!malen) return;
    var z = zelleAus(e);
    if (z) anwenden(+z.dataset.r, +z.dataset.c, false);
  });
  function malenEnde() { if (malen) { malen = null; statusZeigen(); } }
  raster.addEventListener("pointerup", malenEnde);
  raster.addEventListener("pointercancel", malenEnde);

  // Tastatur: Pfeiltasten bewegen den Fokus, Eingabe/Leertaste wendet das Werkzeug an.
  raster.addEventListener("keydown", function (e) {
    var z = e.target.closest(".ed-zelle");
    if (!z) return;
    var r = +z.dataset.r, c = +z.dataset.c, n = aktivesLayout().g.length;
    var d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (d) {
      var nr = Math.max(0, Math.min(n - 1, r + d[0])), nc = Math.max(0, Math.min(n - 1, c + d[1]));
      var ziel = raster.querySelector('.ed-zelle[data-r="' + nr + '"][data-c="' + nc + '"]');
      z.tabIndex = -1; ziel.tabIndex = 0; ziel.focus();
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      meldung("");
      anwenden(r, c, true);
      malen = null;
      statusZeigen();
      raster.querySelector('.ed-zelle[data-r="' + r + '"][data-c="' + c + '"]').focus();
    }
  });

  /* ---------- Labyrinthe verwalten --------------------------- */

  $("knopfNeu").addEventListener("click", function () {
    entwurf.layouts.push(leeresLayout(aktivesLayout().g.length));
    entwurf.aktiv = entwurf.layouts.length - 1;
    renderRaster();
  });
  $("knopfKopie").addEventListener("click", function () {
    var l = aktivesLayout();
    entwurf.layouts.push(ausKarte(karteVon(l), l.blick, l.verdeckt));
    entwurf.aktiv = entwurf.layouts.length - 1;
    renderRaster();
  });
  $("knopfWeg").addEventListener("click", function () {
    if (entwurf.layouts.length < 2) return;
    if (!confirm("Labyrinth " + (entwurf.aktiv + 1) + " löschen?")) return;
    entwurf.layouts.splice(entwurf.aktiv, 1);
    entwurf.aktiv = Math.min(entwurf.aktiv, entwurf.layouts.length - 1);
    renderRaster();
  });
  $("verdeckt").addEventListener("change", function () { aktivesLayout().verdeckt = $("verdeckt").checked; statusZeigen(); });

  function istLeer(l) {
    var leer = leeresLayout(l.g.length);
    return JSON.stringify(leer.g) === JSON.stringify(l.g);
  }
  $("groesse").addEventListener("change", function () {
    var n = +$("groesse").value, l = aktivesLayout();
    if (n === l.g.length) return;
    if (!istLeer(l) && !confirm("Die Grösse ändern? Dabei wird dieses Labyrinth geleert.")) { $("groesse").value = String(l.g.length); return; }
    entwurf.layouts[entwurf.aktiv] = leeresLayout(n);
    renderRaster();
  });
  $("knopfLeer").addEventListener("click", function () {
    var l = aktivesLayout();
    if (!istLeer(l) && !confirm("Dieses Labyrinth leeren?")) return;
    entwurf.layouts[entwurf.aktiv] = leeresLayout(l.g.length);
    entwurf.layouts[entwurf.aktiv].verdeckt = l.verdeckt;
    renderRaster();
  });
  function zufaellig(inseln) {
    var l = aktivesLayout(), n = l.g.length;
    if (!istLeer(l) && !confirm("Dieses Labyrinth durch ein zufälliges ersetzen?")) return;
    var seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0, raeume = (n - 1) / 2;
    var z = E.erzeugeLabyrinth(seed, raeume, inseln ? { inseln: Math.max(2, Math.round(raeume * 0.8)) } : undefined);
    entwurf.layouts[entwurf.aktiv] = ausKarte(z.karte, z.blick, l.verdeckt);
    renderRaster();
  }
  $("knopfZufall").addEventListener("click", function () { zufaellig(false); });
  $("knopfZufallInseln").addEventListener("click", function () { zufaellig(true); });

  /* ---------- Angaben, Speichern, Teilen --------------------- */

  function angabenLesen() {
    entwurf.titel = $("titel").value;
    entwurf.text = $("text").value;
    var v = $("limit").value.trim();
    entwurf.maxBloecke = v === "" ? null : Number(v);
    entwurfSpeichern();
  }
  ["titel", "text", "limit"].forEach(function (id) { $(id).addEventListener("input", angabenLesen); });
  function angabenZeigen() {
    $("titel").value = entwurf.titel;
    $("text").value = entwurf.text;
    $("limit").value = entwurf.maxBloecke == null ? "" : String(entwurf.maxBloecke);
  }

  function meldung(text, fehler) {
    var m = $("meldung");
    m.textContent = text || "";
    m.className = "ed-meldung" + (fehler ? " fehler" : "");
    m.hidden = !text;
  }

  function challenge() {
    angabenLesen();
    return C.pruefen({
      titel: entwurf.titel, text: entwurf.text, maxBloecke: entwurf.maxBloecke,
      layouts: entwurf.layouts.map(function (l) { return { karte: karteVon(l), blick: l.blick, verdeckt: l.verdeckt }; })
    });
  }

  function speichern() {
    var ch;
    try { ch = challenge(); } catch (e) { meldung(e.message, true); return null; }
    var r = C.hinzufuegen(ch, { eigen: true, ersetzt: entwurf.ersetzt });
    if (!r.gespeichert) { meldung("Der Browser erlaubt kein Speichern. Teilen Sie die Challenge als Link.", true); return null; }
    entwurf.ersetzt = r.id;
    entwurfSpeichern();
    renderListe();
    return r.id;
  }

  $("knopfSpielen").addEventListener("click", function () {
    var id = speichern();
    if (id) location.href = "../baukasten/?reihe=eigene&aufgabe=" + encodeURIComponent(id);
  });

  function baukastenUrl() { return new URL("../baukasten/", location.href).href; }

  function teilen(ch) {
    var url = C.link(ch, baukastenUrl()), feld = $("link");
    feld.value = url;
    feld.hidden = false;
    var fertig = function (ok) {
      meldung(ok ? "Link kopiert (" + url.length + " Zeichen). Wer ihn öffnet, kann die Challenge in den eigenen Browser übernehmen."
        : "Bitte den Link oben markieren und kopieren.", !ok);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { fertig(true); }, function () { fertig(false); });
    else fertig(false);
    feld.focus();
    feld.select();
  }
  $("knopfTeilen").addEventListener("click", function () {
    var ch;
    try { ch = challenge(); } catch (e) { meldung(e.message, true); return; }
    teilen(ch);
  });
  $("link").addEventListener("focus", function () { $("link").select(); });

  $("knopfFrisch").addEventListener("click", function () {
    if (!confirm("Eine neue, leere Challenge beginnen? Der jetzige Entwurf geht verloren, gespeicherte Challenges bleiben.")) return;
    entwurf = neuerEntwurf();
    angabenZeigen();
    renderRaster();
    $("link").hidden = true;
    meldung("");
  });

  /* ---------- Liste der Challenges im Browser ----------------- */

  function renderListe() {
    var ul = $("liste"), liste = C.alle().sort(function (a, b) { return (b.zeit || 0) - (a.zeit || 0); });
    ul.textContent = "";
    if (!liste.length) { ul.append(el("li", "leer", "Noch keine. Speichern Sie Ihre erste Challenge oder öffnen Sie einen Challenge-Link.")); return; }
    liste.forEach(function (ch) {
      var li = el("li");
      li.append(el("span", "titel", ch.titel));
      var verd = ch.layouts.filter(function (l) { return l.verdeckt; }).length;
      li.append(el("span", "info", ch.layouts.length + (ch.layouts.length === 1 ? " Labyrinth" : " Labyrinthe") +
        (verd ? ", davon " + verd + " verdeckt" : "") + (ch.maxBloecke ? ", höchstens " + ch.maxBloecke + " Bausteine" : "") +
        (ch.eigen ? " · selbst gebaut" : " · erhalten")));
      var z = el("div", "ed-zeile");
      var spielen = el("a", "ed-knopf klein", "Spielen");
      spielen.href = "../baukasten/?reihe=eigene&aufgabe=" + encodeURIComponent(ch.id);
      var bearbeiten = el("button", "ed-knopf klein", "Bearbeiten");
      bearbeiten.type = "button";
      bearbeiten.addEventListener("click", function () {
        entwurf = ausChallenge(ch);
        angabenZeigen();
        renderRaster();
        meldung("«" + ch.titel + "» ist im Editor. Speichern ersetzt die bisherige Fassung.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      var t = el("button", "ed-knopf klein", "Link kopieren");
      t.type = "button";
      t.addEventListener("click", function () { teilen(ch); });
      var weg = el("button", "ed-knopf klein", "Entfernen");
      weg.type = "button";
      weg.addEventListener("click", function () {
        if (!confirm("«" + ch.titel + "» aus diesem Browser entfernen?")) return;
        C.entfernen(ch.id);
        if (entwurf.ersetzt === ch.id) { entwurf.ersetzt = null; entwurfSpeichern(); }
        renderListe();
      });
      z.append(spielen, bearbeiten, t, weg);
      li.append(z);
      ul.append(li);
    });
  }

  /* ---------- Start ------------------------------------------ */

  var idParam = null;
  try { idParam = new URLSearchParams(location.search).get("id"); } catch (e) { /* ohne Parameter */ }
  var vorlage = idParam ? C.finde(idParam) : null;
  entwurf = vorlage ? ausChallenge(vorlage) : (entwurfLaden() || neuerEntwurf());
  if (idParam) {
    try { history.replaceState(null, "", location.pathname); } catch (e) { /* Adresse bleibt */ }
  }
  angabenZeigen();
  renderRaster();
  renderListe();
  if (vorlage) meldung("«" + vorlage.titel + "» ist im Editor. Speichern ersetzt die bisherige Fassung.");
})();
