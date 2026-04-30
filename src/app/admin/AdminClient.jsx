import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Globe,
  User,
  Hash,
  Briefcase,
  FileText,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

/**
 * 기부처 관리 페이지
 */
const AdminClient = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [currentClient, setCurrentClient] = useState({
    client_no: '',
    client_name: '',
    biz_no: '',
    representative: '',
    zipcode: '',
    address: '',
    address_detail: '',
    industry: '',
    biz_type: '',
    home_page: '',
    manager_name: '',
    manager_hpno: '',
    manager_email_add: '',
    manager_tel: '',
    note: ''
  });

  // 통합 상태 알림 모달
  const [statusModal, setStatusModal] = useState({ 
    show: false, 
    type: 'success', 
    message: '',
    onConfirm: null
  });

  // 데이터 불러오기
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/clients', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      const validData = Array.isArray(data) ? data : [];
      setClients(validData);
      setFilteredClients(validData);
    } catch (error) {
      console.error('기부처 조회 오류:', error);
      setClients([]);
      setFilteredClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // 검색 필터링
  useEffect(() => {
    const safeClients = Array.isArray(clients) ? clients : [];
    const filtered = safeClients.filter(client => 
      (client.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.biz_no && client.biz_no.includes(searchTerm)) ||
      (client.manager_name && client.manager_name.includes(searchTerm))
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  // 저장 처리
  const handleSave = async (e) => {
    e.preventDefault();
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const adminId = adminInfo.referral_code || 'admin';
    
    try {
      const method = isNew ? 'POST' : 'PUT';
      const response = await fetch('/api/admin/clients', {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...currentClient,
          reg_id: adminId,
          upd_id: adminId
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        setStatusModal({
          show: true,
          type: 'success',
          message: isNew ? '새로운 기부처가 등록되었습니다.' : '기부처 정보가 성공적으로 수정되었습니다.'
        });
        fetchClients();
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
  const handleDelete = (client_no, client_name) => {
    setStatusModal({
      show: true,
      type: 'confirm',
      message: `[${client_name}] 기부처 정보를 삭제하시겠습니까?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/clients/${client_no}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.ok) {
            setStatusModal({
              show: true,
              type: 'success',
              message: '기부처가 삭제되었습니다.'
            });
            fetchClients();
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 헤더 영역 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Building className="text-blue-600" size={32} />
            기부처 관리
          </h1>
          <p className="text-slate-500 mt-1 font-medium ml-11">기부금이 전달되는 각 기관 및 시설 정보를 관리합니다.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="기부처명, 사업자번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl w-full sm:w-80 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm font-bold"
            />
          </div>
          <button 
            onClick={() => {
              setIsNew(true);
              setCurrentClient({
                client_no: '', client_name: '', biz_no: '', representative: '',
                zipcode: '', address: '', address_detail: '', industry: '',
                biz_type: '', home_page: '', manager_name: '', manager_hpno: '',
                manager_email_add: '', manager_tel: '', note: ''
              });
              setIsModalOpen(true);
            }}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            <Plus size={20} />
            새 기부처 등록
          </button>
        </div>
      </div>

      {/* 리스트 영역 */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">기부처 정보를 불러오는 중입니다...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <Building size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">검색 결과가 없거나 등록된 기부처가 없습니다.</h2>
          <p className="text-slate-500">정확한 검색어를 입력하시거나 새로운 기부처를 등록해 주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.client_no} className="group bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Building size={28} />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => {
                      setIsNew(false);
                      setCurrentClient(client);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(client.client_no, client.client_name)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                    {client.client_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{client.client_no}</span>
                    {client.biz_no && (
                      <>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="text-xs font-bold text-slate-500">사업자: {client.biz_no}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 space-y-3 border-t border-slate-50">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                      {client.address} {client.address_detail}
                    </p>
                  </div>
                  {client.manager_name && (
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-slate-400 shrink-0" />
                      <p className="text-sm font-bold text-slate-700">
                        담당: {client.manager_name} 
                        <span className="ml-2 font-medium text-slate-400">{client.manager_hpno}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Client Master Info</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform animate-in zoom-in duration-300 flex flex-col border border-white/20">
            {/* 모달 헤더 */}
            <div className="px-10 py-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Building size={28} className="text-blue-400" />
                  {isNew ? '새 기부처 등록' : '기부처 정보 수정'}
                </h2>
                <p className="text-slate-400 text-sm font-medium mt-1">기관의 상세 정보를 빠짐없이 입력해 주세요.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                <X size={28} />
              </button>
            </div>
            
            {/* 모달 본문 (스크롤) */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              {/* 섹션 1: 기본 정보 */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileText size={18} className="text-blue-600" />
                  <h3 className="font-black text-slate-900 uppercase tracking-tight">기본 정보</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">기관명 (기부처명)</label>
                    <input 
                      type="text" required
                      value={currentClient.client_name}
                      onChange={(e) => setCurrentClient({...currentClient, client_name: e.target.value})}
                      placeholder="기관 정식 명칭 입력"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">사업자등록번호</label>
                    <input 
                      type="text"
                      value={currentClient.biz_no}
                      onChange={(e) => setCurrentClient({...currentClient, biz_no: e.target.value})}
                      placeholder="000-00-00000"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">대표자명</label>
                    <input 
                      type="text"
                      value={currentClient.representative}
                      onChange={(e) => setCurrentClient({...currentClient, representative: e.target.value})}
                      placeholder="대표자 이름"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">홈페이지</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="url"
                        value={currentClient.home_page}
                        onChange={(e) => setCurrentClient({...currentClient, home_page: e.target.value})}
                        placeholder="https://..."
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 섹션 2: 주소 정보 */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <MapPin size={18} className="text-blue-600" />
                  <h3 className="font-black text-slate-900 uppercase tracking-tight">주소 정보</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      value={currentClient.zipcode}
                      onChange={(e) => setCurrentClient({...currentClient, zipcode: e.target.value})}
                      placeholder="우편번호"
                      className="w-32 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold outline-none"
                    />
                    <button type="button" className="px-6 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                      주소 검색
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={currentClient.address}
                    onChange={(e) => setCurrentClient({...currentClient, address: e.target.value})}
                    placeholder="기본 주소"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                  />
                  <input 
                    type="text"
                    value={currentClient.address_detail}
                    onChange={(e) => setCurrentClient({...currentClient, address_detail: e.target.value})}
                    placeholder="상세 주소 입력"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                  />
                </div>
              </section>

              {/* 섹션 3: 담당자 정보 */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <User size={18} className="text-blue-600" />
                  <h3 className="font-black text-slate-900 uppercase tracking-tight">담당자 정보</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">담당자 성함</label>
                    <input 
                      type="text"
                      value={currentClient.manager_name}
                      onChange={(e) => setCurrentClient({...currentClient, manager_name: e.target.value})}
                      placeholder="담당자 이름"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">담당자 휴대폰</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        value={currentClient.manager_hpno}
                        onChange={(e) => setCurrentClient({...currentClient, manager_hpno: e.target.value})}
                        placeholder="010-0000-0000"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">담당자 이메일</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email"
                        value={currentClient.manager_email_add}
                        onChange={(e) => setCurrentClient({...currentClient, manager_email_add: e.target.value})}
                        placeholder="example@email.com"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">담당자 유선전화</label>
                    <input 
                      type="text"
                      value={currentClient.manager_tel}
                      onChange={(e) => setCurrentClient({...currentClient, manager_tel: e.target.value})}
                      placeholder="02-000-0000"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </section>

              {/* 섹션 4: 기타 메모 */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileText size={18} className="text-blue-600" />
                  <h3 className="font-black text-slate-900 uppercase tracking-tight">기타 메모</h3>
                </div>
                <textarea 
                  rows={4}
                  value={currentClient.note}
                  onChange={(e) => setCurrentClient({...currentClient, note: e.target.value})}
                  placeholder="추가적인 사항이나 특이사항을 기록하세요."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[30px] focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold resize-none"
                />
              </section>
            </form>

            {/* 모달 푸터 */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
              >
                취소하기
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-200"
              >
                {isNew ? '새 기부처 등록 완료' : '정보 수정 사항 저장'}
              </button>
            </div>
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

export default AdminClient;
