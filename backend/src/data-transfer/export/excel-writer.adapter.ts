import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as path from 'path';

@Injectable()
export class ExcelWriterAdapter {
  createWriter(fileName: string) {
    const filePath = path.join(process.cwd(), 'uploads', fileName);
    
    // Cấu hình WorkbookWriter để ghi file dạng luồng (Stream)
    const options = {
      filename: filePath,
      useStyles: false, // Bỏ qua style để xuất file tốc độ bàn thờ
      useSharedStrings: false, // 🛡️ Bắt buộc false để tối ưu RAM tuyệt đối cho 10 triệu dòng
    };
    
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter(options);
    return { workbook, filePath };
  }
}
