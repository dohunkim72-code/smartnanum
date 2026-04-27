import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

/**
 * 메인 대시보드 화면 컴포넌트입니다.
 * 디자인_2 시안을 바탕으로 고도화된 UI를 제공합니다.
 */
const DashboardScreen = () => {
  const navigate = useNavigate();

  // localStorage에서 로그인한 사용자 정보를 가져옵니다.
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || "고객";

  const menuItems = [
    { icon: 'calculate', label: '기부 한도 조회', subLabel: '최대 금액 계산', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-50', path: '/calculator' },
    { icon: 'receipt_long', label: '기부 내역 확인', subLabel: '내 활동 보기', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-50', path: '/donation-history' },

    { icon: 'person_edit', label: '회원정보 수정', subLabel: '개인정보 관리', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-50', path: '/profile' },
    { icon: 'lock_reset', label: '비밀번호 변경', subLabel: '보안 설정 강화', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-50', path: '/change-password' },
  ];

  return (
    <div className="bg-background-light min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden font-display">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-5 h-16">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">스마트나눔</h1>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-red-500 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>로그아웃</span>
          </button>
        </div>
      </header>

      <main className="px-5 pb-32">
        {/* 환영 섹션 */}
        <section className="pt-8 pb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-2xl font-medium text-gray-800 leading-tight">
            <span className="text-indigo-blue font-black text-3xl">{userName}</span>님, 안녕하세요 👋
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">따뜻한 나눔으로 세상을 더 밝게 만들어주세요.</p>
        </section>

        {/* 메인 액션 카드: 기부 신청하기 */}
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div 
            onClick={() => {
              localStorage.removeItem('termsAgreed_status');
              localStorage.removeItem('donation_temp_form');
              navigate('/donation');
            }}
            className="bg-gradient-to-br from-[#3713ec] via-[#4e2cf3] to-[#7154f7] rounded-[2rem] p-7 flex justify-between items-center shadow-[0_20px_40px_rgba(55,19,236,0.25)] cursor-pointer active:scale-[0.97] transition-all group overflow-hidden relative border border-white/10"
          >
            {/* 배경 장식 요소 */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                <p className="text-white/70 text-[11px] font-black tracking-[0.2em] uppercase">Ready to help</p>
              </div>
              <h2 className="text-white text-2xl font-black tracking-tight drop-shadow-sm">기부 신청하기</h2>
              <p className="text-white/80 text-xs font-medium">당신의 따뜻한 마음을 지금 전하세요</p>
            </div>
            
            <div className="relative z-10 bg-white/20 backdrop-blur-md p-4 rounded-2xl group-hover:rotate-[15deg] group-hover:scale-110 transition-all duration-500 border border-white/20 shadow-inner">
              <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                volunteer_activism
              </span>
            </div>
          </div>
        </section>

        {/* 메뉴 그리드 */}
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(item.path)}
                className={`bg-white p-5 rounded-2xl border ${item.borderColor} flex flex-col gap-4 shadow-sm hover:shadow-md cursor-pointer active:scale-95 transition-all group`}
              >
                <div className={`w-10 h-10 ${item.bgColor} ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined font-bold">{item.icon}</span>
                </div>
                <div>
                  <p className="font-black text-gray-900 text-[15px] tracking-tight">{item.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{item.subLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 가이드 배너 */}
        <section className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div 
            onClick={() => navigate('/tax-guide')}
            className="relative overflow-hidden rounded-2xl h-32 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md group cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
            <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            
            <div className="relative h-full w-full p-6 flex flex-col justify-center">
              <span className="text-[10px] bg-white/20 text-white w-fit px-2 py-0.5 rounded-full mb-2 font-black tracking-widest">GUIDE</span>
              <h3 className="text-white text-lg font-black leading-tight tracking-tight">세금 환급 가이드</h3>
              <p className="text-white/80 text-xs mt-1 font-medium">기부금 공제 혜택 놓치지 마세요</p>
            </div>
            
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-30 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-white">request_quote</span>
            </div>
          </div>
        </section>
      </main>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
};

export default DashboardScreen;
