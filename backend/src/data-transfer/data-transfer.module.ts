import { Module } from '@nestjs/common';
import { DataTransferController } from './data-transfer.controller';
import { DataTransferService } from './data-transfer.service';
import { BullModule } from '@nestjs/bullmq';
import { ExcelImportProcessor } from './import/excel-import.processor';
import { CleanupCron } from './cron/cleanup.cron';

import { UserQueryAdapter } from './adapters/user-query.adapter';
import { ExcelWriterAdapter } from './adapters/excel-writer.adapter';
import { ExcelExportProcessor } from './export/excel-export.processor';

import { UsersModule } from '../users/users.module';
import { ExcelReaderAdapter } from './adapters/excel-reader.adapter';
import { ReportWriterAdapter } from './adapters/report-writer.adapter';

@Module({
  imports: [
    // Tạo Hàng đợi chuyên trách việc Nhập file Excel
    BullModule.registerQueue({
      name: 'excel-import',
    }),
    // Tạo Hàng đợi chuyên trách việc Xuất file Excel
    BullModule.registerQueue({
      name: 'excel-export',
    }),
    // Phụ thuộc vào UsersModule để xử lý DB (Clean Architecture)
    UsersModule,
  ],
  controllers: [DataTransferController],
  providers: [
    DataTransferService, 
    ExcelImportProcessor, 
    CleanupCron,
    UserQueryAdapter,
    ExcelWriterAdapter,
    ExcelExportProcessor,
    ExcelReaderAdapter,
    ReportWriterAdapter
  ],
})
export class DataTransferModule {}
