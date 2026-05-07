import { Module } from '@nestjs/common';
import { DataTransferController } from './data-transfer.controller';
import { DataTransferService } from './data-transfer.service';
import { BullModule } from '@nestjs/bullmq';
import { ExcelImportProcessor } from './excel-import.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { CleanupCron } from './cleanup.cron';

import { UserQueryAdapter } from './export/user-query.adapter';
import { ExcelWriterAdapter } from './export/excel-writer.adapter';
import { ExcelExportProcessor } from './export/excel-export.processor';

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
    // Cấp quyền thao tác với bảng Users cho module này
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [DataTransferController],
  providers: [
    DataTransferService, 
    ExcelImportProcessor, 
    CleanupCron,
    UserQueryAdapter,
    ExcelWriterAdapter,
    ExcelExportProcessor
  ],
})
export class DataTransferModule {}
