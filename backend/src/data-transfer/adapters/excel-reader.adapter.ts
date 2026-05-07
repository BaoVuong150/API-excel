import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExcelReaderAdapter {
  /**
   * Khởi tạo ống hút Stream của thư viện ExcelJS
   * Trả về WorkbookReader (Async Iterator)
   */
  createStream(filePath: string) {
    const options = {
      sharedStrings: 'cache',
      worksheets: 'emit',
    };

    return new ExcelJS.stream.xlsx.WorkbookReader(filePath, options as any);
  }
}
