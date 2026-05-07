import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

export interface JwtPayload {
  sub: number;
  name: string;
  role: string;
  iat?: number; // Issued at (thời gian phát hành)
  exp?: number; // Expiration time (thời gian hết hạn)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 1. Chỉ cho bảo vệ: "Khách giấu Thẻ từ ở trong HTTP Header (dạng Bearer Token)"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Bật tính năng kiểm tra xem Thẻ từ có bị hết hạn không
      ignoreExpiration: false,
      
      // 2. Đưa cho bảo vệ Chìa khóa bí mật để đối chiếu xem thẻ thật hay thẻ giả
      secretOrKey: process.env.JWT_SECRET || 'BiMatCuaDuAn123',
    });
  }

  // 3. Khách là ai?
  // Hàm này CHỈ ĐƯỢC CHẠY khi Token là ĐỒ THẬT và CHƯA HẾT HẠN.
  // Tham số 'payload' chính là những thông tin gốc đã được giải mã từ cái Token.
  async validate(payload: JwtPayload) {
    // Trả về thông tin này, nó sẽ được tự động gắn vào Request (thành req.user)
    return { 
      id: payload.sub, 
      name: payload.name, 
      role: payload.role 
    };
  }
}
