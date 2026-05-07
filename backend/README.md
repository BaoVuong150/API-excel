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
