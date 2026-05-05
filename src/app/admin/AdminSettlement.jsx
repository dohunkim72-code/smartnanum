import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronRight, 
  Download, 
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  X,
  Check,
  PenTool,
  RotateCcw,
  Plus,
  Trash2,
  ListFilter,
  CheckCircle2
} from 'lucide-react';
import api from '../../lib/api';

const AdminSettlement = () => {
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  const isSuperAdmin = adminInfo.grade === '01';

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedReferralCode, setSelectedReferralCode] = useState(isSuperAdmin ? '' : (adminInfo.referral_code || ''));
  const [referrals, setReferrals] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [loading, setLoading] = useState(false);

  const years = ['2026', '2025'];

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const data = await api.get('/admin/referrals');
        setReferrals(data);
      } catch (err) {
        console.error('추천인 로드 실패:', err);
      }
    };
    fetchReferrals();
  }, []);

  // 상태 모달 제어
  const [statusModal, setStatusModal] = useState({
    show: false,
    type: 'success', // 'success', 'error', 'confirm', 'warning'
    title: '',
    message: '',
    onConfirm: null,
    actionLabel: ''
  });
  
  const showStatus = (type, title, message, onConfirm = null, actionLabel = '') => {
    setStatusModal({ show: true, type, title, message, onConfirm, actionLabel });
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const url = `/admin/settlement/summary?dona_yy=${selectedYear}&referral_code=${selectedReferralCode}`;
      const data = await api.get(url);
      setSummaryData(data);
      setSelectedReferral(null);
      setDetailData([]);
    } catch (error) {
      console.error('요약 데이터 조회 실패:', error);
      showStatus('error', '조회 실패', '데이터를 불러오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (referral) => {
    setLoading(true);
    setSelectedReferral(referral);
    try {
      const url = `/admin/settlement/detail?dona_yy=${selectedYear}&referral_code=${referral.referral_code}`;
      const data = await api.get(url);
      setDetailData(data);
    } catch (error) {
      console.error('상세 데이터 조회 실패:', error);
      showStatus('error', '상세 조회 실패', '상세 데이터를 불러오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header & Filters */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                <TrendingUp size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">정산 관리</h1>
            </div>
            <p className="text-slate-500 font-medium ml-1">추천인별 및 고객별 정산 현황을 실시간으로 분석하고 관리합니다.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-2 min-w-[140px]">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">조회 연도</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer text-slate-700"
                >
                  {years.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
              </div>
            </div>

            <div className={`flex flex-col gap-2 min-w-[220px] ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">추천인 필터</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <select
                  value={selectedReferralCode}
                  onChange={(e) => isSuperAdmin && setSelectedReferralCode(e.target.value)}
                  disabled={!isSuperAdmin}
                  className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer text-slate-700 disabled:cursor-not-allowed"
                >
                  {isSuperAdmin && <option value="">전체 추천인</option>}
                  {referrals.filter(ref => isSuperAdmin || ref.referral_code === adminInfo.referral_code).map(ref => (
                    <option key={ref.referral_code} value={ref.referral_code}>{ref.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-6">
              <button 
                onClick={fetchSummary}
                disabled={loading}
                className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-3"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
                조회하기
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Summary List */}
        <div className={`transition-all duration-700 ${selectedReferral ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="w-2 h-7 bg-blue-600 rounded-full"></div>
                추천인별 정산 요약 ({selectedYear}년)
              </h2>
              {loading && <div className="text-blue-600 text-xs font-black animate-pulse uppercase tracking-widest">Updating data...</div>}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-slate-400 text-[11px] font-black uppercase tracking-widest">
                    <th className="px-6 py-6 border-b border-slate-50">추천인</th>
                    <th className="px-4 py-6 border-b border-slate-50 text-right">신청금액</th>
                    <th className="px-4 py-6 border-b border-slate-50 text-right">기부금액</th>
                    <th className="px-4 py-6 border-b border-slate-50 text-right">환급금액</th>
                    <th className="px-4 py-6 border-b border-slate-50 text-right">기입금액</th>
                    <th className="px-4 py-6 border-b border-slate-50 text-right text-rose-500">미입금액</th>
                    <th className="px-4 py-6 border-b border-slate-50 text-right text-emerald-600">수수료</th>
                    <th className="px-6 py-6 border-b border-slate-50 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {summaryData.length > 0 ? (
                    summaryData.map((row) => (
                      <tr 
                        key={row.referral_code}
                        onClick={() => fetchDetail(row)}
                        className={`group cursor-pointer transition-all ${selectedReferral?.referral_code === row.referral_code ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="px-6 py-6">
                          <span className="text-[15px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {row.referral_name || '미지정'}
                          </span>
                        </td>
                        <td className="px-4 py-6 text-slate-600 text-right font-bold text-sm">{formatNumber(row.total_dona_amt)}</td>
                        <td className="px-4 py-6 text-slate-900 text-right font-black text-sm">{formatNumber(row.total_real_amt)}</td>
                        <td className="px-4 py-6 text-slate-600 text-right font-bold text-sm">{formatNumber(row.total_refund_amt)}</td>
                        <td className="px-4 py-6 text-slate-900 text-right font-black text-sm">{formatNumber(row.total_deposit_amt)}</td>
                        <td className="px-4 py-6 text-rose-600 text-right font-black text-sm bg-rose-50/30">{formatNumber(row.total_unpaid_amt)}</td>
                        <td className="px-4 py-6 text-emerald-600 text-right font-black text-sm bg-emerald-50/30">{formatNumber(row.total_comm_amt)}</td>
                        <td className="px-6 py-6 text-slate-300 group-hover:text-blue-600 transition-all">
                          <ChevronRight className={`w-5 h-5 transform transition-transform ${selectedReferral?.referral_code === row.referral_code ? 'translate-x-1' : ''}`} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                            <AlertCircle size={32} />
                          </div>
                          <p className="text-slate-400 font-bold">조회된 정산 데이터가 없습니다.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Detailed List */}
        {selectedReferral && (
          <div className="lg:col-span-7 animate-in slide-in-from-right-8 duration-700">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden h-full flex flex-col">
              <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <FileText className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{selectedReferral.referral_name} 상세 내역</h2>
                    <p className="text-slate-400 text-sm font-bold mt-1 opacity-80">총 {detailData.length}건의 개별 정산 기록</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReferral(null)}
                  className="p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-95"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/30">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm">
                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-5 border-b border-slate-100">고객 정보</th>
                      <th className="px-4 py-5 border-b border-slate-100">상태</th>
                      <th className="px-4 py-5 border-b border-slate-100 text-right">기부금액</th>
                      <th className="px-4 py-5 border-b border-slate-100 text-right">환급액</th>
                      <th className="px-4 py-5 border-b border-slate-100 text-right">물품대금</th>
                      <th className="px-4 py-5 border-b border-slate-100 text-right">기입금액</th>
                      <th className="px-4 py-5 border-b border-slate-100 text-right text-rose-500">미입금액</th>
                      <th className="px-6 py-5 border-b border-slate-100">계좌 정보</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {detailData.length > 0 ? (
                      detailData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-6 py-5">
                            <p className="text-sm font-black text-slate-900">{row.cust_name}</p>
                            <p className="text-[11px] text-slate-400 font-bold mt-1 tracking-tight">{row.cust_hpno}</p>
                          </td>
                          <td className="px-4 py-5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              row.step_code === '04' ? 'bg-emerald-100 text-emerald-600' :
                              row.step_code === '01' ? 'bg-amber-100 text-amber-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {row.step_name}
                            </span>
                          </td>
                          <td className="px-4 py-5 text-slate-900 text-right font-black text-sm">{formatNumber(row.real_amt)}</td>
                          <td className="px-4 py-5 text-slate-500 text-right font-bold text-xs">{formatNumber(row.refund_amt)}</td>
                          <td className="px-4 py-5 text-slate-500 text-right font-bold text-xs">{formatNumber(row.goods_amt)}</td>
                          <td className="px-4 py-5 text-slate-900 text-right font-black text-sm">{formatNumber(row.deposit_amt)}</td>
                          <td className="px-4 py-5 text-rose-600 text-right font-black text-sm bg-rose-50/30">{formatNumber(row.unpaid_amt)}</td>
                          <td className="px-6 py-5">
                            <p className="text-[11px] font-black text-slate-900">{row.bank_name || '-'}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.account_no || '-'}</p>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-24 text-center">
                          <p className="text-slate-400 font-bold">상세 내역이 없습니다.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 프리미엄 상태 모달 */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !statusModal.onConfirm && setStatusModal({ ...statusModal, show: false })} />
          <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300 border border-slate-50">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce ${
              statusModal.type === 'success' 
                ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-emerald-200' 
                : statusModal.type === 'confirm'
                ? 'bg-gradient-to-tr from-indigo-400 to-violet-500 shadow-indigo-200'
                : statusModal.type === 'warning'
                ? 'bg-gradient-to-tr from-amber-400 to-orange-500 shadow-amber-200'
                : 'bg-gradient-to-tr from-rose-400 to-pink-500 shadow-rose-200'
            }`}>
              {statusModal.type === 'success' ? (
                <Check size={48} className="text-white" />
              ) : statusModal.type === 'confirm' ? (
                <PenTool size={48} className="text-white" />
              ) : statusModal.type === 'warning' ? (
                <AlertCircle size={48} className="text-white" />
              ) : (
                <X size={48} className="text-white" />
              )}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{statusModal.title}</h3>
            <p className="text-slate-500 font-bold leading-relaxed whitespace-pre-line mb-10">{statusModal.message}</p>
            
            <div className="flex gap-3">
              {statusModal.type === 'confirm' ? (
                <>
                  <button 
                    onClick={() => setStatusModal({ ...statusModal, show: false })}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    취소
                  </button>
                  <button 
                    onClick={() => {
                      setStatusModal({ ...statusModal, show: false });
                      if (statusModal.onConfirm) statusModal.onConfirm();
                    }}
                    className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
                    {statusModal.actionLabel || '확인'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setStatusModal({ ...statusModal, show: false })}
                  className={`w-full py-4 font-black rounded-2xl transition-all active:scale-95 shadow-lg ${
                    statusModal.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-100 hover:bg-emerald-600' : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
                  }`}
                >
                  확인
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettlement;
