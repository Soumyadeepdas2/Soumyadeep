#!/usr/bin/env python3
"""Local preview server for the portfolio."""
import json
import mimetypes
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs

ROOT = Path(__file__).resolve().parent
PORT = 8080
FORMSUBMIT = "https://formsubmit.co/ajax/soumyadeepdas044@gmail.com"
SITE = "https://www.soumyadeep.space"

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("image/x-icon", ".ico")
mimetypes.add_type("application/javascript", ".js")


CLEAN = {
    "/hushhconnect": "/hushhconnect.html",
    "/hushh": "/hushhconnect.html",
    "/bookyuniverse": "/bookyuniverse.html",
    "/tellsgroup": "/tellsgroup.html",
    "/openrail": "/openrail.html",
    "/meow": "/meow.html",
    "/feedback": "/feedback.html",
}


def parse_body(raw: bytes, content_type: str) -> dict:
    text = raw.decode("utf-8", "replace")
    if "application/json" in content_type:
        try:
            data = json.loads(text or "{}")
            return data if isinstance(data, dict) else {}
        except json.JSONDecodeError:
            return {}
    parsed = parse_qs(text, keep_blank_values=True)
    return {k: (v[-1] if v else "") for k, v in parsed.items()}


def forward_formsubmit(data: dict, origin: str) -> bool:
    payload = json.dumps(
        {
            "name": data["name"],
            "email": data["email"],
            "message": data["message"],
            "subject": data["subject"],
            "_subject": f"[Portfolio] {data['subject']} — {data['name']}",
            "_replyto": data["email"],
            "_template": "table",
            "_captcha": "false",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        FORMSUBMIT,
        data=payload,
        method="POST",
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Origin": origin,
            "Referer": origin.rstrip("/") + "/",
            "User-Agent": "soumyadeep.space-contact/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        body = res.read().decode("utf-8", "replace")
    try:
        j = json.loads(body)
    except json.JSONDecodeError:
        j = {}
    return str(j.get("success")) != "false"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0].rstrip("/") or "/"
        if path in CLEAN:
            qs = self.path.split("?", 1)[1] if "?" in self.path else ""
            self.path = CLEAN[path] + (("?" + qs) if qs else "")
        return super().do_GET()

    def do_POST(self):
        path = self.path.split("?", 1)[0].rstrip("/") or "/"
        if path != "/api/contact":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b""
        data = parse_body(raw, self.headers.get("Content-Type") or "")
        name = str(data.get("name") or "").strip()
        email = str(data.get("email") or "").strip()
        subject = str(data.get("subject") or "Portfolio enquiry").strip()
        message = str(data.get("message") or "").strip()
        wants_json = "application/json" in (self.headers.get("Accept") or "")

        def reply(code, payload):
            body = json.dumps(payload).encode("utf-8") if wants_json else str(payload.get("message") or "").encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json" if wants_json else "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        if not name or "@" not in email or "." not in email.split("@")[-1] or len(message) < 10:
            reply(400, {"ok": False, "message": "Please check the fields."})
            return
        origin = SITE
        try:
            sent = forward_formsubmit(
                {"name": name, "email": email, "subject": subject, "message": message},
                origin,
            )
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            print("contact forward failed:", exc, flush=True)
            reply(502, {"ok": False, "message": "Send failed"})
            return
        if not sent:
            reply(502, {"ok": False, "message": "Send failed"})
            return
        if wants_json:
            reply(200, {"ok": True})
            return
        self.send_response(303)
        self.send_header("Location", "/?sent=1#contact")
        self.end_headers()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args), flush=True)

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            body = (ROOT / "404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
