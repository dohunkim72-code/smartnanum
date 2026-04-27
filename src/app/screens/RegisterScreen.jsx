import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

/**
 * 회원가입 화면 컴포넌트입니다.
 * 디자인 가이드(_3)를 기반으로 제작되었습니다.
 */
const RegisterScreen = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    pw: '',
    confirmPw: '', // 비밀번호 확인 추가
    name: '',
    email: '',
    hpno: '',
    referral_code: '',
    note: '' // 소개자 성명
  });
  const [loading, setLoading] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false); // 아이디 중복 확인 여부
  
  // 프리미엄 모달 상태
  const [modal, setModal] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info' // info, success, error
  });

  const [isSmsSent, setIsSmsSent] = useState(false); // SMS 발송 여부
  const [inputCode, setInputCode] = useState(''); // 사용자가 입력한 인증번호
  const [isPhoneVerified, setIsPhoneVerified] = useState(false); // 휴대폰 인증 완료 여부
  const [confirmationResult, setConfirmationResult] = useState(null); // Firebase 인증 결과 객체
  const recaptchaRef = useRef(null);
  const recaptchaVerifier = useRef(null);

  const showAlert = (title, message, type = 'info') => {
    setModal({ show: true, title, message, type });
  };

  const closeAlert = () => {
    setModal(prev => ({ ...prev, show: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 아이디가 변경되면 다시 중복 확인을 하도록 리셋
    if (name === 'id') {
      setIsIdChecked(false);
    }
  };

  const handleCheckId = async () => {
    if (!formData.id) {
      showAlert('알림', '아이디를 입력해주세요!', 'info');
      return;
    }
    if (formData.id.length < 5) {
      showAlert('알림', '아이디는 5자 이상이어야 합니다.', 'info');
      return;
    }

    try {
      const response = await fetch('/api/auth/check-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: formData.id }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isDuplicate) {
          showAlert('중복 확인', '이미 사용 중인 아이디입니다. 😢', 'error');
          setIsIdChecked(false);
        } else {
          showAlert('확인 완료', '사용 가능한 아이디입니다! ✅', 'success');
          setIsIdChecked(true);
        }
      } else {
        showAlert('오류', data.message || '중복 확인 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('중복 확인 에러:', error);
      showAlert('통신 오류', '서버 접속에 실패했습니다. cPanel의 원격 MySQL 설정을 확인해주세요!', 'error');
    }
  };

  const handleRegister = async () => {
    if (!formData.id || !formData.pw || !formData.confirmPw || !formData.name || !formData.email || !formData.hpno || !formData.referral_code) {
      showAlert('알림', '필수 정보를 모두 입력해주세요! (추천인 코드 포함)', 'info');
      return;
    }

    if (formData.pw !== formData.confirmPw) {
      showAlert('알림', '비밀번호가 일치하지 않습니다. 다시 확인해주세요!', 'error');
      return;
    }

    if (!isIdChecked) {
      showAlert('알림', '아이디 중복 확인을 해주세요!', 'info');
      return;
    }

    if (!isPhoneVerified) {
      showAlert('알림', '휴대폰 인증을 완료해주세요!', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('성공', '회원가입이 완료되었습니다! 로그인해주세요. 😊', 'success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showAlert('오류', data.message || '회원가입에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('회원가입 에러:', error);
      showAlert('통신 오류', '서버 접속에 실패했습니다. cPanel의 원격 MySQL 설정을 확인해주세요!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!formData.hpno) {
      showAlert('알림', '휴대폰 번호를 입력해주세요!', 'info');
      return;
    }

    // 휴대폰 번호 정제: 모든 비숫자 제거 후 010... -> +8210... 변환
    let cleanPhone = formData.hpno.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '82' + cleanPhone.substring(1);
    }
    const phoneNumber = '+' + cleanPhone;

    try {
      setLoading(true);
      
      // Recaptcha 초기화 (중복 렌더링 방지)
      if (recaptchaVerifier.current) {
        try {
          recaptchaVerifier.current.clear();
        } catch (e) {
          console.log('Recaptcha clear error:', e);
        }
        recaptchaVerifier.current = null;
      }
      
      const container = document.getElementById('recaptcha-container');
      if (container) container.innerHTML = '';

      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier.current);
      setConfirmationResult(confirmation);
      setIsSmsSent(true);

      // DB 로그 기록 (백그라운드에서 실행, type -> category로 수정)
      fetch('/api/auth/log-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hpno: formData.hpno,
          category: 'REGISTER',
          code: null // Firebase 방식은 번호를 알 수 없음
        }),
      }).catch(err => console.error('SMS Log Error:', err));

      showAlert('인증번호 발송', '휴대폰으로 인증번호가 발송되었습니다. (Firebase)', 'success');
    } catch (error) {
      console.error('SMS 발송 에러:', error);
      
      // 발송 실패 로그 저장 (백그라운드)
      fetch('/api/auth/log-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hpno: formData.hpno,
          category: 'REGISTER',
          send_stat: 'FAIL',
          error_msg: error.message || 'Firebase 발송 에러'
        }),
      }).catch(err => console.error('SMS Fail Log Error:', err));

      let errorMsg = '인증번호 발송 중 오류가 발생했습니다.';
      if (error.code === 'auth/invalid-phone-number') errorMsg = '유효하지 않은 전화번호 형식입니다.';
      if (error.code === 'auth/too-many-requests') errorMsg = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
      showAlert('오류', errorMsg, 'error');
      
      // 에러 발생 시 리캡차 초기화
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!inputCode) {
      showAlert('알림', '인증번호를 입력해주세요!', 'info');
      return;
    }

    if (!confirmationResult) {
      showAlert('알림', '먼저 인증번호를 요청해주세요.', 'info');
      return;
    }

    try {
      setLoading(true);
      const result = await confirmationResult.confirm(inputCode);
      // 인증 성공
      showAlert('인증 성공', '휴대폰 인증이 완료되었습니다! ✅', 'success');
      setIsPhoneVerified(true);
      
      // 인증된 전화번호로 고정 (수정 방지)
      setFormData(prev => ({ ...prev, hpno: result.user.phoneNumber }));
    } catch (error) {
      console.error('인증번호 확인 에러:', error);
      showAlert('인증 실패', '인증번호가 일치하지 않거나 만료되었습니다. 😢', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden">
      {/* 헤더 영역 */}
      <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="flex items-center p-4 justify-between">
          <div 
            className="flex size-10 shrink-0 items-center justify-center cursor-pointer text-[#100d1b]"
            onClick={() => navigate(-1)}
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </div>
          <h2 className="text-lg font-bold leading-tight flex-1 text-center pr-10">회원가입</h2>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 w-full pb-8">
        {/* 진행 단계 표시 */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex gap-6 justify-between items-center">
            <p className="text-base font-medium leading-normal">상세 정보 입력</p>
          </div>
          <div className="rounded-full bg-[#d3cfe7] h-2 overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* 입력 필드들 */}
        <div className="space-y-2">
          {/* 아이디 */}
          <div className="px-4 py-2">
            <label className="flex flex-col">
              <p className="text-sm font-semibold pb-2 px-1">아이디</p>
              <div className="flex gap-2">
                <div className="flex flex-1 items-stretch rounded-xl border border-[#d3cfe7] bg-white overflow-hidden focus-within:border-primary">
                  <input 
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    className="w-full border-none bg-transparent h-14 placeholder:text-[#594c9a]/60 p-4 text-base outline-none focus:ring-0" 
                    placeholder="5~20자 영문, 숫자" 
                  />
                  <div className="flex items-center px-4">
                    {isIdChecked && (
                      <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                    )}
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={handleCheckId}
                  className={`px-4 rounded-xl font-bold text-sm shrink-0 whitespace-nowrap active:scale-95 transition-all ${isIdChecked ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}
                >
                  {isIdChecked ? '확인됨' : '중복확인'}
                </button>
              </div>
            </label>
          </div>

          {/* 비밀번호 */}
          <div className="px-4 py-2">
            <label className="flex flex-col">
              <p className="text-sm font-semibold pb-2 px-1">비밀번호</p>
              <div className="flex flex-col gap-2">
                <input 
                  name="pw"
                  value={formData.pw}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#d3cfe7] bg-white h-14 placeholder:text-[#594c9a]/60 p-4 text-base outline-none focus:border-primary focus:ring-0" 
                  placeholder="영문, 숫자, 특수문자 조합 8자 이상" 
                  type="password"
                />
                <p className="text-[11px] text-[#594c9a] px-1">보안 규칙: 8~16자 이내, 영문/숫자/특수문자 조합</p>
              </div>
            </label>
          </div>

          {/* 비밀번호 확인 */}
          <div className="px-4 py-2">
            <label className="flex flex-col">
              <p className="text-sm font-semibold pb-2 px-1">비밀번호 확인</p>
              <div className="flex flex-col gap-2">
                <input 
                  name="confirmPw"
                  value={formData.confirmPw}
                  onChange={handleChange}
                  className={`w-full rounded-xl border h-14 placeholder:text-[#594c9a]/60 p-4 text-base outline-none focus:ring-0 ${
                    formData.confirmPw 
                      ? (formData.pw === formData.confirmPw ? 'border-green-500 focus:border-green-600' : 'border-red-500 focus:border-red-600')
                      : 'border-[#d3cfe7] focus:border-primary'
                  }`} 
                  placeholder="비밀번호를 한번 더 입력해주세요" 
                  type="password"
                />
                {formData.confirmPw && (
                  <p className={`text-[11px] px-1 ${formData.pw === formData.confirmPw ? 'text-green-500' : 'text-red-500'}`}>
                    {formData.pw === formData.confirmPw ? '✅ 비밀번호가 일치합니다.' : '❌ 비밀번호가 일치하지 않습니다.'}
                  </p>
                )}
              </div>
            </label>
          </div>

          {/* 이름 */}
          <div className="px-4 py-2">
            <label className="flex flex-col">
              <p className="text-sm font-semibold pb-2 px-1">이름</p>
              <input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#d3cfe7] bg-white h-14 placeholder:text-[#594c9a]/60 p-4 text-base outline-none focus:border-primary focus:ring-0" 
                placeholder="실명 입력"
              />
            </label>
          </div>

          {/* 이메일 */}
          <div className="px-4 py-2">
            <label className="flex flex-col">
              <p className="text-sm font-semibold pb-2 px-1">이메일 주소</p>
              <input 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-[#d3cfe7] bg-white h-14 placeholder:text-[#594c9a]/60 p-4 text-base outline-none focus:border-primary focus:ring-0" 
                placeholder="example@email.com" 
                type="email"
              />
            </label>
          </div>

          {/* 휴대폰 번호 */}
          <div className="px-4 py-2">
            <label className="flex flex-col">
              <p className="text-sm font-semibold pb-2 px-1">휴대폰 번호</p>
              <div className="flex gap-2 mb-2">
                <input 
                  name="hpno"
                  value={formData.hpno}
                  onChange={handleChange}
                  className="flex-1 rounded-xl border border-[#d3cfe7] bg-white h-14 placeholder:text-[#594c9a]/60 p-4 text-base outline-none focus:border-primary focus:ring-0" 
                  placeholder="'-' 제외 숫자만 입력" 
                  type="tel"
                  disabled={isPhoneVerified}
                />
                <button 
                  type="button"
                  onClick={handleSendSMS}
                  disabled={isPhoneVerified}
                  className={`px-4 rounded-xl font-bold text-sm shrink-0 whitespace-nowrap active:scale-95 transition-transform ${isPhoneVerified ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}
                >
                  {isPhoneVerified ? '인증완료' : (isSmsSent ? '재전송' : '인증번호 전송')}
                </button>
              </div>
              <div className="relative">
                <input 
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full rounded-xl border border-[#d3cfe7] bg-white h-14 placeholder:text-[#594c9a]/60 p-4 text-base outline-none focus:border-primary focus:ring-0" 
                  placeholder="인증번호 6자리"
                  maxLength={6}
                  disabled={isPhoneVerified}
                />
                {!isPhoneVerified && isSmsSent && (
                  <button 
                    type="button"
                    onClick={handleVerifyCode}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold"
                  >
                    확인
                  </button>
                )}
                {isPhoneVerified && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-green-500">check_circle</span>
                )}
              </div>
              {/* Firebase Recaptcha Container */}
              <div id="recaptcha-container"></div>
            </label>
          </div>

          <div className="h-4"></div>

          {/* 추천인 정보 */}
          <div className="mx-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-sm font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">redeem</span>
              추천인 정보 (필수)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <p className="text-xs text-[#594c9a] mb-1 px-1">추천인 코드</p>
                <input 
                  name="referral_code"
                  value={formData.referral_code}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#d3cfe7] bg-white h-12 placeholder:text-[#594c9a]/40 p-3 text-sm outline-none focus:border-primary focus:ring-0" 
                  placeholder="4자리 코드"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-xs text-[#594c9a] mb-1 px-1">소개자 성명</p>
                <input 
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[#d3cfe7] bg-white h-12 placeholder:text-[#594c9a]/40 p-3 text-sm outline-none focus:border-primary focus:ring-0" 
                  placeholder="소개자 이름"
                />
              </div>
            </div>
          </div>


      {/* 가입 버튼 */}
          <div className="px-4 pb-8">
            <button 
              onClick={handleRegister}
              disabled={loading}
              className={`w-full bg-primary text-white font-bold h-14 rounded-xl text-lg shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </div>
        </div>
      </main>

      {/* 프리미엄 모달 UI */}
      {modal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* 배경 오버레이 */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
            onClick={closeAlert}
          ></div>
          
          {/* 모달 컨텐츠 */}
          <div className="relative bg-white rounded-[40px] p-8 shadow-2xl flex flex-col items-center gap-6 w-full max-w-[340px] animate-zoom-in border border-white/20">
            {/* 아이콘 영역 */}
            <div className="relative">
              <div className={`absolute inset-0 rounded-full blur-xl animate-pulse ${
                modal.type === 'success' ? 'bg-green-400/20' : 
                modal.type === 'error' ? 'bg-red-400/20' : 'bg-primary/20'
              }`}></div>
              <div className={`relative size-20 rounded-full flex items-center justify-center shadow-xl ${
                modal.type === 'success' ? 'bg-gradient-to-tr from-green-400 to-green-600 shadow-green-500/30' : 
                modal.type === 'error' ? 'bg-gradient-to-tr from-red-400 to-red-600 shadow-red-500/30' : 
                'bg-gradient-to-tr from-primary to-[#6e4ff5] shadow-primary/30'
              }`}>
                <span className="material-symbols-outlined text-white text-4xl font-bold">
                  {modal.type === 'success' ? 'check_circle' : 
                   modal.type === 'error' ? 'error' : 'info'}
                </span>
              </div>
            </div>
    
            {/* 텍스트 영역 */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{modal.title}</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed whitespace-pre-wrap">
                {modal.message}
              </p>
            </div>
            
            <button 
              onClick={closeAlert}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-lg"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterScreen;
