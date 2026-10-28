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

  // Beschriftung der Spalte «Durchgang»: mit nur einer Wiederholung heisst die erste Zeile «Start».
  function durchgangText(z, eineSchleife) {
    if (typeof z.durchgang === "string") return z.durchgang;
    return z.durchgang === 0 && eineSchleife ? "Start" : String(z.durchgang);
  }
  function bedingungText(z, bedingung) {
    if (z.ja == null) return "";
    return (bedingung ? "" : z.bedingung + ": ") + (z.ja ? "wahr" : "falsch");
  }

  function kopf(variablen, bedingung) {
    var tr = el("tr");
    tr.append(el("th", null, "Durchgang"));
    variablen.forEach(function (v) { tr.append(el("th", "zw-var", v)); });
    tr.append(el("th", null, bedingung || "Bedingung"), el("th", null, "Ausgabe"));
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
    var hilfe = el("p", "zw-hilfe", "Eine Zeile pro Prüfung der Bedingung. Tragen Sie ein, was sich ändert; leer heisst: unverändert. " +
      "Schreiben Sie Ausgaben in die Zeile, nach der sie erscheinen." + (opt.fest ? " Füllen Sie die ersten " + opt.fest + " Zeilen aus." : ""));
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
      var lab = erw[i] ? durchgangText(erw[i], eineSchleife) : (i === 0 && eineSchleife ? "Start" : String(i));
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
      var tdB = el("td"), sel = el("select", "zw-feld zw-bed");
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

  window.KaraZahlwelt = { ansicht: ansicht, schreibtisch: schreibtisch, ausgabeLesen: ausgabeLesen };
})();
