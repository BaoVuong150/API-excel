import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DataTransferModule } from './data-transfer/data-transfer.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    // Bật tính năng Cron Job toàn cục
    ScheduleModule.forRoot(),
    // Kết nối Database PostgreSQL qua TypeORM
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASS || 'adminpassword',
      database: process.env.DB_NAME || 'user_management',
      entities: [User],
      synchronize: true, // Dev only: tự tạo bảng từ Entity
    }),

    // Cấu hình Throttler lưu vào Redis
    ThrottlerModule.forRoot({
      // Giới hạn chung toàn hệ thống: 60 request / 1 phút (Bảo vệ Database, nhưng không làm khó người dùng thường)
      throttlers: [{ name: 'default', ttl: 60000, limit: 60 }],
      storage: new ThrottlerStorageRedisService(process.env.REDIS_URL || 'redis://redis:6379'),
    }),

    // Cấu hình BullMQ (Hàng đợi) kết nối vào Redis
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      },
    }),

    // --- Các Module Cốt Lõi ---
    RedisModule, // Nhúng Redis một lần duy nhất ở đây
    
    // 3 Domain Modules
    AuthModule,
    UsersModule,
    DataTransferModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard, // Cắm chốt bảo vệ ở cửa ngõ toàn hệ thống
    },
  ],
})
export class AppModule {}
