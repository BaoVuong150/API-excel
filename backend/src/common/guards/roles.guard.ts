import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // 1. Nhìn lên cửa API xem có dán cái nhãn @Roles(...) nào không
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu API không dán nhãn gì cả -> Mở cửa tự do
    if (!requiredRoles) {
      return true;
    }

    // 2. Chộp lấy thông tin vị khách đang đứng chờ
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException('Chưa đăng nhập hoặc không tìm thấy thẻ từ');
    }

    // 3. Xử lý tư duy phân cấp: Admin có đặc quyền tối thượng, được vào mọi phòng
    if (user.role === 'admin') {
      return true;
    }

    // 4. Đối chiếu: Chữ 'role' ghi trên thẻ có khớp với nhãn dán trên cửa không?
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Bạn không có quyền truy cập');
    }

    return true; // Khớp! Cho qua.
  }
}
