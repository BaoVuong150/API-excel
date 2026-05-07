# 🚀 API Excel - Hệ thống Xử lý Dữ liệu Lớn (Big Data)

Dự án Backend xử lý file Excel lên tới 10 triệu dòng bằng kiến trúc Stream và Queue (Message Broker), đảm bảo không tràn RAM và tối ưu hiệu năng tuyệt đối.

## 📦 Công nghệ sử dụng
- **Framework:** NestJS v11
- **Cơ sở dữ liệu:** PostgreSQL v15
- **Message Broker:** Redis + BullMQ
- **Thư viện xử lý Excel:** ExcelJS (Stream API)
- **Bảo mật:** JWT Auth, Role-based Access Control (RBAC)

---

## 🛠 Hướng dẫn Cài đặt & Khởi chạy (Dành cho máy mới)

Chỉ với 2 thao tác đơn giản bằng Docker, bạn có thể dựng toàn bộ hệ thống (Bao gồm API, Database và Redis) một cách chuẩn mực mà không cần cài đặt tay bất cứ thứ gì.

### Bước 1: Khởi động toàn bộ hệ thống
Mở Terminal tại thư mục gốc của dự án và chạy lệnh sau:
```bash
docker compose up -d --build
```
> **Lưu ý:** Nếu chạy trên Windows, máy ảo đã được thiết lập tự động chờ 5 giây để đồng bộ File System nhằm triệt tiêu hoàn toàn lỗi `Cannot find module` lúc khởi động. Mọi thứ sẽ trơn tru ngay từ giây đầu tiên!

### Bước 2: Gieo dữ liệu khởi tạo (Seed Database)
Sau khi Docker báo `Started`, cơ sở dữ liệu hiện vẫn đang rỗng. Chạy lệnh sau để tự động tạo các tài khoản mẫu:
```bash
docker exec -it nestjs_api npx ts-node src/seed.ts
```

**🎉 Xong! Hệ thống đã sẵn sàng hoạt động tại `http://localhost:3000`.**

---

## 🔑 Tài khoản Mặc định (Sau khi Seed)
Sử dụng các tài khoản này trên Postman để lấy Token:
- **Giám đốc (Quyền Import/Export):** `admin` / `admin123`
- **Nhân viên (Quyền truy cập cơ bản):** `user01` / `user123`

## 📖 Các API chính
1. `POST /auth/login`: Đăng nhập lấy JWT Token.
2. `POST /data/import`: Upload file Excel khổng lồ để Worker xử lý ngầm.
3. `POST /data/export`: Xuất dữ liệu Database ra file Excel không giới hạn.
4. `GET /data/reports/:filename`: Tải về Sổ Nam Tào (Báo cáo lỗi chi tiết từng dòng không hợp lệ).

---

## 🧪 Hướng dẫn Kịch bản Test Khả năng Chịu tải (Dành cho Quản lý)

Hệ thống được thiết kế để không bao giờ "Chết" (Crash) dù file tải lên có chứa rác hay kích thước khổng lồ đến mức nào. Dưới đây là 2 file test và cách sử dụng:

1. **`Test_10K768_Rows.xlsx` (Đã có sẵn trên GitHub)**: 
   File chứa 10.768 dòng (Được gài sẵn 5% dòng lỗi xen kẽ để test Sổ Nam Tào). Bạn có thể dùng luôn.

2. **`Test_3M689_Rows.xlsx` (File Siêu Bạo Lực - Nặng 114MB)**: 
   Vì GitHub cấm lưu trữ file > 100MB, file này không được đính kèm. Bạn không cần phải cài đặt Node.js hay NPM vào máy tính của mình. Để sinh ra file này, bạn chỉ cần lợi dụng thẳng máy ảo Docker đang chạy bằng 2 lệnh sau:
   ```bash
   docker exec -it nestjs_api node generate_test_files.js
   docker cp nestjs_api:/usr/src/app/Test_3M689_Rows.xlsx .
   ```
   *(Lệnh đầu tiên bắt máy ảo sinh ra file, lệnh thứ hai copy file đó từ máy ảo ra ngoài thư mục của bạn).*

> ⚠️ **CẢNH BÁO SINH TỬ DÀNH CHO QUẢN LÝ:** 
> Tuyệt đối **KHÔNG click đúp** để mở file 3.6 triệu dòng này bằng phần mềm Microsoft Excel thông thường trên máy tính cá nhân. File này được chia làm 4 Sheet khổng lồ, nếu cố tình mở lên, phần mềm Excel sẽ treo và đứng máy tính ngay lập tức. Cả phần mềm Postman cũng có thể bị đứng máy nếu bạn cố gắng Upload file quá nặng bằng giao diện. Thay vào đó, hãy dùng lệnh `curl` dưới đây.

### Kịch bản Test 1: Khả năng Lọc rác (Import File Vừa)
Thay vì dùng phần mềm Postman, hãy mở Terminal/PowerShell tại thư mục gốc và dội thẳng lệnh `curl` vào hệ thống:

**1. Đăng nhập lấy thẻ Token:**
```bash
curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```
*(Hãy copy đoạn mã `access_token` dài loằng ngoằng vừa hiện ra).*

**2. Bắn file Excel lên Server (Thay `<TOKEN>` bằng đoạn mã vừa copy):**
```bash
curl -s -X POST http://localhost:3000/data/import -H "Authorization: Bearer <TOKEN>" -F "file=@./Test_10K768_Rows.xlsx"
```
- **Kỳ vọng:** Lệnh `curl` sẽ trả về *"File đang xử lý ngầm"* ngay lập tức (Không bị treo Terminal). Mở một Terminal khác gõ `docker logs -f nestjs_api` để xem tiến trình. RAM Server không bao giờ vượt qua 60MB, bóc tách chính xác 5% dòng rác thành Sổ Nam Tào.

### Kịch bản Test 2: Sức mạnh Bạo lực (Import File Khổng lồ)
Tiếp tục dùng Token đó bắn thẳng file siêu nặng (114MB) vào hệ thống:
```bash
curl -s -X POST http://localhost:3000/data/import -H "Authorization: Bearer <TOKEN>" -F "file=@./Test_3M689_Rows.xlsx"
```
- **Kỳ vọng:** Quá trình upload qua LAN/Localhost mất vài giây. Sau đó Server chạy xuyên suốt nhiều giờ. Mìn nhịp tim tự động gia hạn để bảo vệ Server. 100% dòng sạch được Bulk Upsert, và RAM tuyệt đối không vượt ngưỡng báo động.

### Kịch bản Test 3: Ép xung Server (Export)
Khi Database đã ôm vài triệu dòng từ 2 bài test trên, gọi API xuất dữ liệu:
```bash
curl -X POST http://localhost:3000/data/export -H "Authorization: Bearer <TOKEN>" -o "Xuat_Du_Lieu.xlsx"
```
- **Kỳ vọng:** Quá trình Export sử dụng Cursor cuộn dần qua Database. File `Xuat_Du_Lieu.xlsx` sẽ dần dần phình to trên máy tính của bạn và tải về an toàn.

> **Tự tin bàn giao:** Hãy dùng bảng lệnh `curl` dũng mãnh này để demo cho Sếp, dự án đã hoàn toàn miễn nhiễm với rác dữ liệu và rủi ro sập phần mềm từ phía Client (Postman)!
