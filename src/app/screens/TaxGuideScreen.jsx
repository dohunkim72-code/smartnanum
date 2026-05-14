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
        
        {/* 환급 예시 표 섹션 ✨ */}
        <section className="px-6 pb-12">
          <div className="flex items-center gap-2 mb-4 px-1">
            <span className="material-symbols-outlined text-primary">analytics</span>
            <h4 className="text-base font-bold text-slate-800">연봉별 환급 및 물품대금 예시</h4>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-4 text-center whitespace-nowrap">년 근로소득금액</th>
                    <th className="px-3 py-4 text-center whitespace-nowrap">기부금 한도</th>
                    <th className="px-3 py-4 text-center whitespace-nowrap">예상환급금</th>
                    <th className="px-3 py-4 text-center whitespace-nowrap">물품대금</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { income: '34,000,000', limit: '10,200,000', refund: '1,560,000', payment: '826,800' },
                    { income: '50,000,000', limit: '15,000,000', refund: '3,000,000', payment: '1,590,000' },
                    { income: '70,000,000', limit: '21,000,000', refund: '4,800,000', payment: '2,544,000' },
                    { income: '100,000,000', limit: '30,000,000', refund: '7,500,000', payment: '3,975,000' },
                    { income: '150,000,000', limit: '45,000,000', refund: '12,000,000', payment: '6,360,000' },
                    { income: '200,000,000', limit: '60,000,000', refund: '16,500,000', payment: '8,745,000' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-4 text-right font-medium text-slate-600">{row.income}</td>
                      <td className="px-3 py-4 text-right font-medium text-slate-600">{row.limit}</td>
                      <td className="px-3 py-4 text-right font-black text-primary">{row.refund}</td>
                      <td className="px-3 py-4 text-right font-black text-slate-900">{row.payment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 px-2 text-[11px] text-slate-400 font-medium leading-tight">
            * 위 표는 이해를 돕기 위한 예시이며, 실제 환급액은 개인별 소득 및 공제 항목(부양가족 등)에 따라 홈택스 최종 결정 시 차이가 발생할 수 있습니다.
          </p>
        </section>
      </main>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
};

export default TaxGuideScreen;
