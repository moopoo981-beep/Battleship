# วิธีเปิด IRON TIDE II บน GitHub และเล่นกับเพื่อน

เอกสารสำหรับเวอร์ชัน 2.0 · 9 กันยายน 2026

## เลือกวิธีเข้าเล่น

| ต้องการ | วิธีเปิด |
| --- | --- |
| เล่นคนเดียวทันที | แยก ZIP แล้วเปิด START_GAME.html |
| เล่นกับเพื่อนใน Wi-Fi / LAN เดียวกัน | เปิด START_SERVER.bat แล้วทุกคนเข้าเว็บของเครื่องที่เปิดเซิร์ฟเวอร์ |
| มีลิงก์หน้าเกม GitHub Pages | อัปโหลดซอร์สและเปิด workflow ที่แนบมา |
| เล่นกับเพื่อนคนละบ้าน | เปิดเซิร์ฟเวอร์ Node.js ที่มี HTTPS แล้วเชื่อมหน้าเกมกับ URL นั้น |

**GitHub Pages เป็นส่วนหน้าเกม เซิร์ฟเวอร์ห้องต้องรันอีกส่วนหนึ่ง** ใน ZIP มีซอร์สและไฟล์ตั้งค่าแล้ว แต่ยังไม่ได้ deploy เซิร์ฟเวอร์หรือสร้างบัญชีโฮสต์ให้ ขั้นตอนด้านล่างเป็นการตั้งค่าจากชุดไฟล์นี้

## 1. ลองเล่นบนเครื่องก่อน

1. แยก IRON_TIDE_Battleship_Game.zip ทั้งหมด
2. เข้าโฟลเดอร์ IRON_TIDE
3. เปิด START_GAME.html ด้วย Chrome หรือ Edge
4. เลือกเรือ → เริ่มภารกิจ → เข้าปฏิบัติการ
5. กด W เพิ่มคันเร่ง A/D เลี้ยว Q โซนาร์ คลิกศัตรูแล้ว L ล็อก จากนั้น M ยิงจรวด

การเปิดไฟล์นี้เล่นคนเดียวไม่ต้องใช้ Node.js ถ้าจะทำห้องให้ใช้ขั้นต่อไป

## 2. เปิดห้องบนเครื่อง Windows หรือ LAN

1. ติดตั้ง Node.js รุ่น 20 ขึ้นไปจาก https://nodejs.org/en/download ให้มีคำสั่ง node ใน PATH
2. เปิด START_SERVER.bat ภายในโฟลเดอร์ IRON_TIDE
3. ปล่อยหน้าต่างเซิร์ฟเวอร์เปิดไว้ แล้วเข้า http://localhost:3000 บนเครื่องเดียวกัน
4. เลือกชื่อและเรือ กด **เล่นกับเพื่อน → เชื่อมต่อ / รีเฟรช → สร้างห้อง**
5. หากเพื่อนอยู่ LAN เดียวกัน ให้เพื่อนเปิด http://ตามด้วยIPv4ของเครื่องเจ้าของ:3000 เช่น http://192.168.1.23:3000
6. เพื่อนกดเล่นกับเพื่อนและใช้ URL เซิร์ฟเวอร์เดียวกับที่เพื่อนเปิดเว็บ แล้วค้นหาห้องหรือกรอกรหัส
7. ทุกคนกด **พร้อมรบ** เจ้าของกด **เริ่มรบทั้งทีม**

หา IPv4 บน Windows โดยเปิด Command Prompt แล้วพิมพ์ ipconfig ดู IPv4 Address ของ Wi-Fi หรือ Ethernet ที่ใช้อยู่ อนุญาต Node.js ผ่าน Windows Firewall สำหรับเครือข่ายส่วนตัวเมื่อระบบถาม ถ้า Wi-Fi แยกเครื่องลูกข่ายออกจากกัน เช่น guest network จะเชื่อมถึงกันไม่ได้

**localhost หมายถึงเครื่องที่กำลังเปิดเว็บ** เพื่อนจึงไม่ควรพิมพ์ localhost เพื่อเข้าเครื่องของคุณ IP ตัวอย่างต้องเปลี่ยนเป็น IP จริงของเครื่องที่รันเซิร์ฟเวอร์ LAN ไม่ทำให้เพื่อนคนละบ้านเข้าได้โดยอัตโนมัติ สำหรับอินเทอร์เน็ตใช้เซิร์ฟเวอร์ HTTPS ตามขั้นที่ 4

บน macOS / Linux หรือเมื่อใช้เทอร์มินัล ให้เข้าโฟลเดอร์ IRON_TIDE แล้วรัน:

```
node server/server.cjs
```

เปิด http://localhost:3000 หยุดเซิร์ฟเวอร์ด้วย Ctrl+C ไม่ต้องรัน npm install เพราะไม่มี dependencies ภายนอก

## 3. อัปโหลดหน้าเกมขึ้น GitHub Pages

1. สร้าง repository บน GitHub เช่น iron-tide
2. อัปโหลด **ไฟล์ข้างในโฟลเดอร์ IRON_TIDE** ให้ dist, server, package.json และ .github อยู่ที่รากของ repository
3. ต้องมีไฟล์ .github/workflows/pages.yml อยู่จริง อย่าอัปโหลดเพียง ZIP หรือวาง IRON_TIDE ซ้อนอีกชั้นจน workflow หา dist ไม่เจอ
4. ใช้ branch main ตาม workflow ที่แนบมา ถ้าใช้ชื่ออื่น แก้ branches ในไฟล์ pages.yml ให้ตรง
5. เข้า repository → **Settings → Pages → Build and deployment → Source → GitHub Actions**
6. เข้าแท็บ **Actions → Publish IRON TIDE to GitHub Pages → Run workflow → main**
7. เมื่อ workflow สำเร็จ เปิด URL ที่แสดงใน Settings → Pages หรือในงาน deploy

URL ทั่วไปจะมีรูปแบบ https://USERNAME.github.io/iron-tide/ โดย USERNAME และชื่อ repo ต้องตรงกับของคุณ workflow ใช้โฟลเดอร์ dist เป็นหน้าเว็บ โดยอัปโหลดไฟล์ทั้งหมดจากโฟลเดอร์นั้นและเผยแพร่ผ่าน GitHub Pages

ถ้าหน้าเว็บมีแต่ README ให้ตรวจ Source ว่าเลือก GitHub Actions และ workflow สำเร็จแล้ว ถ้า Actions แจ้งหาโฟลเดอร์ dist ไม่พบ ให้ย้ายเนื้อหา IRON_TIDE ขึ้นมาที่ราก repo

สำหรับ Git ในเครื่อง รันทีละคำสั่งหลังแทน URL repo จริง:

```
git init
git add .
git commit -m "Add IRON TIDE 2 game and co-op server"
git branch -M main
git remote add origin https://github.com/USERNAME/iron-tide.git
git push -u origin main
```

ตัวอย่างนี้สำหรับโฟลเดอร์ใหม่ที่ยังไม่ได้ผูก repo ถ้ามี repo อยู่แล้วให้ใช้ remote/branch เดิมตามงานของคุณ การเผยแพร่ต้องใช้สิทธิ์ของบัญชี GitHub เจ้าของ repo

หน้าเกมจะเล่นคนเดียวได้หลัง Pages พร้อม ส่วนปุ่มห้องต้องเชื่อมกับเซิร์ฟเวอร์จากขั้นถัดไป

## 4. เปิดเซิร์ฟเวอร์ HTTPS สำหรับเล่นคนละบ้าน

ใช้บริการโฮสต์ที่รัน Node.js แบบต่อเนื่องและรองรับ HTTP streaming ได้ ตัวอย่างด้านล่างใช้ **Render Web Service** คุณต้องมีบัญชีและเลือกแผนบริการเอง เอกสารนี้ไม่ระบุว่าฟรีหรือรับประกันว่าจะเปิดตลอด เพราะขึ้นกับบริการที่เลือก

1. เปิด https://dashboard.render.com/ แล้วเลือก **New → Web Service**
2. เชื่อม repository เดียวกับที่มี server/server.cjs, dist และ package.json
3. เลือก branch main และ Root Directory เป็นราก repo
4. Language / Runtime: **Node**
5. Build Command: **node --version**
6. Start Command: **node server/server.cjs**
7. ตั้ง Environment Variable **NODE_VERSION = 24**
8. ตั้ง **ALLOWED_ORIGINS = https://USERNAME.github.io** โดยใช้ชื่อบัญชีของคุณ
9. กำหนด Health Check Path เป็น **/api/health**
10. สร้างบริการ รอ build/start สำเร็จ แล้วคัดลอก URL HTTPS ของบริการ

ALLOWED_ORIGINS รับเฉพาะ origin: scheme และโดเมน **ไม่ใส่ /iron-tide/ ท้าย URL** ถ้าต้องใช้ custom domain ให้ใส่ origin ของโดเมนนั้น ถ้าจะเปิดหน้าเกมจาก URL ของเซิร์ฟเวอร์ด้วย ให้เพิ่ม origin เซิร์ฟเวอร์คั่นด้วย comma เช่น:

```
https://captain.github.io,https://iron-tide-server.example
```

ช่วงทดลองใช้ **ALLOWED_ORIGINS** เป็นเครื่องหมายดอกจัน (*) เพื่ออนุญาตทุก origin ได้ เมื่อกำหนดแบบรายชื่อ การเปิด START_GAME.html จากไฟล์มี origin แบบ null และอาจถูกปฏิเสธ ให้เข้าเว็บที่อยู่ในรายชื่อแทน

เซิร์ฟเวอร์อ่าน PORT ที่บริการโฮสต์ให้ และ bind ที่ 0.0.0.0 จึงไม่ต้อง hard-code พอร์ต 3000 บนบริการภายนอก มี render.yaml แนบสำหรับผู้ที่ใช้ Render Blueprint ด้วย แต่ไม่ต้องใช้ทั้ง Blueprint และการสร้าง Web Service ด้วยมือพร้อมกัน

ตรวจโดยเปิด URL เซิร์ฟเวอร์ต่อท้าย **/api/health** ควรได้ JSON ลักษณะนี้:

```
{"ok":true,"game":"IRON TIDE","version":2,"rooms":0}
```

จำนวน rooms เปลี่ยนตามห้องที่เปิดอยู่ ถ้าไม่ขึ้น JSON ให้ตรวจ log, path server/server.cjs, branch และ PORT ก่อนเชื่อมหน้าเกม

อีกทางหนึ่งใช้ Docker:

```
docker build -t iron-tide .
docker run --rm -p 3000:3000 -e ALLOWED_ORIGINS=https://USERNAME.github.io iron-tide
```

Dockerfile ใช้ Node 24 และเปิดพอร์ต 3000 ตัวอย่าง Docker นี้ยังต้องวางหลัง HTTPS proxy หรือบริการโฮสต์ที่ออกใบรับรองให้ก่อนเชื่อมจากหน้า GitHub Pages

## 5. เชื่อมหน้า GitHub Pages กับเซิร์ฟเวอร์

เปิดไฟล์ **dist/config.js** ใน repository แก้เป็น URL เซิร์ฟเวอร์จริง:

```
window.IRON_TIDE_CONFIG = {
  serverUrl: "https://YOUR-SERVER.example"
};
```

Commit การเปลี่ยนแปลง workflow จะเผยแพร่หน้าเกมใหม่ จากนั้นเปิด GitHub Pages → **เล่นกับเพื่อน → เชื่อมต่อ / รีเฟรช**

หรือใส่ URL เดียวกันโดยตรงในช่อง **ที่อยู่เซิร์ฟเวอร์ห้อง** ของเมนูเล่นกับเพื่อนก็ได้ ถ้าเคยบันทึก URL เดิมไว้ เกมจะใช้ค่าที่บันทึกไว้ก่อน ให้เปลี่ยนในช่องนี้เมื่อย้ายเซิร์ฟเวอร์

อย่าใส่ URL GitHub Pages ลงในช่องเซิร์ฟเวอร์ห้อง และไม่ต้องต่อท้าย /api, /api/rooms หรือชื่อไฟล์ หน้าเว็บ HTTPS ต้องเชื่อมเซิร์ฟเวอร์ HTTPS

เมื่อแก้ dist/config.js ไฟล์ออฟไลน์ START_GAME.html เดิมยังไม่เปลี่ยน หากต้องการแจกไฟล์รวมที่ตั้ง URL ใหม่ไว้แล้ว ให้สร้างใหม่ด้วยคำสั่งในหัวข้อพัฒนาต่อด้านล่าง

## 6. ชวนเพื่อนเข้าห้อง

1. ทุกคนเปิดหน้าเกม เลือกเรือและชื่อผู้เล่น
2. เข้า **เล่นกับเพื่อน** และใช้ URL เซิร์ฟเวอร์เดียวกัน
3. เจ้าของตั้งชื่อห้อง กด **สร้างห้อง** จะได้รหัส 6 ตัว
4. เพื่อนกดเชื่อมต่อเพื่อดูรายการ แล้วกดเข้าร่วม หรือพิมพ์รหัสห้อง
5. ห้องที่เลือก **เข้าด้วยรหัสเท่านั้น** จะไม่ปรากฏในรายการสาธารณะ
6. เลือกเรือและอัปเกรดใน **เลือกเรือ / อัปเกรด** แล้วกด **เสร็จแล้ว**
7. ทุกคนกด **พร้อมรบ** เจ้าของเลือก **เริ่มรบทั้งทีม**

ห้องรองรับได้สูงสุด 4 ผู้เล่น น้อยกว่า 4 คนจะมี AI เติม เข้าร่วมเป็นสมาชิกใหม่ได้ขณะอยู่ล็อบบี้เท่านั้น ถ้ารอบเริ่มแล้วรอเจ้าของพาทีมกลับล็อบบี้หลังจบรอบ

หลังรบ ซื้อของจากหน้าผล แล้วกดเสร็จแล้วเพื่อบันทึกชุดเรือ เจ้าของพาทีมกลับล็อบบี้ ทุกคนกดพร้อมอีกครั้งเพื่อเริ่มรอบถัดไป

หากเน็ตหลุดระบบพยายามเชื่อมใหม่ AI รับช่วงหลังประมาณ 3 วินาที ถ้ารีเฟรชแท็บให้กด **กลับเข้าห้องล่าสุด** ภายใน 90 วินาที ใช้เซสชันเดิมจึงได้เรือลำเดิม การออกห้องด้วยปุ่มออกลบสิทธิ์กลับเข้ารอบนั้นโดยตั้งใจ

## 7. เซฟและการดูแลเซิร์ฟเวอร์

เครดิต เรือ และอัปเกรดอยู่ในเบราว์เซอร์แต่ละคน ย้ายจากเล่นไฟล์ไป Pages ให้กด **สำรองข้อมูล** แล้วไปกด **โหลดข้อมูล / เซฟ** บนเว็บใหม่ ไม่มีระบบล็อกอินหรือซิงก์เครดิตบนเซิร์ฟเวอร์

ห้องออนไลน์เก็บใน RAM เซิร์ฟเวอร์รีสตาร์ตหรือโฮสต์หยุดบริการแล้วห้องหาย ไม่สามารถโหลดเซฟคนเดียวไปเป็นรอบออนไลน์ รองรับหนึ่ง server instance ต่อกลุ่มห้อง การเพิ่ม replicas โดยไม่มี sticky routing และ shared state จะทำให้คำสั่งอาจไปคนละห้องข้อมูล

ค่า **MAX_ROOMS** ตั้งจำนวนห้องสูงสุด ค่าเริ่มต้น 24 เป็นเพดานซอฟต์แวร์ ไม่ใช่ผลรับรองว่าเครื่องทุกสเปกรองรับพร้อมกันได้เท่านั้น การทดสอบครั้งนี้ใช้การเชื่อมจริง 2 ผู้เล่นและตรวจเพดานสมาชิก 4 คน ยังไม่ได้วัดโหลดหลายห้องหรืออินเทอร์เน็ตจริง

หากใช้ reverse proxy ให้รองรับ SSE/HTTP streaming ปิด response buffering และเพิ่ม read timeout ตามระยะเล่น ตัวเซิร์ฟเวอร์ส่ง X-Accel-Buffering: no และสถานะเกมต่อเนื่อง ใช้บริการที่ให้ process รันต่อเนื่องเพื่อไม่ให้ห้องถูกหยุดกลางรอบ

## แก้ปัญหาที่พบบ่อย

| อาการ | ตรวจและแก้อย่างไร |
| --- | --- |
| เปิด START_SERVER.bat แล้วแจ้งไม่พบ Node.js | ติดตั้ง Node แล้วเปิดหน้าต่างใหม่ ลอง node --version |
| /api/health เป็น 404 หรือหน้า HTML | URL นั้นอาจเป็นหน้า Pages ให้ใช้ URL backend จริง |
| เพื่อนใน LAN เข้า localhost ไม่ได้ | ใช้ IPv4 ของเครื่องที่เปิดเซิร์ฟเวอร์ ตรวจ Firewall และ guest Wi-Fi |
| หน้าเกม HTTPS ต่อห้องไม่ได้ | backend ต้องเป็น HTTPS และ ALLOWED_ORIGINS ต้องตรงโดเมนหน้าเกม |
| ขึ้นโดเมนไม่ได้รับอนุญาต | ใส่ origin เท่านั้น ไม่ใส่ path ชื่อ repo; เพิ่ม custom domain หากใช้ |
| ห้องไม่อยู่ในรายการ | ตรวจ URL backend ให้ตรงกัน ห้อง private ต้องเข้าด้วยรหัส |
| กดเริ่มรบไม่ได้ | ทุกคนต้องเชื่อมต่อและกดพร้อม การเปลี่ยนภารกิจหรือเรือจะยกเลิกความพร้อม |
| กลับเข้ารอบเดิมไม่ได้ | เกิน 90 วินาที เซสชันเดิมหาย กดออกจากห้องแล้ว หรือเซิร์ฟเวอร์รีสตาร์ต |
| ภาพเคลื่อนเป็นจังหวะ / คำสั่งช้า | ตรวจ latency และ proxy buffering ลดจำนวนห้องหรือย้าย backend ใกล้ผู้เล่น |
| เซฟหายเมื่อเปิดเว็บใหม่ | ข้อมูลแยกตามเบราว์เซอร์/โดเมน นำเข้า JSON สำรองจากที่เล่นเดิม |
| ซื้อของแล้วค่าพลังในรอบปัจจุบันไม่เปลี่ยน | อัปเกรดเริ่มมีผลในรอบใหม่ กดเสร็จแล้วในร้านก่อนเริ่มรอบออนไลน์ |
| ไม่มีเสียง | คลิกเกมก่อน ตรวจเมนูเสียง ปุ่ม mute และระดับเสียงเครื่อง |

## พัฒนาต่อและสร้าง ZIP ใหม่

แก้ซอร์สใน dist และ server จากรากโครงการทดสอบด้วย Node.js:

```
npm test
npm run test:campaign
```

สร้าง START_GAME.html คู่มือ HTML และ ZIP ใหม่ด้วย Python 3:

```
python3 tools/build_release.py
```

ผล ZIP อยู่ที่ release/IRON_TIDE_Battleship_Game.zip บน Windows หากไม่มี python3 ให้ลอง py -3 tools/build_release.py

## เอกสารอ้างอิงของแพลตฟอร์ม

GitHub Pages custom workflows:
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

Render Node web service:
https://render.com/docs/deploy-node-express-app

Render web service และการกำหนดพอร์ต:
https://render.com/docs/web-services

Render environment variables:
https://render.com/docs/environment-variables

Node.js HTTP API:
https://nodejs.org/api/http.html

Server-Sent Events:
https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
