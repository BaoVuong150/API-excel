import * as fs from 'fs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportWriterAdapter {
  /**
   * Xuất báo cáo lỗi ra file JSON
   */
  writeErrorReport(reportPath: string, totalRows: number, totalErrors: number, errorReport: string[]) {
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          totalRows,
          totalErrors,
          errors: errorReport,
        },
        null,
        2,
      ),
    );
  }

  /**
   * Xóa file rác sau khi xử lý xong
   */
  deleteFile(filePath: string) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[🧹 SERVICE] Đã quét sạch rác: Xóa file ${filePath}`);
    }
  }
}
