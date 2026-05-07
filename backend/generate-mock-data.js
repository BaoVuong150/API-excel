const ExcelJS = require('exceljs');
const path = require('path');

async function generateMockExcel(totalRows = 10000000) {
  const filePath = path.join(__dirname, 'mock_10m_users.xlsx');
  console.log(`\n======================================================`);
  console.log(`🚀 BẮT ĐẦU ĐÚC FILE EXCEL ${totalRows.toLocaleString()} DÒNG`);
  console.log(`======================================================\n`);
  
  // Tắt toàn bộ style để tối ưu RAM và tốc độ (Streaming mode)
  const options = {
    filename: filePath,
    useStyles: false,
    useSharedStrings: false,
  };
  
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
  
  let currentWorksheet;
  let sheetCount = 0;
  
  for (let i = 1; i <= totalRows; i++) {
    // 🛡️ Bẫy Excel: 1 Sheet chỉ chứa tối đa 1.048.576 dòng
    // Cứ 1 triệu dòng ta cắt sang Sheet mới cho an toàn
    if ((i - 1) % 1000000 === 0) {
      if (currentWorksheet) {
        currentWorksheet.commit();
      }
      sheetCount++;
      currentWorksheet = workbook.addWorksheet(`Tap_Khach_Hang_${sheetCount}`);
      // Dòng đầu tiên là Header (Chuẩn fomart hệ thống yêu cầu)
      currentWorksheet.columns = [
        { header: 'name', key: 'name' },
        { header: 'password', key: 'password' },
        { header: 'age', key: 'age' },
        { header: 'birthday', key: 'birthday' },
        { header: 'role', key: 'role' },
      ];
      console.log(`📝 Đã tạo Sheet mới: Tap_Khach_Hang_${sheetCount}`);
    }

    // Gài bẫy đa dạng để Test bộ Lọc (Row Validator)
    let rowData;
    // 🕵️‍♂️ SỬA LỖI LOGIC GÀI BẪY: Dùng số nguyên tố lởm chởm để không bẫy nào dẫm lên bẫy nào!
    if (i % 100003 === 0) {
      // 💣 Bẫy 1 (Xuất hiện 99 lần): Thiếu cột bắt buộc (Không có name) -> Bị Máy chém vứt đi
      rowData = { password: 'pass', age: 25, birthday: '1995-01-01', role: 'user' };
    } else if (i % 150007 === 0) {
      // 💣 Bẫy 2 (Xuất hiện 66 lần): Sai định dạng dữ liệu (Tuổi là chữ) -> Bị Máy chém vứt đi
      rowData = { name: `User_${i}`, password: 'p', age: 'Hai muoi', birthday: '1995-01-01', role: 'user' };
    } else if (i % 200000 === 0) {
      // 💣 Bẫy 3 (Xuất hiện 50 lần): Trùng lặp Name -> Sẽ được Upsert ghi đè cực xịn, không báo lỗi
      rowData = { name: `Duplicate_Vip_User`, password: 'p', age: 30, birthday: '1990-01-01', role: 'admin' };
    } else {
      // Dữ liệu bình thường
      rowData = {
        name: `User_Fake_${i}`,
        password: `password_${i}`,
        age: Math.floor(Math.random() * 50) + 18,
        birthday: '2000-01-01',
        role: i % 100 === 0 ? 'admin' : 'user'
      };
    }

    const row = currentWorksheet.addRow(rowData);
    
    // Ép nhả RAM lập tức, chống tràn bộ nhớ (Backpressure)
    row.commit();

    if (i % 1000000 === 0) {
      console.log(`✅ Đã đúc thành công: ${i.toLocaleString()} dòng...`);
    }
  }

  // Đóng gói file
  currentWorksheet.commit();
  await workbook.commit();
  console.log(`\n🎉 [HOÀN TẤT] File khủng đã được lưu tại: ${filePath}`);
}

// Gọi hàm chạy luôn
generateMockExcel();
