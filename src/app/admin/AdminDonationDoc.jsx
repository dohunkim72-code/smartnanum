import React, { useState, useEffect } from 'react';
import {
  FileText,
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
  UserCheck
} from 'lucide-react';

/**
 * 기부 문서 생성 관리 페이지 (엑셀 문서 생성 및 상태 변경)
 */
const AdminDonationDoc = () => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    dona_yy: new Date().getFullYear().toString()
  });

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

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin/donation-doc/list?${query}`);
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setTargets(data);
        setSelectedIds([]); // 목록 갱신 시 선택 초기화
      } else {
        setTargets([]);
      }
    } catch (error) {
      console.error('대상 목록 조회 오류:', error);
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [filters.dona_yy]);

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (targets.length === 0) return;
    
    if (selectedIds.length === targets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(targets.map(t => `${t.cust_no}-${t.dona_yy}-${t.seq_no}`));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const processGeneration = async () => {
    try {
      setProcessing(true);
      const selectedCustomers = targets.filter(t => 
        selectedIds.includes(`${t.cust_no}-${t.dona_yy}-${t.seq_no}`)
      );

      const response = await fetch('/api/admin/donation-doc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customers: selectedCustomers
        })
      });

      const data = await response.json();
      if (response.ok) {
        fetchTargets(); // 목록 새로고침
        showStatus('success', '문서 생성 완료', `${data.count}건의 기부 문서가 서버에 생성되었습니다.\n요약파일: ${data.summary}`);
      } else {
        showStatus('error', '생성 실패', data.message || '문서 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('문서 생성 처리 오류:', error);
      showStatus('error', '오류 발생', '처리 중 예기치 못한 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerate = () => {
    if (selectedIds.length === 0) {
      showStatus('error', '선택 필요', '문서를 생성할 대상을 선택해주세요.');
      return;
    }

    showStatus(
      'confirm', 
      '기부 문서 생성 확인', 
      `${selectedIds.length}건의 기부 문서(엑셀)를 생성하시겠습니까?\n이 작업은 상태를 '서류완료'로 변경합니다.`,
      processGeneration,
      '지금 생성하기'
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
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-600/20">
              <FileText size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">기부 문서 생성</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">기부 신청이 완료된 건에 대해 공식 증빙 문서를 엑셀로 생성합니다.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTargets}
            className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            title="새로고침"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleGenerate}
            disabled={processing || selectedIds.length === 0}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-2xl active:scale-95 ${
              selectedIds.length > 0 
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            {processing ? <RefreshCw size={20} className="animate-spin" /> : <FileSpreadsheet size={20} />}
            {selectedIds.length > 0 ? `${selectedIds.length}건 문서 생성하기` : '처리할 대상 선택'}
          </button>
        </div>
      </div>

      {/* 필터 카드 */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-wrap items-center gap-6">
        <div className="flex flex-col gap-2 min-w-[140px]">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">기부 년도</label>
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <select
              value={filters.dona_yy}
              onChange={(e) => setFilters({ ...filters, dona_yy: e.target.value })}
              className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer text-slate-700"
            >
              {years.map(y => <option key={y} value={y}>{y}년도</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 flex justify-end gap-8">
          <div className="flex items-center gap-8 px-8 py-4 bg-emerald-50/50 border border-emerald-100 rounded-3xl">
            <div className="text-center">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">서류 대기</p>
              <p className="text-2xl font-black text-emerald-600">{targets.length}<span className="text-xs ml-1">건</span></p>
            </div>
            <div className="w-px h-8 bg-emerald-200" />
            <div className="text-center">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">선택됨</p>
              <p className="text-2xl font-black text-slate-900">{selectedIds.length}<span className="text-xs ml-1">건</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 테이블 */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-8 py-6 w-20 text-center">
                  <button 
                    onClick={handleSelectAll}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      targets.length > 0 && selectedIds.length === targets.length 
                        ? 'bg-slate-900 shadow-lg shadow-slate-200' 
                        : 'bg-white border-2 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {targets.length > 0 && selectedIds.length === targets.length && <Check size={14} className="text-white" strokeWidth={4} />}
                  </button>
                </th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">기부자 정보</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">주민번호/연락처</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">기부금액</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">수량</th>
                <th className="px-6 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">상태</th>
                <th className="px-8 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">서명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="animate-spin text-emerald-500" size={40} />
                      <p className="text-slate-400 font-bold">대상 목록을 불러오는 중입니다...</p>
                    </div>
                  </td>
                </tr>
              ) : targets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                        <FileText size={32} />
                      </div>
                      <p className="text-slate-400 font-bold">문서 생성이 필요한 대기 건이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                targets.map((t) => {
                  const id = `${t.cust_no}-${t.dona_yy}-${t.seq_no}`;
                  const isSelected = selectedIds.includes(id);
                  return (
                    <tr 
                      key={id} 
                      className={`group transition-all cursor-pointer ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}
                      onClick={() => handleSelectOne(id)}
                    >
                      <td className="px-8 py-6 text-center">
                        <div className={`mx-auto w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-slate-900 shadow-lg shadow-slate-200' 
                            : 'bg-white border-2 border-slate-300 group-hover:border-slate-400'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-black text-sm">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[15px] font-black text-slate-900 leading-none">{t.name}</p>
                            <p className="text-xs text-slate-400 font-bold mt-1.5 tracking-tight">{t.referral_name || '일반'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-[13px] font-bold text-slate-600">{t.jmin1}-*******</p>
                        <p className="text-xs text-slate-400 mt-1">{t.hpno}</p>
                      </td>
                      <td className="px-6 py-6 text-right font-mono">
                        <p className="text-lg font-black text-emerald-600 tracking-tighter">
                          {formatAmt(t.real_amt)}<span className="text-xs ml-0.5">원</span>
                        </p>
                      </td>
                      <td className="px-6 py-6 text-center font-bold text-slate-700">
                        {t.release_qty}개
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-black">
                          <Clock size={12} />
                          서류 대기
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        {t.signature ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black">
                            <CheckCircle2 size={12} />
                            서명 완료
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[11px] font-black">
                            <AlertCircle size={12} />
                            서명 누락
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
                : 'bg-gradient-to-tr from-rose-400 to-pink-500 shadow-rose-200'
            }`}>
              {statusModal.type === 'success' ? (
                <Check size={48} className="text-white" />
              ) : statusModal.type === 'confirm' ? (
                <Download size={48} className="text-white" />
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
                    className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
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

export default AdminDonationDoc;
