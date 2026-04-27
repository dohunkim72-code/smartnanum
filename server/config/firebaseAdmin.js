const admin = require('firebase-admin');
const path = require('path');

// 서비스 계정 키 파일 경로
// 사용자가 Firebase 콘솔에서 다운로드하여 이 위치에 업로드해야 합니다.
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  // 파일 존재 여부 확인 후 로드
  const serviceAccount = require(serviceAccountPath);
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK 초기화 성공');
  }
} catch (error) {
  console.error('Firebase Admin SDK 초기화 오류:', error.message);
  console.warn('주의: server/config/serviceAccountKey.json 파일이 없으면 실제 휴대폰 인증 검증 기능이 작동하지 않습니다.');
}

module.exports = admin;
