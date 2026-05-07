const ExcelJS = require('exceljs');
const path = require('path');

// Excel có giới hạn vật lý là 1.048.576 dòng mỗi Sheet.
// Để tạo file 3.6 triệu dòng, ta phải chia nhỏ ra nhiều Sheet.
const MAX_ROWS_PER_SHEET = 1000000; 

async function generateFile(filename, totalRows) {
  const filePath = path.join(__dirname, filename);
  console.log(`\n⏳ Bắt đầu tạo file: ${filename} với ${totalRows.toLocaleString()} dòng...`);
  const startTime = Date.now();

  const options = {
    filename: filePath,
    useStyles: true,
  };
  
  // Dùng Stream Writer để nặn file khổng lồ mà không sợ nổ RAM
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);

  let remainingRows = totalRows;
  let sheetIndex = 1;
  let currentRowCount = 0;

  while (remainingRows > 0) {
    const rowsForThisSheet = Math.min(remainingRows, MAX_ROWS_PER_SHEET);
    const worksheet = workbook.addWorksheet(`Users_Part_${sheetIndex}`);
    
    // Khai báo Header chuẩn xác
    worksheet.columns = [
      { header: 'name', key: 'name' },
      { header: 'age', key: 'age' },
      { header: 'birthday', key: 'birthday' },
      { header: 'password', key: 'password' },
      { header: 'role', key: 'role' }
    ];

    for (let i = 1; i <= rowsForThisSheet; i++) {
      currentRowCount++;
      const row = {
        name: `BossTest_${sheetIndex}_${i}_${Math.random().toString(36).substring(7)}`,
        age: Math.floor(Math.random() * 50) + 18,
        birthday: '1995-05-05',
        password: 'password123',
        role: 'user'
      };

      // 🛑 CỐ TÌNH CHÈN LỖI (Xác suất 5% dòng bị lỗi rác)
      if (Math.random() < 0.05) {
        const errorType = Math.floor(Math.random() * 3);
        if (errorType === 0) row.name = ''; // Lỗi: Bỏ trống tên (Bat buoc)
        else if (errorType === 1) row.password = ''; // Lỗi: Bỏ trống mật khẩu
        else row.role = 'hacker_role'; // Lỗi: Nhập sai Role hệ thống
      }

      worksheet.addRow(row).commit();

      // Báo cáo tiến độ cho đỡ chán
      if (currentRowCount % 100000 === 0) {
        console.log(`  -> Đã ghi ${currentRowCount.toLocaleString()} dòng... (RAM: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB)`);
      }
    }
    
    worksheet.commit();
    remainingRows -= rowsForThisSheet;
    sheetIndex++;
  }

  await workbook.commit();
  console.log(`✅ Đã tạo xong [${filename}] trong ${((Date.now() - startTime) / 1000).toFixed(2)} giây.`);
}

async function main() {
  try {
    // 1. Tạo file 10,768 dòng
    await generateFile('Test_10K768_Rows.xlsx', 10768);
    
    // 2. Tạo file 3,689,000 dòng
    await generateFile('Test_3M689_Rows.xlsx', 3689000);
    
    console.log('\n🎉 HOÀN TẤT! Hãy gửi 2 file này cho Sếp test nhé!');
  } catch (error) {
    console.error('Lỗi thảm họa khi tạo file:', error);
  }
}

main();
