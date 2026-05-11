import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase 설정 정보 (서버에서 조회한 정확한 최신 정보)
const firebaseConfig = {
  apiKey: "AIzaSyAU5QJ2pnJb37BJ3iUXoppMoi3kRgP55QI",
  authDomain: "project-d481af23-2c56-483d-956.firebaseapp.com",
  projectId: "project-d481af23-2c56-483d-956",
  storageBucket: "project-d481af23-2c56-483d-956.firebasestorage.app",
  messagingSenderId: "98374123431",
  appId: "1:98374123431:web:7db538cf23173492e74082"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Auth 인스턴스 내보내기
export const auth = getAuth(app);
// 언어 설정 (한국어)
auth.languageCode = 'ko';

export default app;
