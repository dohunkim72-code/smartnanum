const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebaseAdmin'); // Firebase Admin 추가
const axios = require('axios');

// 알리고 SMS 발송 유틸리티 함수
const sendAligoSMS = async (receiver, message) => {
  try {
    const params = new URLSearchParams();
    params.append('key', process.env.ALIGO_API_KEY);
    params.append('userid', process.env.ALIGO_USER_ID);
    params.append('sender', process.env.ALIGO_SENDER);
    params.append('receiver', receiver);
    params.append('msg', message);
    // params.append('testmode_yn', 'Y'); // 테스트 모드 필요 시 주석 해제

    const response = await axios.post('https://apis.aligo.in/send/', params);
    console.log('📱 [Aligo Response]:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [Aligo Error]:', error.message);
    throw error;
  }
};

// 로그인
exports.login = async (req, res) => {
  const { id, pw } = req.body;

  try {
    // 1. 사용자 조회
    const [rows] = await db.query('SELECT * FROM cust WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    const user = rows[0];

    // 2. 비밀번호 확인
    const isMatch = await bcrypt.compare(pw, user.pw);
    if (!isMatch) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 3. JWT 토큰 생성
    const token = jwt.sign(
      { cust_no: user.cust_no, id: user.id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        cust_no: user.cust_no,
        id: user.id,
        name: user.name,
        email: user.email_add,
        hpno: user.hpno,
        note: user.note // 사인자(소개자) 성명 추가
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '로그인 처리 중 오류가 발생했습니다.' });
  }
};

// 비밀번호 변경
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const cust_no = req.user.cust_no;

  try {
    // 1. 사용자 조회
    const [rows] = await db.query('SELECT pw FROM cust WHERE cust_no = ?', [cust_no]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = rows[0];

    // 2. 현재 비밀번호 확인
    const isMatch = await bcrypt.compare(currentPassword, user.pw);
    if (!isMatch) {
      return res.status(400).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
    }

    // 3. 새 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. DB 업데이트
    await db.query(
      'UPDATE cust SET pw = ?, upd_date = current_timestamp(), upd_id = ? WHERE cust_no = ?',
      [hashedPassword, req.user.id, cust_no]
    );

    res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('비밀번호 변경 에러:', error);
    res.status(500).json({ message: '비밀번호 변경 중 오류가 발생했습니다.' });
  }
};
// 비밀번호 재설정 (임시 비밀번호 발급 및 카카오톡 전송)
exports.sendPwKakao = async (req, res) => {
  const { id, hpno } = req.body;

  try {
    // 1. 번호 형식 정제 (010... 형식으로 통일)
    let cleanPhone = hpno.replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('+82')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('82')) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }
    
    // 검색 후보군: 변환된 번호, 원본 번호 등
    let searchPhones = [cleanPhone, hpno, hpno.replace(/[^0-9]/g, '')];
    searchPhones = [...new Set(searchPhones)].filter(p => p);

    // 2. 사용자 조회 (아이디와 휴대폰 번호 일치 확인)
    const [rows] = await db.query('SELECT cust_no, name, hpno FROM cust WHERE id = ? AND hpno IN (?)', [id, searchPhones]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '입력하신 정보와 일치하는 사용자를 찾을 수 없습니다.' });
    }

    const user = rows[0];
    const cust_no = user.cust_no;
    const userName = user.name.trim(); // DB에서 조회된 사용자 이름 사용

    // 3. 임시 비밀번호 생성 (8자리 랜덤)
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // 4. 새 비밀번호 암호화 및 DB 업데이트
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await db.query(
      'UPDATE cust SET pw = ?, upd_date = current_timestamp(), upd_id = ? WHERE cust_no = ?',
      [hashedPassword, id, cust_no]
    );

    // 발송용 번호 정제 (반드시 010... 형식으로)
    let targetHpno = user.hpno.replace(/[^0-9+]/g, '');
    if (targetHpno.startsWith('+82')) {
      targetHpno = '0' + targetHpno.slice(3);
    } else if (targetHpno.startsWith('82')) {
      targetHpno = '0' + targetHpno.slice(2);
    }

    // 5. 카카오톡 API 호출 (서버 IP 기반 발송으로 원복)
    let kakaoSuccess = false;
    let kakaoMessage = '';
    
    try {
      const axios = require('axios');
      const kakaoResponse = await axios.post('https://hanwoolfd.synology.me/api/auth/send-pw-kakao', {
        hpno: targetHpno,
        name: userName,
        pw: tempPassword
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('📡 [Synology Response]:', JSON.stringify(kakaoResponse.data, null, 2));
      
      kakaoSuccess = kakaoResponse.data.success;
      kakaoMessage = kakaoResponse.data.message;
    } catch (kakaoError) {
      console.error('카카오 API 호출 에러:', kakaoError.message);
      kakaoMessage = '카카오 서버 통신 오류';
    }

    // 6. 로그 기록
    try {
      const today = new Date();
      const yymmdd = today.getFullYear().toString().slice(-2) + 
                     (today.getMonth() + 1).toString().padStart(2, '0') + 
                     today.getDate().toString().padStart(2, '0');
      const prefix = 'SMS' + yymmdd;
      const [lastLogs] = await db.query('SELECT log_id FROM TB_SMS_LOG WHERE log_id LIKE ? ORDER BY log_id DESC LIMIT 1', [prefix + '%']);
      let sequence = 1;
      if (lastLogs.length > 0) {
        sequence = parseInt(lastLogs[0].log_id.slice(-7)) + 1;
      }
      const log_id = prefix + sequence.toString().padStart(7, '0');
      // 실제 iTEASY 템플릿(dn002)과 동일한 문구로 로그 저장
      const msg_content = `{한울파운데이션}\n\n${userName}님\n\n임시 비밀번호는 [${tempPassword}] 입니다.\n\n로그인 후 반드시 비밀번호를 새로 변경하세요.`;

      await db.execute(
        'INSERT INTO TB_SMS_LOG (log_id, cust_no, send_category, receiver_phone, msg_content, msg_type, send_stat, error_msg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [log_id, cust_no, 'RESET_PW', targetHpno, msg_content, 'KAKAO', kakaoSuccess ? 'SUCCESS' : 'FAIL', kakaoSuccess ? null : kakaoMessage]
      );
    } catch (logError) {
      console.error('로그 저장 에러:', logError);
    }

    if (kakaoSuccess) {
      res.status(200).json({ success: true, message: '임시 비밀번호가 카카오톡으로 발송되었습니다.' });
    } else {
      res.status(500).json({ success: false, message: kakaoMessage || '카카오톡 발송에 실패했습니다.' });
    }

  } catch (error) {
    console.error('비밀번호 재설정 에러:', error);
    res.status(500).json({ success: false, message: '비밀번호 재설정 중 오류가 발생했습니다.' });
  }
};



exports.register = async (req, res) => {
  const { id, pw, name, email, hpno, referral_code } = req.body;

  try {
    // 0. 휴대폰 번호 정제 (010... 형식으로)
    let cleanHpno = hpno ? hpno.replace(/[^0-9+]/g, '') : '';
    if (cleanHpno.startsWith('+82')) {
      cleanHpno = '0' + cleanHpno.slice(3);
    } else if (cleanHpno.startsWith('82')) {
      cleanHpno = '0' + cleanHpno.slice(2);
    }
    
    // 1. 아이디 형식 및 중복 확인
    if (id.length < 5) {
      return res.status(400).json({ message: '아이디는 5자 이상이어야 합니다.' });
    }

    const [existingUser] = await db.query('SELECT id FROM cust WHERE id = ?', [id]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: '이미 사용 중인 아이디입니다.' });
    }

    // 추천인 코드 유효성 확인
    if (referral_code) {
      const [referralRows] = await db.query('SELECT referral_code FROM referral WHERE referral_code = ?', [referral_code]);
      if (referralRows.length === 0) {
        return res.status(400).json({ message: '유효하지 않은 추천인 코드입니다.' });
      }
    } else {
      return res.status(400).json({ message: '추천인 코드는 필수 입력 항목입니다.' });
    }

    // 2. 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pw, salt);

    // 3. 고객 번호 생성 (맨 앞자리 C + 숫자 9자리 + 1 형식)
    const [lastCust] = await db.query('SELECT cust_no FROM cust WHERE cust_no LIKE "C%" ORDER BY cust_no DESC LIMIT 1');
    let cust_no;
    if (lastCust.length > 0) {
      const lastNoStr = lastCust[0].cust_no;
      const lastNum = parseInt(lastNoStr.substring(1));
      cust_no = 'C' + (lastNum + 1).toString().padStart(9, '0');
    } else {
      cust_no = 'C000000001'; // 첫 가입자 초기값
    }

    // 4. DB 저장
    await db.execute(
      'INSERT INTO cust (cust_no, id, pw, name, email_add, hpno, referral_code, note, reg_id, upd_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [cust_no, id, hashedPassword, name, email, cleanHpno, referral_code || '', req.body.note || '', id, id]
    );

    res.status(201).json({ message: '회원가입이 완료되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '회원가입 처리 중 오류가 발생했습니다.' });
  }
};

// 회원정보 수정
exports.updateProfile = async (req, res) => {
  const { name, email, email_add, hpno, referral_code, note } = req.body;
  const cust_no = req.user.cust_no;

  try {
    // 1. 현재 사용자 정보 조회 (NOT NULL 필드 보존을 위함)
    const [rows] = await db.query('SELECT * FROM cust WHERE cust_no = ?', [cust_no]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    const currentUser = rows[0];

    // 2. 입력된 값 또는 기존 값 사용
    const finalName = name || currentUser.name;
    const finalEmail = email || email_add || currentUser.email_add;
    
    // 휴대폰 번호 정제
    let cleanHpno = hpno ? hpno.replace(/[^0-9+]/g, '') : '';
    if (cleanHpno.startsWith('+82')) {
      cleanHpno = '0' + cleanHpno.slice(3);
    } else if (cleanHpno.startsWith('82')) {
      cleanHpno = '0' + cleanHpno.slice(2);
    }

    const finalHpno = cleanHpno || currentUser.hpno;
    const finalReferralCode = referral_code || currentUser.referral_code;
    const finalNote = note || currentUser.note;

    // 3. 이메일 형식 체크 (값이 변경된 경우에만)
    if (finalEmail !== currentUser.email_add) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalEmail)) {
        return res.status(400).json({ message: '올바른 이메일 형식이 아닙니다.' });
      }
    }

    // 4. 정보 업데이트
    await db.query(
      'UPDATE cust SET name = ?, email_add = ?, hpno = ?, referral_code = ?, note = ?, upd_date = current_timestamp(), upd_id = ? WHERE cust_no = ?',
      [finalName, finalEmail, finalHpno, finalReferralCode, finalNote, req.user.id, cust_no]
    );

    res.json({ 
      message: '회원정보가 성공적으로 수정되었습니다.',
      user: {
        ...req.user,
        name: finalName,
        email: finalEmail,
        hpno: finalHpno,
        note: finalNote
      }
    });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ message: '회원정보 수정 중 오류가 발생했습니다.' });
  }
};

// 아이디 중복 체크
exports.checkDuplicateId = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: '아이디를 입력해주세요.' });
  }

  if (id.length < 5) {
    return res.status(400).json({ message: '아이디는 5자 이상이어야 합니다.' });
  }

  try {
    const [rows] = await db.execute('SELECT id FROM cust WHERE id = ?', [id]);

    if (rows.length > 0) {
      return res.status(200).json({ 
        isDuplicate: true, 
        message: '이미 사용 중인 아이디입니다.' 
      });
    } else {
      return res.status(200).json({ 
        isDuplicate: false, 
        message: '사용 가능한 아이디입니다.' 
      });
    }
  } catch (error) {
    console.error('아이디 중복 체크 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 휴대폰 번호 가입 여부 확인 (Firebase SMS 전송 전 확인용)
exports.checkPhoneExists = async (req, res) => {
  const { hpno } = req.body;
  console.log('🔍 [checkPhoneExists] 요청 번호:', hpno);

  if (!hpno) {
    return res.status(400).json({ message: '휴대폰 번호를 입력해주세요.' });
  }

  try {
    // 1. 번호 형식 정제 (숫자만 추출)
    const cleanPhone = hpno.replace(/[^0-9]/g, '');
    
    // 2. 다양한 형식으로 검색 후보군 생성
    let searchPhones = [hpno, cleanPhone];
    if (cleanPhone.startsWith('010')) {
        searchPhones.push('+82' + cleanPhone.substring(1));
        searchPhones.push('82' + cleanPhone.substring(1));
    } else if (cleanPhone.startsWith('8210')) {
        searchPhones.push('0' + cleanPhone.substring(2));
        searchPhones.push('+' + cleanPhone);
    }
    
    // 중복 제거 및 빈 값 제외
    searchPhones = [...new Set(searchPhones)].filter(p => p);
    console.log('📱 [checkPhoneExists] 검색 후보군:', searchPhones);

    // mysql2에서 IN (?)은 [배열] 형식을 사용함
    const [rows] = await db.query('SELECT id, cust_no, hpno FROM cust WHERE hpno IN (?)', [searchPhones]);
    console.log(`✅ [checkPhoneExists] 조회 결과: ${rows.length}건 발견`);
    if (rows.length > 0) {
      console.log('👤 [checkPhoneExists] 매칭된 사용자:', rows[0].id, rows[0].hpno);
    }

    if (rows.length > 0) {
      return res.status(200).json({ exists: true, message: '가입된 번호입니다.' });
    } else {
      return res.status(404).json({ exists: false, message: '가입되지 않은 번호입니다.' });
    }
  } catch (error) {
    console.error('❌ [checkPhoneExists] 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// Firebase ID 토큰을 이용한 아이디 찾기
exports.findIdWithFirebase = async (req, res) => {
  const { idToken, hpno } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: '인증 정보가 누락되었습니다.' });
  }

  try {
    // 1. Firebase ID 토큰 검증
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (authError) {
      console.error('Firebase 토큰 검증 실패:', authError);
      return res.status(401).json({ message: '유효하지 않은 인증 정보입니다.' });
    }

    // 2. 다양한 형식으로 검색 후보군 생성
    const cleanPhone = hpno.replace(/[^0-9]/g, '');
    let searchPhones = [hpno, cleanPhone];
    if (cleanPhone.startsWith('010')) {
        searchPhones.push('+82' + cleanPhone.substring(1));
        searchPhones.push('82' + cleanPhone.substring(1));
    } else if (cleanPhone.startsWith('8210')) {
        searchPhones.push('0' + cleanPhone.substring(2));
        searchPhones.push('+' + cleanPhone);
    }
    searchPhones = [...new Set(searchPhones)].filter(p => p);

    const [rows] = await db.query('SELECT id FROM cust WHERE hpno IN (?)', [searchPhones]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: '해당 번호로 가입된 사용자를 찾을 수 없습니다.' });
    }

    res.json({ id: rows[0].id });
  } catch (error) {
    console.error('Firebase 아이디 찾기 에러:', error);
    res.status(500).json({ message: '아이디 조회 중 오류가 발생했습니다.' });
  }
};

// Firebase ID 토큰을 이용한 비밀번호 재설정 (인증 후 새 비밀번호 설정)
exports.resetPasswordWithFirebase = async (req, res) => {
  const { idToken, hpno, newPw } = req.body;

  if (!idToken || !hpno || !newPw) {
    return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
  }

  try {
    // 1. Firebase ID 토큰 검증
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (authError) {
      console.error('Firebase 토큰 검증 실패:', authError);
      return res.status(401).json({ message: '유효하지 않은 인증 정보입니다.' });
    }

    // 2. 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(newPw, salt);

    // 3. 다양한 형식으로 대상 탐색
    const cleanPhone = hpno.replace(/[^0-9]/g, '');
    let searchPhones = [hpno, cleanPhone];
    if (cleanPhone.startsWith('010')) {
        searchPhones.push('+82' + cleanPhone.substring(1));
        searchPhones.push('82' + cleanPhone.substring(1));
    } else if (cleanPhone.startsWith('8210')) {
        searchPhones.push('0' + cleanPhone.substring(2));
        searchPhones.push('+' + cleanPhone);
    }
    searchPhones = [...new Set(searchPhones)].filter(p => p);

    // 4. DB 업데이트
    const [result] = await db.query(
      'UPDATE cust SET pw = ? WHERE hpno IN (?)',
      [hashedPw, searchPhones]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 번호로 가입된 사용자를 찾을 수 없습니다.' });
    }

    res.json({ message: '비밀번호가 성공적으로 재설정되었습니다.' });
  } catch (error) {
    console.error('Firebase 비밀번호 재설정 에러:', error);
    res.status(500).json({ message: '비밀번호 재설정 중 오류가 발생했습니다.' });
  }
};

// 인증번호 SMS 발송 (기존 방식 유지 - 하위 호환성)
exports.sendVerificationSMS = async (req, res) => {
  const { hpno, category, cust_no } = req.body; // cust_no 추가

  if (!hpno) {
    return res.status(400).json({ message: '휴대폰 번호를 입력해주세요.' });
  }

  try {
    // 1. 6자리 인증번호 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 2. 로그 ID 생성 (매체 + YYMMDD + 일련번호 7자리, 총 16자)
    const today = new Date();
    const yymmdd = today.getFullYear().toString().slice(-2) + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    const prefix = 'SMS' + yymmdd;

    // DB에서 당일 마지막 시퀀스 조회
    const [lastLogs] = await db.query(
      'SELECT log_id FROM TB_SMS_LOG WHERE log_id LIKE ? ORDER BY log_id DESC LIMIT 1',
      [prefix + '%']
    );

    let sequence = 1;
    if (lastLogs.length > 0) {
      const lastSeq = parseInt(lastLogs[0].log_id.slice(-7));
      sequence = lastSeq + 1;
    }
    const log_id = prefix + sequence.toString().padStart(7, '0');
    
    const msg_content = `[스마트나눔] 인증번호는 [${verificationCode}] 입니다.`;


    // 4. 실제 Aligo SMS 발송
    let sendStat = 'SUCCESS';
    let errorMsg = null;
    
    try {
      const aligoResult = await sendAligoSMS(hpno, msg_content);
      if (aligoResult.result_code !== '1') {
        sendStat = 'FAIL';
        errorMsg = aligoResult.message;
      }
    } catch (sendError) {
      sendStat = 'FAIL';
      errorMsg = sendError.message;
    }

    // 5. TB_SMS_LOG 테이블에 저장
    try {
      await db.execute(
        'INSERT INTO TB_SMS_LOG (log_id, cust_no, receiver_phone, msg_content, msg_type, send_stat, send_category, error_msg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [log_id, cust_no || null, hpno, msg_content, 'SMS', sendStat, category || 'SIGN_UP', errorMsg]
      );
    } catch (dbError) {
      console.error('DB 저장 중 오류 발생:', dbError);
    }

    if (sendStat === 'SUCCESS') {
      res.status(200).json({ 
        success: true,
        message: '인증번호가 발송되었습니다.',
        // 보안을 위해 실제 서비스에서는 code를 반환하지 않습니다.
        // 개발/테스트 단계에서 확인이 필요하면 아래 주석을 해제하세요.
        // testCode: verificationCode 
      });
    } else {
      res.status(500).json({ success: false, message: errorMsg || '인증번호 발송에 실패했습니다.' });
    }
  } catch (error) {
    console.error('SMS 발송 로그 저장 에러:', error);
    res.status(500).json({ message: '인증번호 발송 중 오류가 발생했습니다.' });
  }
};

// 아이디 찾기용 인증번호 발송
exports.findIdSendSMS = async (req, res) => {
  const { hpno } = req.body;

  if (!hpno) {
    return res.status(400).json({ message: '휴대폰 번호를 입력해주세요.' });
  }

  try {
    // 1. 번호 형식 정제 및 검색 후보군 생성
    const cleanPhone = hpno.replace(/[^0-9]/g, '');
    let searchPhones = [hpno, cleanPhone];
    if (cleanPhone.startsWith('010')) {
        searchPhones.push('+82' + cleanPhone.substring(1));
        searchPhones.push('82' + cleanPhone.substring(1));
    } else if (cleanPhone.startsWith('8210')) {
        searchPhones.push('0' + cleanPhone.substring(2));
        searchPhones.push('+' + cleanPhone);
    }
    searchPhones = [...new Set(searchPhones)].filter(p => p);

    // 2. 해당 휴대폰 번호로 가입된 사용자가 있는지 확인 (다중 형식 지원)
    const [users] = await db.query('SELECT cust_no FROM cust WHERE hpno IN (?)', [searchPhones]);
    if (users.length === 0) {
      return res.status(404).json({ message: '해당 휴대폰 번호로 가입된 정보가 없습니다.' });
    }

    const cust_no = users[0].cust_no;

    // 2. 6자리 인증번호 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 3. 로그 ID 생성 (매체 + YYMMDD + 일련번호 7자리, 총 16자)
    const today = new Date();
    const yymmdd = today.getFullYear().toString().slice(-2) + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    const prefix = 'SMS' + yymmdd;

    // DB에서 당일 마지막 시퀀스 조회
    const [lastLogs] = await db.query(
      'SELECT log_id FROM TB_SMS_LOG WHERE log_id LIKE ? ORDER BY log_id DESC LIMIT 1',
      [prefix + '%']
    );

    let sequence = 1;
    if (lastLogs.length > 0) {
      const lastSeq = parseInt(lastLogs[0].log_id.slice(-7));
      sequence = lastSeq + 1;
    }
    const log_id = prefix + sequence.toString().padStart(7, '0');
    
    const msg_content = `[스마트나눔] 아이디 찾기 인증번호는 [${verificationCode}] 입니다.`;


    // 5. 실제 Aligo SMS 발송
    let sendStat = 'SUCCESS';
    let errorMsg = null;

    try {
      const aligoResult = await sendAligoSMS(hpno, msg_content);
      if (aligoResult.result_code !== '1') {
        sendStat = 'FAIL';
        errorMsg = aligoResult.message;
      }
    } catch (sendError) {
      sendStat = 'FAIL';
      errorMsg = sendError.message;
    }

    // 6. TB_SMS_LOG 테이블에 저장 (카테고리: FIND_ID)
    try {
      await db.execute(
        'INSERT INTO TB_SMS_LOG (log_id, cust_no, receiver_phone, msg_content, msg_type, send_stat, send_category, error_msg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [log_id, cust_no, hpno, msg_content, 'SMS', sendStat, 'FIND_ID', errorMsg]
      );
    } catch (dbError) {
      console.error('DB 저장 중 오류 발생 (아이디 찾기):', dbError);
    }

    if (sendStat === 'SUCCESS') {
      res.status(200).json({ 
        success: true,
        message: '인증번호가 발송되었습니다.',
        // verificationCode: verificationCode // 보안상 주석 처리
      });
    } else {
      res.status(500).json({ success: false, message: errorMsg || '인증번호 발송에 실패했습니다.' });
    }
  } catch (error) {
    console.error('아이디 찾기 SMS 발송 에러:', error);
    res.status(500).json({ message: '인증번호 발송 중 오류가 발생했습니다.' });
  }
};

// 인증번호 확인 및 아이디 반환
exports.verifyCodeAndFindId = async (req, res) => {
  const { hpno, code } = req.body;

  if (!hpno || !code) {
    return res.status(400).json({ message: '정보가 누락되었습니다.' });
  }

  try {
    // 1. 번호 형식 정제
    const cleanPhone = hpno.replace(/[^0-9]/g, '');
    
    // 2. DB에서 최근 3분 이내에 발송된 해당 번호의 최신 인증번호 조회
    // msg_content에서 [123456] 형식을 찾아 추출함
    const [logs] = await db.query(
      `SELECT msg_content FROM TB_SMS_LOG 
       WHERE receiver_phone = ? 
       AND send_category = 'FIND_ID' 
       AND send_stat = 'SUCCESS'
       AND reg_date >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)
       ORDER BY reg_date DESC LIMIT 1`,
      [cleanPhone]
    );

    if (logs.length === 0) {
      return res.status(400).json({ message: '인증번호가 만료되었거나 요청 이력이 없습니다.' });
    }

    // 3. 메시지 내용에서 인증번호 6자리 추출 (정규표현식 사용)
    const match = logs[0].msg_content.match(/\[(\d{6})\]/);
    if (!match || match[1] !== code) {
      return res.status(400).json({ message: '인증번호가 일치하지 않습니다.' });
    }

    // 4. 인증 성공 시 아이디 조회
    // 다양한 형식 지원을 위해 검색 후보군 생성
    let searchPhones = [cleanPhone];
    if (cleanPhone.startsWith('010')) {
        searchPhones.push('+82' + cleanPhone.substring(1));
        searchPhones.push('82' + cleanPhone.substring(1));
    }
    searchPhones = [...new Set(searchPhones)].filter(p => p);

    const [rows] = await db.query('SELECT id FROM cust WHERE hpno IN (?)', [searchPhones]);
    if (rows.length === 0) {
      return res.status(404).json({ message: '인증은 성공했으나 연결된 사용자 정보를 찾을 수 없습니다.' });
    }

    res.json({ success: true, id: rows[0].id });
  } catch (error) {
    console.error('아이디 조회 에러:', error);
    res.status(500).json({ message: '인증 확인 중 오류가 발생했습니다.' });
  }
};
// Firebase SMS 발송 로그 기록
exports.logSMS = async (req, res) => {
  const { hpno, category, cust_no, code, error_msg, send_stat } = req.body;
  console.log('📝 [logSMS] 로그 기록 시도:', { hpno, category, cust_no, code, send_stat });

  if (!hpno) {
    return res.status(400).json({ message: '휴대폰 번호가 누락되었습니다.' });
  }

  try {
    // 1. 로그 ID 생성 (매체 + YYMMDD + 일련번호 7자리, 총 16자)
    const today = new Date();
    const yymmdd = today.getFullYear().toString().slice(-2) + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    const prefix = 'SMS' + yymmdd;

    const [lastLogs] = await db.query(
      'SELECT log_id FROM TB_SMS_LOG WHERE log_id LIKE ? ORDER BY log_id DESC LIMIT 1',
      [prefix + '%']
    );

    let sequence = 1;
    if (lastLogs.length > 0) {
      const lastSeq = parseInt(lastLogs[0].log_id.slice(-7));
      sequence = lastSeq + 1;
    }
    const log_id = prefix + sequence.toString().padStart(7, '0');
    
    // 2. 메시지 내용 구성
    const msg_content = code 
      ? `[스마트나눔] ${category === 'RESET_PW' ? '임시 비밀번호' : '인증번호'}는 [${code}] 입니다.` 
      : (error_msg ? `[실패] ${error_msg}` : `[스마트나눔] 메시지가 발송되었습니다.`);

    const send_category = category || 'SIGN_UP';
    const final_send_stat = send_stat || 'SUCCESS';
    
    // 3. TB_SMS_LOG 테이블에 저장
    console.log('💾 [logSMS] DB INSERT 시작...', {
      log_id,
      cust_no: cust_no || null,
      send_category,
      hpno,
      msg_content,
      final_send_stat,
      error_msg: error_msg || null
    });

    await db.execute(
      'INSERT INTO TB_SMS_LOG (log_id, cust_no, send_category, receiver_phone, msg_content, msg_type, send_stat, error_msg) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [log_id.trim(), cust_no || null, send_category, hpno, msg_content, 'SMS', final_send_stat, error_msg || null]
    );

    console.log('✅ [logSMS] 로그 기록 성공:', log_id.trim());
    res.status(200).json({ message: 'SMS 로그가 기록되었습니다.', log_id: log_id.trim() });
  } catch (error) {
    console.error('❌ [logSMS] 로그 저장 오류 발생!');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.sqlMessage) console.error('SQL Error Detail:', error.sqlMessage);
    if (error.sql) console.error('Executed SQL:', error.sql);
    res.status(500).json({ success: false, message: '로그 저장 중 오류가 발생했습니다.', detail: error.message });
  }
};

// 비밀번호 재설정을 위한 사용자 확인 (OTP 발송 전 단계)
exports.checkUserExistsForReset = async (req, res) => {
  const { id, hpno } = req.body;
  try {
    // 01012345678 형식을 010-1234-5678 등으로 다양하게 검색할 수 있도록 정제
    const cleanHpno = hpno.replace(/[^0-9]/g, '');
    
    const [rows] = await db.query(
      'SELECT cust_no FROM cust WHERE id = ? AND (REPLACE(hpno, "-", "") = ? OR hpno = ?)', 
      [id, cleanHpno, cleanHpno]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '입력하신 정보와 일치하는 사용자를 찾을 수 없습니다.' });
    }
    res.status(200).json({ success: true, cust_no: rows[0].cust_no });
  } catch (error) {
    console.error('사용자 확인 에러:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
};

// 인증 완료 후 최종 비밀번호 변경
exports.resetPasswordFinal = async (req, res) => {
  const { id, hpno, newPassword } = req.body;
  try {
    const cleanHpno = hpno.replace(/[^0-9]/g, '');
    
    // 1. 사용자 확인 (보안을 위해 한 번 더 체크)
    const [rows] = await db.query(
      'SELECT cust_no FROM cust WHERE id = ? AND (REPLACE(hpno, "-", "") = ? OR hpno = ?)', 
      [id, cleanHpno, cleanHpno]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '사용자 정보가 일치하지 않습니다.' });
    }

    // 2. 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. 비밀번호 업데이트
    await db.query('UPDATE cust SET pw = ? WHERE id = ?', [hashedPassword, id]);

    console.log(`✅ [비밀번호 변경 성공] 아이디: ${id}`);
    res.status(200).json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('비밀번호 변경 에러:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
};

// 추천인 코드 유효성 체크
exports.checkReferralCode = async (req, res) => {
  const { referral_code } = req.body;

  if (!referral_code) {
    return res.status(400).json({ message: '추천인 코드를 입력해주세요.' });
  }

  try {
    const [rows] = await db.execute('SELECT name FROM referral WHERE referral_code = ?', [referral_code]);

    if (rows.length > 0) {
      return res.status(200).json({ 
        isValid: true, 
        name: rows[0].name,
        message: `확인되었습니다. (${rows[0].name} 추천인)` 
      });
    } else {
      return res.status(200).json({ 
        isValid: false, 
        message: '유효하지 않은 추천인 코드입니다.' 
      });
    }
  } catch (error) {
    console.error('추천인 코드 체크 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 회원가입용 인증번호 확인
exports.verifySignupCode = async (req, res) => {
  const { hpno, code } = req.body;

  if (!hpno || !code) {
    return res.status(400).json({ message: '휴대폰 번호와 인증번호를 모두 입력해주세요.' });
  }

  try {
    // 1. 번호 형식 정제
    const cleanPhone = hpno.replace(/[^0-9]/g, '');
    
    // 2. DB에서 최근 3분 이내에 발송된 해당 번호의 최신 인증번호 조회 (카테고리: SIGN_UP)
    const [logs] = await db.query(
      `SELECT msg_content FROM TB_SMS_LOG 
       WHERE receiver_phone = ? 
       AND send_category = 'SIGN_UP' 
       AND send_stat = 'SUCCESS'
       AND reg_date >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)
       ORDER BY reg_date DESC LIMIT 1`,
      [cleanPhone]
    );

    if (logs.length === 0) {
      return res.status(400).json({ message: '인증번호가 만료되었거나 요청 이력이 없습니다.' });
    }

    // 3. 메시지 내용에서 인증번호 6자리 추출
    const match = logs[0].msg_content.match(/\[(\d{6})\]/);
    if (!match || match[1] !== code) {
      return res.status(400).json({ message: '인증번호가 일치하지 않습니다.' });
    }

    res.json({ success: true, message: '인증에 성공했습니다.' });
  } catch (error) {
    console.error('회원가입 인증 확인 에러:', error);
    res.status(500).json({ message: '인증 확인 중 오류가 발생했습니다.' });
  }
};

// 비밀번호 재설정용 인증번호 확인
exports.verifyResetPasswordCode = async (req, res) => {
  const { hpno, code } = req.body;

  if (!hpno || !code) {
    return res.status(400).json({ message: '휴대폰 번호와 인증번호를 모두 입력해주세요.' });
  }

  try {
    const cleanPhone = hpno.replace(/[^0-9]/g, '');
    
    // DB에서 최근 3분 이내에 발송된 해당 번호의 최신 인증번호 조회 (카테고리: RESET_PW)
    const [logs] = await db.query(
      `SELECT msg_content FROM TB_SMS_LOG 
       WHERE receiver_phone = ? 
       AND send_category = 'RESET_PW' 
       AND send_stat = 'SUCCESS'
       AND reg_date >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)
       ORDER BY reg_date DESC LIMIT 1`,
      [cleanPhone]
    );

    if (logs.length === 0) {
      return res.status(400).json({ message: '인증번호가 만료되었거나 요청 이력이 없습니다.' });
    }

    // 메시지 내용에서 [123456] 형태의 인증번호 추출
    const match = logs[0].msg_content.match(/\[(\d{6})\]/);
    if (!match || match[1] !== code) {
      return res.status(400).json({ message: '인증번호가 일치하지 않습니다.' });
    }

    res.json({ success: true, message: '인증에 성공했습니다.' });
  } catch (error) {
    console.error('비밀번호 재설정 인증 확인 에러:', error);
    res.status(500).json({ message: '인증 확인 중 오류가 발생했습니다.' });
  }
};

// 회원정보 수정용 인증번호 확인
exports.verifyProfileCode = async (req, res) => {
  const { hpno, code } = req.body;

  if (!hpno || !code) {
    return res.status(400).json({ message: '휴대폰 번호와 인증번호를 모두 입력해주세요.' });
  }

  try {
    const cleanPhone = hpno.replace(/[^0-9]/g, '');
    
    // DB에서 최근 3분 이내에 발송된 해당 번호의 최신 인증번호 조회 (카테고리: PROFILE_EDIT)
    const [logs] = await db.query(
      `SELECT msg_content FROM TB_SMS_LOG 
       WHERE receiver_phone = ? 
       AND send_category = 'PROFILE_EDIT' 
       AND send_stat = 'SUCCESS'
       AND reg_date >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)
       ORDER BY reg_date DESC LIMIT 1`,
      [cleanPhone]
    );

    if (logs.length === 0) {
      return res.status(400).json({ message: '인증번호가 만료되었거나 요청 이력이 없습니다.' });
    }

    const match = logs[0].msg_content.match(/\[(\d{6})\]/);
    if (!match || match[1] !== code) {
      return res.status(400).json({ message: '인증번호가 일치하지 않습니다.' });
    }

    res.json({ success: true, message: '인증에 성공했습니다.' });
  } catch (error) {
    console.error('프로필 수정 인증 확인 에러:', error);
    res.status(500).json({ message: '인증 확인 중 오류가 발생했습니다.' });
  }
};
