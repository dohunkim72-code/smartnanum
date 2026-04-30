import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Filter,
  Calendar,
  Phone,
  Mail,
  Shield,
  X,
  Check,
  AlertCircle,
  Save,
  UserCheck,
  ChevronDown
} from 'lucide-react';

/**
 * 회원 관리 (Donor/Member Management)
 * 기부자 정보를 조회하고 관리합니다.
 */
const AdminUser = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinYear, setJoinYear] = useState('all');
  const [referralFilter, setReferralFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    pw: '',
    name: '',
    email_add: '',
    hpno: '',
    referral_code: '',
    note: ''
  });

  const [statusModal, setStatusModal] = useState({ 
    show: false, 
    type: 'success', 
    message: '', 
    onConfirm: null,
    actionLabel: '확인' 
  });

  const [referrals, setReferrals] = useState([]);

  // 데이터 로드
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        searchTerm,
        joinYear,
        referralCode: referralFilter
      }).toString();

      const response = await fetch(`/api/admin/users?${query}`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      }
    } catch (error) {
      console.error('회원 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      const response = await fetch('/api/admin/referrals');
      const data = await response.json();
      if (response.ok) {
        setReferrals(data);
      }
    } catch (error) {
      console.error('추천인 목록 조회 오류:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [joinYear, referralFilter]);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      fetchUsers();
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        cust_no: user.cust_no,
        id: user.id,
        pw: '', // 수정 시 비번은 비워둠
        name: user.name,
        email_add: user.email_add,
        hpno: user.hpno,
        referral_code: user.referral_code,
        note: user.note
      });
    } else {
      setCurrentUser(null);
      setFormData({
        id: '',
        pw: '',
        name: '',
        email_add: '',
        hpno: '',
        referral_code: '',
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const adminId = adminInfo.referral_code || 'admin';

    const method = currentUser ? 'PUT' : 'POST';
    const body = { ...formData, reg_id: adminId, upd_id: adminId };

    try {
      const response = await fetch('/api/admin/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setStatusModal({
          show: true,
          type: 'success',
          message: currentUser ? '회원 정보가 수정되었습니다.' : '새로운 회원이 등록되었습니다.'
        });
        closeModal();
        fetchUsers();
        setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
      } else {
        const error = await response.json();
        setStatusModal({
          show: true,
          type: 'error',
          message: error.message || '처리 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      console.error('회원 저장 오류:', error);
    }
  };

  const handleDelete = (cust_no) => {
    setStatusModal({
      show: true,
      type: 'error',
      message: '정말 이 회원을 삭제하시겠습니까?\n연관된 기부 내역이 있을 경우 삭제가 불가능할 수 있습니다.',
      actionLabel: '삭제하기',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/users/${cust_no}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            setStatusModal({
              show: true,
              type: 'success',
              message: '회원이 삭제되었습니다.'
            });
            fetchUsers();
            setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
          } else {
            const error = await response.json();
            setStatusModal({
              show: true,
              type: 'error',
              message: error.message || '삭제 중 오류가 발생했습니다.'
            });
          }
        } catch (error) {
          console.error('회원 삭제 오류:', error);
        }
      }
    });
  };

  // 년도 필터 옵션 생성 (2026년부터 현재까지)
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 2026; y--) {
    years.push(y.toString());
  }

  const formatPhone = (phone) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" />
            회원 관리
          </h1>
          <p className="text-slate-500">기부자(회원) 정보를 조회하고 관리합니다.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
        >
          <UserPlus size={20} /> 회원 등록
        </button>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 검색 바 */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="이름, 휴대폰, 아이디로 검색... (Enter)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
            />
          </div>

          {/* 가입년도 필터 */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={joinYear}
              onChange={(e) => setJoinYear(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer"
            >
              <option value="all">모든 가입년도</option>
              {years.map(y => <option key={y} value={y}>{y}년 가입</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>

          {/* 추천인 필터 */}
          <div className="relative">
            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={referralFilter}
              onChange={(e) => setReferralFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-bold appearance-none cursor-pointer"
            >
              <option value="">모든 추천인</option>
              {referrals.map(r => (
                <option key={r.referral_code} value={r.referral_code}>
                  {r.name} ({r.referral_code})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* 리스트 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">이름 / 아이디</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">연락처 / 이메일</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">추천인</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">가입일</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">회원 정보를 불러오는 중...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">조회된 회원이 없습니다.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.cust_no} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{u.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700 font-medium flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        {formatPhone(u.hpno)}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail size={12} className="text-slate-300" />
                        {u.email_add || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                        {u.referral_code || '직접가입'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{u.reg_date?.split('T')[0]}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{u.join_year}년 신규</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModal(u)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.cust_no)}
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

      {/* 회원 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl transition-all duration-500">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl border border-white/40 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* 모달 헤더 */}
            <div className="px-10 py-8 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <UserPlus size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {currentUser ? '회원 정보 수정' : '신규 회원 등록'}
                  </h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                    Donor Information Management
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="p-3 hover:bg-slate-50 rounded-2xl text-slate-300 hover:text-slate-900 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="px-10 pb-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">아이디</label>
                    <input
                      type="text"
                      required
                      disabled={!!currentUser}
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold disabled:bg-slate-100"
                      placeholder="아이디 입력"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">비밀번호</label>
                    <input
                      type="password"
                      placeholder={currentUser ? '변경 시에만 입력' : '비밀번호 입력'}
                      value={formData.pw}
                      onChange={(e) => setFormData({ ...formData, pw: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">이름</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold"
                      placeholder="이름 입력"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">휴대폰 번호</label>
                    <input
                      type="text"
                      value={formData.hpno}
                      onChange={(e) => setFormData({ ...formData, hpno: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold"
                      placeholder="010-0000-0000"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">이메일</label>
                    <input
                      type="email"
                      value={formData.email_add}
                      onChange={(e) => setFormData({ ...formData, email_add: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold"
                      placeholder="example@email.com"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">추천인 코드</label>
                    <div className="relative">
                      <select
                        value={formData.referral_code}
                        onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                      >
                        <option value="">추천인 없음 (직접가입)</option>
                        {referrals.map(r => (
                          <option key={r.referral_code} value={r.referral_code}>
                            {r.name} ({r.referral_code})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">비고 (사인자 등)</label>
                    <textarea
                      rows="2"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-bold resize-none"
                      placeholder="추가 특이사항 입력"
                    ></textarea>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-5 rounded-3xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all font-black"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-5 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-200 hover:brightness-110 transition-all font-black flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {currentUser ? '정보 수정 완료' : '회원 가입 승인'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 상태 알림 모달 */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl max-w-sm w-full text-center border border-white/50">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
              statusModal.type === 'success' ? 'bg-blue-500 shadow-blue-100' : 'bg-rose-500 shadow-rose-100'
            }`}>
              {statusModal.type === 'success' ? (
                <Check size={40} className="text-white" />
              ) : (
                <AlertCircle size={40} className="text-white" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {statusModal.type === 'success' ? '성공' : '알림'}
            </h3>
            <p className="text-slate-600 font-medium whitespace-pre-line">{statusModal.message}</p>
            <div className="mt-8 flex gap-3">
              {statusModal.onConfirm && (
                <button 
                  onClick={() => setStatusModal(prev => ({ ...prev, show: false }))}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
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
                className={`flex-1 py-4 text-white rounded-2xl font-bold transition-all ${
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

export default AdminUser;
