import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  Package, 
  MessageSquare, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  X,
  Shield,
  UserCircle,
  Database,
  Building2,
  Clock,
  Building,
  Truck,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileText,
  CheckCircle2,
  Receipt,
  ClipboardList
} from 'lucide-react';

/**
 * 관리자 웹의 전체 레이아웃 (사이드바 + 헤더 + 콘텐츠 영역)
 */
const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  const isSuperAdmin = adminInfo.grade === '01';

  const allMenuItems = [
    { name: '대시보드', path: '/admin', icon: <LayoutDashboard size={20} /> },
    {
      name: '운영 관리',
      items: [
        { name: '관리자 계정 관리', path: '/admin/managers', icon: <Shield size={20} />, superOnly: true },
        { name: '회원 관리', path: '/admin/users', icon: <Users size={20} /> },
        { name: '입금 관리', path: '/admin/deposits', icon: <Database size={20} /> },
        { name: '정산 관리', path: '/admin/settlement', icon: <BarChart3 size={20} /> },
      ]
    },
    {
      name: '기부 관리',
      items: [
        { name: '기부 신청 관리', path: '/admin/donations', icon: <Heart size={20} /> },
        { name: '기부금 생성 관리', path: '/admin/donations/create', icon: <Sparkles size={20} />, superOnly: true },
        { name: '기부 문서 생성', path: '/admin/donations/docs', icon: <FileText size={20} />, superOnly: true },
        { name: '기부 완료 처리', path: '/admin/donations/complete', icon: <CheckCircle2 size={20} />, superOnly: true },
        { name: '현금영수증 처리', path: '/admin/donations/cr-receipt', icon: <Receipt size={20} />, superOnly: true },
        { name: '물품공급계약서 생성', path: '/admin/donations/contract', icon: <ClipboardList size={20} />, superOnly: true },
      ]
    },
    {
      name: '물류 관리',
      items: [
        { name: '상품 관리', path: '/admin/products', icon: <Package size={20} />, superOnly: true },
        { name: '입출고 관리', path: '/admin/receipts', icon: <Truck size={20} />, superOnly: true },
        { name: '재고 현황', path: '/admin/stock', icon: <BarChart3 size={20} />, superOnly: true },
      ]
    },
    {
      name: '시스템 설정',
      items: [
        { name: '메시징 센터', path: '/admin/sms', icon: <MessageSquare size={20} />, superOnly: true },
        { name: '기초코드 관리', path: '/admin/base-codes', icon: <Database size={20} />, superOnly: true },
        { name: '입금계좌 관리', path: '/admin/bank-info', icon: <Building2 size={20} />, superOnly: true },
        { name: '마감일자 관리', path: '/admin/closing-dates', icon: <Clock size={20} />, superOnly: true },
        { name: '기부처 관리', path: '/admin/clients', icon: <Building size={20} />, superOnly: true },
      ]
    },
    { name: '내 프로필 관리', path: '/admin/profile', icon: <UserCircle size={20} /> },
  ];

  // 등급에 따른 메뉴 필터링
  const menuItems = allMenuItems.map(group => {
    if (group.items) {
      const filteredItems = group.items.filter(item => isSuperAdmin || !item.superOnly);
      if (filteredItems.length === 0) return null;
      return { ...group, items: filteredItems };
    }
    if (!isSuperAdmin && group.superOnly) return null;
    return group;
  }).filter(Boolean);

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('adminInfo');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* 사이드바 */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-0'
        } bg-slate-900 text-white transition-all duration-500 ease-in-out flex flex-col z-50 overflow-hidden relative shadow-2xl`}
      >
        {/* 로고 영역 */}
        <div className="p-6 flex items-center justify-between border-b border-white/5 h-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20 shrink-0 text-xl">
              S
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="font-black text-lg tracking-tight leading-none">Smart</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-[2px] uppercase mt-1">Management</span>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-all active:scale-90"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        {/* 메뉴 리스트 */}
        <nav className="flex-1 px-4 py-8 space-y-10 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {menuItems.map((group, idx) => (
            <div key={idx} className="space-y-3">
              {group.items ? (
                <>
                  {isSidebarOpen && (
                    <div className="flex items-center gap-2 px-4 mb-4">
                      <div className="w-1 h-3 bg-blue-500 rounded-full" />
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[2.5px]">
                        {group.name}
                      </h3>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-[1.25rem] transition-all duration-300 group relative ${
                          location.pathname === item.path
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className={`shrink-0 transition-transform duration-300 ${location.pathname === item.path ? 'scale-110' : 'group-hover:scale-110'}`}>
                          {item.icon}
                        </span>
                        {isSidebarOpen && <span className="font-bold text-[15px] whitespace-nowrap">{item.name}</span>}
                        {location.pathname === item.path && (
                          <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        )}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  to={group.path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-[1.25rem] transition-all duration-300 group relative ${
                    location.pathname === group.path
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={`shrink-0 transition-transform duration-300 ${location.pathname === group.path ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {group.icon}
                  </span>
                  {isSidebarOpen && <span className="font-bold text-[15px] whitespace-nowrap">{group.name}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* 로그아웃 버튼 */}
        <div className="p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-sm">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 text-slate-400 hover:text-rose-400 transition-all rounded-2xl hover:bg-rose-500/10 group"
          >
            <div className="p-2 rounded-xl group-hover:bg-rose-500/20 transition-colors">
              <LogOut size={20} />
            </div>
            {isSidebarOpen && <span className="font-bold text-[15px]">로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 헤더 */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-10 shadow-sm z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 text-slate-500 hover:bg-slate-100 rounded-2xl transition-all active:scale-95 shadow-sm border border-slate-50"
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            {!isSidebarOpen && (
              <div className="flex items-center gap-2 ml-2 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">S</div>
                <span className="font-black text-slate-800 tracking-tight">Smart 어드민</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">System Online</span>
            </div>

            <button className="relative p-3 text-slate-500 hover:bg-slate-50 rounded-2xl transition-all group">
              <Bell size={22} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm shadow-rose-500/40"></span>
            </button>
            
            <Link 
              to="/admin/profile"
              className="flex items-center gap-4 pl-8 border-l border-slate-100 hover:opacity-80 transition-all group"
            >
              {(() => {
                const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
                const adminName = adminInfo.name || '관리자';
                return (
                  <>
                    <div className="text-right hidden sm:block">
                      <p className="text-[14px] font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {adminName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                        {adminInfo.grade === '01' ? 'Super Administrator' : 'Staff Admin'}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all text-lg">
                        {adminName.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                    </div>
                  </>
                );
              })()}
            </Link>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
