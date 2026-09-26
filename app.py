import os
import io
import csv
import json
import time
import datetime
from collections import defaultdict
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, Response
from werkzeug.security import check_password_hash, generate_password_hash
from config import Config
import database as db

app = Flask(__name__)
app.config.from_object(Config)

# Session Security Hardening
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=datetime.timedelta(hours=8)
)

# Initialize SQLite database & settings
db.init_db()

# ==================== SECURITY & RATE LIMITING ====================

# In-memory sliding window rate limiter
rate_trackers = {
    "admin_login": defaultdict(list),
    "portal_login": defaultdict(list),
    "register": defaultdict(list),
    "check_member": defaultdict(list)
}

def get_client_ip():
    if request.headers.get("X-Forwarded-For"):
        return request.headers.get("X-Forwarded-For").split(",")[0].strip()
    return request.remote_addr or "unknown"

def check_rate_limit(tracker_name, max_requests, window_seconds=60):
    ip = get_client_ip()
    now = time.time()
    tracker = rate_trackers[tracker_name]
    # Filter out requests older than window_seconds
    tracker[ip] = [t for t in tracker[ip] if now - t < window_seconds]
    if len(tracker[ip]) >= max_requests:
        return False
    tracker[ip].append(now)
    return True

# Data Masking Functions to prevent Personal Data Leakage
def mask_phone(phone):
    if not phone:
        return ""
    clean = phone.replace("-", "").replace(" ", "").strip()
    if len(clean) >= 9:
        return clean[:3] + "-xxx-" + clean[-4:]
    return clean

def mask_email(email):
    if not email or "@" not in email:
        return email or ""
    parts = email.split("@", 1)
    username, domain = parts[0], parts[1]
    if len(username) <= 2:
        masked_user = username[0] + "*"
    else:
        masked_user = username[:2] + "*" * (len(username) - 2)
    return f"{masked_user}@{domain}"

def sanitize_member_public(m):
    """Sanitize member data for public/untrusted views (Masking PII)"""
    if not m:
        return None
    return {
        "id": m.get("id"),
        "member_code": m.get("member_code"),
        "first_name": m.get("first_name"),
        "last_name": m.get("last_name"),
        "title": m.get("title", ""),
        "affiliation": m.get("affiliation", ""),
        "phone": mask_phone(m.get("phone", "")),
        "phone_masked": mask_phone(m.get("phone", "")),
        "email": mask_email(m.get("email", "")),
        "email_masked": mask_email(m.get("email", "")),
        "learning_access": m.get("learning_access", "PENDING"),
        "line_display_name": m.get("line_display_name", ""),
        "line_picture_url": m.get("line_picture_url", ""),
        "created_at": m.get("created_at", "")
    }

# Security Headers (OWASP)
@app.after_request
def set_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Allow framing only by self and official LINE domains (for LIFF webview)
    response.headers["Content-Security-Policy"] = "frame-ancestors 'self' https://line.me https://*.line.me https://*.line-apps.com;"
    return response

# Block direct access to database, environment or script files
@app.before_request
def block_sensitive_paths():
    path = request.path.lower()
    blocked_extensions = [".db", ".sqlite", ".sqlite3", ".env", ".py", ".bat", ".log"]
    if any(path.endswith(ext) for ext in blocked_extensions) or "/.git" in path or "/.env" in path:
        return jsonify({"error": "Access Denied"}), 403

# ==================== PUBLIC ROUTES ====================

@app.route("/")
def index():
    appearance = db.get_appearance_settings()
    return render_template("index.html", 
                           liff_id=app.config["LIFF_ID"],
                           brand_name=appearance.get("brand_name", app.config["BRAND_NAME"]),
                           brand_title=appearance.get("brand_title", app.config["BRAND_TITLE"]),
                           brand_subtitle=appearance.get("brand_subtitle", app.config["BRAND_SUBTITLE"]))

@app.route("/portal")
def learning_portal():
    appearance = db.get_appearance_settings()
    return render_template("portal.html",
                           liff_id=app.config["LIFF_ID"],
                           brand_name=appearance.get("brand_name", app.config["BRAND_NAME"]),
                           brand_title=appearance.get("brand_title", app.config["BRAND_TITLE"]))

@app.route("/api/config")
def get_config():
    appearance = db.get_appearance_settings()
    return jsonify({
        "liff_id": app.config["LIFF_ID"],
        "appearance": appearance,
        "fields": db.get_form_fields_settings()
    })

@app.route("/api/check-member", methods=["GET"])
def check_member():
    # Rate limit check-member: max 30 queries/min
    if not check_rate_limit("check_member", max_requests=30, window_seconds=60):
        return jsonify({"error": "คำขอถี่เกินไป กรุณารอสักครู่"}), 429

    line_user_id = request.args.get("line_user_id", "").strip()
    if not line_user_id:
        return jsonify({"exists": False, "member": None})
    
    member = db.get_member_by_line_id(line_user_id)
    if member:
        # Return sanitized/masked member info to prevent data scraping
        return jsonify({"exists": True, "member": sanitize_member_public(member)})
    return jsonify({"exists": False, "member": None})

@app.route("/api/register", methods=["POST"])
def register():
    # Rate limit registrations: max 15 per min per IP
    if not check_rate_limit("register", max_requests=15, window_seconds=60):
        return jsonify({"success": False, "error": "ระบบพบคำขอลงทะเบียนมากเกินไปจาก IP นี้ กรุณารอ 1 นาที"}), 429

    data = request.get_json() or {}
    fields_settings = db.get_form_fields_settings()
    
    # Check required fields
    for f in fields_settings:
        if f.get("enabled", True) and f.get("required", False):
            field_id = f.get("id")
            field_label = f.get("label", field_id)
            
            if field_id == "birthday":
                birth_year = data.get("birth_year", "")
                birth_month = data.get("birth_month", "")
                birth_day = data.get("birth_day", "")
                if not (birth_year and birth_month and birth_day):
                    return jsonify({"success": False, "error": f"กรุณาระบุ {field_label} ให้ครบถ้วน"}), 400
            elif field_id == "pdpa_consent":
                if not data.get("pdpa_consent"):
                    return jsonify({"success": False, "error": f"กรุณายินยอมเงื่อนไข {field_label}"}), 400
            else:
                val = data.get(field_id)
                if val is None or str(val).strip() == "":
                    return jsonify({"success": False, "error": f"กรุณากรอกข้อมูล: {field_label}"}), 400

    phone = data.get("phone", "").replace("-", "").replace(" ", "").strip()
    email = data.get("email", "").strip().lower()
    line_user_id = data.get("line_user_id", "").strip()
    
    # Validate phone
    if phone and len(phone) < 9:
        return jsonify({"success": False, "error": "กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง"}), 400

    # Validate email format if provided
    if email and ("@" not in email or "." not in email):
        return jsonify({"success": False, "error": "รูปแบบอีเมลไม่ถูกต้อง"}), 400

    # Prevent duplicate registrations
    if line_user_id:
        existing_by_line = db.get_member_by_line_id(line_user_id)
        if existing_by_line:
            return jsonify({
                "success": True, 
                "already_registered": True,
                "message": "บัญชี LINE นี้ได้ลงทะเบียนในโครงการเรียบร้อยแล้ว",
                "member": sanitize_member_public(existing_by_line)
            })

    if phone:
        existing_by_phone = db.get_member_by_phone(phone)
        if existing_by_phone:
            return jsonify({
                "success": False, 
                "error": "เบอร์โทรศัพท์นี้ถูกใช้งานในการลงทะเบียนแล้ว"
            }), 400

    if email:
        existing_by_email = db.get_member_by_email(email)
        if existing_by_email:
            return jsonify({
                "success": False, 
                "error": "อีเมลนี้ถูกใช้งานในการลงทะเบียนแล้ว"
            }), 400

    # Save to database
    try:
        new_member = db.create_member(data)
        client_ip = get_client_ip()
        db.log_audit("MEMBER_REGISTER", actor="User", target=new_member.get("member_code"), ip_address=client_ip, details=f"Phone: {mask_phone(phone)}, Email: {mask_email(email)}")
        
        return jsonify({
            "success": True,
            "message": "ลงทะเบียนเข้าร่วมโครงการเรียบร้อยแล้ว",
            "member": sanitize_member_public(new_member)
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {str(e)}"}), 500

# ==================== PART 2: LEARNING PORTAL APIs ====================

@app.route("/api/portal/login", methods=["POST"])
def portal_login():
    # Rate limit portal logins: max 10 attempts/min
    if not check_rate_limit("portal_login", max_requests=10, window_seconds=60):
        return jsonify({"success": False, "message": "พยายามเข้าสู่ระบบถี่เกินไป กรุณารอ 1 นาที"}), 429

    data = request.get_json() or {}
    line_user_id = data.get("line_user_id", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").replace("-", "").replace(" ", "").strip()

    member = None
    if line_user_id:
        member = db.get_member_by_line_id(line_user_id)
    elif email:
        member = db.get_member_by_email(email)
    elif phone:
        member = db.get_member_by_phone(phone)

    client_ip = get_client_ip()

    if not member:
        db.log_audit("PORTAL_LOGIN_FAIL", actor="Anonymous", target=email or phone or line_user_id, ip_address=client_ip, details="User not found")
        return jsonify({
            "success": False, 
            "status": "NOT_REGISTERED", 
            "message": "ไม่พบข้อมูลการลงทะเบียนในระบบ กรุณาลงทะเบียนเข้าร่วมโครงการก่อน"
        }), 404

    access_status = member.get("learning_access", "PENDING")
    
    if access_status == "APPROVED":
        session.permanent = True
        session["member_id"] = member["id"]
        session["member_name"] = f"{member['first_name']} {member['last_name']}"
        materials = db.list_learning_materials(only_published=True)
        db.log_audit("PORTAL_LOGIN_SUCCESS", actor=member.get("member_code"), target="Learning Portal", ip_address=client_ip)
        
        return jsonify({
            "success": True,
            "status": "APPROVED",
            "member": sanitize_member_public(member),
            "materials": materials,
            "message": "ยินดีต้อนรับสู่ระบบคลังสื่อการเรียนรู้ SEED TO SUCCESS"
        })
    elif access_status == "PENDING":
        return jsonify({
            "success": False,
            "status": "PENDING",
            "member": sanitize_member_public(member),
            "message": "ใบสมัครของคุณอยู่ระหว่างการพิจารณาตรวจสอบสิทธิ์จากทีมงานโครงการ SEED TO SUCCESS"
        }), 403
    else:
        return jsonify({
            "success": False,
            "status": "REJECTED",
            "member": sanitize_member_public(member),
            "message": "คุณยังไม่ได้รับสิทธิ์เข้าถึงสื่อการเรียนรู้นี้ กรุณาติดต่อทีมงานผู้ดูแลโครงการ"
        }), 403

@app.route("/api/portal/check-auth", methods=["GET"])
def portal_check_auth():
    member_id = session.get("member_id")
    if not member_id:
        return jsonify({"authenticated": False})
    
    member = db.get_member_by_id(member_id)
    if not member or member.get("learning_access") != "APPROVED":
        session.pop("member_id", None)
        return jsonify({"authenticated": False})
    
    materials = db.list_learning_materials(only_published=True)
    return jsonify({
        "authenticated": True,
        "member": sanitize_member_public(member),
        "materials": materials
    })

@app.route("/api/portal/logout", methods=["POST"])
def portal_logout():
    session.pop("member_id", None)
    session.pop("member_name", None)
    return jsonify({"success": True})

# ==================== ADMIN ROUTES & ACCESS CONTROL ====================

@app.route("/admin")
def admin_page():
    appearance = db.get_appearance_settings()
    return render_template("admin.html", 
                           brand_name=appearance.get("brand_name", app.config["BRAND_NAME"]))

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    # Anti-Brute Force for Admin: Max 5 attempts per minute
    if not check_rate_limit("admin_login", max_requests=5, window_seconds=60):
        client_ip = get_client_ip()
        db.log_audit("ADMIN_LOGIN_LOCKED", actor="Attacker", target="Admin Panel", ip_address=client_ip, details="Rate limit exceeded")
        return jsonify({"success": False, "error": "คุณพยายามเข้าสู่ระบบผิดพลาดบ่อยเกินไป ระบบถูกระงับชั่วคราว 1 นาที"}), 429

    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    client_ip = get_client_ip()
    
    valid_user = (username == app.config["ADMIN_USERNAME"] or username == "admin@tu.ac.th")
    valid_pass = (password == app.config["ADMIN_PASSWORD"])
    
    if valid_user and valid_pass:
        session.permanent = True
        session["admin_logged_in"] = True
        session["admin_user"] = username
        db.log_audit("ADMIN_LOGIN_SUCCESS", actor=username, target="Admin Dashboard", ip_address=client_ip)
        return jsonify({"success": True, "message": "เข้าสู่ระบบสำเร็จ"})
    
    db.log_audit("ADMIN_LOGIN_FAIL", actor=username or "unknown", target="Admin Dashboard", ip_address=client_ip, details="Invalid credentials")
    return jsonify({"success": False, "error": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"}), 401

@app.route("/api/admin/check-auth", methods=["GET"])
def admin_check_auth():
    return jsonify({"authenticated": session.get("admin_logged_in", False)})

@app.route("/api/admin/logout", methods=["POST"])
def admin_logout():
    admin_user = session.get("admin_user", "admin")
    client_ip = get_client_ip()
    db.log_audit("ADMIN_LOGOUT", actor=admin_user, target="Admin Dashboard", ip_address=client_ip)
    session.pop("admin_logged_in", None)
    session.pop("admin_user", None)
    return jsonify({"success": True})

@app.route("/api/admin/members", methods=["GET"])
def get_members():
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
    
    search = request.args.get("search", "").strip()
    filter_access = request.args.get("filter", "all").strip()
    members = db.list_members(search=search if search else None, filter_access=filter_access)
    stats = db.get_member_stats()
    
    return jsonify({
        "members": members,
        "stats": stats
    })

@app.route("/api/admin/members/<int:member_id>/access", methods=["POST"])
def set_member_access(member_id):
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json() or {}
    status = data.get("status", "APPROVED")
    admin_user = session.get("admin_user", "Admin TU")
    client_ip = get_client_ip()
    
    success = db.set_member_learning_access(member_id, status, admin_name=admin_user)
    if success:
        db.log_audit("SET_ACCESS_STATUS", actor=admin_user, target=f"Member ID: {member_id}", ip_address=client_ip, details=f"Status: {status}")
        return jsonify({"success": True, "message": f"ปรับสถานะสิทธิ์เป็น {status} สำเร็จ"})
    return jsonify({"success": False, "error": "ไม่พบข้อมูลสมาชิก"}), 404

@app.route("/api/admin/members/bulk-approve", methods=["POST"])
def bulk_approve_pending():
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
    
    admin_user = session.get("admin_user", "Admin TU")
    client_ip = get_client_ip()
    count = db.bulk_approve_pending_learning(admin_name=admin_user)
    db.log_audit("BULK_APPROVE_ACCESS", actor=admin_user, target="Pending Members", ip_address=client_ip, details=f"Approved {count} members")
    
    return jsonify({"success": True, "message": f"อนุมัติสิทธิ์เข้าเรียนให้ผู้ที่รอพิจารณาแล้วทั้งหมด {count} รายการ", "count": count})

@app.route("/api/admin/members/<int:member_id>", methods=["DELETE"])
def delete_member_api(member_id):
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
    
    admin_user = session.get("admin_user", "Admin TU")
    client_ip = get_client_ip()
    success = db.delete_member(member_id)
    if success:
        db.log_audit("DELETE_MEMBER", actor=admin_user, target=f"Member ID: {member_id}", ip_address=client_ip)
        return jsonify({"success": True, "message": "ลบข้อมูลสำเร็จ"})
    return jsonify({"success": False, "error": "ไม่พบข้อมูลสมาชิก"}), 404

# ==================== ADMIN SETTINGS APIs ====================

@app.route("/api/admin/settings", methods=["GET"])
def get_admin_settings():
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
    
    return jsonify({
        "appearance": db.get_appearance_settings(),
        "fields": db.get_form_fields_settings(),
        "materials": db.list_learning_materials(only_published=False)
    })

@app.route("/api/admin/settings/appearance", methods=["POST"])
def save_appearance():
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json() or {}
    updated = db.save_appearance_settings(data)
    admin_user = session.get("admin_user", "Admin")
    db.log_audit("UPDATE_APPEARANCE", actor=admin_user, target="Appearance Settings", ip_address=get_client_ip())
    return jsonify({"success": True, "message": "บันทึกการตั้งค่าหน้าตาเรียบร้อย", "appearance": updated})

@app.route("/api/admin/settings/fields", methods=["POST"])
def save_fields():
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
    
    fields = request.get_json() or []
    if not isinstance(fields, list):
        return jsonify({"success": False, "error": "ข้อมูลฟิลด์ไม่ถูกต้อง"}), 400
        
    updated = db.save_form_fields_settings(fields)
    admin_user = session.get("admin_user", "Admin")
    db.log_audit("UPDATE_FORM_FIELDS", actor=admin_user, target="Form Fields", ip_address=get_client_ip())
    return jsonify({"success": True, "message": "บันทึกการตั้งค่าฟิลด์แบบฟอร์มเรียบร้อย", "fields": updated})

@app.route("/api/admin/settings/reset", methods=["POST"])
def reset_settings():
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
    
    db.reset_settings_to_default()
    admin_user = session.get("admin_user", "Admin")
    db.log_audit("RESET_SETTINGS_DEFAULT", actor=admin_user, target="System Settings", ip_address=get_client_ip())
    return jsonify({"success": True, "message": "คืนค่าเริ่มต้นโครงการ SEED TO SUCCESS เรียบร้อย"})

# ==================== ADMIN LEARNING MATERIALS APIs ====================

@app.route("/api/admin/materials", methods=["POST"])
def create_material():
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json() or {}
    new_id = db.create_learning_material(data)
    admin_user = session.get("admin_user", "Admin")
    db.log_audit("CREATE_MATERIAL", actor=admin_user, target=f"Material ID: {new_id}", ip_address=get_client_ip(), details=data.get("title"))
    return jsonify({"success": True, "message": "เพิ่มสื่อการเรียนรู้ใหม่เรียบร้อย", "id": new_id})

@app.route("/api/admin/materials/<int:material_id>", methods=["DELETE"])
def delete_material(material_id):
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
    
    success = db.delete_learning_material(material_id)
    admin_user = session.get("admin_user", "Admin")
    db.log_audit("DELETE_MATERIAL", actor=admin_user, target=f"Material ID: {material_id}", ip_address=get_client_ip())
    return jsonify({"success": success})

# ==================== SECURE CSV / EXCEL EXPORT (PDPA AUDITED) ====================

@app.route("/api/admin/export")
def export_csv():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_page"))
    
    admin_user = session.get("admin_user", "Admin TU")
    client_ip = get_client_ip()
    db.log_audit("EXPORT_CSV_DATA", actor=admin_user, target="Members Database", ip_address=client_ip, details="Full Member CSV Export")

    members = db.list_members()
    fields_settings = db.get_form_fields_settings()
    
    output = io.StringIO()
    # Add UTF-8 BOM so Excel opens Thai correctly
    output.write('\ufeff')
    
    writer = csv.writer(output)
    
    # Headers
    headers = ["รหัสสมาชิก", "LINE User ID", "ชื่อใน LINE", "สิทธิ์เข้าเรียนออนไลน์ (Part 2)", "ผู้อนุมัติสิทธิ์", "วันเวลาที่อนุมัติ"]
    
    field_ids_in_export = []
    for f in fields_settings:
        fid = f.get("id")
        headers.append(f.get("label", fid))
        field_ids_in_export.append(fid)
        
    headers.append("วันที่ลงทะเบียน")
    writer.writerow(headers)
    
    for m in members:
        row = [
            m.get("member_code", ""),
            m.get("line_user_id", ""),
            m.get("line_display_name", ""),
            m.get("learning_access", "PENDING"),
            m.get("approved_by", "") or "-",
            m.get("approved_at", "") or "-"
        ]
        
        custom_data = m.get("custom_data", {})
        
        for fid in field_ids_in_export:
            if fid == "phone":
                val = f"{m.get('phone_prefix', '+66')} {m.get('phone', '')}".strip()
            elif fid == "birthday":
                val = m.get("birth_date", "")
            elif fid == "pdpa_consent":
                val = "ยินยอม" if m.get("pdpa_consent") else "ไม่ยินยอม"
            elif fid in m:
                val = m.get(fid, "")
            else:
                val = custom_data.get(fid, "")
            row.append(str(val) if val is not None else "")
            
        row.append(m.get("created_at", ""))
        writer.writerow(row)
    
    response = Response(output.getvalue(), mimetype="text/csv; charset=utf-8")
    response.headers["Content-Disposition"] = "attachment; filename=seed_to_success_members.csv"
    return response

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 SEED TO SUCCESS Secure Server running on http://127.0.0.1:{port}")
    print(f"👉 Learning Portal: http://127.0.0.1:{port}/portal")
    print(f"👉 Admin Dashboard: http://127.0.0.1:{port}/admin (user: {Config.ADMIN_USERNAME}, pass: {Config.ADMIN_PASSWORD})")
    app.run(host="0.0.0.0", port=port, debug=True)
