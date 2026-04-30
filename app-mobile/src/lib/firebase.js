import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase 설정 정보
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

// 모바일용 Auth 설정 (Persistence 추가)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

auth.languageCode = 'ko';

export default app;
