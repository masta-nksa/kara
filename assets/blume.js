/* ============================================================
   blume.js – Fortschritt als Blume (Cockpit und Baukasten).
   Je erledigte Aufgabe bzw. richtig beantwortete Frage öffnet sich
   ein Blütenblatt (bei wenigen Einträgen mehrere); Zusatz-Blätter sind kleiner und gestrichelt.
   Ist alles Pflichtige erledigt, füllt sich die Mitte.
   ============================================================ */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs, cls) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (cls) n.setAttribute("class", cls);
    return n;
  }

  // pflicht, zusatz: Listen von true/false (erledigt). nr: Farbe 0–5. groesse in px.
  function blume(pflicht, zusatz, nr, groesse) {
    var eintraege = pflicht.map(function (v) { return { voll: v, zusatz: false }; })
      .concat(zusatz.map(function (v) { return { voll: v, zusatz: true }; }));
    // Wenige Einträge geben je mehrere Blätter, damit es auch mit zwei Aufgaben nach Blume aussieht.
    var je = Math.max(1, Math.ceil(5 / Math.max(eintraege.length, 1))), alle = [];
    eintraege.forEach(function (e) { for (var j = 0; j < je; j++) alle.push(e); });
    var g = groesse || 56, s = svgEl("svg", { viewBox: "-50 -50 100 100", width: g, height: g, "aria-hidden": "true" }, "kb-blume kb-farbe" + (nr % 6));
    var n = Math.max(alle.length, 1);
    alle.forEach(function (b, i) {
      // Bei vielen Blättern werden sie schmaler, damit sie sich kaum überdecken.
      var w = 360 * i / n, lang = b.zusatz ? 30 : 38, breit = Math.min(b.zusatz ? 9 : 12, 95 / n);
      s.append(svgEl("ellipse", { cx: 0, cy: -lang / 2 - 8, rx: breit, ry: lang / 2, transform: "rotate(" + w + ")" },
        "kb-blatt" + (b.voll ? " voll" : "") + (b.zusatz ? " zusatz" : "")));
    });
    var fertig = pflicht.length > 0 && pflicht.every(Boolean);
    s.append(svgEl("circle", { cx: 0, cy: 0, r: 11 }, "kb-mitte" + (fertig ? " voll" : "")));
    return s;
  }

  window.KaraBlume = { blume: blume };
})();
