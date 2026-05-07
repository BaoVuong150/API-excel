# Sử dụng Node.js bản 20 (nhẹ, bảo mật)
FROM node:20-alpine

# Thư mục làm việc bên trong máy ảo
WORKDIR /usr/src/app

# Chỉ copy file danh sách thư viện vào trước để tận dụng cache
COPY package*.json ./

# Chạy lệnh cài đặt thư viện
RUN npm install

# Sau đó mới copy toàn bộ mã nguồn còn lại vào
COPY . .

# Thông báo máy ảo mở cổng 3000
EXPOSE 3000

# Lệnh khởi động dự án ở chế độ Dev (Sửa code web tự load lại)
CMD ["npm", "run", "start:dev"]
