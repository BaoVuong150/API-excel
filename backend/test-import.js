const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');

async function runStressTest() {
  try {
    console.log('🚀 1. Đang xin Token của Giám đốc (admin/admin123)...');
    const loginRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Đăng nhập thất bại: ${loginRes.status}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log('✅ Đã cầm được Thẻ Bài (JWT)!');

    const filePath = path.join(__dirname, 'mock_10m_users.xlsx');
    console.log(`\n📦 2. Đang bốc dỡ file ${path.basename(filePath)} lên xe tải (FormData)...`);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    console.log('🔥 3. KÍCH NỔ: Bắn thẳng file vào API POST /data/import...');
    const uploadRes = await fetch('http://localhost:3000/data/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });

    const responseText = await uploadRes.text();
    console.log('\n✅ 4. PHẢN HỒI TỪ SERVER:');
    console.log(responseText);
    
    console.log('\n⏳ Server đã tiếp nhận! Sếp hãy nhìn vào Terminal log để xem Worker chạy!');
  } catch (error) {
    console.error('❌ Có lỗi xảy ra:', error);
  }
}

runStressTest();
