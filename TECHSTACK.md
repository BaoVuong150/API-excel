# KHO CÔNG NGHỆ (TECH STACK) VÀ PHIÊN BẢN CHUẨN

Tài liệu này quy định **chính xác phiên bản (version)** và tài liệu tham khảo (documentation) cho toàn bộ các công nghệ được sử dụng trong dự án. 
**LƯU Ý DÀNH CHO CÁC TRỢ LÝ AI:** Vui lòng chỉ sử dụng cú pháp và thư viện tương thích với các phiên bản được liệt kê dưới đây, tuyệt đối không sử dụng code của các phiên bản cũ (ví dụ như NestJS v8 hay TypeORM v0.2).

## 1. Môi trường & Hạ tầng (Runtime & Infrastructure)
*   **Node.js**: `v20.x` (LTS)
    *   **Tài liệu:** [Node.js v20 Docs](https://nodejs.org/docs/latest-v20.x/api/)
    *   **Ứng dụng:** Chạy môi trường Backend. Sử dụng các API Stream mới nhất của Node 20.
*   **Docker Engine**: `v29.x` (Kèm Docker Compose)
    *   **Tài liệu:** [Docker Compose Docs](https://docs.docker.com/compose/)
*   **PostgreSQL**: `v15.x`
    *   **Tài liệu:** [PostgreSQL 15 Docs](https://www.postgresql.org/docs/15/index.html)

## 2. Framework Lõi (Core Framework)
*   **NestJS**: `v11.x`
    *   **Tài liệu:** [NestJS Official Documentation](https://docs.nestjs.com/)
    *   **Lưu ý AI:** Toàn bộ dự án phải tuân thủ cấu trúc của NestJS v11.

## 3. Tương tác Cơ sở dữ liệu (Database ORM)
*   **TypeORM**: `^0.3.x`
    *   **Tài liệu:** [TypeORM 0.3 Docs](https://typeorm.io/)
    *   **Lưu ý CỰC KỲ QUAN TRỌNG cho AI:** Từ bản `0.3.x`, TypeORM đã **thay đổi hoàn toàn** cú pháp truy vấn. Tuyệt đối KHÔNG dùng `findOne(id)`, KHÔNG dùng `findByIds`. Phải dùng cú pháp mới: `findOne({ where: { id: ... } })` hoặc `Repository API`. Không dùng Custom Repository theo cú pháp cũ (`@EntityRepository` đã bị deprecated).
*   **@nestjs/typeorm**: `^11.x.x` (Tương thích với NestJS 11)

## 4. Bảo mật & Xác thực (Security & Auth)
*   **Xác thực JWT & Passport**: 
    *   `@nestjs/jwt`: `^11.0.x`
    *   `@nestjs/passport`: `^11.0.x`
    *   `passport-jwt` (`^4.0.x`) & `passport-local` (`^1.0.x`)
    *   **Tài liệu:** [NestJS Authentication Guide](https://docs.nestjs.com/security/authentication)
*   **Mã hóa mật khẩu**: `crypto` (Thư viện Core tích hợp sẵn của Node.js)
    *   **Tài liệu:** [Node.js Crypto MD5](https://nodejs.org/docs/latest-v20.x/api/crypto.html#cryptocreatehashalgorithm-options)
    *   **Lưu ý BẮT BUỘC cho AI:** Phải sử dụng giải thuật `MD5` để băm mật khẩu theo đúng Requirement cứng của dự án. Tuyệt đối không tự ý cài đặt hay sử dụng `bcrypt` hoặc các thư viện mã hóa khác.

## 5. Xử lý Excel Dữ liệu lớn (Big Data Excel Processing)
*   **ExcelJS**: `^4.4.x`
    *   **Tài liệu:** [ExcelJS GitHub Official](https://github.com/exceljs/exceljs)
    *   **Lưu ý đặc biệt cho AI:** Bài toán yêu cầu Import/Export hàng trăm nghìn dòng. Tuyệt đối KHÔNG dùng hàm `workbook.xlsx.readFile()` hoặc `writeFile()`. **Bắt buộc** phải sử dụng API luồng: `stream.xlsx.WorkbookWriter` (để xuất file) và `stream.xlsx.WorkbookReader` (để nhập file) để chống tràn RAM.
