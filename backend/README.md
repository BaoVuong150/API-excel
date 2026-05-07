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
> Tuyệt đối **KHÔNG click đúp** để mở file 3.6 triệu dòng này bằng phần mềm Microsoft Excel thông thường trên máy tính cá nhân. File này được chia làm 4 Sheet khổng lồ, nếu cố tình mở lên, phần mềm Excel sẽ treo và đứng máy tính ngay lập tức. 
> **Cách Test đúng:** Chỉ cần chọn file này trong Postman và bấm Upload thẳng lên hệ thống API của chúng ta!

### Kịch bản Test 1: Khả năng Lọc rác (Import File Vừa)
- Dùng tài khoản `admin` đăng nhập và lấy Token.
- Dùng Postman gọi API `POST /data/import` tải lên file `Test_10K768_Rows.xlsx`.
- **Kỳ vọng:** API lập tức trả lời *"File đang xử lý ngầm"*. Xem Log của Docker sẽ thấy RAM Server không bao giờ vượt qua mức 60MB. Hệ thống sẽ bóc tách chính xác 5% dòng rác, lưu lại báo cáo lỗi mà vẫn cho phép hơn 10 ngàn dòng hợp lệ nạp thành công vào Database.

### Kịch bản Test 2: Sức mạnh Bạo lực (Import File Khổng lồ)
- Tiếp tục tải lên file siêu nặng `Test_3M689_Rows.xlsx` (Gần 4 triệu dòng).
- **Kỳ vọng:** Quá trình xử lý chạy xuyên suốt. Mìn nhịp tim (Watchdog) tự động gia hạn thời gian để chống sập Server. Toàn bộ 100% dòng dữ liệu sạch được Bulk Upsert, và rác bị nhặt ra ném vào file báo cáo. Cả quá trình RAM không được phép vượt ngưỡng báo động.

### Kịch bản Test 3: Ép xung Server (Export)
- Khi Database đã ôm vài triệu dòng từ 2 bài test trên, gọi API `POST /data/export`.
- **Kỳ vọng:** Quá trình Export sử dụng Cursor để cuộn dần qua Database thay vì kéo hết 1 cục lên RAM. File Excel được tạo ra từ từ và trả về an toàn.
