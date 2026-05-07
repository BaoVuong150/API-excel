# ✅ TODO LIST — Danh sách công việc chi tiết

## 🛠️ Tech Stack & Phiên bản

| Công nghệ        |    Phiên bản    | Ghi chú                                                              |
| :--------------- | :-------------: | :------------------------------------------------------------------- |
| Node.js          |  `v20.x` (LTS)  | Runtime                                                              |
| NestJS           |     `v11.x`     | Framework chính                                                      |
| TypeORM          |    `^0.3.x`     | **Cú pháp mới:** `findOne({ where: {} })` — không dùng `findOne(id)` |
| PostgreSQL       |     `v15.x`     | Database                                                             |
| Redis            |   `v7-alpine`   | Message Queue (BullMQ)                                               |
| Docker Engine    |     `v29.x`     | Container                                                            |
| ExcelJS          |    `^4.4.x`     | **Bắt buộc dùng Stream API** (`WorkbookReader` / `WorkbookWriter`)   |
| @nestjs/jwt      |    `^11.0.x`    | Cấp phát Token                                                       |
| @nestjs/passport |    `^11.0.x`    | Xác thực                                                             |
| Mã hóa mật khẩu  | `crypto` (Core) | **Bắt buộc dùng MD5** — không dùng bcrypt                            |

---

## 🔧 NGÀY 1 — Hạ tầng & Bảo mật

**Mục tiêu cuối ngày:** Chạy `docker-compose up` → Hệ thống lên. Gọi `POST /auth/login` → Nhận JWT Token.

---

### Epic 1: Docker Compose ✅ ĐÃ XONG

> **Mục tiêu:** Khởi chạy toàn bộ hạ tầng (PostgreSQL, Redis, NestJS) bằng một lệnh duy nhất.

- [X] Viết file `docker-compose.yml` (PostgreSQL + Redis + NestJS)
- [X] Chạy thử `docker compose up db redis -d`
- [X] Kiểm tra PostgreSQL: `pg_isready` → accepting connections
- [X] Kiểm tra Redis: `redis-cli ping` → PONG

---

### Epic 2: Khởi tạo Clean Architecture ✅ ĐÃ XONG

> **Mục tiêu:** Thiết lập khung xương thư mục chuẩn mực, chia tách các module độc lập.

- [X] Tạo thư mục `src/auth/` — gồm `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`
- [X] Tạo thư mục `src/users/` — gồm `users.module.ts`, `users.controller.ts`, `users.service.ts`
- [X] Tạo thư mục `src/users/entities/` — gồm `user.entity.ts`
- [X] Tạo thư mục `src/data-transfer/` — gồm `data-transfer.module.ts`, `data-transfer.controller.ts`, `data-transfer.service.ts`
- [X] Cập nhật `app.module.ts` → import 3 Module trên
- [X] Chạy `npm run start:dev` → Không lỗi, NestJS khởi động thành công

---

### Epic 3: Cấu hình TypeORM & Entity User ✅ ĐÃ XONG

> **Mục tiêu:** Xây dựng cầu nối tới Database và định nghĩa cấu trúc bảng User.

- [X] Cài thư viện: `@nestjs/typeorm`, `typeorm`, `pg`
- [X] Cấu hình `TypeOrmModule.forRoot()` trong `app.module.ts` (đọc biến môi trường từ Docker)
- [X] Viết Entity `User` gồm các cột: `id`, `name`, `age`, `birthday`, `password`, `salt`, `role`
- [X] Đăng ký Entity vào `TypeOrmModule.forFeature([User])` trong `UsersModule`
- [X] Chạy app → Kiểm tra trong PostgreSQL đã tự tạo bảng `users` chưa
- [X] Viết Seed Script tạo 2 tài khoản mẫu (1 Admin + 1 User)
- [X] Chạy Seed → Kiểm tra 2 tài khoản đã nằm trong DB

---

### Epic 4: Thuật toán băm MD5 + Salt ✅ ĐÃ XONG

> **Mục tiêu:** Xây dựng bộ công cụ mã hóa để bảo vệ mật khẩu người dùng.

- [X] Viết hàm `generateSalt()` — tạo chuỗi ngẫu nhiên
- [X] Viết hàm `hashPassword(password, salt)` — trả về `MD5(password + salt)`
- [X] Viết hàm `validatePassword(inputPassword, storedHash, storedSalt)` — so sánh Hash
- [X] Cập nhật Seed Script: mật khẩu 2 tài khoản mẫu phải được băm MD5 + Salt trước khi lưu DB

---

### Epic 5: API Login cấp phát JWT ✅ ĐÃ XONG

> **Mục tiêu:** Xác thực người dùng và cấp "Thẻ từ" (JWT Token) để họ đi lại trong hệ thống.

- [X] Cài thư viện: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`
- [X] Tạo file `auth/jwt.strategy.ts` — định nghĩa cách giải mã Token
- [X] Viết logic `AuthService.login()`: Tìm User → So sánh Hash → Cấp JWT
- [X] Cấu hình `JwtModule.register()` trong `AuthModule` (secret key, expiresIn)
- [X] Test bằng Postman: `POST /auth/login`
- [X] Test bằng Postman: `POST /auth/login` với password sai

---

### Epic 6: AuthGuard & RolesGuard ✅ ĐÃ XONG

> **Mục tiêu:** Xây dựng các trạm kiểm soát để quét thẻ JWT và phân quyền (Admin/User).

- [X] Tạo file `common/guards/jwt-auth.guard.ts`
- [X] Tạo file `common/guards/roles.guard.ts`
- [X] Tạo file `common/decorators/roles.decorator.ts` — decorator `@Roles('admin')`
- [X] Test: Gọi API có gắn Guard mà không gửi Token → expect 401 (Đã tối ưu mã lỗi)
- [X] Test: Gọi API có gắn Guard + Token role `user` → expect 403 (Đã xử lý Role admin)

---

### Epic 7: Rate Limiting (Tích hợp Redis) ✅ ĐÃ XONG

> **Mục tiêu:** Ngăn chặn hacker spam API (DDoS/Brute Force). Sử dụng bộ nhớ Redis làm trung tâm để đếm số lần gọi, đảm bảo tính chính xác tuyệt đối khi chạy nhiều Server cùng lúc.

- [X] Cài thư viện: `@nestjs/throttler` và `@nest-lab/throttler-storage-redis`
- [X] Cấu hình `ThrottlerModule` trong `app.module.ts` kết nối thẳng vào Redis.
- [X] Cấu hình Guard toàn cục hoặc gắn `@Throttle()` lên API `/auth/login` (giới hạn 5 lần/phút)
- [X] Test: Gọi `/login` liên tục 6 lần → Lần thứ 6 nhận lỗi 429 Too Many Requests

---

### Epic 8: Response Interceptor & Exception Filter ✅ ĐÃ XONG

> **Mục tiêu:** Quy chuẩn hóa định dạng dữ liệu trả về (JSON) và giấu các lỗi kỹ thuật nhạy cảm.

- [X] Tạo file `common/interceptors/response.interceptor.ts` — bọc output thành `{ statusCode, message, data }`
- [X] Tạo file `common/filters/http-exception.filter.ts` — che giấu lỗi nhạy cảm
- [X] Đăng ký Global trong `main.ts`
- [X] Test: Gọi API thành công → Response có đúng format `{ statusCode, message, data }`
- [X] Test: Gọi API lỗi → Response có đúng format `{ statusCode, message, error }`

---

---

## ⚡ NGÀY 2 — Tính năng lõi Big Data

**Mục tiêu cuối ngày:** Admin upload file Excel → Queue nhận → Worker đọc Stream → Bulk Insert vào DB thành công.

---

### Epic 1: Thiết lập BullMQ + Redis ✅ ĐÃ XONG

> **Mục tiêu:** Thiết lập hệ thống "Công nhân chạy ngầm" (Background Worker) dựa trên Redis Queue. Giúp Server không bị "đơ" khi phải xử lý các tác vụ cực nặng (như đọc file Excel hàng triệu dòng).

- [X] Cài thư viện: `@nestjs/bullmq`, `bullmq`
- [X] Cấu hình `BullModule.forRoot()` trong `app.module.ts` (kết nối Redis)
- [X] Tạo Queue tên `excel-import` trong `DataTransferModule`
- [X] Tạo file `data-transfer/excel-import.processor.ts` (Worker)
- [X] Test: Đẩy 1 Job giả vào Queue → Worker nhận và log ra console

---

### Epic 2: API Upload + Magic Bytes + Queue

> **Mục tiêu:** Xây dựng cổng nhận file từ người dùng. Cài đặt lớp khiên bảo mật "Magic Bytes" để chặn đứng file virus mạo danh Excel, sau đó ném file an toàn vào Queue cho Worker xử lý. Tối ưu hóa bảo mật (Edge Cases) chống đầy ổ cứng và dọn dẹp rác.

- [X] Viết API `POST /data/import` nhận file bằng `@UploadedFile()`
- [X] Viết `FileValidationPipe` — đọc 4 bytes đầu của Buffer kiểm tra Magic Bytes (xlsx = `50 4B 03 04`)
- [X] Kiểm tra dung lượng file ≤ 500MB
- [X] Sau khi validate xong → Lưu file tạm + Đẩy Job vào Queue
- [X] Trả về HTTP 200: `{ message: "File đang được xử lý ngầm" }`
- [X] Test: Upload file `.txt` đổi đuôi thành `.xlsx` → expect bị chặn
- [X] Cấu hình giới hạn cứng (`limits: { fileSize: 500 * 1024 * 1024 }`) ngay trong lõi `FileInterceptor` để cắt đứt mạng sớm, chống đầy ổ cứng.
- [X] Bọc khối lệnh `try...finally` trong `FileValidationPipe` để đảm bảo file lỗi (0 byte, hỏng) luôn bị dọn sạch.
- [X] Cài đặt lệnh quét rác `fs.unlinkSync()` vào cuối Worker (Epic 3) để xóa file Excel sau khi nạp xong.

---

### Epic 3: Worker Stream đọc file Excel ✅ ĐÃ XONG

> **Mục tiêu:** Công nhân bắt đầu làm việc. Đọc file Excel khổng lồ bằng kỹ thuật "nước chảy" (Stream) từng dòng một, tuyệt đối không nạp toàn bộ file lên RAM để phòng tránh sập máy chủ (OOM).

- [X] Import `exceljs` và sử dụng `stream.xlsx.WorkbookReader`
- [X] Đọc file theo Stream (không load toàn bộ lên RAM)
- [X] Mỗi khi đọc đủ 1.000 dòng → gom thành 1 batch
- [X] Đẩy batch xuống hàm Bulk Insert (Epic 4)
- [X] Test: Đọc file 10.000 dòng → Kiểm tra RAM không tăng đột biến

---

### Epic 4: Bulk Insert + Upsert ✅ ĐÃ XONG

> **Mục tiêu:** Tối ưu hóa tốc độ ghi xuống Database. Thay vì ghi lắt nhắt từng dòng (rất chậm), ta gom thành từng Batch 1.000 dòng để xả xuống DB 1 lần. Kèm thuật toán xử lý dữ liệu trùng lặp (Upsert).

- [X] Viết hàm `bulkUpsert(batch)` dùng `Repository.upsert()`
- [X] Bọc trong `DataSource.transaction()` để đảm bảo nguyên tử (1 câu lệnh Upsert đã bao gồm nguyên tử)
- [X] Định nghĩa conflict key là cột `name` (trùng name → update, không trùng → insert)
- [X] Test: Import cùng 1 file 2 lần → Dữ liệu không bị nhân đôi

---

### Epic 5: Skip & Report ✅ ĐÃ XONG

> **Mục tiêu:** Đảm bảo hệ thống không bị "chết chùm" (Fail-fast) khi gặp 1 dòng lỗi. Dòng nào rác thì vứt ra và ghi chép lại lý do, dòng nào đúng thì vẫn lưu bình thường để tối đa hóa lượng dữ liệu thu được. Kèm cơ chế tự động dọn rác.

- [X] Validate từng dòng Excel trước khi đưa vào batch (kiểm tra kiểu dữ liệu, thiếu cột)
- [X] Dòng lỗi → Bỏ qua, ghi vào mảng `errors[]` kèm số dòng và lý do
- [X] Khi xong toàn bộ file → Lưu báo cáo lỗi ra định dạng `.json`
- [X] Viết API `GET /data/reports/:filename` để Admin tải Sổ Nam Tào
- [X] Chế tạo Robot Lao Công (Cron Job) tự động xóa file báo cáo cũ hơn 24h
- [X] Trả kết quả cho Admin: Tổng dòng xử lý, số dòng thành công, số dòng lỗi

---

### Epic 6: Kết xuất dữ liệu (Export) qua Hàng Đợi (Queue) ✅ ĐÃ XONG

> **Mục tiêu:** Kết xuất hàng triệu dòng dữ liệu từ DB ra file Excel. Để chống đứt mạng (HTTP Timeout), ta đưa luồng xuất file vào Background Worker. Server tự tạo file trên ổ cứng rồi cấp Link cho Admin tải về.

- [X] Viết API `POST /data/export` để kích hoạt yêu cầu. API trả về ngay `jobId` và thông báo "Đang xử lý ngầm".
- [X] Tạo Queue tên `excel-export` và cấu hình **Concurrency = 1** (Chống DDoS Hàng đợi).
- [X] Trong Worker, sử dụng `stream.xlsx.WorkbookWriter` để tạo file Excel vật lý trong thư mục `/uploads`.
- [X] Query dữ liệu từ DB theo batch (bằng `createQueryBuilder().stream()`) để nhổ từng lô ghi vào file (Né bẫy tràn RAM DB).
- [X] Tích hợp bộ đếm dòng: Cứ đạt 1.000.000 dòng thì tự động tạo Sheet mới (Né bẫy vỡ trang tính Excel).
- [X] Gọi lệnh `.commit()` sau mỗi dòng để giải phóng bộ đệm (Né bẫy nghẹn ổ cứng - Backpressure).
- [X] Bọc toàn bộ trong `try...finally` để đảm bảo lệnh `stream.destroy()` luôn chạy (Né bẫy rò rỉ kết nối DB).
- [X] Nâng cấp Robot Lao Công (CleanupCron) để dọn dẹp luôn các file Excel `.xlsx` cũ hơn 24h.
- [X] Test: Request Export → Nhận file thành công, Server RAM vẫn ở mức siêu thấp.

---

### Epic 7: Gắn Guard vào Import/Export ✅ ĐÃ XONG

> **Mục tiêu:** Đóng chốt bảo vệ cuối cùng. Đảm bảo chỉ có Giám đốc (Role: admin) mới có quyền Tải lên và Tải xuống cái kho dữ liệu xương sống này.

- [X] Gắn `@UseGuards(JwtAuthGuard, RolesGuard)` lên toàn bộ `DataTransferController`
- [X] Gắn `@Roles('admin')` để khóa chặt mọi cánh cửa Import, Export, Tải file.
- [X] Test: Gọi Import bằng Token role `user` → expect 403
- [X] Test: Gọi Import bằng Token role `admin` → expect thành công

---

---

## 🧪 NGÀY 3 — Kiểm thử tải & Bàn giao

**Mục tiêu cuối ngày:** Hệ thống đã vượt qua stress test 10 triệu dòng, mọi bug đã được fix, sẵn sàng bàn giao.

---

### Epic 1: Sinh Mock Data ✅ ĐÃ XONG

- [X] Viết script Node.js tạo file Excel 10 triệu dòng
- [X] Dữ liệu gồm đủ case: dòng đúng, dòng sai format, dòng trùng name, dòng thiếu cột
- [X] Chạy script → File Excel được tạo thành công (kiểm tra dung lượng file)

---

### Epic 2: Stress Test Import ✅ ĐÃ XONG

- [X] Bật `docker stats` để theo dõi RAM và CPU.
- [X] Bắn file `mock_10m_users.xlsx` vào API Import.
- [X] Quan sát: RAM không được vượt quá giới hạn cấp phép, hệ thống không bị crash (OOM).
- [X] Đợi Queue xử lý xong, check DB `SELECT count(*) FROM users`.
- [X] Check file `error_report_...json` xem có tóm được các dòng rác (sai ngày sinh, thiếu cột...) không.?
- [X] Kiểm tra báo cáo lỗi: Các dòng sai có được liệt kê đầy đủ không?

---

### Epic 3: Test Export

- [ ] Gọi API Export sau khi DB đã có 10 triệu dòng
- [ ] Kiểm tra: File tải về có bị timeout không?
- [ ] Kiểm tra: Mở file Excel → Dữ liệu có đúng format, đủ cột không?

---

### Epic 4: Test luồng Bảo mật end-to-end

- [ ] Kịch bản 1: Không gửi Token → Gọi Import → expect 401
- [ ] Kịch bản 2: Login bằng tài khoản User thường → Lấy Token → Gọi Import → expect 403
- [ ] Kịch bản 3: Login bằng tài khoản Admin → Lấy Token → Gọi Import → expect thành công
- [ ] Kịch bản 4: Gọi Login liên tục 6 lần → Lần thứ 6 expect 429 (Rate Limit)
- [ ] Kịch bản 5: Upload file `.exe` đổi đuôi `.xlsx` → expect bị chặn bởi Magic Bytes

---

### Epic 5: Fix Bug

- [ ] Tổng hợp danh sách bug phát sinh từ Epic 2, 3, 4
- [ ] Fix từng bug, chạy lại test case tương ứng
- [ ] Đảm bảo không regression (fix bug này không gây bug khác)

---

### Epic 6: Rà soát & Bàn giao

- [ ] Chạy lại toàn bộ luồng end-to-end 1 lần cuối: Login → Import → Export
- [ ] Kiểm tra Docker: Tắt tất cả container → Chạy `docker compose up -d` → Hệ thống tự lên lại bình thường
- [ ] Dọn dẹp code: Xoá console.log thừa, comment TODO còn sót
- [ ] Đóng gói bàn giao

---

*Tick ✅ từng checkbox khi hoàn thành. File này là bản đồ chi tiết để code — không phải Estimate.*
