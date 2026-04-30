import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

/**
 * 기부 한도 및 환급액 계산 화면 컴포넌트입니다.
 * 
 * 주요 기능:
 * 1. 연봉/월급 기준 전환 및 소득 입력 (콤마 자동 서식)
 * 2. 기부 한도(30%) 및 추천 한도(95%) 자동 계산
 * 3. 기부 예정 금액에 따른 누진 환급액 산출 (15%/30%)
 * 4. 로그인 고객 전용 '예상 물품 대금' (53%) 안내
 * 5. 직관적인 입력 가이드 이미지 및 텍스트 제공
 */
const DonationLimitScreen = () => {
  const navigate = useNavigate();
  const [salary, setSalary] = useState('0');
  const [plannedDonation, setPlannedDonation] = useState('0');
  const [donationType, setDonationType] = useState('annual'); // 'annual' or 'monthly'

  // 로그인 여부 확인 (localStorage 기반)
  const [isLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');

  const [showGuide, setShowGuide] = useState(false); // 가이드 표시 상태 추가

  // 숫자에 콤마 추가/제거 핸들러
  const handleMoneyChange = (value, setter) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setter(numValue ? parseInt(numValue).toLocaleString() : '');
  };

  // 🌟 계산 로직
  const getBaseIncome = () => {
    const numSalary = parseInt(salary.replace(/,/g, '')) || 0;
    return donationType === 'annual' ? numSalary : numSalary * 12;
  };

  // 1. 기부 한도: 소득의 30%
  const calculateLimit = () => {
    const baseIncome = getBaseIncome();
    return Math.floor(baseIncome * 0.3);
  };

  // 2. 추천 기부 한도: 기부 한도의 95%
  const calculateRecommendLimit = () => {
    const limit = calculateLimit();
    return Math.floor(limit * 0.95);
  };

  // 3. 예상 환급액 산출 공식 (누진 적용)
  // - 10,000,000까지: 15%
  // - 10,000,000 초과분: 30%
  const calculateRefund = () => {
    const amount = parseInt(plannedDonation.replace(/,/g, '')) || 0;
    if (amount <= 10000000) {
      return Math.floor(amount * 0.15);
    } else {
      const basicRefund = 10000000 * 0.15; // 150만원
      const excessRefund = (amount - 10000000) * 0.3;
      return Math.floor(basicRefund + excessRefund);
    }
  };

  // 4. 예상 물품 대금 (로그인 고객 전용): 예상 환급액의 53%
  const calculateGoodsPayment = () => {
    const refund = calculateRefund();
    return Math.floor(refund * 0.53);
  };

  return (
    <div className="bg-[#F9FBFF] min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden pb-32 font-display">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-100 p-4 flex items-center h-16 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center text-slate-800 active:scale-90 transition-all hover:bg-slate-50 rounded-full"
        >
          <span className="material-symbols-outlined font-bold text-2xl">arrow_back_ios_new</span>
        </button>
        <h2 className="text-[17px] font-black flex-1 text-center pr-10 text-slate-900 tracking-tight">기부 한도 및 환급액 산출</h2>
      </header>

      <main className="p-6 flex flex-col gap-8">
        {/* 선택 탭: 연봉 vs 월급 */}
        <div className="bg-slate-100/80 p-1.5 rounded-[1.25rem] flex items-center shadow-inner border border-slate-200/50">
          <button
            onClick={() => setDonationType('annual')}
            className={`flex-1 py-3.5 rounded-[1rem] text-[15px] font-extrabold transition-all duration-500 ${donationType === 'annual'
                ? 'bg-white shadow-[0_4px_12px_rgba(55,19,236,0.12)] text-primary scale-[1.02]'
                : 'text-slate-400 hover:text-slate-500'
              }`}
          >
            연봉 기준
          </button>
          <button
            onClick={() => setDonationType('monthly')}
            className={`flex-1 py-3.5 rounded-[1rem] text-[15px] font-extrabold transition-all duration-500 ${donationType === 'monthly'
                ? 'bg-white shadow-[0_4px_12px_rgba(55,19,236,0.12)] text-primary scale-[1.02]'
                : 'text-slate-400 hover:text-slate-500'
              }`}
          >
            월급 기준
          </button>
        </div>

        {/* 소득 정보 입력 */}
        <section className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

          <div className="relative z-10 flex flex-col gap-6">
            <h3 className="text-[17px] font-black flex items-center gap-2.5 text-slate-900">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl text-xl font-bold">account_balance_wallet</span>
              나의 소득 정보 입력
            </h3>

            <div className="flex flex-col gap-3.5">
              <label className="text-[14px] text-slate-500 font-bold px-1 ml-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                {donationType === 'annual' ? '연간 총 급여 (비과세 제외)' : '월 평균 실수령액'}
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => handleMoneyChange(e.target.value, setSalary)}
                  className="w-full h-18 bg-slate-50 border-2 border-transparent rounded-2xl px-6 text-2xl font-black text-slate-900 focus:bg-white focus:border-primary/30 focus:ring-8 focus:ring-primary/5 transition-all outline-none"
                  placeholder="0"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">원</span>
              </div>
            </div>
          </div>
        </section>

        {/* 정확한 입력을 위한 가이드 */}
        <section className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
          <div className="flex flex-col gap-6">
            <h3 className="text-[16px] font-black flex items-center gap-2.5 text-slate-900">
              <span className="material-symbols-outlined text-amber-500 bg-amber-50 p-2 rounded-xl text-xl font-bold">tips_and_updates</span>
              입력 가이드
            </h3>

            <div className="flex flex-col gap-4">
              {donationType === 'annual' ? (
                <div className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-lg font-black text-[11px] shrink-0 h-fit border border-red-100">必</span>
                  <p className="text-[14px] text-slate-700 leading-relaxed font-semibold">
                    근로소득 원천징수서 영수증의 <span className="bg-yellow-100 text-yellow-800 font-black px-1.5 py-0.5 rounded-md border border-yellow-200 mx-0.5 shadow-sm">23. 근로소득금액</span>을 입력하시면 가장 정확합니다.
                  </p>
                </div>
              ) : (
                <div className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="bg-primary/5 text-primary px-2.5 py-1 rounded-lg font-black text-[11px] shrink-0 h-fit border border-primary/10 uppercase tracking-tight">Info</span>
                  <p className="text-[14px] text-slate-700 leading-relaxed font-semibold">
                    월 급여 입력 시: <span className="text-primary font-black underline underline-offset-4 decoration-primary/20">급여계 - 식대 - 교통비 - 육아근로수당</span>을 뺀 순수 급여 금액을 입력해 주세요.
                  </p>
                </div>
              )}

              {/* 이미지 토글 버튼 */}
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">{showGuide ? 'visibility_off' : 'visibility'}</span>
                {showGuide ? '설명 이미지 숨기기' : '설명 이미지 보기'}
              </button>

              {showGuide && (
                <div className="mt-2 rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white animate-in fade-in zoom-in-95 duration-300">
                  <img
                    src={donationType === 'annual' ? "/annual_guide.png" : "/monthly_guide_v2.png"}
                    alt="입력 가이드 이미지"
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 결과 섹션: 기부 예정 금액 및 환급액 카드 */}
        <section className="bg-[#12111E] rounded-[2.5rem] p-9 shadow-2xl text-white relative overflow-hidden group">
          {/* 장식용 요소 */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-[80px] group-hover:bg-primary/30 transition-all duration-1000"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px]"></div>

          <div className="flex flex-col gap-8 relative z-10">
            {/* 계산 결과 그리드 */}
            <div className="grid grid-cols-1 gap-8">
              {/* 기부 한도 */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-[13px] font-bold tracking-wider uppercase">나의 기부 한도</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-white tracking-tight">{calculateLimit().toLocaleString()}</h4>
                  <span className="text-lg font-bold text-white/30">원</span>
                </div>
              </div>

              {/* 추천 기부 한도 */}
              <div className="bg-white/5 p-6 rounded-[1.75rem] border border-white/5 relative overflow-hidden group/recommend">
                <p className="text-primary text-[13px] font-black mb-2 tracking-widest uppercase">추천 기부 한도</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-4xl font-black text-primary tracking-tight drop-shadow-[0_0_20px_rgba(55,19,236,0.6)]">
                    {calculateRecommendLimit().toLocaleString()}
                  </h4>
                  <span className="text-xl font-bold text-primary/80">원</span>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full"></div>

              {/* 기부 예정 금액 입력 (추천 한도 아래로 이동) */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-[13px] font-black tracking-widest uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    기부 예정 금액 입력
                  </p>
                </div>
                <div className="relative group/input">
                  <input
                    type="text"
                    value={plannedDonation}
                    onChange={(e) => handleMoneyChange(e.target.value, setPlannedDonation)}
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-[1.25rem] px-6 text-3xl font-black text-white focus:bg-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/20 outline-none transition-all shadow-inner"
                    placeholder="0"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-white/30 text-xl">원</span>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full"></div>

              {/* 예상 환급액 */}
              <div className="flex flex-col gap-5 pt-2">
                <div className="flex justify-between items-end border-b border-white/10 pb-6">
                  <div>
                    <p className="text-white/40 text-[12px] font-black mb-1.5 tracking-widest uppercase">예상 환급액</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white tracking-tighter">+{calculateRefund().toLocaleString()}</span>
                      <span className="text-lg font-black text-white/30">원</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="bg-primary px-3 py-1.5 rounded-xl shadow-[0_0_20px_rgba(55,19,236,0.4)]">
                      <span className="text-[11px] font-black text-white uppercase tracking-widest">Tax Refund</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/20 mr-1 italic">Calculated</span>
                  </div>
                </div>

                {/* 로그인 고객 전용 혜택: 예상 물품 대금 */}
                {isLoggedIn && (
                  <div className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-5 border border-amber-500/20 animate-in fade-in slide-in-from-top-2 duration-700 relative overflow-hidden group/benefit">
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover/benefit:bg-amber-500/10 transition-all"></div>
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="material-symbols-outlined text-[14px] text-amber-400 font-bold">verified</span>
                          <p className="text-amber-400/80 text-[11px] font-black uppercase tracking-widest">Member Reward</p>
                        </div>
                        <p className="text-white/90 text-[15px] font-black">예상 물품 대금</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                          {calculateGoodsPayment().toLocaleString()}
                        </span>
                        <span className="text-xs font-black text-white/40 ml-1.5">원</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 법적 고지 및 안내 */}
        <div className="bg-slate-100/50 rounded-2xl p-6 border border-slate-200/50">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-slate-400 text-lg">info</span>
            <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
              * 환급액 산출: 1,000만원 이하 15%, 초과분 30% 적용 기준<br />
              * 실제 환급액은 근로소득 및 개인별 공제 항목(부양가족 등)에 따라 홈택스 최종 결정 시 차이가 발생할 수 있습니다.
            </p>
          </div>
        </div>
      </main>

      {/* 하단 탭바 (로그인 시 노출) */}
      {isLoggedIn && <BottomNav />}
    </div>
  );
};

export default DonationLimitScreen;
