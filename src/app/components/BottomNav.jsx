import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 앱의 하단 네비게이션 바 컴포넌트입니다.
 */
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: 'home', label: '홈', path: '/dashboard', activeFill: true },
    { icon: 'history', label: '내역', path: '/donation-history' },
    { icon: 'add', label: '', path: '/donation', isCenter: true },
    { icon: 'payments', label: '환급액', path: '/calculator' },
    { icon: 'person', label: 'MY', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] bg-white/90 backdrop-blur-xl border-t border-gray-100 flex items-center justify-between px-4 pt-2 pb-6">
      {navItems.map((item, idx) => {
        if (item.isCenter) {
          return (
            <div key="center" className="relative -top-6">
              <button 
                onClick={() => navigate(item.path)}
                className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full border-4 border-white shadow-[0_4px_14px_0_rgba(55,19,236,0.39)] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-3xl font-bold">{item.icon}</span>
              </button>
            </div>
          );
        }

        const isActive = location.pathname === item.path;
        return (
          <button 
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 w-16 transition-all active:scale-90 ${
              isActive ? 'text-primary' : 'text-gray-400'
            }`}
          >
            <span 
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: isActive || item.activeFill ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
