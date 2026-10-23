// King's Cup: pass-one-phone / cast-to-TV game. No build step; plain browser JS.
(function () {
  "use strict";

  const KEYS = { age: "kc.age", rules: "kc.rules", game: "kc.game", players: "kc.players" };

  // ---------- Storage (can be unavailable in private mode; the game still works) ----------
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  // ---------- DOM helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function show(screenId) {
    $$(".screen").forEach((s) => { s.hidden = s.id !== screenId; });
    if (screenId === "screen-game") requestWakeLock(); else releaseWakeLock();
  }

  // ---------- Rules ----------
  function getRules() {
    const overrides = load(KEYS.rules, {});
    const rules = {};
    RANKS.forEach((r) => { rules[r] = Object.assign({}, DEFAULT_RULES[r], overrides[r] || {}); });
    return rules;
  }

  // ---------- Deck ----------
  function randomInt(max) {
    if (window.crypto && crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function newDeck() {
    const deck = [];
    SUITS.forEach((s) => RANKS.forEach((r) => deck.push(r + s.key)));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function parseCard(id) {
    const rank = id.slice(0, -1);
    const suit = SUITS.find((s) => s.key === id.slice(-1));
    return { rank, suit };
  }

  // ---------- Game state ----------
  let players = load(KEYS.players, []);
  let game = null;

  function newGame() {
    game = {
      deck: newDeck(),
      drawn: [],
      players: players.slice(),
      turn: 0,
      kings: 0,
      roles: {},       // role name -> holder
      tableRules: [],  // rules made with Jacks
      finished: false,
      keepGoing: false,
      awaitingRule: false,
    };
    save(KEYS.game, game);
  }

  function currentPlayer() {
    if (!game.players.length) return null;
    return game.players[game.turn % game.players.length];
  }

  // Ignore taps that land right after a draw, so an accidental double-tap doesn't skip a card.
  let lastDrawAt = 0;

  function draw() {
    if (!game || !game.deck.length) return;
    if (game.finished && !game.keepGoing) return;
    if (Date.now() - lastDrawAt < 600) return;
    lastDrawAt = Date.now();

    const id = game.deck.pop();
    const { rank } = parseCard(id);
    const rule = getRules()[rank];
    const drawer = currentPlayer();

    game.drawn.push(id);
    game.awaitingRule = !!rule.newRule;
    if (rule.role) game.roles[rule.role] = drawer || "Whoever drew it";

    let fourthKing = false;
    if (rank === "K") {
      game.kings += 1;
      fourthKing = game.kings === 4;
    }
    game.turn += 1;

    if (fourthKing) game.finished = true;
    save(KEYS.game, game);

    if (navigator.vibrate) navigator.vibrate(fourthKing ? [80, 60, 200] : 30);
    renderGame(true);

    if (fourthKing) {
      setTimeout(() => showEnd("king", drawer), 1400);
    } else if (!game.deck.length) {
      setTimeout(() => showEnd("empty"), 1400);
    }
  }

  // ---------- Rendering ----------
  function renderGame(animate) {
    const cardEl = $("#card");
    const last = game.drawn[game.drawn.length - 1];

    $$(".king-slot").forEach((el, i) => el.classList.toggle("on", i < game.kings));
    $("#remaining").textContent = game.deck.length + " cards left";

    const next = currentPlayer();

    if (!last) {
      cardEl.className = "card back";
      cardEl.setAttribute("aria-label", "Draw a card");
      $("#rule-title").textContent = "Ready?";
      $("#rule-text").textContent = "Tap the deck to draw the first card.";
      $("#turn").textContent = next ? next + " goes first" : "";
    } else {
      const { rank, suit } = parseCard(last);
      const rule = getRules()[rank];
      const drawer = game.players.length
        ? game.players[(game.turn - 1) % game.players.length]
        : null;

      cardEl.className = "card" + (suit.red ? " red" : "") + (game.deck.length ? "" : " empty");
      cardEl.querySelector(".tl").textContent = rank + "\n" + suit.symbol;
      cardEl.querySelector(".br").textContent = rank + "\n" + suit.symbol;
      cardEl.querySelector(".card-center").textContent = rank === "K" ? "♛" : suit.symbol;
      cardEl.setAttribute("aria-label", rank + " of " + suitName(suit.key) + ". " + rule.title + ". Tap to draw the next card.");

      $("#rule-title").textContent = rule.title;
      let text = rule.text;
      if (rank === "K" && game.kings < 4) text += " (" + (4 - game.kings) + " King" + (4 - game.kings === 1 ? "" : "s") + " left.)";
      $("#rule-text").textContent = text;

      const parts = [];
      if (drawer) parts.push(drawer + " drew");
      if (next && game.deck.length) parts.push("next: " + next);
      $("#turn").textContent = parts.join(" · ");

      if (animate) {
        cardEl.classList.remove("flip");
        void cardEl.offsetWidth; // restart animation
        cardEl.classList.add("flip");
      }
    }

    $("#new-rule-form").hidden = !game.awaitingRule;
    if (game.awaitingRule && animate) $("#new-rule-input").value = "";

    const status = $("#status");
    status.innerHTML = "";
    Object.keys(game.roles).forEach((role) => {
      status.appendChild(tag(role, game.roles[role]));
    });
    game.tableRules.forEach((r, i) => status.appendChild(tag("Rule " + (i + 1), r)));
  }

  function tag(label, value) {
    const el = document.createElement("div");
    el.className = "tag";
    const b = document.createElement("b");
    b.textContent = label + ": ";
    el.appendChild(b);
    el.appendChild(document.createTextNode(value));
    return el;
  }

  function suitName(key) {
    return { S: "Spades", H: "Hearts", D: "Diamonds", C: "Clubs" }[key];
  }

  function showEnd(reason, drawer) {
    if (reason === "king") {
      $("#end-title").textContent = "The 4th King!";
      $("#end-text").textContent = (drawer || "Whoever drew it") + " drinks the King's Cup.";
      $("#keep-going").hidden = !game.deck.length;
    } else {
      $("#end-title").textContent = "Deck's empty";
      $("#end-text").textContent = "That's every card. Good game.";
      $("#keep-going").hidden = true;
    }
    show("screen-end");
  }

  // ---------- Setup screen ----------
  function renderPlayers() {
    const list = $("#player-list");
    list.innerHTML = "";
    players.forEach((name, i) => {
      const li = document.createElement("li");
      li.textContent = name;
      const x = document.createElement("button");
      x.type = "button";
      x.textContent = "✕";
      x.setAttribute("aria-label", "Remove " + name);
      x.addEventListener("click", () => {
        players.splice(i, 1);
        save(KEYS.players, players);
        renderPlayers();
      });
      li.appendChild(x);
      list.appendChild(li);
    });
  }

  function showSetup() {
    const saved = load(KEYS.game, null);
    $("#resume").hidden = !(saved && saved.drawn && saved.drawn.length && saved.deck.length && !saved.finished);
    renderPlayers();
    show("screen-setup");
  }

  // ---------- House rules dialog ----------
  function openRules() {
    const rules = getRules();
    const wrap = $("#rules-fields");
    wrap.innerHTML = "";
    RANKS.forEach((r) => {
      const row = document.createElement("div");
      row.className = "rule-field";
      row.innerHTML =
        '<div class="rank"></div><div class="fields"><input type="text" maxlength="40"><textarea maxlength="300"></textarea></div>';
      row.querySelector(".rank").textContent = r;
      const title = row.querySelector("input");
      const text = row.querySelector("textarea");
      title.value = rules[r].title;
      text.value = rules[r].text;
      title.dataset.rank = r;
      text.dataset.rank = r;
      title.setAttribute("aria-label", r + " title");
      text.setAttribute("aria-label", r + " rule");
      wrap.appendChild(row);
    });
    $("#rules-dialog").showModal();
  }

  function saveRules() {
    const overrides = {};
    $$("#rules-fields .rule-field").forEach((row) => {
      const title = row.querySelector("input");
      const text = row.querySelector("textarea");
      const r = title.dataset.rank;
      const def = DEFAULT_RULES[r];
      const t = title.value.trim() || def.title;
      const x = text.value.trim() || def.text;
      if (t !== def.title || x !== def.text) overrides[r] = { title: t, text: x };
    });
    save(KEYS.rules, overrides);
    if (game && !$("#screen-game").hidden) renderGame(false);
  }

  // ---------- Fullscreen + keep screen on ----------
  let wakeLock = null;
  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => { wakeLock = null; });
      }
    } catch (e) { /* not supported or denied */ }
  }
  function releaseWakeLock() {
    if (wakeLock) { wakeLock.release(); wakeLock = null; }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !$("#screen-game").hidden) requestWakeLock();
  });

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    }
  }

  // ---------- Wiring ----------
  $("#age-yes").addEventListener("click", () => { save(KEYS.age, true); showSetup(); });
  $("#age-no").addEventListener("click", () => { $("#age-denied").hidden = false; });

  $("#player-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#player-input");
    const name = input.value.trim();
    if (name && players.length < 20) {
      players.push(name);
      save(KEYS.players, players);
      renderPlayers();
    }
    input.value = "";
    input.focus();
  });

  $("#start").addEventListener("click", () => { newGame(); renderGame(false); show("screen-game"); });
  $("#resume").addEventListener("click", () => { game = load(KEYS.game, null); renderGame(false); show("screen-game"); });

  $("#card").addEventListener("click", draw);

  $("#new-rule-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = $("#new-rule-input").value.trim();
    if (value) game.tableRules.push(value);
    game.awaitingRule = false;
    save(KEYS.game, game);
    $("#new-rule-input").blur();
    renderGame(false);
  });

  $("#menu").addEventListener("click", () => {
    if (confirm("End this game?")) { remove(KEYS.game); game = null; showSetup(); }
  });
  $("#fullscreen").addEventListener("click", toggleFullscreen);

  $("#again").addEventListener("click", () => { remove(KEYS.game); game = null; showSetup(); });
  $("#keep-going").addEventListener("click", () => {
    game.keepGoing = true;
    save(KEYS.game, game);
    renderGame(false);
    show("screen-game");
  });

  $$(".open-rules").forEach((b) => b.addEventListener("click", openRules));
  $$(".open-cast").forEach((b) => b.addEventListener("click", () => $("#cast-dialog").showModal()));
  $("#rules-save").addEventListener("click", saveRules);
  $("#rules-reset").addEventListener("click", () => {
    if (confirm("Reset every card to the default rules?")) {
      remove(KEYS.rules);
      $("#rules-dialog").close();
      if (game && !$("#screen-game").hidden) renderGame(false);
    }
  });

  // Keyboard / TV remote: Space or Enter draws, F toggles fullscreen.
  document.addEventListener("keydown", (e) => {
    if ($("#screen-game").hidden) return;
    if (document.querySelector("dialog[open]")) return;
    // Focused controls handle their own keys (Enter on the card button already draws).
    if (e.target.closest && e.target.closest("button, input, textarea")) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      draw();
    } else if (e.key === "f" || e.key === "F") {
      toggleFullscreen();
    }
  });

  // ---------- Start ----------
  if (load(KEYS.age, false)) showSetup(); else show("screen-age");

  // Offline support for the web version. The Android app bundles its files, so it skips this.
  if ("serviceWorker" in navigator && location.protocol === "https:" && !window.Capacitor) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
