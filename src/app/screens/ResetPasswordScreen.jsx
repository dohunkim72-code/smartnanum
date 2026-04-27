import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

/**
 * 비밀번호 재설정 화면 컴포넌트입니다.
 * Firebase 휴대폰 인증을 통해 본인 확인 후 비밀번호를 직접 변경합니다.
 */
const ResetPasswordScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: 정보입력, 2: 인증번호확인, 3: 새비밀번호입력
  const [loginId, setLoginId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [timer, setTimer] = useState(180); // 3분 타이머
  
  const recaptchaWrapperRef = useRef(null);

  // 프리미엄 모달 상태
  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info' // info, success, error
  });

  const showAlert = (title, message, type = 'info') => {
    setModal({ show: true, title, message, type });
  };

  const closeAlert = () => {
    const isFinalSuccess = modal.type === 'success' && modal.title === '변경 완료';
    setModal(prev => ({ ...prev, show: false }));
    if (isFinalSuccess) {
      navigate('/login');
    }
  };

  // 타이머 로직
  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // 휴대폰 번호 포맷팅
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 11) {
      let formatted = value;
      if (value.length > 3 && value.length <= 7) {
        formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
      } else if (value.length > 7) {
        formatted = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
      }
      setPhoneNumber(formatted);
    }
  };

  // 1단계: 아이디 확인 및 인증번호 발송
  const handleSendCode = async () => {
    if (!loginId || phoneNumber.replace(/-/g, '').length < 10) {
      showAlert('알림', '아이디와 휴대폰 번호를 정확히 입력해주세요.', 'info');
      return;
    }

    setLoading(true);
    try {
      // 1. DB에서 사용자 존재 여부 확인
      const checkRes = await fetch('/api/auth/check-user-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loginId, hpno: phoneNumber.replace(/-/g, '') })
      });
      const checkData = await checkRes.json();

      if (!checkRes.ok || !checkData.success) {
        showAlert('확인 실패', checkData.message || '일치하는 정보가 없습니다.', 'error');
        setLoading(false);
        return;
      }

      // 2. Firebase Recaptcha 설정
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      // 3. 인증번호 발송
      const formattedPhone = `+82${phoneNumber.replace(/-/g, '').substring(1)}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      
      setConfirmationResult(result);
      setStep(2);
      setTimer(180);
      showAlert('발송 완료', '인증번호가 SMS로 발송되었습니다.', 'success');
      
      // 로그 기록 (우리 서버에도 남김)
      await fetch('/api/auth/log-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hpno: phoneNumber.replace(/-/g, ''), 
          category: 'RESET_PW',
          cust_no: checkData.cust_no,
          send_stat: 'SUCCESS'
        })
      });

    } catch (error) {
      console.error('인증번호 발송 에러:', error);
      showAlert('오류', '인증번호 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 인증번호 확인
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      showAlert('알림', '6자리 인증번호를 입력해주세요.', 'info');
      return;
    }

    setLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
      setStep(3);
      showAlert('인증 성공', '본인 인증이 완료되었습니다. 새 비밀번호를 설정해주세요.', 'success');
    } catch (error) {
      console.error('인증번호 확인 에러:', error);
      showAlert('인증 실패', '인증번호가 올바르지 않거나 만료되었습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3단계: 비밀번호 최종 변경
  const handleChangePassword = async () => {
    if (newPassword.length < 4) {
      showAlert('알림', '비밀번호는 최소 4자 이상이어야 합니다.', 'info');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('알림', '비밀번호가 일치하지 않습니다.', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: loginId,
          hpno: phoneNumber.replace(/-/g, ''),
          newPassword: newPassword
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showAlert('변경 완료', '비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해주세요!', 'success');
      } else {
        showAlert('변경 실패', data.message || '오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('비밀번호 변경 에러:', error);
      showAlert('오류', '서버 통신 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden font-display relative">
      <div id="recaptcha-container"></div>
      
      {/* 상단 뒤로가기 버튼 */}
      <div className="flex items-center bg-transparent p-4">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="flex items-center justify-center p-2 text-primary active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined font-bold">arrow_back_ios</span>
        </button>
        <h1 className="text-lg font-black flex-1 text-center pr-10 text-slate-900">비밀번호 찾기</h1>
      </div>

      <div className="flex flex-col items-center justify-center pt-8 pb-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {step === 3 ? 'lock_reset' : 'key'}
          </span>
        </div>
        <h2 className="text-[#100d1b] tracking-tight text-2xl font-bold px-4 text-center leading-tight">
          {step === 1 && "정보를 입력해주세요"}
          {step === 2 && "인증번호를 입력해주세요"}
          {step === 3 && "새 비밀번호 설정"}
        </h2>
        <p className="text-slate-500 text-sm mt-2 font-medium px-8 text-center">
          {step === 1 && "아이디와 가입 시 등록한 휴대폰 번호를 입력해주세요."}
          {step === 2 && `${phoneNumber}번으로 전송된 6자리 번호를 입력해주세요.`}
          {step === 3 && "로그인 시 사용할 새로운 비밀번호를 입력해주세요."}
        </p>
      </div>

      <div className="px-6 py-4 flex flex-col gap-5 mt-4">
        {step === 1 && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-[#100d1b] text-sm font-bold ml-1">아이디</label>
              <input 
                className="form-input w-full rounded-2xl border border-[#d3cfe7] h-14 px-5 text-base font-bold focus:ring-2 focus:ring-primary outline-none" 
                placeholder="아이디를 입력하세요" 
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#100d1b] text-sm font-bold ml-1">휴대폰 번호</label>
              <input 
                className="form-input w-full rounded-2xl border border-[#d3cfe7] h-14 px-5 text-base font-bold focus:ring-2 focus:ring-primary outline-none" 
                placeholder="010-0000-0000" 
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[#100d1b] text-sm font-bold">인증번호</label>
              <span className={`text-sm font-bold ${timer < 60 ? 'text-red-500' : 'text-primary'}`}>
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <input 
              className="form-input w-full rounded-2xl border border-[#d3cfe7] h-14 px-5 text-center text-2xl font-black tracking-[0.5em] focus:ring-2 focus:ring-primary outline-none" 
              placeholder="000000" 
              maxLength={6}
              type="tel"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
        )}

        {step === 3 && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-[#100d1b] text-sm font-bold ml-1">새 비밀번호</label>
              <input 
                className="form-input w-full rounded-2xl border border-[#d3cfe7] h-14 px-5 text-base font-bold focus:ring-2 focus:ring-primary outline-none" 
                placeholder="새로운 비밀번호" 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#100d1b] text-sm font-bold ml-1">비밀번호 확인</label>
              <input 
                className="form-input w-full rounded-2xl border border-[#d3cfe7] h-14 px-5 text-base font-bold focus:ring-2 focus:ring-primary outline-none" 
                placeholder="비밀번호를 한 번 더 입력" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <div className="px-6 py-6 mt-auto pb-12">
        <button 
          onClick={step === 1 ? handleSendCode : step === 2 ? handleVerifyCode : handleChangePassword}
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-5 rounded-2xl shadow-lg shadow-primary/25 text-lg active:scale-95 transition-all flex items-center justify-center disabled:bg-slate-300"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            step === 1 ? '인증번호 발송' : step === 2 ? '인증 완료' : '비밀번호 변경하기'
          )}
        </button>
        
        {step === 2 && (
          <button 
            onClick={handleSendCode}
            className="w-full mt-4 text-slate-500 font-bold text-sm underline underline-offset-4"
          >
            인증번호 다시 받기
          </button>
        )}
      </div>

      {/* 프리미엄 모달 UI */}
      {modal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={closeAlert}></div>
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-[340px] overflow-hidden shadow-2xl animate-zoom-in border border-white/20">
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                modal.type === 'success' ? 'bg-green-100 text-green-500' : 
                modal.type === 'error' ? 'bg-red-100 text-red-500' : 
                'bg-blue-100 text-blue-500'
              }`}>
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {modal.type === 'success' ? 'check_circle' : 
                   modal.type === 'error' ? 'error' : 'info'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#100d1b] mb-2">{modal.title}</h3>
              <p className="text-[#594c9a] text-sm font-medium leading-relaxed whitespace-pre-wrap">{modal.message}</p>
            </div>
            <button onClick={closeAlert} className="w-full py-5 bg-slate-50 text-[#100d1b] font-bold text-base hover:bg-slate-100 transition-colors border-t border-slate-100 active:bg-slate-200">
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordScreen;
