import React, { useState, useEffect } from 'react';
import {
  Plus,
  UserPlus,
  Edit2,
  Save,
  Trash2,
  RefreshCw,
  Search,
  Shield,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import api from '../../lib/api';

/**
 * 관리자(추천인) 계정 관리 페이지
 */
const AdminManagement = () => {
  console.log('AdminManagement component rendering...');
  const [managers, setManagers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState({ 
    show: false, 
    type: 'success', 
    message: '', 
    onConfirm: null,
    actionLabel: '확인' 
  });
  const [currentManager, setCurrentManager] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    referral_code: '',
    pw: '',
    hpno: '',
    email_add: '',
    grade: '02' // 기본 일반관리자
  });

  const fetchManagers = async () => {
    setIsLoading(true);
    try {
      // 공통 api 유틸리티 사용 (토큰 자동 포함)
      const data = await api.get('/admin/managers');
      console.log('Fetched managers data:', data);

      if (Array.isArray(data)) {
        setManagers(data);
      } else {
        console.error('Invalid managers data format:', data);
        setManagers([]);
      }
    } catch (error) {
      console.error('Managers fetch error:', error);
      setManagers([]);
      // 401 에러 등은 api.js에서 처리되거나 여기서 추가 처리 가능
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const openModal = (manager = null) => {
    if (manager) {
      setCurrentManager(manager);
      setFormData({
        name: manager.name,
        referral_code: manager.referral_code,
        pw: '', // 비번은 수정 시 새로 입력하거나 비워둠
        hpno: manager.hpno,
        email_add: manager.email_add,
        grade: manager.grade
      });
    } else {
      setCurrentManager(null);
      setFormData({
        name: '',
        referral_code: '',
        pw: '',
        hpno: '',
        email_add: '',
        grade: '02'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // 필수 값 체크
    if (!formData.name || !formData.referral_code) {
      setStatusModal({
        show: true,
        type: 'error',
        message: '성공적인 등록을 위해 이름과 추천인 아이디는 필수입니다! 😊'
      });
      return;
    }

    if (!currentManager && !formData.pw) {
      setStatusModal({
        show: true,
        type: 'error',
        message: '새로운 관리자 등록을 위해 비밀번호를 입력해주세요.'
      });
      return;
    }

    setIsLoading(true);

    try {
      // 공통 api 유틸리티 사용
      const endpoint = '/admin/managers';
      const result = currentManager 
        ? await api.put(endpoint, { ...formData, id: currentManager.id })
        : await api.post(endpoint, formData);

      setStatusModal({
        show: true,
        type: 'success',
        message: currentManager ? '성공적으로 수정되었습니다.' : '새로운 관리자가 등록되었습니다.'
      });
      setIsModalOpen(false);
      fetchManagers();
      
      // 성공 시 2초 후 자동 닫기
      setTimeout(() => {
        setStatusModal(prev => ({ ...prev, show: false }));
      }, 2000);
    } catch (error) {
      console.error('Submit error:', error);
      setStatusModal({
        show: true,
        type: 'error',
        message: error.message || '서버와 통신 중 오류가 발생했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id) => {
    setStatusModal({
      show: true,
      type: 'error',
      message: '정말 이 관리자를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
      actionLabel: '삭제하기',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/managers/${id}`);
          setStatusModal({
            show: true,
            type: 'success',
            message: '관리자가 성공적으로 삭제되었습니다.'
          });
          fetchManagers();
          setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
        } catch (error) {
          setStatusModal({
            show: true,
            type: 'error',
            message: error.message || '삭제 중 오류가 발생했습니다.'
          });
        }
      }
    });
  };


  const filteredManagers = Array.isArray(managers) ? managers.filter(m =>
    m && (m.name?.includes(searchTerm) || m.referral_code?.includes(searchTerm))
  ) : [];

  console.log('Filtered managers length:', filteredManagers.length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">관리자(추천인) 관리</h1>
          <p className="text-slate-500">시스템 관리자 및 추천인 계정을 관리합니다.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <UserPlus size={20} /> 관리자 등록
        </button>
      </div>

      {/* 검색 바 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="이름 또는 아이디로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      {/* 리스트 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">이름 / 아이디</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">휴대폰 / 이메일</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">등급</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400">데이터를 불러오는 중...</td></tr>
              ) : filteredManagers.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400">등록된 관리자가 없습니다.</td></tr>
              ) : (
                filteredManagers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.referral_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700">{m.hpno}</div>
                      <div className="text-xs text-slate-400">{m.email_add}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-xs font-bold ${m.grade === '01' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                        <Shield size={12} />
                        {m.grade === '01' ? '슈퍼관리자' : '일반관리자'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModal(m)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* 등록/수정 프리미엄 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl transition-all duration-500">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_32px_80px_-12px_rgba(0,0,0,0.3)] border border-white/40 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* 모달 헤더 */}
            <div className="px-10 py-10 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-inner">
                  <UserPlus size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {currentManager ? '관리자 정보 수정' : '신규 관리자 등록'}
                  </h2>
                  <div className="text-slate-400 text-sm font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                    Admin Access Management
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-10 pb-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 섹션 1: 기본 정보 */}
                <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Manager Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-black text-slate-800 shadow-sm"
                        placeholder="이름 입력"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Admin ID</label>
                      <input
                        type="text"
                        required
                        disabled={!!currentManager}
                        value={formData.referral_code}
                        onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-black text-slate-800 shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                        placeholder="아이디"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Access Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder={currentManager ? '변경시에만 입력하세요' : '접속 비밀번호'}
                        value={formData.pw}
                        onChange={(e) => setFormData({ ...formData, pw: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-bold shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 섹션 2: 연락처 및 권한 */}
                <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone</label>
                      <input
                        type="text"
                        value={formData.hpno}
                        onChange={(e) => setFormData({ ...formData, hpno: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-bold shadow-sm"
                        placeholder="010-0000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Role (Grade)</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-bold shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="01">슈퍼관리자</option>
                        <option value="02">일반관리자</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email_add}
                      onChange={(e) => setFormData({ ...formData, email_add: e.target.value })}
                      className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 outline-none transition-all font-bold shadow-sm"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 rounded-[1.75rem] bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all font-black active:scale-95"
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-5 rounded-[1.75rem] bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all shadow-xl shadow-blue-600/30 font-black flex items-center justify-center gap-3 active:scale-95 hover:brightness-110"
                  >
                    <Save size={24} strokeWidth={2.5} />
                    {currentManager ? '수정사항 저장' : '신규 관리자 확정'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 통합 상태 알림 모달 (성공/실패/확인 공용) */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-[40px] shadow-2xl max-w-sm w-full text-center transform animate-in zoom-in duration-300">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
              statusModal.type === 'success' ? 'bg-blue-500 shadow-blue-200' : 'bg-rose-500 shadow-rose-200'
            }`}>
              {statusModal.type === 'success' ? (
                <Check size={40} className="text-white animate-in slide-in-from-bottom-2 duration-500" />
              ) : (
                <AlertCircle size={40} className="text-white animate-in slide-in-from-bottom-2 duration-500" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {statusModal.type === 'success' ? '알림' : '확인 필요'}
            </h3>
            <p className="text-slate-600 font-medium whitespace-pre-line">{statusModal.message}</p>
            <div className="mt-8 flex gap-3">
              {statusModal.onConfirm && (
                <button 
                  onClick={() => setStatusModal(prev => ({ ...prev, show: false }))}
                  className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-300 transition-all active:scale-95"
                >
                  취소
                </button>
              )}
              <button 
                onClick={() => {
                  if (statusModal.onConfirm) {
                    statusModal.onConfirm();
                  } else {
                    setStatusModal(prev => ({ ...prev, show: false }));
                  }
                }}
                className={`flex-1 py-4 text-white rounded-2xl font-bold transition-all active:scale-95 ${
                  statusModal.type === 'success' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {statusModal.actionLabel || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
