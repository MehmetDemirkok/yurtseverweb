const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Cookie dosyasını oku (eğer varsa)
function readCookieFile() {
  try {
    const cookiePath = path.join(__dirname, '../.next/cookies.json');
    if (fs.existsSync(cookiePath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
      return cookies.token;
    }
  } catch (error) {
    console.log('Cookie dosyası bulunamadı');
  }
  return null;
}

function decodeToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔍 JWT Token Decoded:');
    console.log('   ID:', decoded.id);
    console.log('   Email:', decoded.email);
    console.log('   Role:', decoded.role);
    console.log('   Company ID:', decoded.companyId);
    console.log('   Company Name:', decoded.companyName);
    console.log('   Permissions:', decoded.permissions);
    return decoded;
  } catch (error) {
    console.error('❌ Token decode error:', error.message);
    return null;
  }
}

// Manuel token test
const testTokens = [
  // Buraya test token'ları ekleyebilirsiniz
];

console.log('🔍 Checking JWT tokens...\n');

// Cookie dosyasından token oku
const cookieToken = readCookieFile();
if (cookieToken) {
  console.log('📁 Cookie dosyasından token bulundu:');
  decodeToken(cookieToken);
  console.log('---\n');
}

// Test token'ları dene
if (testTokens.length > 0) {
  console.log('🧪 Test tokens:');
  testTokens.forEach((token, index) => {
    console.log(`\nToken ${index + 1}:`);
    decodeToken(token);
  });
}

console.log('💡 Manuel token test etmek için:');
console.log('   node scripts/check-user-token.js <token>');
