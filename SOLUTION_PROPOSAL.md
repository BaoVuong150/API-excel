# 🚀 TÀI LIỆU ĐỀ XUẤT GIẢI PHÁP KỸ THUẬT (TECHNICAL PROPOSAL)

> **Dự án:** Xây dựng Backend Hệ thống Quản lý Người dùng & Nhập/Xuất Dữ liệu
> 
> **Ngôn ngữ/Framework:** Node.js (NestJS), PostgreSQL, Redis
> 
> **Môi trường triển khai:** Docker

---

## 🎯 1. MỤC TIÊU DỰ ÁN (REQUIREMENTS)

Hệ thống cần đáp ứng **5 yêu cầu cốt lõi**:

1. 🗄️ Xây dựng CSDL PostgreSQL với bảng `User` (name, age, birthday, password, role).

2. ⚡ Xử lý tải lên/tải xuống (Import/Export) dữ liệu Excel khổng lồ (lên tới 10 triệu dòng+) không bị Timeout.

3. 🐳 Đóng gói toàn bộ hệ thống bằng Docker Compose để triển khai tự động.

4. 🔑 Xây dựng cơ chế Đăng nhập cấp phát Token (JWT).

5. 🛡️ Phân quyền truy cập (RBAC): Chỉ Admin được phép Import/Export.

---

## 🏗️ 2. GIẢI PHÁP KIẾN TRÚC TỔNG THỂ

### 🧱 2.1. Mô hình Kiến trúc Phần mềm

Dự án được thiết kế theo mô hình **Modular Monolith** kết hợp triết lý **Clean Architecture**:

*   **Modular Monolith:** 
    Ứng dụng chạy trên một server duy nhất (tối ưu chi phí và dễ vận hành), nhưng mã nguồn được chia cắt rạch ròi thành các Domain độc lập (`AuthModule`, `UserModule`, `DataTransferModule`). Sẵn sàng "chẻ" ra thành Microservices bất cứ lúc nào.

*   **Clean Architecture & SOLID:** 
    Phân tách nghiêm ngặt mã nguồn thành các lớp:
    *   *Lớp Giao tiếp (Controllers):* Chỉ nhận/trả HTTP Request.
    *   *Lớp Lõi Nghiệp vụ (Services):* Chứa logic tính toán, xử lý Stream Excel.
    *   *Lớp Hạ tầng (Repositories):* Kết nối DB, đọc/ghi file. 
    
    > Lớp giao tiếp và nghiệp vụ gọi nhau thông qua **Dependency Injection**, đảm bảo thay thế công nghệ cực kỳ dễ dàng.

### 🗃️ 2.2. Quản trị Dữ liệu (Database Layer)

*   **Công cụ:** 
    Sử dụng **TypeORM** để tự động đồng bộ hóa cấu trúc bảng, an toàn và dễ bảo trì.

*   **Bảo mật mật khẩu:** 
    Tuân thủ yêu cầu mã hóa **MD5** thông qua thư viện `crypto`. Bổ sung cơ chế **Salting** bằng công thức `MD5(Password + Salt)` để chống Brute-force và Rainbow Tables.
    
    > 💡 **Đề xuất mở rộng:** Tuy MD5 + Salt đã an toàn, nhưng tốc độ băm của MD5 vẫn rất nhanh. Nếu không bị ràng buộc bởi dữ liệu hệ thống cũ, đề xuất mạnh dạn chuyển sang dùng **`Bcrypt`** (Industry Standard) để miễn nhiễm hoàn toàn với các cuộc tấn công GPU.

### 📊 2.3. Xử lý Dữ liệu Lớn - Import/Export Excel (10 Triệu Dòng)

Để giải quyết triệt để rủi ro "Timeout" trình duyệt và "Tràn RAM" (OOM) khi xử lý tập dữ liệu khổng lồ lên tới 10 triệu dòng, dự án sử dụng sự kết hợp song song giữa kiến trúc **Message Queue (Redis)** và kỹ thuật **Data Streaming + Bulk Insert**:

*   **Kiến trúc Message Queue (BullMQ + Redis):** 
    Ngay khi Admin bấm Upload, Backend lập tức ném công việc vào Hàng đợi (Queue) và trả về HTTP 200 báo hiệu "Đang xử lý ngầm". Điều này giúp giải phóng hoàn toàn trình duyệt của Admin, triệt tiêu 100% rủi ro Nginx/Browser Timeout.

*   **Kỹ thuật Import dưới nền (Background Worker):** 
    Worker dưới nền lôi công việc ra làm. Sử dụng luồng đọc **Stream** (`exceljs` WorkbookReader) để không tải toàn bộ 10 triệu dòng lên RAM. Dữ liệu được đọc theo khối (vd: 1.000 dòng/lần) và đẩy thẳng vào Database bằng **Bulk Insert** (chèn hàng loạt qua 1 câu lệnh duy nhất).
    
    > ℹ️ *Ghi chú kiến trúc:* Sự kết hợp giữa Message Queue (cứu Timeout giao diện) và Bulk Insert + Stream (cứu RAM và Database) tạo thành một mô hình bất bại cho mọi bài toán Big Data.

*   **Validation Strategy:** 
    Cơ chế **"Skip & Report" (Bỏ qua & Báo cáo)**. Các dòng lỗi sẽ bị bỏ qua, hệ thống tạo ra một file Danh sách báo cáo lỗi chi tiết (vd: *"Dòng 42: Cột Ngày sinh sai định dạng"*) gửi lại cho Admin để tự sửa.

### 🔐 2.4. Cơ chế Bảo mật & Phân quyền

Áp dụng bảo mật 2 lớp chuẩn RESTful API:

*   **Lớp 1 (Authentication):** 
    Tại API `/login`, hệ thống cấp phát **JWT**. Token được thiết lập **thời hạn sử dụng ngắn (Expiration)** nhằm vô hiệu hóa ngay lập tức các Token bị lộ.

*   **Lớp 2 (Authorization):** 
    Sử dụng `RolesGuard`. API Import/Export được gắn cờ `@Roles('admin')` để chặn đứng lỗi 403 ngay từ vòng ngoài nếu User không mang quyền Admin.

### 🐳 2.5. Đóng gói & Triển khai

*   Sử dụng **Docker Compose** gồm 3 dịch vụ độc lập: **PostgreSQL DB**, **Redis (Message Queue)** và **NestJS API**.
*   Đảm bảo tính nhất quán của môi trường. Chỉ cần chạy duy nhất lệnh `docker-compose up -d` để khởi động toàn bộ hạ tầng.

### 🔌 2.6. Chuẩn hóa Giao tiếp API

*   **Response Formatting:** 
    Sử dụng **Interceptor** bọc kết quả API thành cấu trúc chuẩn: `{ statusCode, message, data }`.

*   **Global Exception Handling:** 
    Cài đặt **Global Exception Filter** tóm lấy mọi lỗi phát sinh, che giấu thông tin nhạy cảm của Server và trả về chuẩn lỗi chung cho Frontend.

### 🛡️ 2.7. Xử lý Ngoại lệ (Edge Cases & Resilience)

Để hệ thống đạt chuẩn Enterprise, sẵn sàng vận hành thực tế mà không sập hay sai lệch dữ liệu:

*   **Idempotency (Chống nhân đôi):** 
    Áp dụng **Upsert** khi Import. Tránh User vô tình Import 2 lần gây trùng lặp.

*   **Data Integrity (Toàn vẹn dữ liệu):** 
    Dùng **Database Transaction** kết hợp Upsert để đảm bảo thao tác Import là nguyên tử — thành công toàn bộ hoặc rollback hoàn toàn.

*   **Rate Limiting (Chống DoS):** 
    Sử dụng `@nestjs/throttler`. Chặn IP gọi API `/login` quá 5 lần/phút, hoặc gọi `/export` liên tục.

*   **Magic Bytes Check (Bảo mật Upload):** 
    Cài đặt **File Validation Pipe** đọc Buffer kiểm tra chữ ký tập tin. Tuyệt đối không chỉ tin tưởng đuôi `.xlsx` do dễ bị làm giả từ file virus. Giới hạn dung lượng Max 500MB (do file 10 triệu dòng rất lớn).
    
    > 💡 **Đề xuất mở rộng:** Cơ chế **Refresh Token** tự động xin cấp mới Token ngầm giúp Admin không bị văng ra ngoài khi đang làm việc. Khuyến nghị đưa vào Giai đoạn 2.

---

## 📅 3. LỘ TRÌNH TRIỂN KHAI (MILESTONES)

| Giai đoạn | Mục tiêu | Tính năng trọng tâm |
| :--- | :--- | :--- |
| **Giai đoạn 1** | Nền tảng & Hạ tầng | `docker-compose.yml` (Postgres + Redis), kết nối TypeORM, cài đặt BullMQ. |
| **Giai đoạn 2** | Bảo mật | Hoàn thiện API Login (MD5 + JWT), xây dựng AuthGuard, RolesGuard. |
| **Giai đoạn 3** | Tính năng cốt lõi | Logic tích hợp BullMQ + Stream Excel + Bulk Insert. Tích hợp bảo mật & Load testing. |

---
*Báo cáo được lập để phục vụ cho việc đánh giá và xét duyệt giải pháp kỹ thuật trước khi bước vào giai đoạn lập trình.*
