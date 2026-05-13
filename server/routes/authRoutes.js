const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// /api/auth/login
router.post('/login', authController.login);

// /api/auth/register
router.post('/register', authController.register);

// /api/auth/check-id
router.post('/check-id', authController.checkDuplicateId);

// /api/auth/check-referral
router.post('/check-referral', authController.checkReferralCode);

// /api/auth/profile (회원정보 수정)
router.put('/profile', authMiddleware, authController.updateProfile);

// /api/auth/change-password (비밀번호 변경)
router.post('/change-password', authMiddleware, authController.changePassword);

// /api/auth/reset-password (비밀번호 재설정)


// /api/auth/send-pw-kakao (카카오톡으로 임시 비밀번호 발급)
router.post('/send-pw-kakao', authController.sendPwKakao);

// /api/auth/send-sms (인증번호 발송 및 로그 저장)
router.post('/send-sms', authController.sendVerificationSMS);

// /api/auth/verify-signup-code (회원가입 인증번호 확인)
router.post('/verify-signup-code', authController.verifySignupCode);

// /api/auth/verify-reset-code (비밀번호 재설정 인증번호 확인)
router.post('/verify-reset-code', authController.verifyResetPasswordCode);

// /api/auth/verify-profile-code (회원정보 수정 인증번호 확인)
router.post('/verify-profile-code', authController.verifyProfileCode);

// /api/auth/find-id/send-sms (아이디 찾기용 인증번호 발송)
router.post('/find-id/send-sms', authController.findIdSendSMS);

// /api/auth/find-id/verify (인증번호 확인 및 아이디 반환)
router.post('/find-id/verify', authController.verifyCodeAndFindId);

// --- Firebase Phone Auth 관련 추가 ---

// /api/auth/check-phone-exists (휴대폰 번호 가입 여부 확인)
router.post('/check-phone-exists', authController.checkPhoneExists);

// /api/auth/find-id/verify-firebase (Firebase 인증 후 아이디 찾기)
router.post('/find-id/verify-firebase', authController.findIdWithFirebase);

// /api/auth/reset-password/verify-firebase (Firebase 인증 후 비밀번호 재설정)
router.post('/reset-password/verify-firebase', authController.resetPasswordWithFirebase);

// /api/auth/log-sms (Firebase 발송 로그 기록)
router.post('/log-sms', authController.logSMS);

// 비밀번호 재설정 신규 흐름
router.post('/check-user-exists', authController.checkUserExistsForReset);
router.post('/reset-password-final', authController.resetPasswordFinal);

module.exports = router;
