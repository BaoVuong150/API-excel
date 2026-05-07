import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    // Xử lý lỗi do mình chủ động ném ra (VD: 400 Bad Request, 401 Unauthorized, 429 Too Many Requests)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // Ép các thông báo lỗi vào một form chuẩn chung
        return response.status(status).json({
          statusCode: status,
          ...(exceptionResponse as object),
        });
      }

      return response.status(status).json({
        statusCode: status,
        message: exceptionResponse,
        error: exception.name,
      });
    }

    // Xử lý LỖI HỆ THỐNG (500 Internal Server Error)
    // Che giấu chi tiết lỗi (đường dẫn file, cấu trúc DB) để bảo mật
    console.error('🔥 [INTERNAL SERVER ERROR]', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Hệ thống đang bảo trì hoặc gặp sự cố nội bộ. Vui lòng thử lại sau!',
      error: 'Internal Server Error',
    });
  }
}
