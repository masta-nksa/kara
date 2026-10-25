/* ============================================================
   cockpit.js – Übersicht: Reihen aus baukasten/reihen.json,
   Fortschritt aus dem localStorage des Baukastens (nur lesen).
   ============================================================ */
(function () {
  "use strict";

  var BASIS = "baukasten/";
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var rule = $("pixelrule");
  for (var i = 0; i < 40; i++) rule.append(document.createElement("i"));

  // Gelöste Aufgaben; vor dem ersten Besuch im Baukasten ggf. noch unter dem alten Schlüssel aus checks.
  function geloest() {
    try {
      var roh = localStorage.getItem("kara.baukasten.v1");
      if (roh === null) roh = localStorage.getItem("checks.baukasten.v1");
      var d = JSON.parse(roh || "{}");
      return d && d.geloest && typeof d.geloest === "object" ? d.geloest : {};
    } catch (e) { return {}; }
  }

  // Richtig beantwortete Konzeptfragen (Baukasten): {aufgabenId: 1}
  function beantwortet() {
    try {
      var d = JSON.parse(localStorage.getItem("kara.baukasten.fragen.v1") || "{}");
      return d && typeof d === "object" && !Array.isArray(d) ? d : {};
    } catch (e) { return {}; }
  }

  // Je Abschnitt (z. B. Denkfigur) eine Blume: gelöste Aufgaben und beantwortete Fragen sind Blätter.
  function blumen(r, aufgaben, fertig, fragen) {
    var box = el("div", "ck-blumen");
    r.abschnitte.forEach(function (x, k) {
      var pflicht = [], zusatz = [];
      aufgaben.forEach(function (a) {
        if (a.abschnitt !== x.id) return;
        var l = a.zusatz ? zusatz : pflicht;
        l.push(!!fertig[a.id]);
        if (a.frage) l.push(!!fragen[a.id]);
      });
      var n = pflicht.filter(Boolean).length;
      var f = el("figure", "ck-blume kb-farbe" + (k % 4));
      f.append(window.KaraBlume.blume(pflicht, zusatz, k, 44), el("figcaption", null, x.titel));
      f.setAttribute("aria-label", x.titel + ": " + n + " von " + pflicht.length + " erledigt");
      box.append(f);
    });
    return box;
  }

  function holeJson(datei) {
    return fetch(datei, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(datei + ": HTTP " + r.status); return r.json(); });
  }

  function fehler(err) {
    var box = el("div", "oops");
    box.append(el("h2", null, "Die Übersicht kann nicht geladen werden."));
    box.append(el("p", null, String(err && err.message ? err.message : err)));
    $("reihen").replaceWith(box);
    console.error("[cockpit]", err);
  }

  function karte(r, nr, aufgaben, fertig) {
    var li = el("li", "ck-karte");
    var href = BASIS + "?reihe=" + encodeURIComponent(r.id);
    var n = aufgaben.filter(function (a) { return fertig[a.id]; }).length;

    li.append(el("span", "ck-nr", String(nr)));
    li.append(el("h2", null, r.titel));
    if (r.untertitel) li.append(el("p", "ck-unter", r.untertitel));

    var stand = el("div", "ck-stand");
    var balken = el("div", "ck-balken");
    balken.setAttribute("role", "progressbar");
    balken.setAttribute("aria-valuemin", "0");
    balken.setAttribute("aria-valuemax", String(aufgaben.length));
    balken.setAttribute("aria-valuenow", String(n));
    balken.setAttribute("aria-label", r.titel + ": " + n + " von " + aufgaben.length + " gelöst");
    var fuell = el("i");
    balken.append(fuell);
    stand.append(balken, el("span", "ck-zahl", n + " von " + aufgaben.length + " gelöst"));
    li.append(stand);
    if (Array.isArray(r.abschnitte) && r.abschnitte.length && window.KaraBlume) li.append(blumen(r, aufgaben, fertig, beantwortet()));
    requestAnimationFrame(function () { fuell.style.width = (aufgaben.length ? 100 * n / aufgaben.length : 0) + "%"; });

    var ul = el("ul", "ck-aufgaben");
    aufgaben.forEach(function (a) {
      var item = el("li"), link = el("a", fertig[a.id] ? "fertig" : null);
      link.href = href + "&aufgabe=" + encodeURIComponent(a.id);
      link.append(el("span", null, a.titel));
      if (fertig[a.id]) link.append(el("span", "haken", "✓"));
      link.setAttribute("aria-label", a.titel + (fertig[a.id] ? ", gelöst" : ""));
      item.append(link);
      ul.append(item);
    });
    li.append(ul);

    // Weiter bei der ersten ungelösten Aufgabe
    var offen = aufgaben.filter(function (a) { return !fertig[a.id]; })[0];
    var start = el("a", "ck-start", n === 0 ? "Starten" : offen ? "Weitermachen" : "Nochmals ansehen");
    start.href = offen && n > 0 ? href + "&aufgabe=" + encodeURIComponent(offen.id) : href;
    if (r.lokal) {
      var knoepfe = el("div", "ck-knoepfe"), editor = el("a", "ck-start ck-zweit", "Labyrinth-Editor");
      editor.href = "editor/";
      knoepfe.append(start, editor);
      li.append(knoepfe);
    } else li.append(start);
    return li;
  }

  holeJson(BASIS + "reihen.json").then(function (d) {
    if (!d || !Array.isArray(d.reihen) || !d.reihen.length) throw new Error("reihen.json: Feld „reihen“ fehlt oder ist leer.");
    return Promise.all(d.reihen.map(function (r) {
      return Promise.all(r.dateien.map(function (f) { return holeJson(BASIS + f); })).then(function (teile) {
        var aufgaben = teile.reduce(function (acc, t) { return acc.concat(t.aufgaben || []); }, []);
        // Eigene Challenges aus diesem Browser gehören zur Reihe mit «lokal: true»
        if (r.lokal && window.KaraChallenges) aufgaben = aufgaben.concat(window.KaraChallenges.alle().map(window.KaraChallenges.alsAufgabe));
        return { reihe: r, aufgaben: aufgaben };
      });
    }));
  }).then(function (liste) {
    var ol = $("reihen"), fertig = geloest();
    liste.forEach(function (x, i) { ol.append(karte(x.reihe, i + 1, x.aufgaben, fertig)); });
  }).catch(fehler);
})();
