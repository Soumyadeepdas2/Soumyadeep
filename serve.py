#!/usr/bin/env python3
"""Local preview server for the portfolio."""
import http.server
import mimetypes
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = 8080

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("image/x-icon", ".ico")
mimetypes.add_type("application/javascript", ".js")


CLEAN = {
    "/hushhconnect": "/hushhconnect.html",
    "/hushh": "/hushhconnect.html",
    "/bookyuniverse": "/bookyuniverse.html",
    "/tellsgroup": "/tellsgroup.html",
}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0].rstrip("/") or "/"
        if path in CLEAN:
            qs = self.path.split("?", 1)[1] if "?" in self.path else ""
            self.path = CLEAN[path] + (("?" + qs) if qs else "")
        return super().do_GET()

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
    http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
