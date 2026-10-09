/* Live viewer tracker — records pageviews and heartbeats to /api/analytics.
   Same pattern as souradeep.me's live tracker, adapted for this site:
   one POST on arrival, a lightweight heartbeat every 25s so "live now"
   stays warm, sendBeacon where available. Fails silently — tracking must
   never break the page, and it no-ops until the API exists (i.e. after
   the Vercel deploy with the Neon DATABASE_URL env var set). */
(function () {
  try {
    var path = location.pathname || "/";
    if (path.indexOf("/admin") === 0 || path.indexOf("/api") === 0) return;

    var sid;
    try {
      sid = localStorage.getItem("viewerSid");
      if (!sid) {
        sid =
          (crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("viewerSid", sid);
      }
    } catch (e) {
      sid = "v-" + Date.now().toString(36);
    }

    var started = false;
    function send(beat) {
      var payload = JSON.stringify({
        sid: sid,
        path: path,
        ref: document.referrer || "",
        beat: beat === true,
      });
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            "/api/analytics",
            new Blob([payload], { type: "application/json" })
          );
          return;
        }
      } catch (e) { /* fall through to fetch */ }
      try {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(function () {});
      } catch (e) { /* ignore */ }
    }

    started = true;
    send(false); /* arrival: pageview + session */

    setInterval(function () { send(true); }, 25000); /* heartbeat */

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && started) send(true);
    });
  } catch (e) { /* never break the page */ }
})();
