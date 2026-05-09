import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class UserQueryAdapter {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createDataStream() {
    // 🛡️ Bơm dữ liệu từng giọt (Stream), tuyệt đối không load hết lên RAM
    return this.userRepository.createQueryBuilder('user').stream();
  }
}
