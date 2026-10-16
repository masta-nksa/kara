/* ============================================================
   zaehler.js – anonyme Nutzungsstatistik mit GoatCounter
   Meldet Seitenaufrufe (und im Baukasten jede geöffnete Aufgabe sowie
   gelöste Aufgaben als Ereignis) an https://nksa.goatcounter.com.
   Ohne Cookies, ohne Kennung im Browser; GoatCounter speichert keine
   IP-Adressen. Gesendet werden nur Pfad, Seitentitel, Herkunftsseite
   und Bildschirmgrösse.

   Nicht gezählt wird auf localhost/file:, oder wenn der Browser
   abgemeldet ist: einmal eine Seite mit ?zaehler=aus öffnen
   (z. B. für die eigenen Aufrufe als Lehrperson), ?zaehler=an hebt das auf.

   Seiten mit <script … data-selbst> zählen selbst (KaraZaehler.zaehlen),
   alle anderen werden beim Laden automatisch gezählt.
   ============================================================ */
(function () {
  "use strict";

  var ZIEL = "https://nksa.goatcounter.com/count";
  var AUS = "kara.zaehler.aus";
  var skript = document.currentScript;

  function speicher(f) { try { return f(); } catch (e) { return null; } }

  // Ab- und Anmelden per Adresse
  var wunsch = speicher(function () { return new URLSearchParams(location.search).get("zaehler"); });
  if (wunsch === "aus") speicher(function () { localStorage.setItem(AUS, "1"); });
  if (wunsch === "an") speicher(function () { localStorage.removeItem(AUS); });

  function abgeschaltet() {
    var lokal = location.protocol === "file:" || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname);
    // «kara.zaehler.test» erlaubt das Zählen lokal, nur für Tests
    if (lokal && speicher(function () { return localStorage.getItem("kara.zaehler.test"); }) !== "1") return true;
    return speicher(function () { return localStorage.getItem(AUS) === "1"; }) === true;
  }

  var zuletzt = null;
  // pfad: z. B. "/kara/baukasten/inseln/insel2"; ereignis: true für Ereignisse wie «gelöst»
  function zaehlen(pfad, titel, ereignis) {
    if (abgeschaltet()) return;
    if (!ereignis && pfad === zuletzt) return;          // dieselbe Seite nicht doppelt hintereinander
    if (!ereignis) zuletzt = pfad;
    var teile = [
      "p=" + encodeURIComponent(pfad),
      "t=" + encodeURIComponent(titel || document.title),
      "s=" + encodeURIComponent(screen.width + "," + screen.height + "," + (window.devicePixelRatio || 1)),
      "rnd=" + Math.random().toString(36).slice(2)
    ];
    if (ereignis) teile.push("e=true");
    else if (document.referrer && document.referrer.indexOf(location.origin) !== 0) teile.push("r=" + encodeURIComponent(document.referrer));
    var bild = new Image();
    bild.referrerPolicy = "no-referrer-when-downgrade";
    bild.src = ZIEL + "?" + teile.join("&");
  }

  window.KaraZaehler = { zaehlen: zaehlen, abgeschaltet: abgeschaltet };

  if (!skript || !skript.hasAttribute("data-selbst")) zaehlen(location.pathname);
})();
