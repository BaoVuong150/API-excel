import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DataTransferService } from '../data-transfer.service';

export interface ExcelImportJobData {
  filePath: string;
}

@Processor('excel-import', {
  concurrency: 1, // Chỉ cho phép 1 thằng chạy 1 lúc để bảo vệ RAM
  lockDuration: 600000, // Gia hạn thì giờ báo cáo lên 10 phút (600,000 ms)
  maxStalledCount: 0 // Tắt luôn tính năng "Phái Công nhân mới đi làm lại"
})
export class ExcelImportProcessor extends WorkerHost {
  constructor(private readonly dataTransferService: DataTransferService) {
    super();
  }

  async process(job: Job<ExcelImportJobData, any, string>): Promise<any> {
    const { filePath } = job.data;
    
    console.log(`\n==============================================`);
    console.log(`[👷 CÔNG NHÂN] Nhận được Job ID: ${job.id}`);
    console.log(`[👷 CÔNG NHÂN] Bàn giao file cho Service xử lý:`, job.data);
    
    try {
      // Nhường toàn bộ quyền sinh sát và xử lý nghiệp vụ cho Service
      return await this.dataTransferService.processExcelStream(filePath);
    } catch (error) {
      console.error(`[👷 CÔNG NHÂN] Lỗi cmnr:`, error);
      throw error;
    } finally {
      console.log(`==============================================\n`);
    }
  }
}
