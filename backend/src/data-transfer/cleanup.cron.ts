import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CleanupCron {
  private readonly logger = new Logger(CleanupCron.name);

  // Chạy tự động vào lúc 2:00 sáng mỗi ngày
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  handleCron() {
    this.logger.log('🧹 [CRON JOB] Đang khởi động Robot lao công dọn dẹp Sổ Nam Tào...');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return;
    }

    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    // 24 tiếng (Tính bằng mili-giây)
    const MAX_AGE = 24 * 60 * 60 * 1000; 

    let deletedCount = 0;

    for (const file of files) {
      // Nhắm mục tiêu vào 2 loại rác: Sổ Nam Tào (.json) và File Xuất Dữ Liệu (.xlsx)
      const isErrorReport = file.startsWith('error_report_') && file.endsWith('.json');
      const isExportFile = file.startsWith('export_users_') && file.endsWith('.xlsx');

      if (!isErrorReport && !isExportFile) {
        continue;
      }

      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      // Nếu file tồn tại quá 24h thì xóa
      if (now - stats.mtimeMs > MAX_AGE) {
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
          const icon = isExportFile ? '📦' : '🗑️';
          this.logger.log(`${icon} Đã đốt file hết hạn: ${file}`);
        } catch (error) {
          this.logger.error(`❌ Lỗi khi xóa file ${file}:`, error);
        }
      }
    }

    this.logger.log(`✅ [CRON JOB] Xong việc! Đã xóa thành công ${deletedCount} file báo cáo rác.`);
  }
}
