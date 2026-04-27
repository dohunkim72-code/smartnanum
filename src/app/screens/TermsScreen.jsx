import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 약관 동의 및 서명 화면 컴포넌트입니다.
 * 디자인 가이드(_7)를 기반으로 구현되었습니다. ✨
 */
const TermsScreen = () => {
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState({
    all: false,
    term1: false,
    term2: false,
    term3: false,
    term4: false,
    term5: false,
    term6: false,
    term7: false,
    term8: false,
    term9: false,
    term10: false,
    term11: false,
    term12: false,
    term13: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const scrollRef = useRef(null);

  // 화면 진입 시 최상단으로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, []);

  // 전체 동의 핸들러
  const handleAllAgree = (e) => {
    const checked = e.target.checked;
    setAgreements({
      all: checked,
      term1: checked,
      term2: checked,
      term3: checked,
      term4: checked,
      term5: checked,
      term6: checked,
      term7: checked,
      term8: checked,
      term9: checked,
      term10: checked,
      term11: checked,
      term12: checked,
      term13: checked,
    });
  };

  // 개별 동의 핸들러
  const handleTermChange = (name) => (e) => {
    const checked = e.target.checked;
    const newAgreements = { ...agreements, [name]: checked };
    
    // 전체 동의 상태 업데이트
    const { all, ...rest } = newAgreements;
    const allChecked = Object.values(rest).every(val => val);
    newAgreements.all = allChecked;
    
    setAgreements(newAgreements);
  };

  // 약관 동의 제출 핸들러
  const handleSubmit = () => {
    // 약관 동의 상태를 로컬 스토리지에 상세히 저장
    localStorage.setItem('termsAgreed_status', 'true');
    localStorage.setItem('termsAgreed_details', JSON.stringify(agreements));
    
    // 세련된 커스텀 팝업 표시
    setShowSuccess(true);
    
    // 1.8초 후 자동으로 이전 화면으로 이동
    setTimeout(() => {
      navigate(-1);
    }, 1800);
  };

  const terms = [
    { id: 'term1', title: '제1조 (목적)', content: '본 약관은 기부금 환급 및 기부 관리 서비스 이용과 관련하여 회사가 제공하는 제반 서비스의 이용 조건 및 절차, 이용자와 회사의 권리, 의무, 책임사항 등을 규정함을 목적으로 합니다.' },
    { id: 'term2', title: '제2조 (개인정보 수집 및 이용 동의)', content: '회사는 기부금 영수증 발급 및 환급 대행을 위해 성명, 주민등록번호(세무 신고용), 연락처, 주소, 이메일 등을 수집합니다. 수집된 정보는 법령에 따른 보유기간 동안 안전하게 관리됩니다.' },
    { id: 'term3', title: '제3조 (서비스 이용의 제한)', content: '회사는 이용자가 본 약관을 위반하거나 서비스의 정상적인 운영을 방해하는 경우 서비스 이용을 제한하거나 중지할 수 있습니다.' },
    { id: 'term4', title: '제4조 (권리와 의무)', content: '이용자는 정확한 정보를 제공할 의무가 있으며, 회사는 이용자의 정보를 보호하고 원활한 서비스를 제공할 책임이 있습니다.' },
    { id: 'term5', title: '제5조 (기부금 환급 대행)', content: '이용자는 회사가 대리인으로서 관계 기관에 기부금 환급 업무를 수행하는 데 필요한 권한을 위임하는 것에 동의합니다.' },
    { id: 'term6', title: '제6조 (면책 조항)', content: '회사는 천재지변 또는 이용자의 귀책사유로 인한 서비스 장애나 손해에 대하여 책임을 지지 않습니다.' },
    { id: 'term7', title: '제7조 (관할 법원)', content: '본 서비스 이용과 관련하여 발생한 분쟁에 대해서는 회사의 본사 소재지를 관할하는 법원을 합의 관할 법원으로 합니다.' },
    { id: 'term8', title: '제8조 (기부금 산정 및 한도)', content: '기부금 산정시 근로소득금액의 최대 30% 한도 내에서 개인 공제 내역, 기부 내역, 이월금, 연봉 변동 등을 고려하여 신청 해주세요. 한도가 넘어가는 기부금에 대해서는 이월되더라도, 물품 대금은 완납 해주셔야 합니다.' },
    { id: 'term9', title: '제9조 (기부 취소 불가 안내)', content: '기부신청 후 기부가 완료된 경우에는 취소가 불가합니다. (기부 완료 후 퇴사, 휴직 등의 사유로 변동이 발생하는 경우에는 담당자에게 필히 연락주시기 바랍니다.)' },
    { id: 'term10', title: '제10조 (계약금 납부 안내)', content: '기부신청 시 계약금(기부신청금 기준 환급 예상액의 5%)을 받고 있습니다. 계약금을 납부하신 경우에만 기부가 진행됩니다.' },
    { id: 'term11', title: '제11조 (물품대금 납부 안내)', content: '계약금 제외 한 물품대금은 연말정산환급 후 납부 바랍니다.' },
    { id: 'term12', title: '제12조 (신청 기한 안내)', content: '당해년도 기부신청은 연말정산 직후 완료 부탁드리며, 상반기 내 신청 완료 바랍니다. 신청이 늦어지시면 구입할 물품이 없어 기부가 어려울 수 있습니다.' },
    { id: 'term13', title: '제13조 (개인정보 제3자 제공 동의)', content: '개인정보 제3자 제공에 동의 하십니까?' },
  ];

  return (
    <div className="bg-background-light min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden pb-10">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center text-[#100d1b] active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">약관 동의 및 서명</h2>
      </header>

      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 pt-6 pb-6"
      >
        <h2 className="text-[#100d1b] text-2xl font-black leading-tight tracking-tight pb-4">서비스 이용을 위해<br/>약관에 동의해 주세요</h2>
          
          {/* 전체 동의 */}
          <div className="mb-6 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <label className="flex gap-x-4 items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={agreements.all}
                onChange={handleAllAgree}
                className="size-7 rounded-lg border-slate-200 text-primary focus:ring-primary transition-all"
              />
              <p className="text-[#100d1b] text-lg font-black">전체 동의하기</p>
            </label>
          </div>

          {/* 약관 리스트 */}
          <div className="space-y-4 mb-8">
            {terms.map((term) => (
              <div key={term.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-primary/20">
                <label className="flex gap-x-4 items-start cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={agreements[term.id]}
                    onChange={handleTermChange(term.id)}
                    className="mt-1 size-5 rounded border-slate-200 text-primary focus:ring-primary transition-all"
                  />
                  <div className="flex-1">
                    <p className="text-[#100d1b] text-sm font-bold mb-1.5">{term.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed">{term.content}</p>
                  </div>
                </label>
              </div>
            ))}
          </div>

        {/* 하단 버튼 */}
        <div className="px-6 pb-10 pt-4 bg-white border-t border-slate-100 sticky bottom-0 z-20">
          <button 
            onClick={handleSubmit}
            disabled={!agreements.all}
            className={`w-full py-5 rounded-2xl text-lg font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
              agreements.all
              ? 'bg-primary text-white shadow-primary/20 active:scale-95'
              : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
            }`}
          >
            <span>동의 완료</span>
            <span className="material-symbols-outlined">check_circle</span>
          </button>
        </div>
      </main>

      {/* 프리미엄 커스텀 성공 팝업 */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          {/* 배경 오버레이 (Glass-dark) */}
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"></div>
          
          {/* 모달 컨텐츠 (Glass-panel) */}
          <div className="relative glass-panel rounded-[40px] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] flex flex-col items-center gap-8 w-full max-w-[320px] animate-zoom-in overflow-hidden">
            {/* 상단 장식 빛 효과 */}
            <div className="absolute -top-20 -left-20 size-40 bg-primary/20 rounded-full blur-[60px]"></div>
            <div className="absolute -bottom-20 -right-20 size-40 bg-indigo-400/20 rounded-full blur-[60px]"></div>

            {/* 아이콘 영역 */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative size-20 bg-gradient-to-br from-primary via-[#5a36ff] to-[#8261ff] rounded-full flex items-center justify-center shadow-xl shadow-primary/40 ring-4 ring-white/30">
                <span className="material-symbols-outlined text-white text-4xl font-bold">task_alt</span>
              </div>
            </div>

            {/* 텍스트 영역 */}
            <div className="text-center space-y-3 relative z-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">동의 완료! ✨</h3>
              <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                모든 약관에 동의하셨습니다.<br/>
                <span className="text-primary font-bold">기부 신청 화면</span>으로 돌아갑니다.
              </p>
            </div>

            {/* 하단 프로그레스 바 영역 */}
            <div className="w-full flex flex-col items-center gap-3">
              <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden relative border border-white/20">
                <div className="bg-gradient-to-r from-primary to-indigo-400 h-full animate-progress rounded-full shadow-[0_0_8px_rgba(55,19,236,0.5)]"></div>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Redirecting...</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TermsScreen;
