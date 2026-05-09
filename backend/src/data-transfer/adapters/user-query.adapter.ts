import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

@Injectable()
export class UserQueryAdapter {
  constructor(private readonly usersService: UsersService) {}

  async createDataStream() {
    // 🛡️ Bơm dữ liệu từng giọt (Stream), giao việc chọc DB cho UsersService
    return this.usersService.streamAllUsers();
  }
}
