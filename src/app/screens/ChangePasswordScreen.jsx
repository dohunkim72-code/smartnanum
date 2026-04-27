import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 비밀번호 변경 화면 컴포넌트입니다.
 * 디자인 시안(_10)을 기반으로 제작되었습니다. ✨
 * 보안 규칙 3, 4번 항목은 요청에 따라 삭제되었습니다.
 */
const ChangePasswordScreen = () => {
  const navigate = useNavigate();
  
  // 상태 관리
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
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
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showModal('입력 오류', '모든 필드를 입력해주세요!', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showModal('입력 오류', '새 비밀번호가 일치하지 않습니다.\n다시 확인해주세요!', true);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showModal('변경 완료', '비밀번호가 성공적으로 변경되었습니다!\n안전한 이용을 위해 다시 로그인해 주세요.', false, () => {
          // 로그아웃 처리 후 로그인 페이지로 이동
          localStorage.clear();
          navigate('/login');
          window.location.reload();
        });
      } else {
        showModal('변경 실패', data.message || '비밀번호 변경 중 오류가 발생했습니다.', true);
      }
    } catch (error) {
      console.error('비밀번호 변경 에러:', error);
      showModal('오류', '서버와 통신 중 오류가 발생했습니다.', true);
    }
  };

  return (
    <div className="bg-background-light min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden font-display shadow-2xl bg-white">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-gray-50">
        <button 
          onClick={() => navigate(-1)}
          className="flex size-12 items-center justify-center text-[#100d1b] active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-[#100d1b] text-lg font-bold leading-tight flex-1 text-center pr-12">비밀번호 변경</h2>
      </header>

      <main className="flex-1 overflow-y-auto pb-10">
        {/* 헤드라인 섹션 */}
        <div className="px-5 pb-6 pt-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <h3 className="text-[#100d1b] tracking-tight text-2xl font-black leading-tight">
            새로운 비밀번호를<br/>설정해주세요
          </h3>
          <p className="text-[#594c9a] opacity-70 text-sm mt-3 font-medium">안전한 계정 관리를 위해 주기적인 비밀번호 변경을 권장합니다.</p>
        </div>

        <div className="flex flex-col gap-5 px-5">
          {/* 현재 비밀번호 */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[#100d1b] text-[15px] font-black px-1 ml-1">현재 비밀번호</p>
            <div className="relative group">
              <input 
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-16 bg-white border border-[#d3cfe7] rounded-2xl px-5 pr-14 text-[#100d1b] font-medium text-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-300 shadow-sm"
                placeholder="현재 비밀번호 입력"
              />
              <button 
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">{showCurrent ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[#100d1b] text-[15px] font-black px-1 ml-1">새 비밀번호</p>
            <div className="relative group">
              <input 
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-16 bg-white border border-[#d3cfe7] rounded-2xl px-5 pr-14 text-[#100d1b] font-medium text-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-300 shadow-sm"
                placeholder="새 비밀번호 입력"
              />
              <button 
                onClick={() => setShowNew(!showNew)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">{showNew ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {/* 새 비밀번호 확인 */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[#100d1b] text-[15px] font-black px-1 ml-1">새 비밀번호 확인</p>
            <div className="relative group">
              <input 
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-16 bg-white border border-[#d3cfe7] rounded-2xl px-5 pr-14 text-[#100d1b] font-medium text-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-300 shadow-sm"
                placeholder="새 비밀번호 다시 입력"
              />
              <button 
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">{showConfirm ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 보안 규칙 섹션 */}
        <div className="mx-5 mt-8 p-5 rounded-2xl bg-primary/[0.03] border border-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
          <h4 className="text-primary text-[14px] font-black mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            비밀번호 보안 규칙
          </h4>
          <ul className="text-[13px] text-[#594c9a] space-y-2 font-medium opacity-80">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1 h-1 bg-primary rounded-full shrink-0"></span>
              영문 대소문자, 숫자, 특수문자 중 3종류 이상 조합
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1 h-1 bg-primary rounded-full shrink-0"></span>
              8자 이상 16자 이하로 설정
            </li>
          </ul>
        </div>
      </main>

      {/* 하단 버튼 */}
      <footer className="p-5 bg-white border-t border-gray-100 pb-10">
        <button 
          onClick={handleUpdate}
          className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-2"
        >
          <span>비밀번호 변경 완료</span>
          <span className="material-symbols-outlined">check_circle</span>
        </button>
      </footer>

      {/* 팝업 메시지 박스 (모달) */}
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
              <p className="text-slate-500 font-medium mb-8 leading-relaxed whitespace-pre-line">
                {modalState.message}
              </p>
              
              <button 
                onClick={closeModal}
                className={`w-full text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all ${modalState.isError ? 'bg-red-500 shadow-red-500/20' : 'bg-primary shadow-primary/20'}`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangePasswordScreen;
