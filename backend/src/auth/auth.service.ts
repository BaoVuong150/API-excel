import { Injectable, UnauthorizedException, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { validatePassword } from '../common/utils/crypto.util';
import { JwtPayload } from './jwt.strategy';
import { Redis } from 'ioredis';

@Injectable()
export class AuthService {

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis, // Xin kết nối từ RedisModule
  ) { }

  /**
   * Hàm dùng chung để ném lỗi Đăng nhập. 
   * Tránh việc hard-code lặp lại chuỗi 'Sai tài khoản hoặc mật khẩu' nhiều nơi.
   */
  private throwInvalidAuth(): never {
    throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
  }

  async login(username: string, password: string) {
    // 1. Tìm User trong Database
    const user = await this.usersService.findOneByName(username);
    if (!user) {
      this.throwInvalidAuth();
    }

    // 2. Kiểm tra Mật Khẩu NGAY LẬP TỨC (Dù có đang bị khóa hay không)
    const isPasswordValid = validatePassword(password, user.password, user.salt);

    const lockKey = `lockout_${username}`;
    const failKey = `fail_login_${username}`;

    if (isPasswordValid) {
      // [ĐẶC QUYỀN]: Nhập đúng pass -> Gỡ bỏ mọi án phạt, cho qua luôn!
      await this.redisClient.del(lockKey);
      await this.redisClient.del(failKey);

      // Nhào nặn ra JWT Token
      const payload: JwtPayload = { sub: user.id, name: user.name, role: user.role };
      return { access_token: this.jwtService.sign(payload) };
    }

    // --- XỬ LÝ KHI NHẬP SAI PASS ---
    // Kiểm tra xem tài khoản có đang bị treo cờ cấm không?
    const isLocked = await this.redisClient.get(lockKey);
    if (isLocked) {
      // [SILENT LOCK] Giả vờ như đang sai pass bình thường để lừa hacker
      this.throwInvalidAuth();
    }

    // Nếu chưa bị cấm, tăng biến đếm số lần sai lên
    const failCount = await this.redisClient.incr(failKey);

    if (failCount === 1) {
      await this.redisClient.expire(failKey, 600); // Bộ đếm sai sẽ tự hủy sau 10 phút
    }

    if (failCount >= 5) {
      // Sai 5 lần liên tiếp -> Cắm cờ khóa 15 phút (900 giây)
      await this.redisClient.set(lockKey, 'locked', 'EX', 900);
      await this.redisClient.del(failKey); // Dọn dẹp bộ đếm cũ

      // [SILENT LOCK] Khóa ngầm bên dưới, nhưng bên ngoài vẫn báo sai pass
      this.throwInvalidAuth();
    }

    this.throwInvalidAuth();
  }
}
