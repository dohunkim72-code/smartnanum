const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const path = require('path');

const app = express();

// 미들웨어 설정
app.use(cors()); // CORS 허용
app.use(express.json({ limit: '50mb' })); // JSON 파싱 용량 상향
app.use(express.urlencoded({ limit: '50mb', extended: true })); // URL 인코딩 용량 상향
app.use(morgan('dev')); // 로그 출력

// 정적 파일 서빙 (빌드된 프론트엔드 파일들)
app.use(express.static(path.join(__dirname, '../dist')));

// API 라우터 연결
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donation', require('./routes/donationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 모든 기타 경로는 프론트엔드 index.html로 연결 (React Router 대응)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  }
});

// 라우터 연결
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donation', require('./routes/donationRoutes'));

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 작동 중입니다.`);
});
