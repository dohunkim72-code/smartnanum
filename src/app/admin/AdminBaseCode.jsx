import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  AlertCircle,
  Database,
  Filter,
  RefreshCcw,
  Tag
} from 'lucide-react';

/**
 * 기초코드(공통코드) 관리 페이지
 */
const AdminBaseCode = () => {
  const [codes, setCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [baseCodeFilter, setBaseCodeFilter] = useState('ALL');
  const [uniqueBaseCodes, setUniqueBaseCodes] = useState([]);
  
  // 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCode, setCurrentCode] = useState({
    base_code: '',
    sub_code: '',
    code_name: '',
    note: ''
  });
  const [isNew, setIsNew] = useState(true);

  // 통합 상태 알림 모달
  const [statusModal, setStatusModal] = useState({ 
    show: false, 
    type: 'success', 
    message: '',
    onConfirm: null
  });

  // 데이터 불러오기
  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/basic-codes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      const validData = Array.isArray(data) ? data : [];
      setCodes(validData);
      setFilteredCodes(validData);
      
      // 고유 대분류 코드 추출 (필터용)
      const baseCodes = [...new Set(validData.map(item => item?.base_code).filter(Boolean))];
      setUniqueBaseCodes(baseCodes);
    } catch (error) {
      console.error('코드 조회 중 오류:', error);
      setCodes([]);
      setFilteredCodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  // 검색 및 필터링 적용
  useEffect(() => {
    let result = codes;
    
    if (baseCodeFilter !== 'ALL') {
      result = result.filter(c => c.base_code === baseCodeFilter);
    }
    
    if (searchTerm) {
      result = result.filter(c => 
        (c.code_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.sub_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.base_code || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCodes(result);
  }, [searchTerm, baseCodeFilter, codes]);

  // 등록/수정 저장
  const handleSave = async (e) => {
    e.preventDefault();
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    
    try {
      const method = isNew ? 'POST' : 'PUT';
      const response = await fetch('/api/admin/basic-codes', {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...currentCode,
          reg_id: adminInfo.referral_code,
          upd_id: adminInfo.referral_code
        })
      });

      if (response.ok) {
        setIsEditModalOpen(false);
        setStatusModal({
          show: true,
          type: 'success',
          message: isNew ? '기초코드가 등록되었습니다.' : '기초코드가 수정되었습니다.'
        });
        fetchCodes();
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
  const handleDelete = async (base_code, sub_code) => {
    setStatusModal({
      show: true,
      type: 'confirm',
      message: `[${base_code} - ${sub_code}] 코드를 정말 삭제하시겠습니까?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/basic-codes/${base_code}/${sub_code}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.ok) {
            setStatusModal({
              show: true,
              type: 'success',
              message: '성공적으로 삭제되었습니다.'
            });
            fetchCodes();
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Database className="text-blue-600" size={32} />
            기초코드 관리
          </h1>
          <p className="text-slate-500 mt-1 font-medium ml-11">시스템 전반에서 사용되는 공통 코드들을 관리합니다.</p>
        </div>
        <button 
          onClick={() => {
            setIsNew(true);
            setCurrentCode({ base_code: '', sub_code: '', code_name: '', note: '' });
            setIsEditModalOpen(true);
          }}
          className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          <Plus size={20} />
          새 코드 등록
        </button>
      </div>

      {/* 필터 및 검색바 */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="코드명, 상세코드, 대분류 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={18} className="text-slate-400" />
          <select 
            value={baseCodeFilter}
            onChange={(e) => setBaseCodeFilter(e.target.value)}
            className="flex-1 md:w-48 px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
          >
            <option value="ALL">전체 대분류</option>
            {uniqueBaseCodes.map(bc => (
              <option key={bc} value={bc}>{bc}</option>
            ))}
          </select>
          <button 
            onClick={fetchCodes}
            className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"
            title="새로고침"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      {/* 코드 리스트 테이블 */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-wider">대분류 (Base)</th>
                <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-wider">상세코드 (Sub)</th>
                <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-wider">코드명 (Name)</th>
                <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-wider">비고</th>
                <th className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-medium">데이터를 불러오는 중...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Database size={48} className="text-slate-200" />
                      <p className="text-slate-400 font-medium">조회된 코드가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => (
                  <tr key={`${code.base_code}-${code.sub_code}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                        <Tag size={12} />
                        {code.base_code}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-mono text-sm font-bold text-slate-700">{code.sub_code}</td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900">{code.code_name}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-slate-500 font-medium">{code.note || '-'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => {
                            setIsNew(false);
                            setCurrentCode(code);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="수정"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(code.base_code, code.sub_code)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 등록/수정 모달 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full overflow-hidden transform animate-in zoom-in duration-300 border border-white/20">
            <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Database size={24} className="text-blue-400" />
                {isNew ? '새 기초코드 등록' : '기초코드 정보 수정'}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">대분류 코드 (Base)</label>
                  <input 
                    type="text"
                    required
                    disabled={!isNew}
                    value={currentCode.base_code}
                    onChange={(e) => setCurrentCode({...currentCode, base_code: e.target.value})}
                    placeholder="예: BANK"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">상세 코드 (Sub)</label>
                  <input 
                    type="text"
                    required
                    disabled={!isNew}
                    value={currentCode.sub_code}
                    onChange={(e) => setCurrentCode({...currentCode, sub_code: e.target.value})}
                    placeholder="예: 01"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">코드 명칭</label>
                <input 
                  type="text"
                  required
                  value={currentCode.code_name}
                  onChange={(e) => setCurrentCode({...currentCode, code_name: e.target.value})}
                  placeholder="예: 국민은행"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">비고 / 설명</label>
                <textarea 
                  value={currentCode.note}
                  onChange={(e) => setCurrentCode({...currentCode, note: e.target.value})}
                  placeholder="코드에 대한 설명을 입력하세요..."
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium min-h-[100px]"
                ></textarea>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                >
                  {isNew ? '등록하기' : '수정 완료'}
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
               statusModal.type === 'error' ? <AlertCircle size={40} className="text-white" /> : <AlertCircle size={40} className="text-white" />}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {statusModal.type === 'success' ? '성공!' : statusModal.type === 'error' ? '오류' : '확인'}
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

export default AdminBaseCode;
