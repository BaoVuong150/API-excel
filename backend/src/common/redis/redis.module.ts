import { Module, Global } from '@nestjs/common';
import { Redis } from 'ioredis';

@Global() // Đặt Global để cắm 1 lần ở AppModule, tất cả mọi nơi đều xài được
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT', // Chìa khóa kết nối
      useFactory: () => {
        // Chỉ tạo 1 kết nối (1 đường ống) duy nhất xuyên suốt ứng dụng
        return new Redis(process.env.REDIS_URL || 'redis://redis:6379');
      },
    },
  ],
  exports: ['REDIS_CLIENT'], // Phải export ra thì Service khác mới Inject vào được
})
export class RedisModule {}
