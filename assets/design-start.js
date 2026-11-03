/* design-start.js – setzt das Design, bevor die Seite gezeichnet wird (im <head> laden).
   Gewählt ist, was im Browser gespeichert ist («kara.design.v1»); ohne Wahl gilt «klassisch».
   «grusel» ist seit 3. November 2026 abgeschaltet (der Code bleibt für nächstes Halloween
   liegen); ein gespeichertes «grusel» zählt als «klassisch». Der Umschalter steht in design.js. */
(function () {
  "use strict";
  var id = null;
  try { id = localStorage.getItem("kara.design.v1"); } catch (e) { /* gesperrt */ }
  if (!id || id === "grusel") id = "klassisch";
  if (id !== "klassisch") document.documentElement.setAttribute("data-design", id);
  if (id === "grusel") {
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Creepster&display=swap";
    document.head.appendChild(l);
  }
})();
