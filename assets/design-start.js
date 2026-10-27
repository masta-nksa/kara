/* design-start.js – setzt das Design, bevor die Seite gezeichnet wird (im <head> laden).
   Gewählt ist, was im Browser gespeichert ist («kara.design.v1»). Ohne Wahl gilt «grusel»
   bis zum 2. November 2026 (Halloween-Woche), danach «klassisch». Der Umschalter selbst
   steht in design.js. */
(function () {
  "use strict";
  var id = null;
  try { id = localStorage.getItem("kara.design.v1"); } catch (e) { /* gesperrt */ }
  if (!id) {
    var t = new Date();
    var halloween = t.getFullYear() === 2026 && ((t.getMonth() === 9 && t.getDate() >= 20) || (t.getMonth() === 10 && t.getDate() <= 2));
    id = halloween ? "grusel" : "klassisch";
  }
  if (id !== "klassisch") document.documentElement.setAttribute("data-design", id);
  if (id === "grusel") {
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Creepster&display=swap";
    document.head.appendChild(l);
  }
})();
