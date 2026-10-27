/* ============================================================
   design.js – Design-Umschalter und Effekte (Cockpit, Baukasten, Editor)
   Designs: klassisch · bluete · grusel (siehe designs.css). Die Wahl steht in
   localStorage «kara.design.v1»; design-start.js setzt sie schon im <head>.
   Im Grusel erschreckt Kara bei Fehlschlägen und manchmal mitten im Lauf
   (Bild + Ton, der Ton ist bewusst immer an) oder
   spielt nur einen Gruselton, bei Erfolg steigen Fledermäuse
   und Geister auf. Der Baukasten ruft window.KaraDesign.lauf() beim Start und
   .ende(ok) nach der Auswertung. Alles per CSS/SVG/WebAudio, ohne Fremddateien.
   ============================================================ */
(function () {
  "use strict";

  var SCHLUESSEL = "kara.design.v1";
  var DESIGNS = [
    { id: "klassisch", name: "Klassisch", icon: "▦" },
    { id: "bluete", name: "Blüte", icon: "✿" },
    { id: "grusel", name: "Grusel", icon: "🎃" }
  ];
  var SVGNS = "http://www.w3.org/2000/svg";
  var root = document.documentElement;
  var KEINE_BEWEGUNG = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function aktuell() { return root.getAttribute("data-design") || "klassisch"; }
  function speichern(id) { try { localStorage.setItem(SCHLUESSEL, id); } catch (e) { /* gesperrt */ } }

  function anwenden(id) {
    if (id === "klassisch") root.removeAttribute("data-design"); else root.setAttribute("data-design", id);
    if (id === "grusel" && !document.querySelector("link[href*='Creepster']")) {
      var l = document.createElement("link");
      l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Creepster&display=swap";
      document.head.appendChild(l);
    }
    beschriften();
  }

  /* ---------- Knopf ---------- */
  var knopf = document.createElement("button");
  knopf.type = "button"; knopf.className = "design-knopf";
  function beschriften() {
    var i = Math.max(0, DESIGNS.map(function (d) { return d.id; }).indexOf(aktuell()));
    var n = DESIGNS[(i + 1) % DESIGNS.length];
    knopf.textContent = DESIGNS[i].icon + " " + DESIGNS[i].name;
    knopf.dataset.ziel = n.id;
    knopf.title = "Zum Design «" + n.name + "» wechseln";
    knopf.setAttribute("aria-label", "Design wechseln, jetzt: " + DESIGNS[i].name + ", als Nächstes: " + n.name);
  }
  knopf.addEventListener("click", function () { audioWecken(); var z = knopf.dataset.ziel; speichern(z); anwenden(z); });
  document.body.appendChild(knopf);
  beschriften();
  window.addEventListener("storage", function (ev) { if (ev.key === SCHLUESSEL && ev.newValue) anwenden(ev.newValue); });

  /* ---------- Dekoration auf der Karte (nur im Grusel sichtbar) ---------- */
  function se(tag, a, cls) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    e.setAttribute("class", "deko " + (cls || ""));
    return e;
  }
  function schmuecken(wurzel) {
    var i;
    var kaefer = wurzel.querySelectorAll ? wurzel.querySelectorAll(".bk-kaefer:not(.bk-kaefer-bild):not([data-deko])") : [];
    for (i = 0; i < kaefer.length; i++) {
      var k = kaefer[i]; k.setAttribute("data-deko", "1");
      // Spinne: je Seite ein weiteres Beinpaar, rote Augen
      k.append(se("line", { x1: -7, y1: -1, x2: -15, y2: -3 }, "deko-bein"), se("line", { x1: 7, y1: -1, x2: 15, y2: -3 }, "deko-bein"),
        se("line", { x1: -7, y1: 5, x2: -14, y2: 8 }, "deko-bein"), se("line", { x1: 7, y1: 5, x2: 14, y2: 8 }, "deko-bein"),
        se("circle", { cx: -2.2, cy: -13, r: 1.3 }, "deko-auge"), se("circle", { cx: 2.2, cy: -13, r: 1.3 }, "deko-auge"));
    }
    var steine = wurzel.querySelectorAll ? wurzel.querySelectorAll(".bk-stein:not([data-deko])") : [];
    for (i = 0; i < steine.length; i++) {
      var s = steine[i]; s.setAttribute("data-deko", "1");
      var b = s.querySelector(".bk-stein-block");
      if (!b) continue;
      var x = Number(b.getAttribute("x")), y = Number(b.getAttribute("y")), w = Number(b.getAttribute("width"));
      var cx = x + w / 2;
      s.append(se("path", { d: "M" + cx + " " + (y + w - 14) + " V" + (y + w - 36) + " M" + (cx - 7) + " " + (y + w - 29) + " H" + (cx + 7) }, "deko-kreuz"));
    }
  }
  new MutationObserver(function (liste) {
    for (var i = 0; i < liste.length; i++) for (var j = 0; j < liste[i].addedNodes.length; j++) {
      var n = liste[i].addedNodes[j];
      if (n.nodeType === 1) schmuecken(n);
    }
  }).observe(document.body, { childList: true, subtree: true });
  schmuecken(document);

  /* ---------- Ton (WebAudio, wird beim ersten Klick freigeschaltet) ---------- */
  var audio = null;
  function audioWecken() {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
    } catch (e) { audio = null; }
  }
  ["pointerdown", "keydown"].forEach(function (n) { window.addEventListener(n, audioWecken, { passive: true }); });

  function rauschen(dauer) {
    var n = Math.floor(audio.sampleRate * dauer), buf = audio.createBuffer(1, n, audio.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var q = audio.createBufferSource(); q.buffer = buf; return q;
  }
  function verzerrer() {
    var c = new Float32Array(256);
    for (var i = 0; i < 256; i++) { var x = i / 128 - 1; c[i] = Math.tanh(x * 6); }
    var w = audio.createWaveShaper(); w.curve = c; return w;
  }
  // Schrei: verzerrte, gleitende Töne + Rauschen + dumpfer Schlag
  function schrei(stark) {
    if (!audio || audio.state !== "running") return;
    var t = audio.currentTime, dauer = stark ? 1.1 : 0.5;
    var master = audio.createGain(), komp = audio.createDynamicsCompressor(), vz = verzerrer();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(stark ? 0.9 : 0.5, t + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    vz.connect(master); master.connect(komp); komp.connect(audio.destination);
    [[0, "sawtooth", 620, 1500, 380], [0.01, "square", 930, 2200, 520], [0, "sawtooth", 233, 520, 150]].forEach(function (p) {
      var o = audio.createOscillator(); o.type = p[1];
      o.frequency.setValueAtTime(p[2], t + p[0]);
      o.frequency.exponentialRampToValueAtTime(p[3], t + p[0] + dauer * 0.25);
      o.frequency.exponentialRampToValueAtTime(p[4], t + dauer);
      var vib = audio.createOscillator(), vg = audio.createGain();
      vib.frequency.value = 38; vg.gain.value = 60; vib.connect(vg); vg.connect(o.frequency);
      o.connect(vz); o.start(t + p[0]); vib.start(t); o.stop(t + dauer); vib.stop(t + dauer);
    });
    var r = rauschen(dauer), bp = audio.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 0.7;
    r.connect(bp); bp.connect(vz); r.start(t);
    var dumpf = audio.createOscillator(), dg = audio.createGain();
    dumpf.frequency.setValueAtTime(110, t); dumpf.frequency.exponentialRampToValueAtTime(28, t + 0.35);
    dg.gain.setValueAtTime(0.9, t); dg.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    dumpf.connect(dg); dg.connect(komp); dumpf.start(t); dumpf.stop(t + 0.4);
  }
  // leises Knarren fürs Flackern
  function knarren() {
    if (!audio || audio.state !== "running") return;
    var t = audio.currentTime, r = rauschen(0.5), f = audio.createBiquadFilter(), g = audio.createGain();
    f.type = "lowpass"; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(120, t + 0.5);
    g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    r.connect(f); f.connect(g); g.connect(audio.destination); r.start(t);
  }
  // Leise Gruseltöne bei Fehlschlägen (ohne Bild): Geisterheulen, Totenglocke oder Kichern
  function ton(typ, f0, start, dauer, laut, ziel) {
    var t = audio.currentTime + start, o = audio.createOscillator(), g = audio.createGain();
    o.type = typ; o.frequency.setValueAtTime(f0, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(laut, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
    o.connect(g); g.connect(ziel || audio.destination); o.start(t); o.stop(t + dauer + 0.05);
    return o;
  }
  function heulen() {
    var t = audio.currentTime, o = ton("sine", 260, 0, 1.6, 0.22), vib = audio.createOscillator(), vg = audio.createGain();
    o.frequency.exponentialRampToValueAtTime(390, t + 0.6); o.frequency.exponentialRampToValueAtTime(210, t + 1.6);
    vib.frequency.value = 5; vg.gain.value = 14; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + 1.6);
  }
  function glocke() {
    [[98, 0.3], [98 * 2.76, 0.12], [98 * 5.4, 0.05]].forEach(function (p) { ton("sine", p[0], 0, 2.4, p[1]); });
  }
  function kichern() {
    for (var i = 0; i < 5; i++) {
      var o = ton("sawtooth", 720 - i * 60, i * 0.13, 0.1, 0.07);
      o.frequency.exponentialRampToValueAtTime(520 - i * 50, audio.currentTime + i * 0.13 + 0.1);
    }
  }
  function gruselton() {
    if (!audio || audio.state !== "running") return;
    [heulen, glocke, kichern][Math.floor(Math.random() * 3)]();
  }

  /* ---------- Gesichter für den Schreck ---------- */
  var GESICHT = '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><radialGradient id="kf" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#ece6d2"/><stop offset=".65" stop-color="#9c9680"/><stop offset="1" stop-color="#1c1814"/></radialGradient></defs>' +
    '<path d="M28 110C28 22 172 22 172 110C172 162 150 202 100 228C50 202 28 162 28 110Z" fill="url(#kf)"/>' +
    '<path d="M70 38l8 22-10 14M130 44l-6 26 12 12" stroke="#3a342a" stroke-width="2" fill="none"/>' +
    '<ellipse cx="66" cy="102" rx="23" ry="31" fill="#000" transform="rotate(-14 66 102)"/><ellipse cx="134" cy="102" rx="23" ry="31" fill="#000" transform="rotate(14 134 102)"/>' +
    '<circle cx="68" cy="108" r="4" fill="#f00"/><circle cx="132" cy="108" r="4" fill="#f00"/>' +
    '<path d="M100 128l-9 24h18z" fill="#14100c"/>' +
    '<path d="M52 166Q100 144 148 166L156 192Q100 244 44 192Z" fill="#000"/>' +
    '<path d="M54 170l7 22 7-20 8 24 8-22 8 24 8-22 8 24 8-22 8 24 8-22 7 20 7-20" stroke="#ece6d2" stroke-width="5" fill="none" stroke-linejoin="round"/>' +
    '</svg>';
  var SPINNE = '<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<g stroke="#0a0a0a" stroke-width="7" stroke-linecap="round" fill="none">' +
    '<path d="M100 96L50 40L8 62M96 106L30 100L2 138M100 116L40 160L18 196M110 124L82 176L70 200"/>' +
    '<path d="M140 96L190 40L232 62M144 106L210 100L238 138M140 116L200 160L222 196M130 124L158 176L170 200"/></g>' +
    '<ellipse cx="120" cy="128" rx="34" ry="42" fill="#0a0a0a"/><circle cx="120" cy="84" r="26" fill="#0a0a0a"/>' +
    '<path d="M108 126l12 20 12-20-12 8z" fill="#c00"/>' +
    '<g fill="#f22"><circle cx="110" cy="78" r="5"/><circle cx="130" cy="78" r="5"/><circle cx="118" cy="68" r="3"/><circle cx="122" cy="68" r="3"/><circle cx="104" cy="88" r="2.5"/><circle cx="136" cy="88" r="2.5"/></g>' +
    '<path d="M108 100l-4 12M132 100l4 12" stroke="#ddd" stroke-width="3"/></svg>';

  function schreck() {
    if (document.querySelector(".schreck")) return;
    var d = document.createElement("div");
    d.className = "schreck"; d.setAttribute("aria-hidden", "true");
    d.innerHTML = Math.random() < 0.6 ? GESICHT : SPINNE;
    function weg() { d.classList.add("aus"); setTimeout(function () { d.remove(); }, 380); }
    d.addEventListener("click", weg);
    document.body.appendChild(d);
    schrei(true);
    setTimeout(weg, KEINE_BEWEGUNG ? 700 : 1400);
  }
  function augen() {
    var a = document.createElement("div");
    a.className = "schreck-augen"; a.setAttribute("aria-hidden", "true");
    a.innerHTML = "<i></i><i></i>";
    a.style.left = (6 + Math.random() * 78) + "vw"; a.style.top = (8 + Math.random() * 76) + "vh";
    document.body.appendChild(a);
    setTimeout(function () { a.remove(); }, 2500);
  }
  function flackern() {
    var f = document.createElement("div");
    f.className = "schreck-flackern"; f.setAttribute("aria-hidden", "true");
    document.body.appendChild(f); knarren();
    setTimeout(function () { f.remove(); }, 700);
  }

  /* ---------- Aufsteigende Figuren bei Erfolg ---------- */
  var FIGUREN = { grusel: ["🦇", "👻", "🎃", "🕷️", "💀"], bluete: ["🌸", "🌷", "💖", "✨", "🦋"] };
  function aufsteigen() {
    var set = FIGUREN[aktuell()];
    if (!set || KEINE_BEWEGUNG) return;
    for (var i = 0; i < 14; i++) (function (i) {
      setTimeout(function () {
        var e = document.createElement("span");
        e.className = "design-aufstieg"; e.setAttribute("aria-hidden", "true");
        e.textContent = set[Math.floor(Math.random() * set.length)];
        e.style.left = (4 + Math.random() * 90) + "vw";
        e.style.fontSize = (1.6 + Math.random() * 1.8) + "rem";
        document.body.appendChild(e);
        setTimeout(function () { e.remove(); }, 3100);
      }, i * 120);
    })(i);
  }

  /* ---------- Hooks für den Baukasten ---------- */
  var laufTimer = null, letzterSchreck = false;
  function lauf() {
    clearTimeout(laufTimer);
    if (aktuell() !== "grusel" || Math.random() > 0.35) return;
    laufTimer = setTimeout(function () {
      var w = Math.random();
      if (w < 0.45) augen(); else if (w < 0.85) flackern(); else { schreck(); letzterSchreck = true; }
    }, 700 + Math.random() * 3500);
  }
  function ende(ok) {
    clearTimeout(laufTimer);
    if (ok) { aufsteigen(); return; }
    if (aktuell() !== "grusel") return;
    // Nicht jedes Mal: Schreck mit 60 % (nie zweimal nacheinander), sonst in der Hälfte der Fälle nur ein Ton
    if (!letzterSchreck && Math.random() < 0.6) { letzterSchreck = true; setTimeout(schreck, 250); return; }
    letzterSchreck = false;
    if (Math.random() < 0.5) setTimeout(gruselton, 200);
  }

  window.KaraDesign = { lauf: lauf, ende: ende, schreck: schreck, aktuell: aktuell };
})();
