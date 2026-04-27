import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase 설정 정보 (발급받은 정보)
const firebaseConfig = {
  apiKey: "AIzaSyCyREZV9rjfntAlSN2O7X2Al71Atwl5ZmY",
  authDomain: "smartnanum-auth-f2026.firebaseapp.com",
  projectId: "smartnanum-auth-f2026",
  storageBucket: "smartnanum-auth-f2026.firebasestorage.app",
  messagingSenderId: "1047846658276",
  appId: "1:1047846658276:web:b1d32364fba24629c88cf1"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Auth 인스턴스 내보내기
export const auth = getAuth(app);
// 언어 설정 (한국어)
auth.languageCode = 'ko';

export default app;
