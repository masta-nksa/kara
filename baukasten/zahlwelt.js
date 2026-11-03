/* ============================================================
   zahlwelt.js – Darstellung der Zahlenwelt (Aufgaben mit welt: "zahlen")
   Variablen als Kisten, Ablauftabelle (eine Zeile pro Prüfung einer
   «solange»-Bedingung), Ausgabe und der Schreibtischtest zum Ausfüllen.
   Nur DOM, keine Logik des Baukastens: app.js ruft window.KaraZahlwelt.
   ============================================================ */
(function () {
  "use strict";

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function hat(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  // Beschriftung der ersten Spalte: mit nur einer Wiederholung zählt sie die Prüfungen der Bedingung
  // («1.» = die erste Prüfung, vor dem ersten Durchlauf), sonst die Durchgänge.
  function durchgangText(z, eineSchleife) {
    if (typeof z.durchgang === "string") return z.durchgang;
    return eineSchleife ? (z.durchgang + 1) + "." : String(z.durchgang);
  }
  function bedingungText(z, bedingung) {
    if (z.ja == null) return "";
    return (bedingung ? "" : z.bedingung + ": ") + (z.ja ? "wahr" : "falsch");
  }

  function kopf(variablen, bedingung) {
    var tr = el("tr");
    tr.append(el("th", null, bedingung ? "Prüfung" : "Durchgang"));
    variablen.forEach(function (v) { tr.append(el("th", "zw-var", v)); });
    tr.append(el("th", bedingung ? "zw-bedkopf" : null, bedingung || "Bedingung"), el("th", null, "Ausgabe"));
    var th = el("thead");
    th.append(tr);
    return th;
  }

  /* ---------- Ansicht beim Ausführen ---------- */

  // variablen: Spalten; eingabe: Startwerte; bedingung: Text der einzigen «solange»-Bedingung oder null.
  function ansicht(box, variablen, eingabe, bedingung) {
    box.textContent = "";
    var wurzel = el("div", "zw");
    var kisten = el("div", "zw-kisten"), kiste = {};
    variablen.forEach(function (v) {
      var k = el("div", "zw-kiste");
      var w = el("span", "zw-wert");
      k.append(w, el("span", "zw-name", v));
      kiste[v] = { k: k, w: w };
      kisten.append(k);
    });
    var tabBox = el("div", "zw-tabbox");
    var tab = el("table", "zw-tabelle"), body = el("tbody");
    tab.append(el("caption", null, "Ablauftabelle"), kopf(variablen, bedingung), body);
    tabBox.append(tab);
    var aus = el("div", "zw-ausgabe"), ausText = el("pre");
    aus.append(el("span", "zw-ausgabe-titel", "Ausgabe"), ausText);
    wurzel.append(kisten, tabBox, aus);
    box.append(wurzel);

    var bisher = 0, alteWerte = {};
    function zeile(z) {
      var tr = el("tr");
      tr.append(el("td", null, durchgangText(z, !!bedingung)));
      variablen.forEach(function (v) { tr.append(el("td", "zw-zahl", hat(z.werte, v) ? String(z.werte[v]) : "–")); });
      var b = el("td", z.ja == null ? null : z.ja ? "zw-wahr" : "zw-falsch", bedingungText(z, bedingung));
      tr.append(b, el("td", "zw-zahl", z.ausgabe.join(", ")));
      return tr;
    }
    // stand: {werte, ausgabe, zeilen (Anzahl), alle (Zeilen des Laufs), fehler}
    function zeigen(stand) {
      variablen.forEach(function (v) {
        var da = hat(stand.werte, v), w = da ? String(stand.werte[v]) : "";
        var r = kiste[v];
        r.w.textContent = w;
        r.k.classList.toggle("leer", !da);
        r.k.classList.toggle("neu", da && alteWerte[v] !== w && bisher > 0);
        alteWerte[v] = w;
      });
      var n = Math.min(stand.zeilen || 0, (stand.alle || []).length);
      if (n < bisher) { body.textContent = ""; bisher = 0; }
      for (var i = bisher; i < n; i++) body.append(zeile(stand.alle[i]));
      // Ausgaben der letzten Zeile erst zeigen, wenn sie schon erschienen sind.
      if (n) {
        var frueher = 0;
        for (var j = 0; j < n - 1; j++) frueher += stand.alle[j].ausgabe.length;
        body.lastChild.lastChild.textContent = stand.alle[n - 1].ausgabe.slice(0, Math.max(0, (stand.ausgabe || []).length - frueher)).join(", ");
      }
      if (n > bisher) tabBox.scrollTop = tabBox.scrollHeight;
      bisher = Math.max(bisher, n);
      tab.hidden = !body.childNodes.length;
      ausText.textContent = (stand.ausgabe || []).join("\n");
      aus.classList.toggle("leer", !(stand.ausgabe || []).length);
      wurzel.classList.toggle("fehler", !!stand.fehler);
    }
    bisher = 1;   // erster Aufruf: keine Hervorhebung
    zeigen({ werte: eingabe, ausgabe: [], zeilen: 0, alle: [] });
    bisher = 0;
    return { zeigen: zeigen };
  }

  /* ---------- Schreibtischtest ---------- */

  // Eingaben lesen: leere Zelle = unverändert gegenüber der Zeile davor (Zeile 1: keine Wert).
  function zahlOderLeer(s) {
    s = String(s == null ? "" : s).trim().replace("−", "-");
    if (s === "") return null;
    return /^-?\d+$/.test(s) ? Number(s) : NaN;
  }
  function ausgabeLesen(s) {
    s = String(s || "").trim();
    if (!s) return [];
    return s.split(/[\s,;]+/).filter(Boolean).map(function (t) { return /^-?\d+$/.test(t.replace("−", "-")) ? Number(t.replace("−", "-")) : NaN; });
  }

  // opt: {variablen, erwartet (Zeilen), bedingung, eingabe, fest (Anzahl Zeilen vorgegeben, sonst null),
  //       eintraege (gespeicherte Eingaben oder null), fertig (bool), aendern(eintraege), geloest()}
  function schreibtisch(box, opt) {
    box.textContent = "";
    var vars = opt.variablen, erw = opt.erwartet, eineSchleife = !!opt.bedingung;
    var hilfe = el("p", "zw-hilfe");
    if (eineSchleife) {
      hilfe.append("Eine Zeile pro Prüfung des gefärbten Blocks ", el("span", "zw-chip", "solange " + opt.bedingung),
        ": Tragen Sie ein, was in den Variablen steht, wenn geprüft wird. ");
    } else {
      hilfe.append("Eine Zeile pro Schritt: Tragen Sie ein, was in den Variablen steht. ");
    }
    hilfe.append("Leer heisst: unverändert. Schreiben Sie Ausgaben in die Zeile, nach der sie erscheinen." +
      (opt.fest ? " Füllen Sie die ersten " + opt.fest + " Zeilen aus." : ""));
    var tabBox = el("div", "zw-tabbox zw-tabbox-test");
    var tab = el("table", "zw-tabelle zw-test"), body = el("tbody");
    tab.append(el("caption", null, "Schreibtischtest"), kopf(vars, opt.bedingung), body);
    tabBox.append(tab);
    var knoepfe = el("div", "zw-knoepfe");
    var plus = el("button", "bk-knopf bk-knopf-klein", "+ Zeile");
    var minus = el("button", "bk-knopf bk-knopf-klein", "− Zeile");
    var pruef = el("button", "bk-knopf", "Schreibtischtest prüfen");
    [plus, minus, pruef].forEach(function (b) { b.type = "button"; });
    if (!opt.fest) knoepfe.append(plus, minus);
    knoepfe.append(pruef);
    var rueck = el("p", "bk-frage-rueck", "");
    rueck.setAttribute("role", "status");
    rueck.hidden = true;
    box.append(hilfe, tabBox, knoepfe, rueck);

    var zeilen = [];   // je Zeile {tr, felder:{v: input}, bed: select, aus: input}
    function neueZeile(werte) {
      var i = zeilen.length, tr = el("tr"), z = { tr: tr, felder: {} };
      var lab = erw[i] ? durchgangText(erw[i], eineSchleife) : (eineSchleife ? (i + 1) + "." : String(i));
      tr.append(el("td", "zw-dg", lab));
      vars.forEach(function (v) {
        var td = el("td"), inp = el("input", "zw-feld");
        inp.type = "text";
        inp.setAttribute("inputmode", "numeric");
        inp.setAttribute("aria-label", v + ", Zeile " + (i + 1));
        inp.value = werte && werte[v] != null ? werte[v] : "";
        td.append(inp);
        tr.append(td);
        z.felder[v] = inp;
      });
      var tdB = el("td", "zw-bedzelle"), sel = el("select", "zw-feld zw-bed");
      sel.setAttribute("aria-label", "Bedingung, Zeile " + (i + 1));
      ["", "wahr", "falsch"].forEach(function (t) { var o = el("option", null, t || "–"); o.value = t; sel.append(o); });
      sel.value = werte && werte._bed ? werte._bed : "";
      tdB.append(sel);
      var tdA = el("td"), aus = el("input", "zw-feld zw-aus");
      aus.type = "text";
      aus.setAttribute("aria-label", "Ausgabe, Zeile " + (i + 1));
      aus.value = werte && werte._aus ? werte._aus : "";
      tdA.append(aus);
      tr.append(tdB, tdA);
      z.bed = sel; z.aus = aus;
      body.append(tr);
      zeilen.push(z);
      tr.addEventListener("input", geaendert);
      tr.addEventListener("change", geaendert);
    }
    function eintraege() {
      return zeilen.map(function (z) {
        var w = {};
        vars.forEach(function (v) { w[v] = z.felder[v].value; });
        w._bed = z.bed.value; w._aus = z.aus.value;
        return w;
      });
    }
    function geaendert(e) {
      if (e && e.target && e.target.classList) e.target.classList.remove("falsch", "richtig");
      rueck.hidden = true;
      if (opt.aendern) opt.aendern(eintraege());
    }
    function erwartetFeld(z, v) { return hat(z.werte, v) ? z.werte[v] : null; }

    // Eingaben: gespeicherte, sonst gelöst (Lösung) oder leer mit den Eingabewerten in der ersten Zeile.
    if (opt.fertig) {
      erw.forEach(function (z, i) {
        var w = {};
        vars.forEach(function (v) {
          var vor = i ? erwartetFeld(erw[i - 1], v) : null, jetzt = erwartetFeld(z, v);
          w[v] = jetzt === null || (i && jetzt === vor) ? "" : String(jetzt);
        });
        w._bed = z.ja == null ? "" : z.ja ? "wahr" : "falsch";
        w._aus = z.ausgabe.join(", ");
        neueZeile(w);
      });
    } else if (opt.eintraege && opt.eintraege.length) {
      opt.eintraege.forEach(neueZeile);
    } else {
      var anzahl = opt.fest || 1;
      for (var k = 0; k < anzahl; k++) neueZeile(k === 0 ? opt.eingabe : null);
    }
    if (opt.fertig) {
      tab.classList.add("fertig");
      zeilen.forEach(function (z) { Array.prototype.forEach.call(z.tr.querySelectorAll(".zw-feld"), function (f) { f.disabled = true; }); });
      knoepfe.hidden = true;
      rueck.hidden = false;
      rueck.className = "bk-frage-rueck ok";
      rueck.textContent = "Der Schreibtischtest stimmt.";
    }

    plus.addEventListener("click", function () { neueZeile(null); geaendert(); zeilen[zeilen.length - 1].felder[vars[0]].focus(); });
    minus.addEventListener("click", function () {
      if (zeilen.length <= 1) return;
      zeilen.pop().tr.remove();
      geaendert();
    });

    pruef.addEventListener("click", function () {
      var falsch = 0, ungueltig = 0, vorher = {};
      var soll = opt.fest ? erw.slice(0, opt.fest) : erw;
      zeilen.forEach(function (z, i) {
        var e = soll[i];
        vars.forEach(function (v) {
          var inp = z.felder[v], w = zahlOderLeer(inp.value);
          if (isNaN(w)) { ungueltig++; inp.classList.add("falsch"); return; }
          var eff = w === null ? (hat(vorher, v) ? vorher[v] : null) : w;
          vorher[v] = eff;
          if (!e) { inp.classList.remove("richtig", "falsch"); return; }
          var ok = eff === erwartetFeld(e, v);
          inp.classList.toggle("falsch", !ok);
          inp.classList.toggle("richtig", ok && w !== null);
          if (!ok) falsch++;
        });
        if (!e) return;
        var bedSoll = e.ja == null ? "" : e.ja ? "wahr" : "falsch", okB = z.bed.value === bedSoll;
        z.bed.classList.toggle("falsch", !okB);
        z.bed.classList.toggle("richtig", okB && bedSoll !== "");
        if (!okB) falsch++;
        var a = ausgabeLesen(z.aus.value);
        var okA = a.length === e.ausgabe.length && a.every(function (x, k) { return x === e.ausgabe[k]; });
        z.aus.classList.toggle("falsch", !okA);
        z.aus.classList.toggle("richtig", okA && e.ausgabe.length > 0);
        if (!okA) falsch++;
      });
      var fehlt = soll.length - zeilen.length;
      rueck.hidden = false;
      if (!falsch && !ungueltig && !fehlt) {
        rueck.className = "bk-frage-rueck ok";
        rueck.textContent = "Der Schreibtischtest stimmt.";
        if (opt.geloest) opt.geloest();
        return;
      }
      var teile = [];
      if (ungueltig) teile.push(ungueltig + (ungueltig === 1 ? " Feld enthält" : " Felder enthalten") + " keine ganze Zahl");
      if (falsch) teile.push(falsch + (falsch === 1 ? " Feld stimmt" : " Felder stimmen") + " noch nicht (rot markiert)");
      if (fehlt > 0) teile.push(fehlt === 1 ? "es fehlt eine Zeile" : "es fehlen Zeilen");
      if (fehlt < 0) teile.push(fehlt === -1 ? "es hat eine Zeile zu viel" : "es hat Zeilen zu viel");
      rueck.className = "bk-frage-rueck fehler";
      var t = teile.join(", ") + ".";
      rueck.textContent = t.charAt(0).toUpperCase() + t.slice(1) + " Vergleichen Sie mit «Einzelschritt».";
      if (opt.geprueft) opt.geprueft();
    });
  }

  /* ---------- Geführter Schreibtischtest: Feld für Feld ---------- */

  // opt: {variablen, bedingung, eingabe, zeilen (erwartete Zeilen), schritte ([{zeile, art:"var"|"bed"|"aus", name, soll, pfad}]),
  //       index (schon beantwortete Schritte), weiter(index), markiere(pfad|null), geloest()}
  // Die Tabelle steht von Anfang an da; das Feld, das dran ist, ist farbig hinterlegt, darunter steht die Frage dazu.
  function gefuehrt(box, opt) {
    box.textContent = "";
    var vars = opt.variablen, st = opt.schritte, eine = !!opt.bedingung, i = opt.index || 0;
    var tabBox = el("div", "zw-tabbox zw-tabbox-test");
    var tab = el("table", "zw-tabelle zw-test zw-gefuehrt"), body = el("tbody");
    tab.append(el("caption", null, "Schreibtischtest"), kopf(vars, opt.bedingung), body);
    tabBox.append(tab);
    var zellen = opt.zeilen.map(function (z, k) {
      var tr = el("tr"), c = { vars: {} };
      tr.append(el("td", "zw-dg", durchgangText(z, eine)));
      vars.forEach(function (v) { c.vars[v] = el("td", "zw-gz"); tr.append(c.vars[v]); });
      c.bed = el("td", "zw-gz zw-bedzelle");
      c.aus = el("td", "zw-gz");
      tr.append(c.bed, c.aus);
      body.append(tr);
      return c;
    });
    var frage = el("p", "bk-frage-text");
    var eingabe = el("div", "zw-knoepfe");
    var rueck = el("p", "bk-frage-rueck", "");
    rueck.setAttribute("role", "status");
    box.append(tabBox, frage, eingabe, rueck);

    function zelle(s) { return s.art === "var" ? zellen[s.zeile].vars[s.name] : zellen[s.zeile][s.art]; }
    function text(s) {
      return s.art === "bed" ? (s.soll ? "wahr" : "falsch") : s.art === "aus" ? s.soll.join(", ") : String(s.soll);
    }
    // Eingabewerte stehen in der ersten Zeile schon da.
    Object.keys(opt.eingabe).forEach(function (v) { if (zellen[0] && zellen[0].vars[v]) zellen[0].vars[v].textContent = String(opt.eingabe[v]); });

    function fragetext(s) {
      var n = s.zeile + 1, z = opt.zeilen[s.zeile];
      var wann = typeof z.durchgang === "string" ? "am Ende"
        : eine ? "bei der " + n + ". Prüfung" + (n === 1 ? " (vor dem ersten Durchlauf der Wiederholung)" : " (der Rumpf ist " + (n - 1) + "-mal gelaufen)") : "in Zeile " + n;
      if (s.art === "bed") return "Ist «" + (opt.bedingung || z.bedingung) + "» " + wann + " wahr oder falsch?";
      if (s.art === "aus") return "Was wurde bis hierher ausgegeben, seit der Zeile davor?";
      return "Welchen Wert hat «" + s.name + "» " + wann + "?";
    }

    var steuer = null;   // Eingabefeld im farbigen Feld
    function zeigen() {
      Array.prototype.forEach.call(box.querySelectorAll(".zw-dran"), function (c) { c.classList.remove("zw-dran"); });
      eingabe.textContent = "";
      rueck.hidden = true;
      steuer = null;
      if (i >= st.length) { opt.markiere(null); frage.textContent = ""; opt.geloest(); return; }
      var s = st[i], c = zelle(s);
      c.classList.add("zw-dran");
      c.classList.remove("zw-blitz-ok", "zw-blitz-falsch");
      opt.markiere(s.pfad);
      frage.textContent = "Schritt " + (i + 1) + " von " + st.length + ". " + fragetext(s) + " Tragen Sie die Antwort im farbigen Feld der Tabelle ein.";
      if (s.art === "bed") {
        steuer = el("select", "zw-feld zw-bed");
        ["", "wahr", "falsch"].forEach(function (t) { var o = el("option", null, t || "–"); o.value = t; steuer.append(o); });
        // Mit Maus/Finger übernimmt schon die Wahl; mit der Tastatur schaltet der Pfeil nur um, dort gilt Enter.
        var mitZeiger = false;
        steuer.addEventListener("pointerdown", function () { mitZeiger = true; });
        steuer.addEventListener("keydown", function (e) { mitZeiger = false; if (e.key === "Enter") { e.preventDefault(); pruefen(); } });
        steuer.addEventListener("change", function () { if (mitZeiger && steuer.value) { mitZeiger = false; pruefen(); } });
      } else {
        steuer = el("input", "zw-feld" + (s.art === "aus" ? " zw-aus" : ""));
        steuer.type = "text";
        steuer.setAttribute("inputmode", "numeric");
        steuer.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); pruefen(); } });
      }
      steuer.setAttribute("aria-label", "Ihre Antwort");
      c.textContent = "";
      c.append(steuer);
      var ok = el("button", "bk-knopf primaer", "Weiter");
      ok.type = "button";
      ok.addEventListener("click", pruefen);
      eingabe.append(ok);
    }
    function meldung(t, fehler) {
      rueck.hidden = false;
      rueck.className = "bk-frage-rueck" + (fehler ? " fehler" : " ok");
      rueck.textContent = t;
    }
    function pruefen() {
      var s = st[i], v = steuer.value.trim(), richtig;
      if (!v) { meldung("Tragen Sie zuerst im farbigen Feld einen Wert ein.", false); rueck.className = "bk-frage-rueck"; steuer.focus(); return; }
      if (s.art === "bed") richtig = (v === "wahr") === s.soll;
      else {
        var a = ausgabeLesen(v);
        if (!a.length || a.some(isNaN) || (s.art === "var" && a.length !== 1)) {
          meldung(s.art === "aus" ? "Geben Sie die Ausgabe als Zahl ein." : "Geben Sie eine ganze Zahl ein.", false);
          rueck.className = "bk-frage-rueck";
          steuer.focus();
          return;
        }
        richtig = s.art === "aus" ? a.length === s.soll.length && a.every(function (x, k) { return x === s.soll[k]; }) : a[0] === s.soll;
      }
      var c = zelle(s);
      c.textContent = text(s);
      c.classList.add("zw-gut", richtig ? "zw-blitz-ok" : "zw-blitz-falsch");
      i++;
      opt.weiter(i);
      zeigen();
      if (i < st.length) {
        meldung(richtig ? "Richtig." : "Nicht ganz: richtig ist " + text(s) + ".", !richtig);
        steuer.focus({ preventScroll: true });
      }
    }
    // Schon beantwortete Felder ausfüllen.
    for (var k = 0; k < i && k < st.length; k++) { zelle(st[k]).textContent = text(st[k]); zelle(st[k]).classList.add("zw-gut"); }
    zeigen();
  }

  window.KaraZahlwelt = { ansicht: ansicht, schreibtisch: schreibtisch, gefuehrt: gefuehrt, ausgabeLesen: ausgabeLesen };
})();
