import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {

  // API này mô phỏng phòng VIP, yêu cầu:
  // 1. Phải có thẻ (JwtAuthGuard)
  // 2. Thẻ phải dán mác admin (RolesGuard + @Roles)
  @Get('vip-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getVipData(@Req() req: any) {
    return {
      message: 'Thành công! Chào mừng sếp đã vào phòng VIP!',
      user: req.user,
    };
  }
}
