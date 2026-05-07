import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  transform(file: MulterFile) {
    if (!file) {
      throw new BadRequestException('Không tìm thấy file tải lên');
    }

    // 1. Kiểm tra đuôi file nghiêm ngặt (Chống Macro Virus .xlsm / .xlsb)
    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new BadRequestException('Bảo mật: Hệ thống chỉ chấp nhận định dạng .xlsx. Nghiêm cấm tải lên file chứa Macro (.xlsm) hoặc các định dạng khác.');
    }

    // 2. Kiểm tra dung lượng (Tối đa 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new BadRequestException('File quá lớn! Dung lượng tối đa là 500MB.');
    }

    try {
      // 3. Lớp khiên MAGIC BYTES
      // Mở file từ ổ cứng lên, chỉ lấy đúng 4 bytes đầu tiên
      const buffer = Buffer.alloc(4);
      const fd = fs.openSync(file.path, 'r');
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);

      const magicBytes = buffer.toString('hex').toUpperCase();

      // File .xlsx bản chất là một file nén ZIP, có Magic Bytes chuẩn quốc tế là "504B0304"
      if (magicBytes !== '504B0304') {
        throw new BadRequestException('Bảo mật: Phát hiện file mạo danh! Đây không phải là file Excel hợp lệ.');
      }
    } catch (error) {
      // Dù văng lỗi do file mạo danh, hay văng lỗi do file 0 byte, file hỏng...
      // Phải luôn luôn dọn sạch rác trên ổ cứng!
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error; // Ném lỗi ra lại cho NestJS xử lý trả về User
    }

    return file;
  }
}
