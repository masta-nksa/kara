/* ============================================================
   challenges.js – eigene Labyrinth-Challenges
   Prüfen, als Link kodieren (Base64 im #-Teil der Adresse) und im
   Browser speichern. Kein Server: Wer einen Link öffnet und zustimmt,
   hat die Challenge danach im eigenen Browser.
   Läuft im Browser (window.KaraChallenges) und unter node (require).

   Format (v1, kurz gehalten, damit der Link kurz bleibt):
     {v:1, t:Titel, b:Beschreibung, m:Bausteinlimit|null,
      l:[{k:[Kartenzeilen], r:Blick, v:1 (verdeckt) | 0}]}
   Kartenzeichen: «#» Mauer, «.» Weg, «S» Start, «Z» Ausgang (am Kartenrand).
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.KaraChallenges = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var SPEICHER = "kara.challenges.v1";
  var GRENZEN = { titel: 60, text: 400, layouts: 12, min: 5, max: 25, bloecke: 99, link: 40000 };

  // Alle Bausteine: das freie Abschluss-Level und eigene Challenges bieten alles an.
  var PALETTE = {
    befehle: ["vor", "rechts", "links", "zaehlerPlus", "zaehlerMinus", "zaehlerNull"],
    wiederholung: true, bis: true, verzweigung: true,
    bedingungen: ["frei", "freiLinks", "freiRechts", "zaehlerIstNull"], sonst: true
  };

  /* ---------- Prüfen ---------------------------------------- */

  function fehler(text) { return new Error(text); }

  // Prüft eine Karte streng und liefert null (gültig) oder einen Grund (Text).
  function karteGrund(karte) {
    if (!Array.isArray(karte) || karte.length < GRENZEN.min || karte.length > GRENZEN.max) {
      return "Die Karte braucht " + GRENZEN.min + " bis " + GRENZEN.max + " Zeilen.";
    }
    var breite = karte[0] && karte[0].length, s = null, z = null, r, c;
    if (typeof karte[0] !== "string" || breite < GRENZEN.min || breite > GRENZEN.max) {
      return "Die Karte braucht " + GRENZEN.min + " bis " + GRENZEN.max + " Spalten.";
    }
    for (r = 0; r < karte.length; r++) {
      if (typeof karte[r] !== "string" || karte[r].length !== breite) return "Alle Zeilen müssen gleich lang sein.";
      if (!/^[#.SZ]+$/.test(karte[r])) return "Die Karte enthält unerlaubte Zeichen.";
      for (c = 0; c < breite; c++) {
        var ch = karte[r].charAt(c);
        if (ch === "S") { if (s) return "Es darf nur einen Start geben."; s = [r, c]; }
        if (ch === "Z") { if (z) return "Es darf nur einen Ausgang geben."; z = [r, c]; }
      }
    }
    if (!s) return "Der Start fehlt.";
    if (!z) return "Der Ausgang fehlt.";
    if (!(z[0] === 0 || z[1] === 0 || z[0] === karte.length - 1 || z[1] === breite - 1)) {
      return "Der Ausgang muss am Rand liegen.";
    }
    // Erreichbarkeit: Breitensuche vom Start über freie Felder
    var gesehen = {}, schlange = [s];
    gesehen[s[0] + "," + s[1]] = true;
    while (schlange.length) {
      var p = schlange.shift();
      if (p[0] === z[0] && p[1] === z[1]) return null;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (v) {
        var y = p[0] + v[0], x = p[1] + v[1], k = y + "," + x;
        if (y < 0 || x < 0 || y >= karte.length || x >= breite || gesehen[k] || karte[y].charAt(x) === "#") return;
        gesehen[k] = true;
        schlange.push([y, x]);
      });
    }
    return "Vom Start führt kein Weg zum Ausgang.";
  }

  // Wandelt Kurz- oder Langform in die geprüfte Langform um, sonst Fehler mit Grund.
  // Langform: {titel, text, maxBloecke, layouts:[{karte, blick, verdeckt}]}
  function pruefen(roh) {
    if (!roh || typeof roh !== "object" || Array.isArray(roh)) throw fehler("Keine gültige Challenge.");
    var kurz = roh.v === 1 && "l" in roh;
    var titel = kurz ? roh.t : roh.titel, text = kurz ? roh.b : roh.text, max = kurz ? roh.m : roh.maxBloecke;
    var liste = kurz ? roh.l : roh.layouts;
    if (typeof titel !== "string" || !titel.trim()) throw fehler("Der Titel fehlt.");
    titel = titel.trim().replace(/\s+/g, " ");
    if (titel.length > GRENZEN.titel) throw fehler("Der Titel ist zu lang (höchstens " + GRENZEN.titel + " Zeichen).");
    if (text == null) text = "";
    if (typeof text !== "string") throw fehler("Die Beschreibung ist ungültig.");
    text = text.trim();
    if (text.length > GRENZEN.text) throw fehler("Die Beschreibung ist zu lang (höchstens " + GRENZEN.text + " Zeichen).");
    if (max === undefined || max === "") max = null;
    if (max !== null && (typeof max !== "number" || max % 1 !== 0 || max < 1 || max > GRENZEN.bloecke)) {
      throw fehler("Das Bausteinlimit muss leer oder eine ganze Zahl von 1 bis " + GRENZEN.bloecke + " sein.");
    }
    if (!Array.isArray(liste) || !liste.length) throw fehler("Es fehlt mindestens ein Labyrinth.");
    if (liste.length > GRENZEN.layouts) throw fehler("Höchstens " + GRENZEN.layouts + " Labyrinthe.");
    var layouts = liste.map(function (l, i) {
      if (!l || typeof l !== "object") throw fehler("Labyrinth " + (i + 1) + " ist ungültig.");
      var karte = kurz ? l.k : l.karte, blick = kurz ? l.r : l.blick, verdeckt = kurz ? l.v === 1 : l.verdeckt === true;
      var grund = karteGrund(karte);
      if (grund) throw fehler("Labyrinth " + (i + 1) + ": " + grund);
      if (typeof blick !== "string" || "NESW".indexOf(blick) < 0 || blick.length !== 1) throw fehler("Labyrinth " + (i + 1) + ": Die Blickrichtung ist ungültig.");
      return { karte: karte.slice(), blick: blick, verdeckt: verdeckt };
    });
    if (!layouts.some(function (l) { return !l.verdeckt; })) throw fehler("Mindestens ein Labyrinth muss sichtbar sein.");
    return { titel: titel, text: text, maxBloecke: max, layouts: layouts };
  }

  /* ---------- Kennung, Link --------------------------------- */

  function kurzform(ch) {
    return {
      v: 1, t: ch.titel, b: ch.text || "", m: ch.maxBloecke,
      l: ch.layouts.map(function (l) { return { k: l.karte, r: l.blick, v: l.verdeckt ? 1 : 0 }; })
    };
  }

  // Kennung aus dem Inhalt (FNV-1a): derselbe Link ergibt dieselbe Challenge, kein Duplikat.
  function kennung(ch) {
    var s = JSON.stringify(kurzform(ch)), h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return "ch-" + h.toString(36);
  }

  function zuBase64(text) {
    var bytes = new TextEncoder().encode(text), bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function ausBase64(s) {
    if (!/^[A-Za-z0-9_-]+$/.test(s)) throw fehler("Der Link ist beschädigt.");
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }

  function kodieren(ch) { return zuBase64(JSON.stringify(kurzform(ch))); }

  // Liest den Base64-Teil (mit oder ohne «#challenge=») und liefert die geprüfte Challenge.
  function dekodieren(teil) {
    var s = String(teil || "").trim().replace(/^.*#?challenge=/, "");
    if (!s) throw fehler("Der Link enthält keine Challenge.");
    if (s.length > GRENZEN.link) throw fehler("Der Link ist zu lang.");
    var roh;
    try { roh = JSON.parse(ausBase64(s)); } catch (e) { throw fehler("Der Link ist beschädigt oder unvollständig."); }
    return pruefen(roh);
  }

  // Link zum Spielen: baukastenUrl ist die Adresse von baukasten/ (absolut).
  function link(ch, baukastenUrl) {
    return baukastenUrl.replace(/[?#].*$/, "") + "?reihe=eigene#challenge=" + kodieren(ch);
  }

  /* ---------- Speichern (localStorage) ---------------------- */

  function alle() {
    try {
      var d = JSON.parse(localStorage.getItem(SPEICHER) || "[]");
      if (!Array.isArray(d)) return [];
      // Nur gültige Einträge (der Speicher könnte von Hand verändert sein)
      return d.map(function (e) {
        try { var ch = pruefen(e); ch.id = kennung(ch); ch.eigen = !!e.eigen; ch.zeit = e.zeit || 0; return ch; }
        catch (err) { return null; }
      }).filter(Boolean);
    } catch (e) { return []; }
  }
  function schreiben(liste) {
    try {
      localStorage.setItem(SPEICHER, JSON.stringify(liste.map(function (c) {
        return { titel: c.titel, text: c.text, maxBloecke: c.maxBloecke, layouts: c.layouts, eigen: !!c.eigen, zeit: c.zeit || 0 };
      })));
      return true;
    } catch (e) { return false; }
  }
  function finde(id) { return alle().filter(function (c) { return c.id === id; })[0] || null; }

  // Fügt hinzu (oder ersetzt «ersetzt», z. B. nach dem Bearbeiten). Liefert {id, neu, gespeichert}.
  function hinzufuegen(roh, opt) {
    var ch = pruefen(roh), id = kennung(ch), liste = alle();
    var ersetzt = opt && opt.ersetzt;
    var alt = liste.filter(function (c) { return c.id === id; })[0];
    liste = liste.filter(function (c) { return c.id !== id && c.id !== ersetzt; });
    ch.id = id;
    ch.eigen = !!(opt && opt.eigen) || !!(alt && alt.eigen);
    ch.zeit = Date.now();
    liste.push(ch);
    return { id: id, neu: !alt, gespeichert: schreiben(liste) };
  }
  function entfernen(id) { return schreiben(alle().filter(function (c) { return c.id !== id; })); }

  // Als Baukasten-Aufgabe (vor E.vorbereiten).
  function alsAufgabe(ch) {
    var sichtbar = ch.layouts.filter(function (l) { return !l.verdeckt; }), verdeckt = ch.layouts.filter(function (l) { return l.verdeckt; });
    var teile = [];
    if (verdeckt.length) teile.push(verdeckt.length + (verdeckt.length === 1 ? " verdecktes Labyrinth" : " verdeckte Labyrinthe"));
    return {
      id: ch.id, challenge: true, eigen: ch.eigen,
      titel: "★ " + ch.titel, stufe: "Challenge",
      text: (ch.text || "Bringen Sie den Käfer in jedem Labyrinth zum Ausgang.") +
        (teile.length ? " Dazu kommen " + teile.join(" und ") + "." : "") +
        (ch.maxBloecke ? " Höchstens " + ch.maxBloecke + " Bausteine." : ""),
      layouts: sichtbar.map(function (l) { return { karte: l.karte, blick: l.blick }; }),
      verdeckt: verdeckt.map(function (l) { return { karte: l.karte, blick: l.blick }; }),
      palette: PALETTE, maxTiefe: 6, maxBloecke: ch.maxBloecke
    };
  }

  return {
    GRENZEN: GRENZEN, PALETTE: PALETTE,
    karteGrund: karteGrund, pruefen: pruefen, kennung: kennung, kodieren: kodieren, dekodieren: dekodieren, link: link,
    alle: alle, finde: finde, hinzufuegen: hinzufuegen, entfernen: entfernen, alsAufgabe: alsAufgabe
  };
});
