import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { generateSalt, hashPassword } from './common/utils/crypto.util';

/**
 * Seed Script — Tạo 2 tài khoản mẫu (1 Admin + 1 User)
 * Chạy bằng: npx ts-node src/seed.ts
 */

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASS || 'adminpassword',
    database: process.env.DB_NAME || 'user_management',
    entities: [User],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Database connected.');

  const userRepo = dataSource.getRepository(User);

  // Tài khoản Admin
  const adminSalt = generateSalt();
  const adminUser = userRepo.create({
    name: 'admin',
    age: 30,
    birthday: new Date('1996-01-15'),
    password: hashPassword('admin123', adminSalt),
    salt: adminSalt,
    role: 'admin',
  });

  // Tài khoản User thường
  const userSalt = generateSalt();
  const normalUser = userRepo.create({
    name: 'user01',
    age: 25,
    birthday: new Date('2001-06-20'),
    password: hashPassword('user123', userSalt),
    salt: userSalt,
    role: 'user',
  });

  // Upsert: nếu name đã tồn tại thì update, không tạo trùng
  await userRepo.upsert([adminUser, normalUser], ['name']);

  console.log('Seed completed! 2 accounts created:');
  console.log('  Admin  → name: admin   | password: admin123');
  console.log('  User   → name: user01  | password: user123');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
