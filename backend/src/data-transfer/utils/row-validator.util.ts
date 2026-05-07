import { generateSalt, hashPassword } from '../../common/utils/crypto.util';

/**
 * Bóc tách giá trị từ ô Excel (để trị dứt điểm RichText, Formula, Date)
 */
export function extractValue(val: any): any {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val.result !== undefined) return val.result;
    if (val.richText) return val.richText.map((rt: any) => rt.text).join('');
    if (val instanceof Date) return val;
  }
  return val;
}

/**
 * Kiểm tra và ép khuôn 1 dòng Excel.
 * - Trả về { isValid: true, data: UserEntity } nếu hợp lệ.
 * - Trả về { isValid: false, reason: string } nếu vi phạm luật tử hình.
 */
export function validateAndMapUserRow(row: any, colMap: Record<string, number>, lineNumber: number) {
  const nameValue = extractValue(row.getCell(colMap['name']).value);
  const ageValue = extractValue(row.getCell(colMap['age']).value);
  const birthdayValue = extractValue(row.getCell(colMap['birthday']).value);
  const passwordValue = extractValue(row.getCell(colMap['password']).value);
  const roleValue = extractValue(row.getCell(colMap['role']).value);

  // 1. LUẬT TỬ HÌNH (Skip): Thiếu Username -> Vứt
  const finalName = String(nameValue || '').trim();
  if (!finalName) {
    return { isValid: false, reason: `Dòng ${lineNumber}: Bỏ qua vì thiếu Username (Name).` };
  }

  // 2. LUẬT TỬ HÌNH (Skip): Thiếu Password -> Vứt
  const rawPassword = String(passwordValue || '').trim();
  if (!rawPassword) {
    return { isValid: false, reason: `Dòng ${lineNumber}: Bỏ qua vì thiếu Password cho user [${finalName}].` };
  }

  // 3. LUẬT TỰ SỬA LỖI (Auto-fix):
  let parsedAge = Number(ageValue);
  if (isNaN(parsedAge)) parsedAge = 0; // Nhập tuổi tào lao -> Bắt về 0

  let parsedDate = new Date(birthdayValue as any);
  if (isNaN(parsedDate.getTime())) parsedDate = new Date(); // Nhập ngày tào lao -> Bắt về ngày hôm nay

  const finalRole = String(roleValue || 'user').trim().toLowerCase();

  // Băm mật khẩu siêu tốc (Epic 4)
  const salt = generateSalt();
  const hashedPassword = hashPassword(rawPassword, salt);

  return {
    isValid: true,
    data: {
      name: finalName.substring(0, 255),
      age: parsedAge,
      birthday: parsedDate,
      password: hashedPassword,
      salt: salt,
      role: finalRole.substring(0, 50),
    },
  };
}
