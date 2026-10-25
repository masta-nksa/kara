/* ============================================================
   blume.js – Fortschritt als Blume (Cockpit und Baukasten).
   Je erledigte Aufgabe bzw. richtig beantwortete Frage öffnet sich
   ein Blütenblatt; Zusatz-Blätter sind kleiner und gestrichelt.
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

  // pflicht, zusatz: Listen von true/false (erledigt). nr: Farbe 0–3. groesse in px.
  function blume(pflicht, zusatz, nr, groesse) {
    var alle = pflicht.map(function (v) { return { voll: v, zusatz: false }; })
      .concat(zusatz.map(function (v) { return { voll: v, zusatz: true }; }));
    var g = groesse || 56, s = svgEl("svg", { viewBox: "-50 -50 100 100", width: g, height: g, "aria-hidden": "true" }, "kb-blume kb-farbe" + (nr % 4));
    var n = Math.max(alle.length, 1);
    alle.forEach(function (b, i) {
      var w = 360 * i / n, lang = b.zusatz ? 30 : 38, breit = b.zusatz ? 9 : 12;
      s.append(svgEl("ellipse", { cx: 0, cy: -lang / 2 - 8, rx: breit, ry: lang / 2, transform: "rotate(" + w + ")" },
        "kb-blatt" + (b.voll ? " voll" : "") + (b.zusatz ? " zusatz" : "")));
    });
    var fertig = pflicht.length > 0 && pflicht.every(Boolean);
    s.append(svgEl("circle", { cx: 0, cy: 0, r: 11 }, "kb-mitte" + (fertig ? " voll" : "")));
    return s;
  }

  window.KaraBlume = { blume: blume };
})();
