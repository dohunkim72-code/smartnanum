import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

/**
 * 세금 환급 가이드 화면 컴포넌트입니다. 📜
 */
const TaxGuideScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden font-display pb-32">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 p-4 flex items-center h-16">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center text-slate-800 active:scale-90 transition-all hover:bg-slate-50 rounded-full"
        >
          <span className="material-symbols-outlined font-bold text-2xl">arrow_back_ios_new</span>
        </button>
        <h2 className="text-[17px] font-black flex-1 text-center pr-10 text-slate-900 tracking-tight">세금 환급 가이드</h2>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="w-full">
          {/* 가이드 이미지 */}
          <img 
            src="/tax_refund_guide.png" 
            alt="세금 환급 가이드" 
            className="w-full h-auto object-contain"
          />
        </div>

        {/* 안내 문구 영역 */}
        <div className="px-6 py-8">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-primary text-2xl font-bold">verified</span>
              <h3 className="text-lg font-black text-slate-900">물품 대금 안내</h3>
            </div>
            <p className="text-[15px] text-slate-700 leading-relaxed font-bold">
              스마트나눔을 통한 기부 시, <span className="text-primary underline underline-offset-4">물품 대금은 환급 금액의 53%</span>가 적용됩니다.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                * 상세한 환급액 계산은 '기부 한도 계산하기' 메뉴에서 확인하실 수 있습니다.<br />
                * 기부 신청 시 해당 비율에 따라 물품 대금이 산정되어 편리하게 이용 가능합니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
};

export default TaxGuideScreen;
