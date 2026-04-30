import React from 'react';

const PlaceholderPage = ({ title }) => (
  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
      <div className="animate-pulse">🛠️</div>
    </div>
    <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
    <p className="text-slate-500">현재 개발 중인 페이지입니다. 곧 만나보실 수 있습니다!</p>
  </div>
);

export const UserManagement = () => <PlaceholderPage title="회원 관리" />;
export const DonationManagement = () => <PlaceholderPage title="기부 신청 관리" />;
export const InventoryManagement = () => <PlaceholderPage title="물류 및 재고 관리" />;
export const SmsLogs = () => <PlaceholderPage title="메시징 센터 (문자 발송 이력)" />;
export const SystemSettings = () => <PlaceholderPage title="시스템 설정" />;
