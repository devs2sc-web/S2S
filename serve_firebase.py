import http.server
import socketserver
import os
import sys

PORT = 8080
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

class FirebaseLocalHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        # Emulate Firebase rewrites
        if self.path == "/portal" or self.path == "/portal/":
            self.path = "/portal.html"
        elif self.path == "/admin" or self.path == "/admin/":
            self.path = "/admin.html"
        return super().do_GET()

if __name__ == "__main__":
    os.chdir(PUBLIC_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), FirebaseLocalHandler) as httpd:
        print("=" * 60)
        print("  SEED TO SUCCESS - Firebase Frontend Local Server")
        print("=" * 60)
        print(f"👉 1. ฟอร์มลงทะเบียนสัมมนา (Part 1):   http://localhost:{PORT}/")
        print(f"👉 2. คลังสื่อการเรียนรู้ออนไลน์ (Part 2): http://localhost:{PORT}/portal")
        print(f"👉 3. ระบบผู้ดูแลระบบ (Admin Dashboard):  http://localhost:{PORT}/admin")
        print("=" * 60)
        print("กด Ctrl+C เพื่อหยุดการทำงาน\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nปิดการทำงานเรียบร้อย")
            sys.exit(0)
