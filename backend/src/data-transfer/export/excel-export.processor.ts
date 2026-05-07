import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { UserQueryAdapter } from './user-query.adapter';
import { ExcelWriterAdapter } from './excel-writer.adapter';

@Processor('excel-export', { concurrency: 1 }) // 🛡️ Concurrency = 1: Tránh DDoS Hàng đợi và nghẽn ổ cứng
export class ExcelExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExcelExportProcessor.name);

  constructor(
    private readonly userQueryAdapter: UserQueryAdapter,
    private readonly excelWriterAdapter: ExcelWriterAdapter,
  ) {
    super();
  }

  async process(job: Job<{ fileName: string }, any, string>): Promise<any> {
    const { fileName } = job.data;
    this.logger.log(`\n==============================================`);
    this.logger.log(`[📦 XUẤT EXCEL] Bắt đầu xử lý Job ${job.id} -> File: ${fileName}`);

    const { workbook, filePath } = this.excelWriterAdapter.createWriter(fileName);
    
    let currentWorksheet = workbook.addWorksheet('Sheet 1');
    currentWorksheet.columns = [
      { header: 'Tên người dùng', key: 'name' },
      { header: 'Tuổi', key: 'age' },
      { header: 'Ngày sinh', key: 'birthday' },
      { header: 'Phân quyền', key: 'role' },
    ];

    let rowCount = 0;
    let sheetCount = 1;
    let dbStream: any;

    try {
      dbStream = await this.userQueryAdapter.createDataStream();

      for await (const chunk of dbStream) {
        // 🛡️ Đề phòng vỡ trang tính Excel (1 triệu dòng)
        if (rowCount > 0 && rowCount % 1000000 === 0) {
          currentWorksheet.commit(); // Chốt Sheet hiện tại
          sheetCount++;
          currentWorksheet = workbook.addWorksheet(`Sheet ${sheetCount}`);
          currentWorksheet.columns = [
             { header: 'Tên người dùng', key: 'name' },
             { header: 'Tuổi', key: 'age' },
             { header: 'Ngày sinh', key: 'birthday' },
             { header: 'Phân quyền', key: 'role' },
          ];
        }

        const row = currentWorksheet.addRow({
          name: chunk.user_name,
          age: chunk.user_age,
          birthday: chunk.user_birthday,
          role: chunk.user_role,
        });

        // 🛡️ Giải phóng bộ đệm để tránh OOM do lệch tốc độ DB và Ổ cứng
        row.commit();
        rowCount++;

        if (rowCount % 10000 === 0) {
          this.logger.log(`Đang xuất... đã ghi ${rowCount} dòng.`);
        }
      }

      // Hoàn tất ghi file
      currentWorksheet.commit();
      await workbook.commit();

      this.logger.log(`✅ [XUẤT EXCEL] Hoàn tất! Đã xuất ${rowCount} người dùng vào ${fileName}`);
      
      return { success: true, filePath, rowCount };
    } catch (error) {
      this.logger.error('❌ [XUẤT EXCEL] Gặp sự cố nổ hệ thống:', error);
      throw error;
    } finally {
      // 🛡️ Ngăn chặn rò rỉ kết nối Database (Connection Leak)
      if (dbStream && typeof dbStream.destroy === 'function') {
         dbStream.destroy();
         this.logger.log(`[🔌 XUẤT EXCEL] Đã ngắt kết nối an toàn khỏi PostgreSQL.`);
      }
      this.logger.log(`==============================================\n`);
    }
  }
}
