import { createHash, randomBytes } from 'crypto';

/**
 * Tạo một chuỗi Salt ngẫu nhiên (dài 32 ký tự hex)
 */
export function generateSalt(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Băm mật khẩu kết hợp với Salt bằng thuật toán MD5
 */
export function hashPassword(password: string, salt: string): string {
  return createHash('md5').update(password + salt).digest('hex');
}

/**
 * Kiểm tra mật khẩu đầu vào có khớp với mã băm trong DB hay không
 */
export function validatePassword(inputPassword: string, storedHash: string, storedSalt: string): boolean {
  const inputHash = hashPassword(inputPassword, storedSalt);
  return inputHash === storedHash;
}
