/**
 * Firebase Configuration for SEED TO SUCCESS
 * นำค่า Config ที่ได้จาก Firebase Console (Project settings -> Your apps) มาใส่ที่นี่
 */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "seed2success-ab3a4.firebaseapp.com",
    projectId: "seed2success-ab3a4",
    storageBucket: "seed2success-ab3a4.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// LINE LIFF ID (นำ LIFF ID ที่ได้จาก LINE Developers Console มาใส่ที่นี่)
const LIFF_ID = ""; // e.g. "2001234567-AbCdEfGh"

// Default System Settings for SEED TO SUCCESS
const DEFAULT_APPEARANCE = {
    brand_name: "SEED TO SUCCESS",
    logo_url: "https://tu.ac.th/uploads/main-logo.png",
    brand_title: "โครงการ SEED TO SUCCESS เมล็ดพันธุ์สู่ความสำเร็จ",
    brand_subtitle: "มหาวิทยาลัยธรรมศาสตร์ ร่วมสร้างผู้ประกอบการและทักษะแห่งอนาคต",
    notice_text: "ยินดีต้อนรับผู้เข้าร่วมสัมมนาทุกท่าน กรุณาลงทะเบียนเพื่อยืนยันตัวตนเข้าร่วมงานสัมมนา On-site และแสดงความจำนงรับสิทธิ์เข้าสู่คลังสื่อการเรียนรู้ออนไลน์ใน Part 2 เมื่อลงทะเบียนสำเร็จจะได้รับ Digital Pass สำหรับแสดงหน้างาน",
    card_tier: "SEED MEMBER",
    card_theme: "deep_navy",
    card_custom_bg: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #020617 100%)",
    accent_color: "#c53030",
    btn_text: "ลงทะเบียนเข้าร่วมโครงการ"
};

const DEFAULT_FORM_FIELDS = [
    {
        id: "first_name",
        label: "ชื่อจริง",
        placeholder: "กรอกชื่อจริง",
        type: "text",
        required: true,
        enabled: true,
        system: true
    },
    {
        id: "last_name",
        label: "นามสกุล",
        placeholder: "กรอกนามสกุล",
        type: "text",
        required: true,
        enabled: true,
        system: true
    },
    {
        id: "phone",
        label: "เบอร์โทรศัพท์มือถือ",
        placeholder: "0812345678",
        type: "tel",
        required: true,
        enabled: true,
        system: true
    },
    {
        id: "email",
        label: "อีเมล (สำหรับล็อกอินเข้าดูสื่อการเรียนรู้)",
        placeholder: "student@dome.tu.ac.th หรือ example@gmail.com",
        type: "email",
        required: true,
        enabled: true,
        system: true
    },
    {
        id: "affiliation",
        label: "สถานะ / สถาบัน",
        placeholder: "",
        type: "select",
        options: [
            "นักศึกษามหาวิทยาลัยธรรมศาสตร์",
            "นักศึกษาต่างสถาบัน",
            "ศิษย์เก่าธรรมศาสตร์",
            "บุคคลทั่วไป / ผู้ประกอบการ / Start-up",
            "อาจารย์ / บุคลากร"
        ],
        required: true,
        enabled: true,
        system: true
    },
    {
        id: "student_id",
        label: "รหัสนักศึกษา / เลขประจำตัว (ถ้ามี)",
        placeholder: "เช่น 660965xxxx",
        type: "text",
        required: false,
        enabled: true,
        system: false
    },
    {
        id: "interest_part2",
        label: "ความสนใจเข้าร่วมคอร์สเรียนรู้ออนไลน์และกิจกรรม Part 2",
        placeholder: "",
        type: "select",
        options: [
            "สนใจอย่างยิ่ง (ขอรับสิทธิ์เข้าเรียนออนไลน์)",
            "สนใจเบื้องต้น (ขอพิจารณาเนื้อหา)",
            "เข้าร่วมเฉพาะงานสัมมนา On-site"
        ],
        required: true,
        enabled: true,
        system: true
    },
    {
        id: "pdpa_consent",
        label: "ความยินยอม PDPA",
        placeholder: "",
        type: "pdpa",
        required: true,
        enabled: true,
        system: true
    }
];

const DEFAULT_MATERIALS = [
    {
        title: "Module 1: บ่มเพาะเมล็ดพันธุ์ ปลูกแนวคิดผู้ประกอบการ (Entrepreneurial Mindset)",
        description: "ค้นหาตัวตน ค้นหาปัญหาที่แท้จริงในตลาด และแนวคิดการสร้างสรรค์นวัตกรรมธุรกิจเพื่อความสำเร็จ",
        category: "วิดีโอบรรยาย",
        content_type: "video_youtube",
        content_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "45 นาที",
        order_index: 1,
        is_published: 1
    },
    {
        title: "Module 2: Business Model Canvas & Customer Validation",
        description: "เจาะลึก 9 ช่องการทำธุรกิจ การสัมภาษณ์กลุ่มลูกค้าตัวจริง และการทดสอบโมเดลธุรกิจเบื้องต้น",
        category: "วิดีโอบรรยาย",
        content_type: "video_youtube",
        content_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "50 นาที",
        order_index: 2,
        is_published: 1
    },
    {
        title: "สไลด์ประกอบการบรรยายโครงการ SEED TO SUCCESS (PDF)",
        description: "เอกสารดาวน์โหลดฉบับเต็ม สรุปเนื้อหาสำคัญและ Workshop Canvas ประจำโครงการ",
        category: "เอกสารดาวน์โหลด",
        content_type: "pdf_download",
        content_url: "https://tu.ac.th/tu04270769/",
        duration: "48 หน้า",
        order_index: 3,
        is_published: 1
    },
    {
        title: "กิจกรรม Workshop Challenge: ส่งข้อเสนอโครงการชิงเงินรางวัล",
        description: "ส่งแนวคิดธุรกิจและเข้าร่วมกิจกรรม Pitching Day ของมหาวิทยาลัยธรรมศาสตร์",
        category: "กิจกรรม Workshop",
        content_type: "link_activity",
        content_url: "https://tu.ac.th/tu04270769/",
        duration: "ตามกำหนดการ",
        order_index: 4,
        is_published: 1
    }
];
