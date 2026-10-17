# YouTube & YouTube Music Dual Pro 🎵🎬

แอพพลิเคชันรวม **YouTube** และ **YouTube Music** ไว้ในแอพเดียว พัฒนาด้วย React Native & Expo SDK 57

## ฟีเจอร์หลัก (Key Features)

1. **Dual Player in One App (2-in-1)**:
   - สลับระหว่าง **YouTube** (`m.youtube.com`) และ **YouTube Music** (`music.youtube.com`) ได้ทันทีผ่านแท็บด้านล่าง
   - **Persistent WebViews**: ทั้งสองแท็บทำงานคู่ขนานกัน ไม่โหลดใหม่เมื่อสลับแท็บ ทำให้ฟังเพลงหรือดูวิดีโอต่อได้ไม่สะดุด

2. **Google Account Sign-In (รองรับการล็อคอินบัญชี Google)**:
   - มีระบบจำลอง Chrome Mobile User-Agent ป้องกันปัญหา `disallowed_useragent` (Error 403 ที่ Google มักบล็อกการล็อคอินบน WebView ทั่วไป)
   - แชร์คุกกี้และ Session (`sharedCookiesEnabled`) ทำให้ล็อคอินครั้งเดียว ใช้งานได้ทั้ง YouTube และ YouTube Music
   - ซิงค์เพลย์ลิสต์, ประวัติการฟัง, รายการที่กดชอบ (Likes) และช่องที่กดติดตามได้ครบถ้วน

3. **Advanced AdBlock Engine (ระบบบล็อกโฆษณา)**:
   - **CSS Element Hiding**: ซ่อนแบนเนอร์โฆษณา, วิดีโอสปอนเซอร์, ป๊อปอัพชวนสมัคร Premium ("Try YouTube Premium", "Music Premium")
   - **Video In-Stream Ad Skipper**: กรอข้ามโฆษณาอัตโนมัติ (Fast-forward 16x) และกดปุ่ม "Skip Ad" ทันทีที่โฆษณาขึ้น
   - **Network Interception**: ดักจับและคัดกรองลิงก์โฆษณา (Doubleclick, GoogleAdServices) และลบ `adPlacements` จากคำขอ YouTube Player API
   - **Realtime Stats Counter**: มีตัวนับและแสดงจำนวนโฆษณาที่บล็อก/ข้ามไปแบบเรียลไทม์

4. **Background Audio & Screen-Off Playback (เล่นเพลงเบื้องหลัง + ปิดหน้าจอ)**:
   - ป้องกันการหยุดเล่นอัตโนมัติเมื่อพับแอพ สลับหน้าจอ หรือกดปิดหน้าจอล็อคเครื่อง (Bypass Visibility API, focusout, pagehide และ blur)
   - ข้ามป๊อปอัพ "Are you still listening?" บน YouTube Music ให้อัตโนมัติ
   - สลับระหว่าง **Mobile View** และ **Desktop View** ได้ตามต้องการ

5. **Notification Bar Media Controls (ตัวควบคุมเพลง/วิดีโอบนแถบแจ้งเตือน & หน้าจอล็อค)**:
   - แสดงชื่อเพลง (Title), ศิลปิน (Artist) และสถานะการเล่นบน Notification Bar และ Lock Screen อัตโนมัติ
   - ปุ่มควบคุมโดยตรงบนแถบแจ้งเตือน:
     - **⏮ Prev**: ย้อนกลับเพลงก่อนหน้า
     - **⏯ Play / Pause**: เล่น / หยุดเพลงชั่วคราว
     - **⏭ Next**: ข้ามไปเพลงถัดไป
     - **📱 Open**: แตะเพื่อเปิดสลับกลับเข้าสู่แอพ
   - เชื่อมต่อกับ `navigator.mediaSession` ของ YouTube/Music โดยตรง สั่งงานข้ามเพลงและเล่น/หยุดได้เสถียรทั้งในเบื้องหลังและขณะหน้าจอดับ

6. **Browser Navigation Controls**:
   - ปุ่ม Back (ย้อนกลับ), Forward (ไปข้างหน้า), Reload (รีเฟรช), และ Home (หน้าแรก)

---

## การเริ่มต้นใช้งาน (Get Started)

### ติดตั้ง Dependencies
```bash
npm install
```

### รันแอพพลิเคชัน
```bash
npm run start
```
หรือรันบน Android:
```bash
npm run android
```

---

## โครงสร้างโปรเจกต์ (Project Structure)

- `src/app/`: Expo Router screens & layout (`_layout.tsx`, `index.tsx`)
- `src/components/`:
  - `HeaderBar.tsx`: แถบสถานะด้านบน พร้อมตัวนับ AdBlock, ปุ่มเข้าสู่ระบบ Google และปุ่มการตั้งค่า
  - `NavigationBar.tsx`: แถบควบคุมเบราว์เซอร์และแถบสลับแท็บ YouTube / Music
  - `SettingsModal.tsx`: หน้าต่างเมนูตั้งค่า (เปิด/ปิด AdBlock, โหมดเดสก์ท็อป, ล้างแคช)
  - `WebContainer.tsx`: ควบคุม Dual WebView แบบแยกอิสระ พร้อมสคริปต์ AdBlock
- `src/constants/config.ts`: การตั้งค่า URL, สีธีม, และ User-Agent
- `src/utils/adblock.ts`: สคริปต์ CSS และ JavaScript สำหรับการบล็อกและข้ามโฆษณา
- `src/utils/mediaNotification.ts`: จัดการ Notification Channel, Notification Actions (Play, Pause, Next, Prev) และสื่อสารกับระบบแจ้งเตือน
