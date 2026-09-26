import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "seed-to-success-tu-2026-secret-key")
    LIFF_ID = os.getenv("LIFF_ID", "")  # Put your LINE LIFF ID here (e.g. "2001234567-AbCdEfGh")
    BRAND_NAME = os.getenv("BRAND_NAME", "SEED TO SUCCESS")
    BRAND_TITLE = os.getenv("BRAND_TITLE", "โครงการ SEED TO SUCCESS เมล็ดพันธุ์สู่ความสำเร็จ")
    BRAND_SUBTITLE = os.getenv("BRAND_SUBTITLE", "มหาวิทยาลัยธรรมศาสตร์ ร่วมสร้างผู้ประกอบการและทักษะแห่งอนาคต")
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin1234")
    DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "members.db")
