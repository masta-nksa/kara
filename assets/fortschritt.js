/* ============================================================
   fortschritt.js – Prozentbalken je Reihe (Cockpit und Baukasten)
   Zählt nur selbst bearbeitete Aufgaben: gelöst, Fragen beantwortet und
   nicht per Dreifachklick mit der Musterlösung gefüllt. 100 % sind alle
   Pflichtaufgaben; Zusatzaufgaben und eigene Challenges kommen darüber hinaus.
   ============================================================ */
(function () {
  "use strict";

  var MUSTER_SPEICHER = "kara.baukasten.muster.v1";

  // Aufgaben, die per Dreifachklick als gelöst gelten: {aufgabenId: 1}
  function musterLaden() {
    try {
      var d = JSON.parse(localStorage.getItem(MUSTER_SPEICHER) || "{}");
      return d && typeof d === "object" && !Array.isArray(d) ? d : {};
    } catch (e) { return {}; }
  }
  function musterSpeichern(m) {
    try { localStorage.setItem(MUSTER_SPEICHER, JSON.stringify(m)); } catch (e) { /* ohne Speicher weiter */ }
  }

  function selbstErledigt(a, geloest, fragen, muster) {
    return !!geloest[a.id] && !muster[a.id] && (!a.strategie || !!fragen[a.id + "/strategie"]) && (!a.frage || !!fragen[a.id]);
  }

  function stand(aufgaben, geloest, fragen, muster) {
    var von = 0, n = 0, extra = 0;
    aufgaben.forEach(function (a) {
      var zusatz = a.zusatz || a.challenge, ok = selbstErledigt(a, geloest, fragen, muster);
      if (!zusatz) von++;
      if (ok && zusatz) extra++;
      else if (ok) n++;
    });
    return { von: von, n: n, extra: extra, prozent: von ? Math.round(100 * (n + extra) / von) : 0 };
  }

  function anzeige(titel, s) {
    var box = document.createElement("span"), balken = document.createElement("span"), fuell = document.createElement("i"), zahl = document.createElement("span");
    box.className = "kf" + (s.prozent > 100 ? " ueber" : "");
    balken.className = "kf-balken";
    zahl.className = "kf-zahl";
    zahl.textContent = s.prozent + " %";
    fuell.style.width = Math.min(100, s.prozent) + "%";
    balken.append(fuell);
    balken.setAttribute("role", "progressbar");
    balken.setAttribute("aria-valuemin", "0");
    balken.setAttribute("aria-valuemax", String(Math.max(100, s.prozent)));
    balken.setAttribute("aria-valuenow", String(s.prozent));
    var text = titel + ": " + s.prozent + " % bearbeitet, " + s.n + " von " + s.von + " Pflichtaufgaben" +
      (s.extra ? ", dazu " + s.extra + (s.extra === 1 ? " Zusatzaufgabe" : " Zusatzaufgaben") : "");
    balken.setAttribute("aria-label", text);
    box.title = text;
    box.append(balken, zahl);
    return box;
  }

  window.KaraFortschritt = { musterLaden: musterLaden, musterSpeichern: musterSpeichern, stand: stand, anzeige: anzeige };
})();
