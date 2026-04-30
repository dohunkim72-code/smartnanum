import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, ShieldCheck, Check, AlertCircle } from 'lucide-react';

/**
 * 관리자 본인의 프로필(정보) 수정 페이지
 */
const AdminProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [adminInfo, setAdminInfo] = useState({
    id: '',
    name: '',
    referral_code: '',
    hpno: '',
    email_add: '',
    grade: ''
  });

  const [formData, setFormData] = useState({
    hpno: '',
    email_add: '',
    pw: '',
    confirmPw: ''
  });

  const [statusModal, setStatusModal] = useState({ show: false, type: 'success', message: '' });

  // 로그인된 정보 불러오기
  useEffect(() => {
    const savedInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    setAdminInfo(savedInfo);
    setFormData(prev => ({
      ...prev,
      hpno: savedInfo.hpno || '',
      email_add: savedInfo.email_add || ''
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 비밀번호 확인 체크
    if (formData.pw && formData.pw !== formData.confirmPw) {
      setStatusModal({
        show: true,
        type: 'error',
        message: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/managers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adminInfo.id,
          name: adminInfo.name, // 이름은 수정하지 않더라도 서버 규격상 전송
          referral_code: adminInfo.referral_code,
          grade: adminInfo.grade,
          hpno: formData.hpno,
          email_add: formData.email_add,
          pw: formData.pw || undefined // 비밀번호 입력시에만 전송
        })
      });

      const result = await response.json();

      if (response.ok) {
        // 성공 시 로컬 스토리지 정보 업데이트
        const updatedAdmin = { 
          ...adminInfo, 
          hpno: formData.hpno, 
          email_add: formData.email_add 
        };
        localStorage.setItem('adminInfo', JSON.stringify(updatedAdmin));
        setAdminInfo(updatedAdmin);
        
        setStatusModal({
          show: true,
          type: 'success',
          message: '프로필 정보가 성공적으로 업데이트되었습니다.'
        });
        
        // 비밀번호 필드 초기화
        setFormData(prev => ({ ...prev, pw: '', confirmPw: '' }));
        
        setTimeout(() => setStatusModal(prev => ({ ...prev, show: false })), 2000);
      } else {
        setStatusModal({
          show: true,
          type: 'error',
          message: result.message || '업데이트 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      setStatusModal({
        show: true,
        type: 'error',
        message: '서버와 통신할 수 없습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 헤더 섹션 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">내 프로필 관리</h1>
          <p className="text-slate-500 mt-2 font-medium">관리자 계정의 개인 정보를 안전하게 관리하세요.</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-2xl flex items-center gap-3 border border-blue-100 shadow-sm">
          <ShieldCheck size={20} />
          <span className="font-bold">현재 등급: {adminInfo.grade === '01' ? 'Super Admin' : 'Admin'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 프로필 요약 카드 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-600 to-indigo-700 -z-0"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl border-4 border-white text-blue-600 text-3xl font-black">
                {adminInfo.name?.charAt(0) || 'K'}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{adminInfo.name}</h2>
              <p className="text-slate-500 font-medium">{adminInfo.referral_code}</p>
              
              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4 text-left">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-medium">ID: {adminInfo.referral_code}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Check size={16} className="text-green-500" />
                  </div>
                  <span className="text-sm font-medium">상태: 활성 계정</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 정보 수정 폼 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">상세 정보 수정</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* 연락처 정보 */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider">연락처 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">이메일 주소</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email"
                        name="email_add"
                        value={formData.email_add}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">휴대폰 번호</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="tel"
                        name="hpno"
                        value={formData.hpno}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                        placeholder="010-0000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 비밀번호 변경 */}
              <div className="space-y-6 pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider">비밀번호 변경</h4>
                  <span className="text-xs text-slate-400 font-medium">변경 시에만 입력하세요</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">새 비밀번호</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="password"
                        name="pw"
                        value={formData.pw}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">비밀번호 확인</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="password"
                        name="confirmPw"
                        value={formData.confirmPw}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save size={20} />
                  )}
                  {isLoading ? '업데이트 중...' : '변경사항 저장하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 상태 알림 모달 */}
      {statusModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-[40px] shadow-2xl max-w-sm w-full text-center transform animate-in zoom-in duration-300">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
              statusModal.type === 'success' ? 'bg-blue-500 shadow-blue-200' : 'bg-rose-500 shadow-rose-200'
            }`}>
              {statusModal.type === 'success' ? (
                <Check size={40} className="text-white" />
              ) : (
                <AlertCircle size={40} className="text-white" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {statusModal.type === 'success' ? '성공!' : '오류'}
            </h3>
            <p className="text-slate-600 font-medium">{statusModal.message}</p>
            <div className="mt-8">
              <button 
                onClick={() => setStatusModal(prev => ({ ...prev, show: false }))}
                className={`w-full py-4 text-white rounded-2xl font-bold transition-all ${
                  statusModal.type === 'success' ? 'bg-slate-900' : 'bg-rose-600'
                }`}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
