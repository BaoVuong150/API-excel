# ⏱️ ESTIMATE

> **Dự án:** Xây dựng Backend Hệ thống Quản lý Người dùng & Nhập/Xuất Dữ liệu
> 
> **Tech Stack:** Node.js v20 (NestJS v11), PostgreSQL v15, Redis v7, Docker Compose v3.8

---

## 📅 TỔNG QUAN TIẾN ĐỘ

| Ngày | Nội dung | Kết quả đầu ra |
| :---: | :--- | :--- |
| **Ngày 1** | Hạ tầng + Bảo mật | Hệ thống Docker chạy được, API Login hoạt động |
| **Ngày 2** | Tính năng lõi (Import/Export 10 triệu dòng) | Toàn bộ luồng Queue + Stream + Bulk Insert hoàn chỉnh |
| **Ngày 3** | Kiểm thử tải & Bàn giao | Hệ thống đã được stress test, sẵn sàng vận hành |

---

## 📊 CHI TIẾT TỪNG NGÀY

### 🔧 NGÀY 1 — Hạ tầng & Bảo mật (8h)

*Mục tiêu: Cuối ngày 1, chạy lệnh `docker-compose up` là lên toàn bộ môi trường. API `/login` trả về JWT thành công.*

| # | Hạng mục công việc | Thời gian |
| :---: | :--- | :---: |
| 1 | Viết `docker-compose.yml` (PostgreSQL + Redis + NestJS) | 1h |
| 2 | Khởi tạo cấu trúc Clean Architecture (Module, Controller, Service, Repository) | 1h |
| 3 | Cấu hình TypeORM, tạo Entity `User`, Seed 2 tài khoản mẫu | 1.5h |
| 4 | Viết thuật toán băm MD5 + Salt | 0.5h |
| 5 | Viết API `/login` cấp phát JWT (Passport + JwtStrategy) | 1.5h |
| 6 | Xây dựng AuthGuard & RolesGuard (`@Roles('admin')`) | 1h |
| 7 | Cấu hình Rate Limiting (`@nestjs/throttler`) | 0.5h |
| 8 | Bọc chuẩn Response (Interceptor) & Global Exception Filter | 1h |
| | **Tổng Ngày 1** | **8h** |

---

### ⚡ NGÀY 2 — Tính năng lõi Big Data (8h)

*Mục tiêu: Cuối ngày 2, Admin upload file Excel → hệ thống nhận, đẩy vào Queue, Worker đọc Stream và ghi Bulk Insert vào DB thành công.*

| # | Hạng mục công việc | Thời gian |
| :---: | :--- | :---: |
| 1 | Thiết lập BullMQ kết nối Redis (Producer + Worker) | 1.5h |
| 2 | Viết API Upload nhận file, validate Magic Bytes, đẩy Job vào Queue | 1.5h |
| 3 | Viết logic Worker: Stream đọc file Excel (`exceljs WorkbookReader`) | 1.5h |
| 4 | Tích hợp Bulk Insert + Upsert trong Database Transaction | 1.5h |
| 5 | Viết logic "Skip & Report" — gom lỗi từng dòng, trả báo cáo | 1h |
| 6 | Viết API Export Excel bằng Stream (`WorkbookWriter` → pipe HTTP) | 0.5h |
| 7 | Tích hợp AuthGuard + RolesGuard vào API Import/Export | 0.5h |
| | **Tổng Ngày 2** | **8h** |

---

### 🧪 NGÀY 3 — Kiểm thử tải & Bàn giao (8h)

*Mục tiêu: Cuối ngày 3, hệ thống đã được đập phá bằng dữ liệu thực tế 10 triệu dòng, mọi bug đã được xử lý, sẵn sàng bàn giao.*

| # | Hạng mục công việc | Thời gian | Ghi chú |
| :---: | :--- | :---: | :--- |
| 1 | Viết Script sinh Mock Data (file Excel 10 triệu dòng) | 1h | Tạo dữ liệu rác đủ các case: đúng, sai, trùng, thiếu cột |
| 2 | Chạy Import & theo dõi RAM/CPU trên Docker | 3h | Quan sát biểu đồ tài nguyên, phát hiện Memory Leak |
| 3 | Chạy Export & kiểm tra file đầu ra | 1h | Đảm bảo file Excel xuất ra đúng format, đủ dữ liệu |
| 4 | Test luồng bảo mật end-to-end (Login → Token → Import với role User → expect 403) | 1h | Đảm bảo AuthGuard & RolesGuard chặn đúng mọi trường hợp |
| 5 | Fix bug phát sinh từ quá trình test | 1h | Dự phòng cho các lỗi ngoại lệ khi chạy dữ liệu thực |
| 6 | Rà soát tổng thể & Bàn giao | 1h | Kiểm tra lại toàn bộ luồng end-to-end, đóng gói bàn giao |
| | **Tổng Ngày 3** | **8h** | |

---

## 📌 TỔNG KẾT

| Hạng mục | Thời gian |
| :--- | :---: |
| Lập trình (Coding) | 16h (2 ngày) |
| Kiểm thử tải & Bàn giao (Testing) | 8h (1 ngày) |
| **TỔNG CỘNG** | **24h (3 ngày làm việc)** |

---
*Bản dự toán được lập theo phương pháp AI-Assisted Development.*
