/* Analytics admin — gate + dashboard.
   The password is checked server-side by /api/analytics against the
   ADMIN_PASSWORD env var in Vercel; it is only kept in this tab's
   sessionStorage for convenience, and every fetch re-verifies it. */
(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var gate = $("#gate"), dash = $("#dash");
  var input = $("#pass"), err = $("#gateErr");
  var KEY = "analyticsPass";
  var days = 30, timer = null, busy = false;

  function saved() {
    try { return sessionStorage.getItem(KEY) || ""; } catch (e) { return ""; }
  }
  function save(p) {
    try { p ? sessionStorage.setItem(KEY, p) : sessionStorage.removeItem(KEY); } catch (e) {}
  }

  function api(password, d) {
    return fetch("/api/analytics?days=" + d, {
      headers: { "x-admin-password": password },
    });
  }

  function unlock(password) {
    if (busy) return;
    busy = true;
    err.textContent = "";
    api(password, days).then(function (r) {
      busy = false;
      if (r.status === 200) {
        save(password);
        gate.hidden = true;
        dash.hidden = false;
        render0(r);
        startAuto();
      } else if (r.status === 429) {
        err.textContent = "Too many attempts — locked for a few minutes.";
      } else if (r.status === 503 || r.status === 502) {
        err.textContent = "API is up, but Neon is not configured yet (DATABASE_URL env var in Vercel).";
      } else {
        err.textContent = "Wrong password.";
        input.select();
      }
    }).catch(function () {
      busy = false;
      err.textContent = "Could not reach the API — is this the deployed site?";
    });
  }

  function fetchStats(silent) {
    var p = saved();
    if (!p) return logout();
    api(p, days).then(function (r) {
      if (r.status === 200) {
        render0(r);
      } else if (r.status === 401 && !silent) {
        logout(); /* password changed on the server */
      }
    }).catch(function () { /* transient — keep the last data */ });
  }

  function render0(r) {
    r.json().then(function (d) { render(d); });
  }

  function fmt(n) {
    return (typeof n === "number" ? n : 0).toLocaleString("en-IN");
  }

  function render(d) {
    $("#liveNow").textContent = fmt(d.liveNow);
    $("#totalViewers").textContent = fmt(d.totalViewers);
    $("#totalPageviews").textContent = fmt(d.totalPageviews);
    $("#chartTitle").textContent = "Browsers each day — last " + days + " days";
    drawChart(d.daily || []);
    drawPages(d.topPages || []);
    drawRows("#browsers tbody", (d.browsers || []).map(function (r) {
      return [r.browser, fmt(r.visitors), fmt(r.views)];
    }), "No browsers recorded yet.");
    drawRows("#referrers tbody", (d.referrers || []).map(function (r) {
      return [r.source, fmt(r.visitors), fmt(r.views)];
    }), "No sources recorded yet.");
    drawRows("#recent tbody", (d.recent || []).map(function (r) {
      return [r.at, r.path, r.browser, r.source];
    }), "No visits recorded yet.");
    var t = new Date();
    $("#updated").textContent =
      "updated " + t.toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" }) + " IST · auto 30s";
  }

  /* ── SVG bar chart, no libraries ─────────────────────────── */
  function drawChart(daily) {
    var svg = $("#chart");
    var W = 760, H = 240, pl = 36, pr = 10, pt = 16, pb = 34;
    var iw = W - pl - pr, ih = H - pt - pb;
    var n = daily.length;

    if (!n) {
      svg.innerHTML =
        '<text class="empty" x="' + W / 2 + '" y="' + H / 2 + '" text-anchor="middle">' +
        "NO DATA YET — OPEN THE SITE IN ANOTHER TAB AND WATCH IT APPEAR" + "</text>";
      return;
    }

    var max = 1;
    for (var i = 0; i < n; i++) max = Math.max(max, daily[i].viewers);
    var today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    var step = iw / n;
    var barW = Math.max(2, Math.min(26, step * 0.62));
    var parts = [];

    var gridN = 4;
    for (var g = 0; g <= gridN; g++) {
      var gy = pt + ih - (ih * g) / gridN;
      var val = Math.round((max * g) / gridN);
      parts.push('<line class="grid" x1="' + pl + '" y1="' + gy + '" x2="' + (W - pr) + '" y2="' + gy + '"/>');
      parts.push('<text class="tick" x="' + (pl - 6) + '" y="' + (gy + 3) + '" text-anchor="end">' + val + "</text>");
    }

    var every = Math.max(1, Math.ceil(n / 7));
    for (var k = 0; k < n; k++) {
      var d = daily[k];
      var h = Math.round((d.viewers / max) * ih);
      var x = pl + k * step + (step - barW) / 2;
      var y = pt + ih - h;
      var isToday = d.day === today;
      var label = d.day.slice(8) + " " + MONTHS[parseInt(d.day.slice(5, 7), 10) - 1];
      parts.push(
        '<rect class="bar' + (isToday ? " today" : "") + '" x="' + x + '" y="' + y +
        '" width="' + barW + '" height="' + Math.max(h, d.viewers > 0 ? 2 : 0) + '" rx="1">' +
        "<title>" + label + " — " + d.viewers + " browsers · " + d.pageviews + " views</title></rect>"
      );
      if (k % every === 0 || k === n - 1) {
        var tx = pl + k * step + step / 2;
        parts.push('<text class="tick" x="' + tx + '" y="' + (H - 12) + '" text-anchor="middle">' + label + "</text>");
      }
    }
    svg.innerHTML = parts.join("");
  }

  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function drawPages(rows) {
    var tb = $("#topPages tbody");
    tb.innerHTML = rows.length
      ? rows
          .map(function (r) {
            return "<tr><td>" + escapeHtml(r.path) + "</td><td>" + fmt(r.viewers) +
              "</td><td>" + fmt(r.views) + "</td></tr>";
          })
          .join("")
      : '<tr><td colspan="3">No pages recorded yet.</td></tr>';
  }

  /* shared table renderer for the browsers / referrers / recent panels */
  function drawRows(sel, rows, emptyMsg) {
    var tb = $(sel);
    tb.innerHTML = rows.length
      ? rows
          .map(function (r) {
            return "<tr>" + r.map(function (c) { return "<td>" + escapeHtml(String(c)) + "</td>"; }).join("") + "</tr>";
          })
          .join("")
      : '<tr><td colspan="4">' + emptyMsg + "</td></tr>";
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── wiring ──────────────────────────────────────────────── */
  function startAuto() {
    if (timer) clearInterval(timer);
    timer = setInterval(function () { fetchStats(true); }, 30000);
  }

  function logout() {
    save("");
    if (timer) clearInterval(timer);
    timer = null;
    dash.hidden = true;
    gate.hidden = false;
    err.textContent = "";
    input.value = "";
    input.focus();
  }

  $("#unlock").addEventListener("click", function () { unlock(input.value); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") unlock(input.value);
  });
  $("#refresh").addEventListener("click", function () { fetchStats(false); });
  $("#logout").addEventListener("click", logout);

  var rangeBtns = document.querySelectorAll(".range button");
  for (var b = 0; b < rangeBtns.length; b++) {
    rangeBtns[b].addEventListener("click", function () {
      days = parseInt(this.getAttribute("data-days"), 10);
      for (var j = 0; j < rangeBtns.length; j++)
        rangeBtns[j].setAttribute("aria-pressed", rangeBtns[j] === this ? "true" : "false");
      fetchStats(false);
    });
  }

  /* returning tab with a saved password */
  if (saved()) unlock(saved());
  else setTimeout(function () { input.focus(); }, 60);
})();
