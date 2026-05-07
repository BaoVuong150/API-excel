import { Controller, Post, Get, Param, Res, UseInterceptors, UploadedFile, InternalServerErrorException, NotFoundException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import type { Response } from 'express';
import { DataTransferService } from './data-transfer.service';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import type { MulterFile } from '../common/pipes/file-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('data')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin') // 🛡️ CHỐT CHẶN CUỐI CÙNG: Toàn bộ cửa ngõ Import/Export chỉ dành cho Giám đốc
export class DataTransferController {
  constructor(
    private readonly dataTransferService: DataTransferService,
    @InjectQueue('excel-export') private readonly excelExportQueue: Queue,
  ) { }

  @Post('export')
  async requestExport() {
    try {
      const fileName = `export_users_${Date.now()}.xlsx`;
      const job = await this.excelExportQueue.add('export-job', { fileName });
      
      return {
        message: 'Yêu cầu kết xuất dữ liệu đã được tiếp nhận và đang chạy ngầm!',
        jobId: job.id,
        downloadUrl: `/data/downloads/${fileName}`,
      };
    } catch (error) {
      throw new InternalServerErrorException('Không thể đưa yêu cầu xuất file vào Hàng đợi!');
    }
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', {
    dest: './uploads', // Tự động lưu file vào thư mục này, không nạp lên RAM
    limits: {
      fileSize: 500 * 1024 * 1024, // Bức tường thành số 1: Multer sẽ cắt cáp mạng ngay khi dung lượng vượt 500MB
    },
  }))
  async importExcel(@UploadedFile(new FileValidationPipe()) file: MulterFile) {
    try {
      // Gọi Service ném file vào Queue
      return await this.dataTransferService.importExcel(file.path);
    } catch (error) {
      // Nếu Redis chết, hoặc Queue bị đầy -> Xóa file rác để giải phóng ổ cứng!
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new InternalServerErrorException('Lỗi hệ thống: Không thể ném file vào Hàng đợi xử lý.');
    }
  }

  // Mở cổng cho phép Tải file Báo cáo lỗi (Sổ Nam Tào)
  @Get('reports/:filename')
  getErrorReport(@Param('filename') filename: string, @Res() res: Response) {
    // Bảo mật đường dẫn: Tránh bị hacker dùng Path Traversal (vd: ../../../etc/passwd)
    if (!filename.match(/^error_report_[0-9]+\.json$/)) {
      throw new NotFoundException('Tên file báo cáo không hợp lệ!');
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File báo cáo không tồn tại hoặc đã bị Robot dọn rác xóa!');
    }

    // Gửi thẳng file JSON về trình duyệt người dùng
    return res.sendFile(filePath);
  }

  // Mở cổng cho phép Tải file Excel Export
  @Get('downloads/:filename')
  getExportFile(@Param('filename') filename: string, @Res() res: Response) {
    if (!filename.match(/^export_users_[0-9]+\.xlsx$/)) {
      throw new NotFoundException('Tên file không hợp lệ!');
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File không tồn tại, có thể đang được tạo hoặc đã bị xóa!');
    }

    // Buộc trình duyệt tải về dưới dạng file đính kèm
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.sendFile(filePath);
  }
}
