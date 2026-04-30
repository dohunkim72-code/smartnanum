import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Check, 
  X, 
  Clock,
  History,
  CalendarDays,
  ShieldAlert
} from 'lucide-react';

/**
 * 마감일자 관리 페이지
 */
const AdminEndDate = () => {
  const [endDates, setEndDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    yy: new Date().getFullYear().toString(),
    end_date: ''
  });

  // 통합 상태 알림 모달
  const [statusModal, setStatusModal] = useState({ 
    show: false, 
    type: 'success', 
    message: '',
    onConfirm: null
  });

  // 데이터 불러오기
  const fetchEndDates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/closing-dates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) {
        throw new Error('데이터 조회 실패');
      }
      const data = await response.json();
      // 데이터가 배열인지 확인 후 설정
      setEndDates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('마감일 조회 오류:', error);
      setEndDates([]); // 오류 발생 시 빈 배열로 설정하여 map 오류 방지
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEndDates();
  }, []);

  // 저장 처리
  const handleSave = async (e) => {
    e.preventDefault();
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    
    try {
      const response = await fetch('/api/admin/closing-dates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          reg_id: adminInfo.referral_code || 'admin'
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        setStatusModal({
          show: true,
          type: 'success',
          message: `${formData.yy}년도 마감일이 성공적으로 설정되었습니다.`
        });
        fetchEndDates();
        setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
      } else {
        const result = await response.json();
        setStatusModal({
          show: true,
          type: 'error',
          message: result.message || '저장 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      setStatusModal({
        show: true,
        type: 'error',
        message: '서버와 통신 중 오류가 발생했습니다.'
      });
    }
  };

  // 삭제 처리
  const handleDelete = (yy) => {
    setStatusModal({
      show: true,
      type: 'confirm',
      message: `${yy}년도 마감 설정을 삭제하시겠습니까?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/closing-dates/${yy}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.ok) {
            setStatusModal({
              show: true,
              type: 'success',
              message: '성공적으로 삭제되었습니다.'
            });
            fetchEndDates();
            setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
          }
        } catch (error) {
          setStatusModal({
            show: true,
            type: 'error',
            message: '삭제 중 오류가 발생했습니다.'
          });
        }
      }
    });
  };

  // 날짜 포맷팅 및 상태 체크
  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <CalendarDays className="text-blue-600" size={32} />
            마감일자 관리
          </h1>
          <p className="text-slate-500 mt-1 font-medium ml-11">연도별 기부 마감일자를 설정하여 시스템 운영을 제어합니다.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ yy: new Date().getFullYear().toString(), end_date: '' });
            setIsModalOpen(true);
          }}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          <Plus size={20} />
          새 마감일 설정
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <History size={20} className="text-slate-400" />
          <h2 className="font-bold text-slate-700">마감 히스토리</h2>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-medium">기록을 불러오는 중입니다...</p>
          </div>
        ) : endDates.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <Calendar size={40} />
            </div>
            <p className="text-slate-400 font-bold">등록된 마감일 정보가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-400 text-sm font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-8 py-5 text-left">관리 연도</th>
                  <th className="px-8 py-5 text-left">마감 일자</th>
                  <th className="px-8 py-5 text-left">상태</th>
                  <th className="px-8 py-5 text-left">등록/수정 정보</th>
                  <th className="px-8 py-5 text-right whitespace-nowrap">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {endDates.map((item) => (
                  <tr key={item.yy} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                          {item.yy}
                        </div>
                        <span className="font-bold text-slate-900">{item.yy}년</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-mono font-black text-lg text-slate-700">{item.end_date}</span>
                    </td>
                    <td className="px-8 py-6">
                      {isExpired(item.end_date) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold border border-rose-100">
                          <Clock size={12} /> 마감 종료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                          <Check size={12} /> 운영 중
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-slate-500">ID: {item.upd_id || item.reg_id || 'system'}</p>
                        <p className="text-slate-400 font-medium">
                          {item.upd_date || item.reg_date ? new Date(item.upd_date || item.reg_date).toLocaleDateString() : '-'} 수정
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setFormData({ yy: item.yy, end_date: item.end_date });
                            setIsModalOpen(true);
                          }}
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Calendar size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.yy)}
                          className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden transform animate-in zoom-in duration-300 border border-white/20">
            <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Calendar size={24} className="text-blue-400" />
                마감일 설정
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">설정 연도 (YYYY)</label>
                <input 
                  type="text"
                  required
                  maxLength={4}
                  value={formData.yy}
                  onChange={(e) => setFormData({...formData, yy: e.target.value})}
                  placeholder="예: 2024"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-black text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">마감 일자 (YYYY-MM-DD)</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 border border-amber-100">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  마감일자가 지나면 해당 연도의 신규 기부 및 수납 작업이 자동으로 제한될 수 있습니다. 신중하게 설정해 주세요.
                </p>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 통합 상태 알림 모달 */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-[40px] shadow-2xl max-w-sm w-full text-center transform animate-in zoom-in duration-300">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
              statusModal.type === 'success' ? 'bg-blue-500 shadow-blue-200' : 
              statusModal.type === 'error' ? 'bg-rose-500 shadow-rose-200' : 'bg-amber-500 shadow-amber-200'
            }`}>
              {statusModal.type === 'success' ? <Check size={40} className="text-white" /> : 
               statusModal.type === 'error' ? <AlertCircle size={40} className="text-white" /> : <ShieldAlert size={40} className="text-white" />}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {statusModal.type === 'success' ? '완료' : statusModal.type === 'error' ? '오류' : '확인'}
            </h3>
            <p className="text-slate-600 font-medium">{statusModal.message}</p>
            <div className="mt-8 flex gap-3">
              {statusModal.type === 'confirm' ? (
                <>
                  <button 
                    onClick={() => setStatusModal(prev => ({ ...prev, show: false }))}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    취소
                  </button>
                  <button 
                    onClick={() => {
                      statusModal.onConfirm();
                      setStatusModal(prev => ({ ...prev, show: false }));
                    }}
                    className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                  >
                    삭제
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setStatusModal(prev => ({ ...prev, show: false }))}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
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

export default AdminEndDate;
