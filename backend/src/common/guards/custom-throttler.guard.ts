import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {

  // Vá Lỗ hổng 1: Nhận diện kẻ spam bằng User ID thay vì IP (nếu đã đăng nhập)
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // Tự bóc tách nhanh Token để lấy ID mà không cần chờ tới JwtGuard
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload && payload.sub) {
          return `user_${payload.sub}`; // Kẻ nào làm kẻ nấy chịu
        }
      } catch (e) {}
    }
    // Dành cho khách vãng lai hoặc ở màn hình Đăng Nhập
    return `ip_${req.ip}`;
  }

  // Việt hóa câu chửi khi chặn spam
  protected async throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: any): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Bạn đã thao tác quá nhanh, vui lòng chờ 1 phút trước khi thử lại!',
        error: 'Too Many Requests'
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
