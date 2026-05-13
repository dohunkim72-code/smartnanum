import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

/**
 * 회원정보 수정 화면 컴포넌트입니다.
 * 알리고 SMS API를 사용하여 실제 SMS 인증을 지원합니다. ✨
 */
const ProfileEditScreen = () => {
  const navigate = useNavigate();
  const [isLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // 상태 관리
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.hpno || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timer, setTimer] = useState(180); // 3분
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // 모달 상태 관리
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    isError: false,
    onConfirm: null
  });

  const showModal = (title, message, isError = false, onConfirm = null) => {
    setModalState({
      isOpen: true,
      title,
      message,
      isError,
      onConfirm
    });
  };

  const closeModal = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    setModalState({ ...modalState, isOpen: false });
  };

  // 타이머 로직
  useEffect(() => {
    let interval;
    if (isVerifying && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isVerifying, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };


  // 알리고 SMS 인증번호 발송 요청
  const handleSendSMS = async () => {
    if (!phone) {
      showModal('입력 오류', '휴대폰 번호를 입력해주세요! 📱', true);
      return;
    }

    if (loading) return;
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hpno: phone,
          category: 'PROFILE_EDIT',
          cust_no: user.cust_no
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsVerifying(true);
        setIsVerified(false);
        setTimer(180);
        setOtp(['', '', '', '', '', '']);
        showModal('인증번호 발송', '인증번호가 발송되었습니다. ✉️');
      } else {
        showModal('발송 실패', data.message || '인증번호 발송 중 오류가 발생했습니다.', true);
      }
    } catch (error) {
      console.error('SMS 발송 오류:', error);
      showModal('발송 실패', '네트워크 오류가 발생했습니다.', true);
    } finally {
      setLoading(false);
    }
  };

  // 인증번호 확인 로직
  const handleVerifySMS = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      showModal('인증 실패', '인증번호 6자리를 모두 입력해주세요.', true);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-profile-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hpno: phone, code: enteredOtp }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsVerified(true);
        setIsVerifying(false);
        showModal('인증 성공', '휴대폰 인증이 완료되었습니다! ✅');
      } else {
        showModal('인증 실패', data.message || '인증번호가 올바르지 않습니다.', true);
      }
    } catch (error) {
      console.error('인증 실패:', error);
      showModal('인증 실패', '네트워크 오류가 발생했습니다.', true);
    }
  };

  const handleSave = async () => {
    // 폰 번호가 바뀌었는데 인증되지 않은 경우
    if (phone !== user.hpno && !isVerified) {
      showModal('인증 필요', '변경된 휴대폰 번호의 인증을 완료해주세요.', true);
      return;
    }

    // 이메일 형식 체크
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showModal('입력 오류', '올바른 이메일 형식을 입력해주세요! ✉️', true);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, hpno: phone }),
      });

      const data = await response.json();

      if (response.ok) {
        // 로컬 스토리지 업데이트
        const updatedUser = { ...user, email, hpno: phone };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        showModal('저장 완료', '회원정보가 안전하게 저장되었습니다! ✅', false, () => {
          navigate('/dashboard');
        });
      } else {
        showModal('저장 실패', data.message || '정보 저장 중 오류가 발생했습니다.', true);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showModal('네트워크 오류', '서버와 통신 중 오류가 발생했습니다.', true);
    }
  };

  return (
    <div className="bg-background-light min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden pb-32 font-display">

      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md p-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex size-12 items-center justify-center text-[#100d1b] active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-[#100d1b] text-lg font-bold leading-tight flex-1 text-center pr-12">회원정보 수정</h2>
      </header>

      <main className="flex flex-col gap-8 p-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* 읽기 전용 섹션 */}
        <section className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 h-16 border-b border-gray-50">
            <p className="text-gray-400 text-sm font-bold">아이디</p>
            <div className="flex items-center gap-2">
              <p className="text-[#100d1b] font-medium">{user.id || '-'}</p>
              <span className="material-symbols-outlined text-gray-300 text-lg">lock</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-5 h-16">
            <p className="text-gray-400 text-sm font-bold">이름</p>
            <div className="flex items-center gap-2">
              <p className="text-[#100d1b] font-medium">{user.name || '-'}</p>
              <span className="material-symbols-outlined text-gray-300 text-lg">lock</span>
            </div>
          </div>
        </section>

        {/* 수정 가능 섹션 */}
        <section className="flex flex-col gap-6">
          <h3 className="text-[#100d1b] text-[15px] font-black px-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            연락처 정보
          </h3>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-[#100d1b] text-[14px] font-black px-1 ml-1 opacity-60 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                이메일 주소
              </label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[22px]">alternate_email</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[72px] bg-white border border-gray-100 rounded-[1.5rem] pl-14 pr-6 text-[#100d1b] font-bold text-lg shadow-[0_8px_20px_-8px_rgba(0,0,0,0.05)] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-300"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[#100d1b] text-[14px] font-black px-1 ml-1 opacity-60 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">smartphone</span>
                휴대폰 번호
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[22px]">phone_iphone</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (e.target.value !== user.hpno) setIsVerified(false);
                      else setIsVerified(true);
                    }}
                    className="w-full h-[72px] bg-white border border-gray-100 rounded-[1.5rem] pl-14 pr-6 text-[#100d1b] font-black text-lg shadow-[0_8px_20px_-8px_rgba(0,0,0,0.05)] focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-300"
                    placeholder="010-0000-0000"
                  />
                </div>
                {phone !== user.hpno && !isVerified && (
                  <button
                    onClick={handleSendSMS}
                    disabled={loading}
                    className={`px-6 h-[72px] text-white font-black rounded-[1.5rem] text-[15px] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 ${
                      loading 
                      ? 'bg-slate-400 shadow-none cursor-not-allowed' 
                      : 'bg-gradient-to-br from-primary to-[#5a3df3] shadow-primary/20'
                    }`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    )}
                    {loading ? '처리중' : '인증요청'}
                  </button>
                )}
              </div>
              {isVerified && phone !== user.hpno && (
                <p className="text-primary text-xs font-bold px-2 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  인증이 완료되었습니다.
                </p>
              )}
            </div>

            {isVerifying && (
              <div className="flex flex-col gap-4 p-5 bg-primary/5 rounded-[1.5rem] border border-primary/10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-xl"></div>
                <div className="flex justify-between items-center relative z-10">
                  <p className="text-primary text-sm font-black tracking-tight">인증번호 입력</p>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm">
                    <span className="material-symbols-outlined text-[14px] text-primary font-bold">schedule</span>
                    <span className="text-primary text-xs font-black tabular-nums">{formatTime(timer)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2.5 relative z-10">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-full aspect-square text-center rounded-xl border border-primary/20 bg-white text-lg font-black text-primary focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all"
                      placeholder="·"
                    />
                  ))}
                </div>
                <button
                  onClick={handleVerifySMS}
                  className="w-full h-14 bg-primary text-white font-black rounded-xl text-[15px] active:scale-95 transition-all shadow-md mt-2"
                >
                  인증확인
                </button>
              </div>
            )}
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={handleSave}
            className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all text-lg"
          >
            저장하기
          </button>
          <button className="w-full py-3 text-gray-400 text-sm font-bold hover:text-red-400 transition-colors">
            회원 탈퇴
          </button>
        </div>
      </main>

      {isLoggedIn && <BottomNav />}

      {modalState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[360px] rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${modalState.isError ? 'bg-red-50' : 'bg-primary/10'}`}>
                <span className={`material-symbols-outlined text-4xl font-bold ${modalState.isError ? 'text-red-500' : 'text-primary'}`}>
                  {modalState.isError ? 'error' : 'check_circle'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{modalState.title}</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed whitespace-pre-line">{modalState.message}</p>
              <button onClick={closeModal} className={`w-full text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all ${modalState.isError ? 'bg-red-500 shadow-red-500/20' : 'bg-primary shadow-primary/20'}`}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileEditScreen;
