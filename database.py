import sqlite3
import datetime
import json
from config import Config

def get_db_connection():
    conn = sqlite3.connect(Config.DATABASE_PATH, timeout=20.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA busy_timeout = 10000;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

DEFAULT_APPEARANCE = {
    "brand_name": "SEED TO SUCCESS",
    "logo_url": "https://tu.ac.th/uploads/main-logo.png",
    "brand_title": "โครงการ SEED TO SUCCESS เมล็ดพันธุ์สู่ความสำเร็จ",
    "brand_subtitle": "มหาวิทยาลัยธรรมศาสตร์ ร่วมสร้างผู้ประกอบการและทักษะแห่งอนาคต",
    "notice_text": "ยินดีต้อนรับผู้เข้าร่วมสัมมนาทุกท่าน กรุณาลงทะเบียนเพื่อยืนยันตัวตนเข้าร่วมงานสัมมนา On-site และแสดงความจำนงรับสิทธิ์เข้าสู่คลังสื่อการเรียนรู้ออนไลน์ใน Part 2 เมื่อลงทะเบียนสำเร็จจะได้รับ Digital Pass สำหรับแสดงหน้างาน",
    "card_tier": "SEED MEMBER",
    "card_theme": "deep_navy",
    "card_custom_bg": "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #020617 100%)",
    "accent_color": "#c53030", # Thammasat Brand Accent
    "btn_text": "ลงทะเบียนเข้าร่วมโครงการ"
}

DEFAULT_FORM_FIELDS = [
    {
        "id": "first_name",
        "label": "ชื่อจริง",
        "placeholder": "กรอกชื่อจริง",
        "type": "text",
        "required": True,
        "enabled": True,
        "system": True
    },
    {
        "id": "last_name",
        "label": "นามสกุล",
        "placeholder": "กรอกนามสกุล",
        "type": "text",
        "required": True,
        "enabled": True,
        "system": True
    },
    {
        "id": "phone",
        "label": "เบอร์โทรศัพท์มือถือ",
        "placeholder": "0812345678",
        "type": "tel",
        "required": True,
        "enabled": True,
        "system": True
    },
    {
        "id": "email",
        "label": "อีเมล (สำหรับล็อกอินเข้าดูสื่อการเรียนรู้)",
        "placeholder": "student@dome.tu.ac.th หรือ example@gmail.com",
        "type": "email",
        "required": True,
        "enabled": True,
        "system": True
    },
    {
        "id": "affiliation",
        "label": "สถานะ / สถาบัน",
        "placeholder": "",
        "type": "select",
        "options": [
            "นักศึกษามหาวิทยาลัยธรรมศาสตร์",
            "นักศึกษาต่างสถาบัน",
            "ศิษย์เก่าธรรมศาสตร์",
            "บุคคลทั่วไป / ผู้ประกอบการ / Start-up",
            "อาจารย์ / บุคลากร"
        ],
        "required": True,
        "enabled": True,
        "system": True
    },
    {
        "id": "student_id",
        "label": "รหัสนักศึกษา / เลขประจำตัว (ถ้ามี)",
        "placeholder": "เช่น 660965xxxx",
        "type": "text",
        "required": False,
        "enabled": True,
        "system": False
    },
    {
        "id": "interest_part2",
        "label": "ความสนใจเข้าร่วมคอร์สเรียนรู้ออนไลน์และกิจกรรม Part 2",
        "placeholder": "",
        "type": "select",
        "options": [
            "สนใจอย่างยิ่ง (ขอรับสิทธิ์เข้าเรียนออนไลน์)",
            "สนใจเบื้องต้น (ขอพิจารณาเนื้อหา)",
            "เข้าร่วมเฉพาะงานสัมมนา On-site"
        ],
        "required": True,
        "enabled": True,
        "system": True
    },
    {
        "id": "pdpa_consent",
        "label": "ความยินยอม PDPA",
        "placeholder": "",
        "type": "pdpa",
        "required": True,
        "enabled": True,
        "system": True
    }
]

SAMPLE_LEARNING_MATERIALS = [
    {
        "title": "Module 1: บ่มเพาะเมล็ดพันธุ์ ปลูกแนวคิดผู้ประกอบการ (Entrepreneurial Mindset)",
        "description": "ค้นหาตัวตน ค้นหาปัญหาที่แท้จริงในตลาด และแนวคิดการสร้างสรรค์นวัตกรรมธุรกิจเพื่อความสำเร็จ",
        "category": "วิดีโอบรรยาย",
        "content_type": "video_youtube",
        "content_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "duration": "45 นาที",
        "order_index": 1,
        "is_published": 1
    },
    {
        "title": "Module 2: Business Model Canvas & Customer Validation",
        "description": "เจาะลึก 9 ช่องการทำธุรกิจ การสัมภาษณ์กลุ่มลูกค้าตัวจริง และการทดสอบโมเดลธุรกิจเบื้องต้น",
        "category": "วิดีโอบรรยาย",
        "content_type": "video_youtube",
        "content_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "duration": "50 นาที",
        "order_index": 2,
        "is_published": 1
    },
    {
        "title": "สไลด์ประกอบการบรรยายโครงการ SEED TO SUCCESS (PDF)",
        "description": "เอกสารดาวน์โหลดฉบับเต็ม สรุปเนื้อหาสำคัญและ Workshop Canvas ประจำโครงการ",
        "category": "เอกสารดาวน์โหลด",
        "content_type": "pdf_download",
        "content_url": "https://tu.ac.th/tu04270769/",
        "duration": "48 หน้า",
        "order_index": 3,
        "is_published": 1
    },
    {
        "title": "กิจกรรม Workshop Challenge: ส่งข้อเสนอโครงการชิงเงินรางวัล",
        "description": "ส่งแนวคิดธุรกิจและเข้าร่วมกิจกรรม Pitching Day ของมหาวิทยาลัยธรรมศาสตร์",
        "category": "กิจกรรม Workshop",
        "content_type": "link_activity",
        "content_url": "https://tu.ac.th/tu04270769/",
        "duration": "ตามกำหนดการ",
        "order_index": 4,
        "is_published": 1
    }
]

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Members table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_code TEXT UNIQUE,
        line_user_id TEXT,
        line_display_name TEXT,
        line_picture_url TEXT,
        title TEXT DEFAULT 'ไม่ระบุ',
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        birth_day TEXT,
        birth_month TEXT,
        birth_year TEXT,
        birth_date TEXT,
        country TEXT DEFAULT 'ไทย',
        nationality TEXT DEFAULT 'ไทย',
        phone_prefix TEXT DEFAULT '+66',
        phone TEXT NOT NULL,
        email TEXT,
        affiliation TEXT DEFAULT 'นักศึกษา',
        student_id TEXT,
        interest_part2 TEXT DEFAULT 'สนใจอย่างยิ่ง',
        learning_access TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
        approved_at TEXT,
        approved_by TEXT,
        pdpa_consent INTEGER DEFAULT 1,
        custom_data TEXT DEFAULT '{}',
        status TEXT DEFAULT 'ACTIVE',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Check and add new columns if upgrading from old version
    cursor.execute("PRAGMA table_info(members);")
    columns = [row["name"] for row in cursor.fetchall()]
    
    new_cols = {
        "custom_data": "TEXT DEFAULT '{}'",
        "affiliation": "TEXT DEFAULT 'นักศึกษา'",
        "student_id": "TEXT",
        "interest_part2": "TEXT DEFAULT 'สนใจอย่างยิ่ง'",
        "learning_access": "TEXT DEFAULT 'PENDING'",
        "approved_at": "TEXT",
        "approved_by": "TEXT"
    }
    for col, col_def in new_cols.items():
        if col not in columns:
            cursor.execute(f"ALTER TABLE members ADD COLUMN {col} {col_def};")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_members_line_id ON members(line_user_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_members_learning ON members(learning_access);")

    # 2. Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Always ensure settings are initialized
    cursor.execute("SELECT value FROM settings WHERE key = 'appearance'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO settings (key, value) VALUES ('appearance', ?)", (json.dumps(DEFAULT_APPEARANCE, ensure_ascii=False),))

    cursor.execute("SELECT value FROM settings WHERE key = 'form_fields'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO settings (key, value) VALUES ('form_fields', ?)", (json.dumps(DEFAULT_FORM_FIELDS, ensure_ascii=False),))

    # 3. Learning Materials table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS learning_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'วิดีโอบรรยาย',
        content_type TEXT DEFAULT 'video_youtube',
        content_url TEXT NOT NULL,
        duration TEXT,
        order_index INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("SELECT COUNT(*) FROM learning_materials")
    if cursor.fetchone()[0] == 0:
        for mat in SAMPLE_LEARNING_MATERIALS:
            cursor.execute("""
                INSERT INTO learning_materials (title, description, category, content_type, content_url, duration, order_index, is_published)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (mat["title"], mat["description"], mat["category"], mat["content_type"], mat["content_url"], mat["duration"], mat["order_index"], mat["is_published"]))
    # 4. Audit Logs table (PDPA Compliance & Security Logging)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        actor TEXT DEFAULT 'system',
        target TEXT,
        ip_address TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

def log_audit(action, actor="system", target=None, ip_address=None, details=""):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (action, actor, target, ip_address, details)
            VALUES (?, ?, ?, ?, ?)
        """, (action, actor, target, ip_address, str(details)))
        conn.commit()
        conn.close()
    except Exception as e:
        print("Audit log error:", e)

def get_recent_audit_logs(limit=50):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception:
        return []

# ==================== Settings Helper Functions ====================

def get_appearance_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = 'appearance'")
    row = cursor.fetchone()
    conn.close()
    if row:
        try:
            stored = json.loads(row["value"])
            result = dict(DEFAULT_APPEARANCE)
            result.update(stored)
            return result
        except Exception:
            return DEFAULT_APPEARANCE
    return DEFAULT_APPEARANCE

def save_appearance_settings(data):
    current = get_appearance_settings()
    current.update(data)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO settings (key, value, updated_at) 
        VALUES ('appearance', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    """, (json.dumps(current, ensure_ascii=False),))
    conn.commit()
    conn.close()
    return current

def get_form_fields_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = 'form_fields'")
    row = cursor.fetchone()
    conn.close()
    if row:
        try:
            return json.loads(row["value"])
        except Exception:
            return DEFAULT_FORM_FIELDS
    return DEFAULT_FORM_FIELDS

def save_form_fields_settings(fields):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO settings (key, value, updated_at) 
        VALUES ('form_fields', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    """, (json.dumps(fields, ensure_ascii=False),))
    conn.commit()
    conn.close()
    return fields

def reset_settings_to_default():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE settings SET value = ? WHERE key = 'appearance'", (json.dumps(DEFAULT_APPEARANCE, ensure_ascii=False),))
    cursor.execute("UPDATE settings SET value = ? WHERE key = 'form_fields'", (json.dumps(DEFAULT_FORM_FIELDS, ensure_ascii=False),))
    conn.commit()
    conn.close()

# ==================== Members CRUD & Access Control ====================

def generate_member_code(cursor):
    year = datetime.datetime.now().year
    cursor.execute("SELECT COUNT(*) FROM members")
    count = cursor.fetchone()[0] + 1
    return f"SEED-{year}-{count:05d}"

def get_member_by_line_id(line_user_id):
    if not line_user_id:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM members WHERE line_user_id = ? AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1", (line_user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        m = dict(row)
        try:
            m["custom_data"] = json.loads(m.get("custom_data") or "{}")
        except Exception:
            m["custom_data"] = {}
        return m
    return None

def get_member_by_phone(phone):
    if not phone:
        return None
    clean_phone = phone.replace("-", "").replace(" ", "").strip()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM members WHERE phone = ? AND status = 'ACTIVE' LIMIT 1", (clean_phone,))
    row = cursor.fetchone()
    conn.close()
    if row:
        m = dict(row)
        try:
            m["custom_data"] = json.loads(m.get("custom_data") or "{}")
        except Exception:
            m["custom_data"] = {}
        return m
    return None

def get_member_by_email(email):
    if not email:
        return None
    clean_email = email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM members WHERE LOWER(email) = ? AND status = 'ACTIVE' LIMIT 1", (clean_email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        m = dict(row)
        try:
            m["custom_data"] = json.loads(m.get("custom_data") or "{}")
        except Exception:
            m["custom_data"] = {}
        return m
    return None

def get_member_by_id(member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM members WHERE id = ?", (member_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        m = dict(row)
        try:
            m["custom_data"] = json.loads(m.get("custom_data") or "{}")
        except Exception:
            m["custom_data"] = {}
        return m
    return None

def create_member(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    clean_phone = data.get("phone", "").replace("-", "").replace(" ", "").strip()
    clean_email = data.get("email", "").strip().lower()
    member_code = generate_member_code(cursor)
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    birth_day = data.get("birth_day", "")
    birth_month = data.get("birth_month", "")
    birth_year = data.get("birth_year", "")
    birth_date = f"{birth_year}-{birth_month.zfill(2) if birth_month else ''}-{birth_day.zfill(2) if birth_day else ''}" if birth_year and birth_month and birth_day else ""

    interest_part2 = str(data.get("interest_part2", "สนใจอย่างยิ่ง")).strip()
    # Flexible check: if user chose an option that does not decline, mark as PENDING for admin review
    no_intent_keywords = ["ไม่สนใจ", "ไม่เข้าร่วม", "ไม่ขอรับ", "เฉพาะงานสัมมนา", "no", "false", "0"]
    is_declined = any(kw in interest_part2.lower() for kw in no_intent_keywords) if interest_part2 else False
    learning_access = "NO_ACCESS" if is_declined else "PENDING"

    standard_keys = {
        "line_user_id", "line_display_name", "line_picture_url",
        "title", "first_name", "last_name", "birth_day", "birth_month", "birth_year",
        "birth_date", "country", "nationality", "phone_prefix", "phone", "email",
        "affiliation", "student_id", "interest_part2", "learning_access",
        "pdpa_consent", "custom_data"
    }
    
    custom_dict = data.get("custom_data", {})
    if not isinstance(custom_dict, dict):
        custom_dict = {}
        
    for k, v in data.items():
        if k not in standard_keys:
            custom_dict[k] = v

    cursor.execute("""
        INSERT INTO members (
            member_code, line_user_id, line_display_name, line_picture_url,
            title, first_name, last_name, birth_day, birth_month, birth_year,
            birth_date, country, nationality, phone_prefix, phone, email,
            affiliation, student_id, interest_part2, learning_access,
            pdpa_consent, custom_data, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    """, (
        member_code,
        data.get("line_user_id", ""),
        data.get("line_display_name", ""),
        data.get("line_picture_url", ""),
        data.get("title", "ไม่ระบุ"),
        data.get("first_name", "").strip(),
        data.get("last_name", "").strip(),
        birth_day,
        birth_month,
        birth_year,
        birth_date,
        data.get("country", "ไทย"),
        data.get("nationality", "ไทย"),
        data.get("phone_prefix", "+66"),
        clean_phone,
        clean_email,
        data.get("affiliation", "นักศึกษา"),
        data.get("student_id", ""),
        interest_part2,
        learning_access,
        1 if data.get("pdpa_consent") else 0,
        json.dumps(custom_dict, ensure_ascii=False),
        now,
        now
    ))
    
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return get_member_by_id(new_id)

def list_members(search=None, filter_access=None, limit=500, offset=0):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM members WHERE status = 'ACTIVE'"
    params = []

    if filter_access and filter_access != "all":
        query += " AND learning_access = ?"
        params.append(filter_access.upper())
    
    if search:
        search_term = f"%{search.strip()}%"
        query += """ AND (
            first_name LIKE ? OR 
            last_name LIKE ? OR 
            phone LIKE ? OR 
            member_code LIKE ? OR 
            line_display_name LIKE ? OR
            email LIKE ? OR
            student_id LIKE ? OR
            affiliation LIKE ?
        )"""
        params.extend([search_term] * 8)
        
    query += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        m = dict(r)
        try:
            m["custom_data"] = json.loads(m.get("custom_data") or "{}")
        except Exception:
            m["custom_data"] = {}
        results.append(m)
    return results

def get_member_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM members WHERE status = 'ACTIVE'")
    total_members = cursor.fetchone()[0]
    
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    cursor.execute("SELECT COUNT(*) FROM members WHERE status = 'ACTIVE' AND created_at LIKE ?", (f"{today}%",))
    today_members = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM members WHERE status = 'ACTIVE' AND learning_access = 'PENDING'")
    pending_learning = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM members WHERE status = 'ACTIVE' AND learning_access = 'APPROVED'")
    approved_learning = cursor.fetchone()[0]
    
    conn.close()
    return {
        "total_members": total_members,
        "today_members": today_members,
        "pending_learning": pending_learning,
        "approved_learning": approved_learning
    }

# Access Grant / Revoke Functions
def set_member_learning_access(member_id, access_status, admin_name="Admin"):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE members 
        SET learning_access = ?, approved_at = ?, approved_by = ?, updated_at = ?
        WHERE id = ?
    """, (access_status.upper(), now if access_status.upper() == "APPROVED" else None, admin_name if access_status.upper() == "APPROVED" else None, now, member_id))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0

def bulk_approve_pending_learning(admin_name="Admin"):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE members 
        SET learning_access = 'APPROVED', approved_at = ?, approved_by = ?, updated_at = ?
        WHERE learning_access = 'PENDING' AND status = 'ACTIVE'
    """, (now, admin_name, now))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected

def delete_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE members SET status = 'DELETED', updated_at = ? WHERE id = ?", 
                   (datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), member_id))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0

# ==================== Learning Materials CRUD ====================

def list_learning_materials(only_published=True):
    conn = get_db_connection()
    cursor = conn.cursor()
    if only_published:
        cursor.execute("SELECT * FROM learning_materials WHERE is_published = 1 ORDER BY order_index ASC, id ASC")
    else:
        cursor.execute("SELECT * FROM learning_materials ORDER BY order_index ASC, id ASC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_learning_material(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO learning_materials (title, description, category, content_type, content_url, duration, order_index, is_published)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("title", "").strip(),
        data.get("description", "").strip(),
        data.get("category", "วิดีโอบรรยาย"),
        data.get("content_type", "video_youtube"),
        data.get("content_url", "").strip(),
        data.get("duration", "").strip(),
        int(data.get("order_index", 0)),
        1 if data.get("is_published", True) else 0
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def delete_learning_material(material_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM learning_materials WHERE id = ?", (material_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0
