import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 아이디 찾기 화면 컴포넌트입니다.
 * 알리고(Aligo) SMS 인증을 통해 아이디를 찾는 기능을 제공합니다.
 */
const FindIdScreen = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [foundId, setFoundId] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    setModal(prev => ({ ...prev, show: false }));
  };

  // 입력 필드 참조를 위한 ref 배열
  const inputRefs = useRef([]);

  // 타이머 로직
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && isCodeSent) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, isCodeSent]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 휴대폰 번호 포맷팅 (010-0000-0000)
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

  // 인증번호 입력 핸들러
  const handleCodeChange = (index, value) => {
    if (/[^0-9]/.test(value)) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);

    // 다음 입력란으로 포커스 이동
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // 백스페이스 시 이전 입력란으로 이동
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // 인증번호 전송 (Aligo 방식)
  const handleSendCode = async () => {
    const rawPhoneNumber = phoneNumber.replace(/-/g, '');
    if (rawPhoneNumber.length < 10) {
      showAlert('알림', '올바른 휴대폰 번호를 입력해주세요.', 'info');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      // 1. 해당 번호로 가입된 사용자가 있는지 먼저 확인
      const checkRes = await fetch('/api/auth/check-phone-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hpno: rawPhoneNumber }),
      });
      const checkData = await checkRes.json();
      
      if (!checkRes.ok) {
        showAlert('알림', checkData.message || '가입되지 않은 번호입니다.', 'info');
        setLoading(false);
        return;
      }

      // 2. 서버를 통해 알리고 SMS 발송 요청
      const response = await fetch('/api/auth/find-id/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hpno: rawPhoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCodeSent(true);
        setTimer(180); // 3분
        setVerificationCode(['', '', '', '', '', '']);
        showAlert('전송 완료', '인증번호가 발송되었습니다.', 'success');
        
        setTimeout(() => {
          if (inputRefs.current[0]) inputRefs.current[0].focus();
        }, 100);
      } else {
        showAlert('오류', data.message || '인증번호 발송에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('SMS 발송 오류:', error);
      showAlert('오류', '서버 통신 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 아이디 확인 (우리 서버 API 호출)
  const handleFindId = async () => {
    const codeString = verificationCode.join('');
    if (codeString.length < 6) {
      showAlert('알림', '인증번호 6자리를 모두 입력해주세요.', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/find-id/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hpno: phoneNumber.replace(/-/g, ''),
          code: codeString
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFoundId(data.id);
        setShowResultModal(true);
      } else {
        showAlert('인증 실패', data.message || '인증번호가 일치하지 않습니다.', 'error');
      }
    } catch (error) {
      console.error('아이디 찾기 에러:', error);
      showAlert('오류', '서버 통신 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden font-display relative">
      {/* 상단 뒤로가기 버튼 */}
      <div className="flex items-center bg-transparent p-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 text-primary active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined font-bold">arrow_back_ios</span>
        </button>
        <h1 className="text-lg font-black flex-1 text-center pr-10 text-slate-900">아이디 찾기</h1>
      </div>

      <div className="flex flex-col items-center justify-center pt-8 pb-6">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            person_search
          </span>
        </div>
        <h2 className="text-[#100d1b] tracking-tight text-2xl font-bold px-4 text-center">
          가입 시 등록한 휴대폰 번호로<br/>아이디를 찾을 수 있습니다.
        </h2>
      </div>

      <div className="px-6 py-6 flex flex-col gap-8">
        {/* 휴대폰 번호 입력 */}
        <div className="flex flex-col gap-2">
          <label className="text-[#100d1b] text-base font-bold ml-1">휴대폰 번호</label>
          <div className="flex gap-2">
            <input 
              className="form-input flex-1 rounded-xl text-[#100d1b] border border-[#d3cfe7] bg-white h-14 placeholder:text-[#594c9a]/60 p-[15px] text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm" 
              placeholder="010-0000-0000" 
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={isCodeSent && timer > 0}
            />
            <button 
              onClick={handleSendCode}
              disabled={loading || (isCodeSent && timer > 150)} // 30초 후 재전송 가능
              className={`px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap shadow-sm ${
                (loading || (isCodeSent && timer > 150))
                ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                : 'bg-primary text-white active:scale-95'
              }`}
            >
              {loading ? '전송중...' : (isCodeSent ? '재전송' : '인증번호 전송')}
            </button>
          </div>
        </div>

        {/* 인증번호 입력 (6자리 개별 박스) */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[#100d1b] text-base font-bold">인증번호 6자리</label>
            {isCodeSent && timer > 0 && (
              <span className="text-red-500 font-bold text-sm flex items-center gap-1 animate-pulse">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {formatTime(timer)}
              </span>
            )}
          </div>
          
          <div className="flex gap-2 justify-between">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                className={`w-12 h-14 rounded-xl border text-center text-2xl font-black focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm ${
                  !isCodeSent 
                  ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' 
                  : digit 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-slate-300 bg-white'
                }`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={!isCodeSent}
                placeholder="-"
              />
            ))}
          </div>

          {!isCodeSent && (
            <p className="text-center text-sm text-slate-400 font-medium mt-1">
              인증번호 전송 버튼을 눌러주세요.
            </p>
          )}
        </div>
      </div>

      <div className="px-6 py-4 mt-auto pb-20">
        <button 
          onClick={handleFindId}
          disabled={!isCodeSent || verificationCode.some(d => d === '')}
          className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center text-lg active:scale-95 ${
            isCodeSent && !verificationCode.some(d => d === '')
            ? 'bg-primary text-white shadow-primary/20'
            : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
          }`}
        >
          아이디 확인
        </button>
      </div>


      {/* 결과 알림 팝업 (모달) */}
      {showResultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
            onClick={() => setShowResultModal(false)}
          ></div>
          
          <div className="relative bg-white rounded-[40px] p-8 shadow-2xl flex flex-col items-center gap-6 w-full max-w-[340px] animate-zoom-in border border-white/20">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative size-20 bg-gradient-to-tr from-primary to-[#6e4ff5] rounded-full flex items-center justify-center shadow-xl shadow-primary/30">
                <span className="material-symbols-outlined text-white text-4xl font-bold">check_circle</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">아이디 찾기 성공</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                고객님의 아이디는 다음과 같습니다.
              </p>
            </div>

            <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">
              <span className="text-2xl font-black text-primary tracking-tight">{foundId}</span>
            </div>
            
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-lg"
            >
              로그인하기
            </button>
          </div>
        </div>
      )}

      {/* 프리미엄 모달 UI (일반 알림용) */}
      {modal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
            onClick={closeAlert}
          ></div>
          
          <div className="relative bg-white rounded-[40px] p-8 shadow-2xl flex flex-col items-center gap-6 w-full max-w-[340px] animate-zoom-in border border-white/20">
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

export default FindIdScreen;
