import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

/**
 * 기부 상세 내역 조회 화면 컴포넌트입니다. 🔍
 * 아라부장님의 요청에 따라 모든 상세 항목을 DB와 연동하여 보여줍니다. ✨
 */
const DonationDetailScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const userId = localStorage.getItem('userId');
  
  // URL 쿼리 파라미터에서 year와 seqNo 추출
  const queryParams = new URLSearchParams(location.search);
  const year = queryParams.get('year');
  const seqNo = queryParams.get('seqNo');

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!userId || !year) return;
      try {
        // seqNo가 있으면 개별 상세, 없으면 연도 합산 조회 🧐
        const url = seqNo 
          ? `/api/donation/detail?id=${userId}&year=${year}&seqNo=${seqNo}`
          : `/api/donation/yearly-summary?id=${userId}&year=${year}`;
          
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setDetail(data);
        }
      } catch (error) {
        console.error('내역 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [userId, year, seqNo]);

  const formatComma = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getStatusInfo = (code) => {
    switch (code) {
      case '01': return { text: '기부요청', color: 'bg-blue-100 text-blue-700' };
      case '02': return { text: '승인완료', color: 'bg-green-100 text-green-700' };
      case '03': return { text: '반려됨', color: 'bg-red-100 text-red-700' };
      case 'YEARLY': return { text: '연도 합산 정보', color: 'bg-primary/10 text-primary' };
      default: return { text: '처리 중', color: 'bg-gray-100 text-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="bg-background-light min-h-screen flex items-center justify-center">
        <p className="text-slate-400 font-bold animate-pulse text-lg">정보를 불러오는 중... ⏳</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="bg-background-light min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">search_off</span>
        <h2 className="text-xl font-bold text-slate-800 mb-2">정보를 찾을 수 없습니다</h2>
        <p className="text-slate-400 mb-8">해당하는 기부 상세 내역이 존재하지 않거나,<br/>접근 권한이 없습니다.</p>
        <button onClick={() => navigate(-1)} className="w-full max-w-[200px] h-12 bg-primary text-white rounded-2xl font-bold">뒤로 가기</button>
      </div>
    );
  }

  const status = getStatusInfo(detail.step_code);

  return (
    <div className="bg-background-light min-h-screen flex flex-col max-w-[480px] mx-auto overflow-x-hidden pb-32">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center text-[#100d1b] active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">{seqNo ? '상세 내역 조회' : '연도별 합산 조회'}</h2>
      </header>

      <main className="p-4 flex flex-col gap-6">
        {/* 요약 카드 */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-[#6e4ff5] p-8 text-white shadow-xl shadow-primary/20">
          <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="relative z-10 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-4">
              {seqNo && <span className="px-3 py-1 rounded-full bg-white/20 text-[11px] font-black backdrop-blur-sm">No.{seqNo}</span>}
              <span className={`px-3 py-1 rounded-full text-[11px] font-black ${status.color.includes('text-primary') ? 'bg-white/90 text-primary' : status.color}`}>
                {status.text}
              </span>
            </div>
            <p className="text-sm font-medium opacity-80">{detail.dona_yy}년 기부 {seqNo ? '상세' : '합산'}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">{formatComma(detail.dona_amt)}</span>
              <span className="text-lg font-bold">원</span>
            </div>
          </div>
        </section>

        {/* 1. 기부자 기본 정보 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-primary text-[20px]">person</span>
            <h3 className="text-base font-bold text-slate-800">기부자 기본 정보</h3>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
            <InfoRow label="이름" value={detail.name} />
            <InfoRow label="주민등록번호" value={`${detail.jmin1}-${detail.jmin2}`} />
            <InfoRow label="휴대폰번호" value={detail.hpno} />
            <InfoRow label="우편번호" value={detail.zipcode} />
            <InfoRow label="주소" value={detail.address} />
            <InfoRow label="상세주소" value={detail.address_detail} />
          </div>
        </div>

        {/* 2. 기부 신청 상세 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-primary text-[20px]">description</span>
            <h3 className="text-base font-bold text-slate-800">기부 신청 상세</h3>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
            <InfoRow label="기부년도" value={`${detail.dona_yy}년`} />
            <InfoRow label="기부금 신청 금액" value={`${formatComma(detail.dona_amt)}원`} />
            <InfoRow label="현금영수증 신청여부" value={detail.receipt_yn === 'Y' ? '신청' : '미신청'} />
            <InfoRow label="진행상태" value={status.text} isBadge badgeColor={status.color} />
          </div>
        </div>

        {/* 3. 기부 정산 정보 (아라부장님 요청 항목) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
            <h3 className="text-base font-bold text-slate-800">기부 정산 내역</h3>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
            <InfoRow label="전월이월금" value={`${formatComma(detail.last_amt)}원`} />
            <InfoRow label="실제기부금" value={`${formatComma(detail.real_amt)}원`} />
            <InfoRow label="환급예상금" value={`${formatComma(detail.refund_amt)}원`} isHighlight />
            <InfoRow label="물품대금" value={`${formatComma(detail.goods_amt)}원`} />
            <InfoRow label="선입금액" value={`${formatComma(detail.pre_deposit_req_amt)}원`} />
            <InfoRow label="입금액" value={`${formatComma(detail.deposit_amt)}원`} />
            <InfoRow label="미입금액" value={`${formatComma((detail.goods_amt || 0) - (detail.pre_deposit_req_amt || 0) - (detail.deposit_amt || 0))}원`} valueColor="text-red-500" />
            <InfoRow label="대금입금여부" value={detail.goods_yn === 'Y' ? '입금완료' : '미입금'} />
            <InfoRow label="총 입금금액" value={`${formatComma(detail.total_real_amt)}원`} />
            <InfoRow label="현금영수증 발행여부" value={detail.issuance_yn === 'Y' ? '발행완료' : '미발행'} />
          </div>
        </div>

        {/* 4. 입금 계좌 정보 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
            <h3 className="text-base font-bold text-slate-800">입금 계좌 정보</h3>
          </div>
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
            <InfoRow label="입금은행" value={detail.bank_name || '-'} />
            <InfoRow label="계좌번호" value={detail.account_no || '-'} />
            <InfoRow label="예금주" value={detail.account_holder || '-'} />
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex flex-col gap-3 mt-4">
          <button 
            disabled={detail.step_code !== '01'}
            onClick={() => navigate('/donation', { state: { editItem: detail } })}
            className={`w-full h-16 rounded-[2rem] font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${
              detail.step_code === '01' 
                ? 'bg-primary text-white shadow-primary/20 active:scale-95' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined">edit_note</span>
            수정하기 {detail.step_code !== '01' && <span className="text-[12px] opacity-60 ml-1">(수정 불가)</span>}
          </button>
          <button 
            onClick={() => navigate(-1)}
            className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all"
          >
            목록으로 돌아가기
          </button>
        </div>
      </main>

      {isLoggedIn && <BottomNav />}
    </div>
  );
};

const InfoRow = ({ label, value, isBadge, badgeColor, isHighlight, valueColor }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-[13px] text-slate-400 font-bold">{label}</span>
    {isBadge ? (
      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${badgeColor}`}>
        {value}
      </span>
    ) : (
      <span className={`text-[14px] font-black ${isHighlight ? 'text-primary' : valueColor || 'text-slate-800'}`}>
        {value}
      </span>
    )}
  </div>
);

export default DonationDetailScreen;
