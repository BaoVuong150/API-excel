# 📋 TODO: TÍNH NĂNG SMART HASH DEDUPLICATION (BỘ LỌC CHỐNG GHI ĐÈ)

File này theo dõi tiến độ nâng cấp thuật toán "Phễu Lọc Mã Băm" dựa trên bản thiết kế đã thống nhất. Tính năng này giúp loại bỏ hoàn toàn các dòng dữ liệu trùng lặp không thay đổi trước khi đẩy xuống Database.

## 🗄️ 1. Nâng Cấp Database Schema
- [ ] Mở file `backend/src/users/entities/user.entity.ts`.
- [ ] Khai báo cột mới: `@Column({ type: 'varchar', length: 32, nullable: true })`.
- [ ] Đặt tên biến là `dataHash: string`.

## ⚙️ 2. Xây Dựng Máy Băm (Hash Generator)
- [ ] Mở file `backend/src/users/users.service.ts`.
- [ ] Import thư viện `* as crypto from 'crypto'`.
- [ ] Viết một hàm `private generateDataHash(user: User): string`.
- [ ] Hàm này cần trích xuất `age`, `birthday`, `role` nối lại thành chuỗi.
- [ ] Dùng `crypto.createHash('md5')` băm chuỗi đó ra định dạng `hex` (32 ký tự).

## 📥 3. Kỹ Thuật "Mẻ Lưới" (Batch Fetching)
- [ ] Trong hàm `bulkUpsert`, trích xuất mảng chứa các `name` (Username) từ danh sách User truyền vào.
- [ ] Gọi TypeORM `this.usersRepository.find(...)` kết hợp với lệnh `In(names)` để truy vấn nhanh.
- [ ] Chỉ `SELECT` 2 cột là `name` và `dataHash` để tiết kiệm RAM.
- [ ] Chuyển mảng kết quả lấy được từ DB sang một `Map<string, string>` để có tốc độ tra cứu tức thời O(1).

## 🌪️ 4. Xây Dựng Phễu Lọc (Smart Filter)
- [ ] Tạo một mảng rỗng `filteredUsers = []`.
- [ ] Dùng vòng lặp duyệt qua từng User do luồng Stream gửi tới.
- [ ] So sánh `newHash` (vừa băm) với `oldHash` (lấy từ Map của DB).
- [ ] **Drop (Đá ra):** Nếu `newHash === oldHash` -> Bỏ qua dòng này (Continue).
- [ ] **Keep (Giữ lại):** Nếu lệch Hash (do cập nhật) hoặc không có Hash (User mới) -> Cập nhật `user.dataHash = newHash` và đẩy vào mảng `filteredUsers`.

## 💾 5. Chốt Hạ (Execute)
- [ ] Thêm cờ chặn: Nếu mảng `filteredUsers.length === 0` (Trùng lặp 100%), lập tức `return` thoát hàm, không cần gọi Database.
- [ ] Cuối cùng, thay thế mảng User ban đầu bằng mảng `filteredUsers` và ném vào hàm `this.usersRepository.upsert`.

---
*Hoàn thành các Checkbox trên là hệ thống sẽ trở nên bất tử trước các pha Import trùng lặp hàng chục triệu dòng!*
