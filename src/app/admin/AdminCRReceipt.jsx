import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  RefreshCw,
  ArrowRight,
  Download,
  Check,
  X,
  FileSpreadsheet,
  ChevronRight,
  UserCheck,
  Smartphone,
  CheckSquare
} from 'lucide-react';

/**
 * 현금영수증 처리 관리 페이지
 * 기부자가 요청한 현금영수증을 조회하고 엑셀로 추출 및 발행 상태를 관리합니다.
 */
const AdminCRReceipt = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [filters, setFilters] = useState({
    dona_yy: new Date().getFullYear().toString(),
    name: '',
    referral_code: ''
  });

  // 상태 모달 제어
  const [statusModal, setStatusModal] = useState({
    show: false,
    type: 'success', // 'success', 'error', 'confirm'
    title: '',
    message: '',
    onConfirm: null,
    actionLabel: ''
  });

  const showStatus = (type, title, message, onConfirm = null, actionLabel = '') => {
    setStatusModal({ show: true, type, title, message, onConfirm, actionLabel });
  };

  // 초기 데이터 로딩 (추천인 목록)
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const response = await fetch('/api/admin/referrals');
        const data = await response.json();
        if (Array.isArray(data)) setReferrals(data);
      } catch (error) {
        console.error('추천인 목록 조회 오류:', error);
      }
    };
    fetchReferrals();
  }, []);

  // 리스트 조회
  const fetchList = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/cr-receipt/list?${query}`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setList(data);
        setSelectedIds([]); // 조회 시 선택 초기화
      } else {
        setList([]);
      }
    } catch (error) {
      console.error('현금영수증 리스트 조회 오류:', error);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [filters.dona_yy, filters.referral_code]);

  // 체크박스 제어
  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (list.length === 0) return;
    if (selectedIds.length === list.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(list.map(item => `${item.cust_no}-${item.dona_yy}-${item.seq_no}`));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // 현금영수증 발행 (엑셀 다운로드 및 상태 변경)
  const processExport = async () => {
    try {
      setProcessing(true);
      const selectedItems = list.filter(item => 
        selectedIds.includes(`${item.cust_no}-${item.dona_yy}-${item.seq_no}`)
      );

      const response = await fetch('/api/admin/cr-receipt/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customers: selectedItems
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `현금영수증_발행대상_${new Date().toISOString().slice(0, 10)}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        fetchList(); // 리스트 갱신 (발행여부 업데이트 확인)
        showStatus('success', '발행 처리 완료', `${selectedItems.length}건의 현금영수증 발행용 엑셀이 생성되었으며,\n시스템상 발행 여부가 '발행'으로 업데이트되었습니다.`);
      } else {
        const err = await response.json();
        showStatus('error', '처리 실패', err.message || '엑셀 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('현금영수증 처리 오류:', error);
      showStatus('error', '오류 발생', '처리 중 예기치 못한 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = () => {
    if (selectedIds.length === 0) {
      showStatus('error', '선택 필요', '발행할 대상을 선택해주세요.');
      return;
    }

    showStatus(
      'confirm', 
      '현금영수증 발행 확인', 
      `선택한 ${selectedIds.length}건에 대해 현금영수증 발행 엑셀을 생성하시겠습니까?\n생성 후 시스템의 발행 상태가 '발행'으로 변경됩니다.`,
      processExport,
      '지금 발행하기'
    );
  };

  const formatAmt = (amt) => {
    return Number(amt || 0).toLocaleString();
  };

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 2025; y--) years.push(y.toString());

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 헤더 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <Receipt size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">현금영수증 처리</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">현금영수증 발행 요청 건을 관리하고 국세청 업로드용 엑셀을 생성합니다.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchList}
            className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExport}
            disabled={processing || selectedIds.length === 0}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-2xl active:scale-95 ${
              selectedIds.length > 0 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {processing ? <RefreshCw size={20} className="animate-spin" /> : <FileSpreadsheet size={20} />}
            {selectedIds.length > 0 ? `${selectedIds.length}건 현금영수증 발행` : '발행 대상 선택'}
          </button>
        </div>
      </div>

      {/* 검색 필터 카드 */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-2 min-w-[140px]">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">기부 년도</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={filters.dona_yy}
              onChange={(e) => setFilters({ ...filters, dona_yy: e.target.value })}
              className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-bold appearance-none cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}년도</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">고객명</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="이름 검색..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && fetchList()}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-bold"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">추천인</label>
          <select
            value={filters.referral_code}
            onChange={(e) => setFilters({ ...filters, referral_code: e.target.value })}
            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none font-bold appearance-none cursor-pointer"
          >
            <option value="">전체 추천인</option>
            {referrals.map(r => <option key={r.referral_code} value={r.referral_code}>{r.name}</option>)}
          </select>
        </div>

        <button
          onClick={fetchList}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
        >
          검색하기
        </button>
      </div>

      {/* 리스트 테이블 */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-6 w-20 text-center">
                  <button 
                    onClick={handleSelectAll}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      list.length > 0 && selectedIds.length === list.length 
                        ? 'bg-slate-900' 
                        : 'bg-white border-2 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {list.length > 0 && selectedIds.length === list.length && <Check size={14} className="text-white" strokeWidth={4} />}
                  </button>
                </th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">기부자</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">연락처</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">실기부금액</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">정산금액</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">요청여부</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">발행상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-8 py-24 text-center">
                    <RefreshCw className="animate-spin text-indigo-500 mx-auto mb-4" size={40} />
                    <p className="text-slate-400 font-bold">목록을 불러오는 중입니다...</p>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-24 text-center text-slate-400 font-bold">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                list.map((item) => {
                  const id = `${item.cust_no}-${item.dona_yy}-${item.seq_no}`;
                  const isSelected = selectedIds.includes(id);
                  return (
                    <tr 
                      key={id} 
                      className={`group transition-all cursor-pointer ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
                      onClick={() => handleSelectOne(id)}
                    >
                      <td className="px-8 py-6 text-center">
                        <div className={`mx-auto w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected ? 'bg-slate-900' : 'bg-white border-2 border-slate-300 group-hover:border-slate-400'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[15px] font-black text-slate-900 leading-none">{item.name}</p>
                            <p className="text-xs text-slate-400 font-bold mt-1.5">{item.referral_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                          <Smartphone size={14} className="text-slate-300" />
                          {item.hpno}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right font-mono">
                        <p className="text-lg font-black text-slate-900 tracking-tighter">
                          {formatAmt(item.real_amt)}<span className="text-xs ml-0.5">원</span>
                        </p>
                      </td>
                      <td className="px-6 py-6 text-right font-mono">
                        <p className="text-lg font-black text-indigo-600 tracking-tighter">
                          {formatAmt(item.goods_amt)}<span className="text-xs ml-0.5">원</span>
                        </p>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black">
                          {item.receipt_yn === 'Y' ? '요청' : '미요청'}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        {item.issuance_yn === 'Y' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[11px] font-black">
                            <CheckCircle2 size={12} />
                            발행완료
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-black">
                            <Clock size={12} />
                            미발행
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상태 모달 */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !statusModal.onConfirm && setStatusModal({ ...statusModal, show: false })} />
          <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              statusModal.type === 'success' ? 'bg-emerald-100 text-emerald-600' : statusModal.type === 'confirm' ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'
            }`}>
              {statusModal.type === 'success' ? <Check size={40} /> : statusModal.type === 'confirm' ? <Receipt size={40} /> : <X size={40} />}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">{statusModal.title}</h3>
            <p className="text-slate-500 font-bold leading-relaxed whitespace-pre-line mb-8">{statusModal.message}</p>
            <div className="flex gap-3">
              {statusModal.type === 'confirm' ? (
                <>
                  <button onClick={() => setStatusModal({ ...statusModal, show: false })} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl">취소</button>
                  <button onClick={() => { setStatusModal({ ...statusModal, show: false }); statusModal.onConfirm(); }} className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200">{statusModal.actionLabel || '확인'}</button>
                </>
              ) : (
                <button onClick={() => setStatusModal({ ...statusModal, show: false })} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl">확인</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCRReceipt;
