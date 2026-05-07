import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { validateAndMapUserRow } from './utils/row-validator.util';

@Injectable()
export class DataTransferService {
  constructor(
    @InjectQueue('excel-import') private readonly excelQueue: Queue,
    @InjectRepository(User) private readonly usersRepository: Repository<User>
  ) { }

  /**
   * Đẩy file thật vào Hàng Đợi (Queue)
   */
  async importExcel(filePath: string) {
    const job = await this.excelQueue.add(
      'import-job',
      {
        filePath: filePath, // Chỉ truyền đường dẫn file, không ném nguyên cái file vào Redis
        timestamp: new Date().toISOString(),
      },
      {
        // Dọn dẹp Job khỏi Redis sau khi xong hoặc lỗi để tránh đầy bộ nhớ Redis
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    return {
      message: 'File đã lọt qua khiên bảo vệ và đang được Công nhân xử lý ngầm!',
      jobId: job.id,
      savedPath: filePath, // Trả về cho User biết chơi
    };
  }

  /**
   * Lõi xử lý Stream cực nặng: Đọc file Excel, Ép khuôn, Đẩy DB
   */
  async processExcelStream(filePath: string): Promise<any> {
    try {
      console.log(`[⚙️ SERVICE] Bắt đầu dùng ống hút Stream đọc file...`);

      const options = {
        sharedStrings: 'cache',
        worksheets: 'emit',
      };

      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, options as any);

      let totalRows = 0;
      let totalErrors = 0;
      let errorReport: string[] = [];

      // 🛡️ LỚP KHIÊN EPIC 4: Máy lọc trùng lặp nội bộ (Dùng Map thay vì Array)
      let batchMap = new Map<string, any>();
      let rowsSinceLastFlush = 0;
      const BATCH_SIZE = 1000;

      const expectedHeaders = ['name', 'age', 'birthday', 'password', 'role'];

      // 🛡️ LỚP KHIÊN EPIC 5: Mìn Cảm Biến Nhịp Tim (Watchdog Timer)
      let heartbeatTimer: NodeJS.Timeout;
      const startHeartbeat = (reject: (reason?: any) => void) => {
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        // Đặt đồng hồ đếm ngược 5 phút. Nếu không được tua lại, mìn sẽ nổ!
        heartbeatTimer = setTimeout(() => {
          reject(new Error(' Phát hiện Bom nén XML (Zip Bomb). Tiến hành Tự hủy!'));
        }, 300000);
      };

      // Tách riêng logic duyệt Stream
      const processStream = async (resetHeartbeat: () => void) => {
        // VÒNG LẶP ASYNC THẦN THÁNH: Duyệt qua tất cả các Sheet trong file
        for await (const worksheet of workbook as any) {
          let isSheetValid = true;
          // Mỗi Sheet có cấu trúc cột riêng, phải reset lại bản đồ
          const colMap: Record<string, number> = {}; 

          for await (const row of worksheet as any) {
            if (!row.hasValues) continue;

            if (row.number === 1) {
              row.eachCell((cell, colNumber) => {
                const cellValue = cell.value ? String(cell.value).trim().toLowerCase() : '';
                if (expectedHeaders.includes(cellValue)) colMap[cellValue] = colNumber;
              });

              // Lính gác kiểm tra: Nếu thiếu cột, cắm cờ rác và vứt Sheet này
              for (const h of expectedHeaders) {
                if (!colMap[h]) {
                  isSheetValid = false;
                  totalErrors++;
                  if (errorReport.length < 10000) {
                    errorReport.push(`Sheet '${worksheet.name}': Bỏ qua toàn bộ vì thiếu cột bắt buộc [${h}].`);
                  }
                  break; 
                }
              }
              continue; // Soi xong dòng 1 thì lướt tiếp xuống dòng 2
            }

            // Nếu Sheet đã bị gắn cờ rác, lướt qua dòng này với tốc độ ánh sáng
            if (!isSheetValid) continue;

            totalRows++; // Đếm mọi dòng (dù đúng hay sai)
            
            // 💓 BÁO CÁO NHỊP TIM: Cứ soi xong 1.000 dòng (bất kể rác hay sạch), báo cáo còn sống để tua lại Đồng hồ
            if (totalRows % BATCH_SIZE === 0) {
              resetHeartbeat();
            }

            // 🛡️ LÕI EPIC 5: Đưa vào máy chém Validator
            const validation = validateAndMapUserRow(row, colMap, row.number);
            
            if (!validation.isValid) {
              totalErrors++;
              // Giới hạn chỉ lưu 10.000 lỗi đầu tiên để chống tràn RAM (Memory Leak)
              if (errorReport.length < 10000) {
                errorReport.push(`[Sheet: ${worksheet.name}] ${validation.reason}`);
              } else if (errorReport.length === 10000) {
                errorReport.push('... và hàng ngàn lỗi khác (Đã ẩn bớt để bảo vệ hệ thống).');
              }
              continue; // Bỏ qua dòng này (Skip)
            }

            const userEntity = validation.data;

            rowsSinceLastFlush++;
            // Nếu trùng tên (Username), Map sẽ tự động vứt thằng cũ và giữ lại thằng mới nhất
            batchMap.set(userEntity.name, userEntity);

            if (rowsSinceLastFlush >= BATCH_SIZE) {
              const ramUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
              const batchArray = Array.from(batchMap.values());
              console.log(`[📦 BATCH] Đang xả Bulk Upsert xuống DB... (${batchArray.length} dòng). RAM: ${ramUsage} MB`);

              // 🛡️ LÕI EPIC 4: Bắn phá DB bằng 1 câu SQL duy nhất
              await this.usersRepository.upsert(batchArray, ['name']);

              batchMap.clear();
              rowsSinceLastFlush = 0;

              // 💓 BÁO CÁO NHỊP TIM: Xử lý xong 1 lô, báo cáo còn sống để tua lại Đồng hồ bom
              resetHeartbeat();
            }
          }
        }

        // Xả nốt số hàng dư dính lại ở đáy xô
        if (batchMap.size > 0) {
          const finalBatchArray = Array.from(batchMap.values());
          console.log(`[📦 BATCH CUỐI] Đang xả nốt ${finalBatchArray.length} dòng còn dư xuống DB...`);
          await this.usersRepository.upsert(finalBatchArray, ['name']);
          batchMap.clear();
        }
      };

      // Chạy tiến trình trong lồng kính có gắn Bom nhịp tim
      await new Promise<void>((resolve, reject) => {
        startHeartbeat(reject); // Bật công tắc Bom

        const resetHeartbeat = () => startHeartbeat(reject); // Công tắc tua lại

        processStream(resetHeartbeat)
          .then(() => {
            clearTimeout(heartbeatTimer); // Hoàn thành xuất sắc -> Tháo ngòi nổ
            resolve();
          })
          .catch((err) => {
            clearTimeout(heartbeatTimer); // Có lỗi nghiệp vụ -> Tháo ngòi nổ
            reject(err);
          });
      });

      // 🛡️ EPIC 5: Lưu sổ Nam Tào (Báo cáo lỗi) ra file JSON nếu có lỗi
      let reportPath = null;
      if (errorReport.length > 0) {
        reportPath = `uploads/error_report_${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify({
          totalRows,
          totalErrors,
          errors: errorReport
        }, null, 2));
        console.log(`[📝 SERVICE] Có ${totalErrors} dòng bị lỗi! Đã xuất báo cáo tại: ${reportPath}`);
      }
      
      console.log(`[✅ SERVICE] Hoàn thành! Thành công: ${totalRows} dòng. Thất bại: ${totalErrors} dòng.`);
      return { success: true, totalRows, totalErrors, reportPath, processedAt: new Date() };
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[🧹 SERVICE] Đã quét sạch rác: Xóa file ${filePath}`);
      }
    }
  }
}
