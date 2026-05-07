import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneByName(name: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { name } });
  }

  /**
   * Đẩy một lô dữ liệu khổng lồ vào Database.
   * Đây là nơi duy nhất được quyền chọc vào bảng User.
   */
  async bulkUpsert(users: User[]): Promise<void> {
    if (users.length === 0) return;
    await this.usersRepository.upsert(users, ['name']);
  }
}
