# คู่มือติดตั้งและใช้งานระบบ SEED TO SUCCESS บน Google Cloud Firebase (100% Serverless & Free)

ระบบได้รับการปรับโครงสร้างให้เป็น **Serverless Architecture** แบบเต็มรูปแบบโดยใช้:
- **Firebase Hosting (Google Global CDN):** โหลดหน้าเว็บเร็วระดับมิลลิวินาที ทั่วโลก ไม่มี Cold Start เหมือน Render.com และมี SSL (HTTPS) ในตัว รองรับ LINE LIFF ทันที
- **Cloud Firestore (NoSQL Database):** รองรับ Concurrency สูงสำหรับผู้ลงทะเบียน 1,000 คนพร้อมกัน ข้อมูลถาวร Real-time ไม่สูญหาย ฟรี 50,000 Reads/วัน และ 20,000 Writes/วัน
- **Firebase Authentication:** ระบบรักษาความปลอดภัยบัญชี Admin มาตรฐานสากล

---

## สรุปภาพรวมโครงสร้างระบบ

| ฟังก์ชัน | ไฟล์ / หน้าเว็บ | หน้าที่ |
|---|---|---|
| **Part 1: สัมมนา On-site** | `public/index.html` | ฟอร์มลงทะเบียนผ่าน LINE LIFF, ออกบัตร Digital Pass พร้อม QR Code แสดงหน้างาน |
| **Part 2: คลังสื่อการเรียนรู้** | `public/portal.html` | ระบบ Dual-Login (LINE หรือ Email/Phone), ตรวจสอบสิทธิ์ Gatekeeper (Pending/Approved) |
| **Admin Backoffice** | `public/admin.html` | แดชบอร์ด Real-time, อนุมัติสิทธิ์ (1-คลิก หรือ Bulk อนุมัติทั้งหมด), จัดการสื่อ, ปรับแต่งหน้าตา & ฟิลด์, ส่งออก Excel/CSV (UTF-8 BOM) |
| **ความปลอดภัย & PDPA** | `firestore.rules` | กฎความปลอดภัย ป้องกันข้อมูลรั่วไหล คนทั่วไปไม่สามารถดึงรายชื่อผู้อื่นได้ เฉพาะ Admin เท่านั้นที่เข้าถึงได้ |

---

## ขั้นตอนการติดตั้งและเชื่อมต่อ Firebase (ทำตามทีละขั้นตอน)

### ขั้นตอนที่ 1: สร้าง Firebase Project (ฟรี)
1. เข้าไปที่ **[Firebase Console](https://console.firebase.google.com/)** แล้วล็อกอินด้วยบัญชี Google
2. คลิกปุ่ม **"Create a project"** (สร้างโปรเจกต์)
3. ตั้งชื่อโปรเจกต์ เช่น `seed-to-success-tu`
4. กด **Continue** (สามารถปิด Google Analytics หรือเปิดไว้ก็ได้) แล้วกด **Create project**

---

### ขั้นตอนที่ 2: เปิดใช้งาน Authentication (สำหรับ Admin)
1. ในเมนูด้านซ้าย เลือก **Build** -> **Authentication**
2. คลิก **Get started**
3. ในแท็บ **Sign-in method** ให้เลือก **Email/Password** -> กดสวิตช์ **Enable** แล้วกด **Save**
4. ไปที่แท็บ **Users** (ผู้ใช้) -> คลิกปุ่ม **Add user**
5. กรอกอีเมลและรหัสผ่านของผู้ดูแลระบบ (Admin) เช่น:
   - **Email:** `admin@tu.ac.th`
   - **Password:** `YourSecurePassword123`
   *(อีเมลและรหัสผ่านนี้จะใช้ล็อกอินเข้าหน้าระบบจัดการ `/admin`)*

---

### ขั้นตอนที่ 3: เปิดใช้งาน Cloud Firestore
1. ในเมนูด้านซ้าย เลือก **Build** -> **Firestore Database**
2. คลิก **Create database**
3. เลือก Location เช่น `asia-southeast1 (Singapore)` เพื่อให้คนไทยเข้าถึงได้เร็วที่สุด
4. เลือก **Start in test mode** หรือ **production mode** ก็ได้ (เพราะเราจะใส่ Rules เองในขั้นตอนถัดไป)
5. คลิก **Create**
6. เมื่อสร้างเสร็จแล้ว ไปที่แท็บ **Rules** ด้านบน
7. คัดลอกเนื้อหาทั้งหมดจากไฟล์ `firestore.rules` ในโฟลเดอร์นี้ไปวางแทนที่ แล้วกด **Publish**

---

### ขั้นตอนที่ 4: คัดลอกค่า Firebase Config มาใส่ในโค้ด
1. ในหน้า Firebase Console คลิกไอคอนรูปเฟือง ⚙️ (มุมซ้ายบน) -> เลือก **Project settings**
2. เลื่อนลงมาที่หัวข้อ **Your apps** -> คลิกไอคอนเว็บ `</>`
3. ตั้งชื่อแอป เช่น `seed-web` แล้วคลิก **Register app**
4. จะมีโค้ด `firebaseConfig` ปรากฏขึ้นมา เช่น:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "seed-to-success-tu.firebaseapp.com",
     projectId: "seed-to-success-tu",
     storageBucket: "seed-to-success-tu.appspot.com",
     messagingSenderId: "123456789...",
     appId: "1:123456789:web:..."
   };
   ```
5. เปิดไฟล์ `public/js/firebase-config.js` ในโฟลเดอร์นี้ แล้วนำค่านั้นมาวางแทนที่บรรทัดที่ 6-13

---

### ขั้นตอนที่ 5: ตั้งค่า LINE LIFF (สำหรับลงทะเบียนผ่าน LINE)
1. เข้าไปที่ **[LINE Developers Console](https://developers.line.biz/console/)**
2. สร้าง **Provider** และ **LINE Login Channel**
3. ไปที่แท็บ **LIFF** -> คลิก **Add**
4. กำหนดค่า:
   - **Size:** Full
   - **Endpoint URL:** ใส่ URL ของ Firebase Hosting (เช่น `https://seed-to-success-tu.web.app/`)
   - **Scopes:** ติ๊กเลือก `profile`, `openid`
5. กด **Add** แล้วคัดลอก **LIFF ID** (เช่น `2001234567-AbCdEfGh`)
6. นำ LIFF ID มาใส่ในไฟล์ `public/js/firebase-config.js` ตรง:
   ```javascript
   const LIFF_ID = "2001234567-AbCdEfGh";
   ```

---

## วิธีทดสอบบนเครื่องก่อน Deploy จริง

คุณสามารถทดสอบหน้าเว็บทั้งหมดบนเครื่องของคุณได้ทันทีโดยไม่ต้องลงโปรแกรมเพิ่ม:
1. ดับเบิ้ลคลิกที่ไฟล์ **`run_firebase.bat`**
2. เปิดเบราว์เซอร์แล้วเข้าดู:
   - หน้าลงทะเบียนสัมมนา (Part 1): `http://localhost:8080/`
   - คลังสื่อการเรียนรู้ (Part 2): `http://localhost:8080/portal`
   - ระบบจัดการ Admin: `http://localhost:8080/admin`

---

## วิธี Deploy ขึ้น Firebase Hosting ใช้งานจริง

### ตัวเลือกที่ 1: Deploy ผ่าน Firebase Standalone Tool (ไม่ต้องลง Node.js)
1. ดาวน์โหลด [Firebase CLI Standalone Binary สำหรับ Windows](https://firebase.tools/bin/win/instant/latest)
2. นำไฟล์ที่โหลดมา (เช่น `firebase-tools-instant-win.exe`) มาใส่ในโฟลเดอร์นี้ แล้วเปลี่ยนชื่อเป็น `firebase.exe`
3. เปิด PowerShell ในโฟลเดอร์นี้แล้วพิมพ์:
   ```powershell
   .\firebase.exe login
   .\firebase.exe deploy
   ```
4. ระบบจะอัปโหลดหน้าเว็บและ Cloud Firestore Rules ทั้งหมดขึ้น Google Cloud ให้อัตโนมัติ พร้อมแจ้ง URL ที่ใช้งานได้ทันที (เช่น `https://seed-to-success-tu.web.app`)

### ตัวเลือกที่ 2: ติดตั้ง Node.js
1. ติดตั้ง Node.js จาก [nodejs.org](https://nodejs.org/)
2. รันคำสั่งใน PowerShell:
   ```powershell
   npm install -g firebase-tools
   firebase login
   firebase deploy
   ```

---

## สรุปจุดเด่นของระบบที่พัฒนาเสร็จสมบูรณ์

1. **รองรับคนเข้าพร้อมกัน 1,000 คน โดยไม่มีล่ม:** ด้วย Cloud Firestore และ Global CDN ของ Google
2. **ระบบอนุมัติแบบ Real-time:** เมื่อผู้เข้าสัมมนาลงทะเบียน Admin จะเห็นรายชื่อเด้งขึ้นหน้าจอทันที สามารถคลิก "อนุมัติสิทธิ์ผู้ที่รอทั้งหมด" (Bulk Approve) ได้ใน 1 วินาที
3. **ป้องกันข้อมูลรั่วไหล (PDPA):** ซ่อนข้อมูลเบอร์โทร (`081-xxx-5678`) และอีเมล (`ta*****@...`) บนหน้าสาธารณะ มีระบบ Audit Log ทุกครั้งที่อนุมัติหรือส่งออกข้อมูล และบล็อกไม่ให้คนภายนอกดึงฐานข้อมูลไปดูได้
4. **ความยืดหยุ่นสูง:** Admin สามารถแก้ไขโลโก้ สีโครงการ หรือเพิ่ม/ลดช่องฟอร์มลงทะเบียนได้เองผ่านหน้า `/admin` โดยไม่ต้องเขียนโค้ดแก้ระบบ
