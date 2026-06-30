import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

/**
 * 기부 내역 확인 (히스토리) 화면 컴포넌트입니다.
 * 실제 DB 연동 버전! 📜
 */
const DonationHistoryScreen = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [historyByYear, setHistoryByYear] = useState([]); // 년도별로 그룹화된 데이터
  const [selectedYear, setSelectedYear] = useState(''); // 선택된 년도
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/donation/history?id=${userId}`);
      const data = await response.json();
      if (response.ok) {
        setHistoryByYear(data);
        // 데이터가 있으면 가장 최신 년도를 기본 선택 (한글 주석)
        if (data.length > 0 && !selectedYear) {
          setSelectedYear(data[0].dona_yy);
        }
      }
    } catch (error) {
      console.error('내역 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchHistory();
  }, [userId]);

  // 기부 신청 취소 처리 함수 (한글 주석)
  const handleCancelClick = async (item) => {
    if (item.step_code !== '01') {
      alert('기부요청 상태인 경우만 취소할 수 있습니다.');
      return;
    }

    if (window.confirm(`${item.company_name || '기부 신청'} 건의 ${formatComma(item.dona_amt)}원 기부 신청을 취소하시겠습니까?`)) {
      try {
        const response = await fetch('/api/donation/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userId,
            year: item.dona_yy,
            seqNo: item.seq_no
          })
        });

        const resData = await response.json();

        if (response.ok) {
          alert('기부 신청이 성공적으로 취소되었습니다. 🗑️');
          fetchHistory(); // 목록 갱신 (한글 주석)
        } else {
          alert(resData.message || '취소 중 오류가 발생했습니다.');
        }
      } catch (error) {
        alert(`취소 처리 중 오류가 발생했습니다: ${error.message}`);
      }
    }
  };


  // 숫자 콤마 포맷팅
  const formatComma = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 선택된 년도의 데이터 및 상세 내역 추출 🧐
  const selectedYearInfo = historyByYear.find(h => h.dona_yy === selectedYear) || 
                          historyByYear[0] || 
                          { dona_yy: new Date().getFullYear().toString(), total_dona_amt: 0, details: [] };
  
  const totalAmount = selectedYearInfo.total_dona_amt || 0;
  const details = selectedYearInfo.details || [];
  const currentYear = selectedYearInfo.dona_yy;

  // 예상 환급액 (단순 15% 계산 예시)
  const estimatedRefund = Math.floor(totalAmount * 0.15);

  // 상태 코드 매핑
  const getStatusInfo = (code) => {
    switch (code) {
      case '01': return { text: '기부요청', color: 'bg-blue-100 text-blue-700' };
      case '02': return { text: '승인완료', color: 'bg-green-100 text-green-700' };
      case '03': return { text: '반려됨', color: 'bg-red-100 text-red-700' };
      default: return { text: '처리 중', color: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full max-w-[430px] mx-auto flex-col bg-background-light dark:bg-background-dark overflow-x-hidden font-display pb-24">
      {/* TopAppBar */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-white/10">
        <div 
          onClick={() => navigate(-1)}
          className="text-primary dark:text-white flex size-12 shrink-0 items-center justify-start cursor-pointer active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </div>
        <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">신청 내역 조회</h2>
      </div>

      <main className="flex-1 overflow-y-auto">
        {/* Year Tabs ✨ */}
        {historyByYear.length > 1 && (
          <div className="px-4 pt-4 mb-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              {historyByYear.map((h) => (
                <button
                  key={h.dona_yy}
                  onClick={() => setSelectedYear(h.dona_yy)}
                  className={`px-6 py-2.5 rounded-full text-sm font-black whitespace-nowrap transition-all ${
                    selectedYear === h.dona_yy 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'bg-white text-slate-400 border border-slate-100'
                  }`}
                >
                  {h.dona_yy}년
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="px-4 py-4">
          <div 
            className="flex flex-col items-stretch justify-start rounded-[2.5rem] shadow-xl shadow-primary/10 bg-white dark:bg-white/5 overflow-hidden border border-slate-50"
          >
            <div className="w-full bg-gradient-to-br from-primary via-[#4e2cf3] to-blue-600 aspect-[21/9] flex flex-col justify-center px-8 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl animate-pulse"></div>
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium opacity-80">{currentYear}년 기부 현황</p>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl font-black">{formatComma(totalAmount)}</span>
                <span className="text-lg font-bold">원</span>
              </div>
            </div>
            <div className="flex w-full grow flex-col items-stretch justify-center gap-1 py-6 px-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">세액공제 예상액</p>
                  <p className="text-primary text-xl font-black">약 {formatComma(estimatedRefund)}원</p>
                </div>
                <div className="h-10 w-px bg-slate-100 mx-4"></div>
                <div className="flex flex-col text-right">
                  <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">신청 건수</p>
                  <p className="text-slate-900 text-xl font-black">{details.length}건</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="px-6 pb-2 pt-6">
          <h3 className="text-slate-900 text-xl font-black tracking-tight flex items-center gap-2">
            {selectedYear}년 상세 내역
            <span className="text-[11px] bg-primary/5 text-primary px-2 py-0.5 rounded-full font-bold">{details.length}건</span>
          </h3>
        </div>

        {/* List Items */}
        <div className="flex flex-col gap-4 px-4 mb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold">내역을 불러오는 중...</p>
            </div>
          ) : details.length > 0 ? (
            details.map((item, index) => {
              const status = getStatusInfo(item.step_code);
              return (
                <div 
                  key={index}
                  onClick={() => {
                    // 상세 조회 화면으로 이동하며 년도와 순번을 파라미터로 전달 🚀
                    navigate(`/donation-detail?year=${item.dona_yy}&seqNo=${item.seq_no}`);
                  }}
                  className="flex flex-col bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer hover:border-primary/30"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400 text-[26px]">volunteer_activism</span>
                      </div>
                      <div>
                        <p className="text-[16px] font-black text-slate-900 mb-0.5">{item.company_name || '기부 신청'}</p>
                        <p className="text-[12px] text-slate-400 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">payments</span>
                          {item.cash_receipt_yn === 'Y' ? '현금영수증 신청' : '영수증 미신청'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {item.step_code === '01' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // 상세 내역으로의 이동 방지 (한글 주석)
                            handleCancelClick(item);
                          }}
                          className="px-2 py-1 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-black border border-red-200 transition-colors"
                        >
                          취소
                        </button>
                      )}
                      <span className={`px-3 py-1 rounded-xl text-[11px] font-black ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-4 border-t border-slate-50">
                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">기부금액</p>
                      <p className="text-lg font-black text-slate-900">{formatComma(item.dona_amt)}원</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-300 font-medium">
                        {item.reg_date ? new Date(item.reg_date).toLocaleDateString() : ''}
                      </p>
                      <p className="text-[10px] text-slate-400">No.{item.seq_no}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center gap-4 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 mt-4">
              <div className="size-20 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-300 text-5xl">history_toggle_off</span>
              </div>
              <div>
                <p className="text-slate-900 font-black text-lg mb-1">신청 내역이 없습니다</p>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">아직 신청하신 기부 내역이 없네요.<br/>첫 번째 기부를 시작해 보세요!</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => navigate('/donation')}
        className="fixed bottom-24 right-6 size-16 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
      >
        <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">add</span>
      </button>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  );
};

export default DonationHistoryScreen;
