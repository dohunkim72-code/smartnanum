import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 로그인 화면 컴포넌트입니다.
 * 대표님이 주신 디자인(_4)을 기반으로 제작했습니다! 🫡
 */
const LoginScreen = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
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

  const handleLogin = async () => {
    if (!id || !pw) {
      showAlert('알림', '아이디와 비밀번호를 입력해주세요!', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, pw }),
      });

      const data = await response.json();

      if (response.ok) {
        // 로그인 성공: 토큰과 사용자 정보 저장
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('userHpno', data.user.hpno || '');
        localStorage.setItem('userNote', data.user.note || '');
        localStorage.setItem('isLoggedIn', 'true');
        
        // 대시보드로 이동
        navigate('/dashboard');
        window.location.reload();
      } else {
        showAlert('로그인 실패', data.message || '아이디 또는 비밀번호를 확인해주세요.', 'error');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      showAlert('오류', '서버와 통신 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden">
      {/* 상단 뒤로가기 버튼 */}
      <div className="flex items-center bg-transparent p-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 text-primary"
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
      </div>

      {/* 로고 및 타이틀 영역 */}
      <div className="flex flex-col items-center justify-center pt-12 pb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            volunteer_activism
          </span>
        </div>
        <h2 className="text-[#100d1b] tracking-light text-[28px] font-bold leading-tight px-4 text-center">
          기부금 환급의 시작
        </h2>
      </div>

      {/* 입력 폼 영역 */}
      <div className="px-6 py-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[#100d1b] text-base font-medium leading-normal">아이디</label>
          <input 
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="form-input flex w-full rounded-xl text-[#100d1b] border border-[#d3cfe7] bg-white h-14 placeholder:text-[#594c9a]/60 p-[15px] text-base font-normal focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
            placeholder="아이디를 입력하세요" 
            type="text"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[#100d1b] text-base font-medium leading-normal">비밀번호</label>
          <div className="flex w-full items-stretch rounded-xl overflow-hidden border border-[#d3cfe7] focus-within:ring-2 focus-within:ring-primary transition-all">
            <input 
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="form-input flex w-full border-none bg-white text-[#100d1b] focus:outline-none h-14 placeholder:text-[#594c9a]/60 p-[15px] pr-2 text-base font-normal" 
              placeholder="비밀번호를 입력하세요" 
              type={showPassword ? "text" : "password"}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <div 
              className="text-[#594c9a] flex bg-white items-center justify-center pr-[15px] cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-outlined">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 로그인 버튼 */}
      <div className="px-6 py-4">
        <button 
          onClick={handleLogin}
          disabled={loading}
          className={`w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center text-lg active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </div>

      {/* 하단 링크 */}
      <div className="flex justify-center items-center gap-4 py-6 text-sm text-[#594c9a]">
        <button 
          onClick={() => navigate('/find-id')}
          className="hover:underline"
        >
          아이디 찾기
        </button>
        <span className="text-gray-300">|</span>
        <button 
          onClick={() => navigate('/reset-password')}
          className="hover:underline"
        >
          비밀번호 재설정
        </button>
      </div>

      <div className="flex-grow"></div>

      {/* 회원가입 버튼 */}
      <div className="px-6 pb-20">
        <button 
          onClick={() => navigate('/register')}
          className="w-full bg-white border-2 border-primary text-primary font-bold py-4 rounded-xl hover:bg-primary/5 transition-all text-lg active:scale-95"
        >
          회원가입
        </button>
      </div>

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

export default LoginScreen;
