import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from './app/screens/HomeScreen';
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';
import DonationLimitScreen from './app/screens/DonationLimitScreen';
import DonationScreen from './app/screens/DonationScreen';
import FindIdScreen from './app/screens/FindIdScreen';
import ResetPasswordScreen from './app/screens/ResetPasswordScreen';
import DashboardScreen from './app/screens/DashboardScreen';
import ProfileEditScreen from './app/screens/ProfileEditScreen';
import ChangePasswordScreen from './app/screens/ChangePasswordScreen';
import TermsScreen from './app/screens/TermsScreen';
import DonationHistoryScreen from './app/screens/DonationHistoryScreen';
import DonationDetailScreen from './app/screens/DonationDetailScreen';
import TaxGuideScreen from './app/screens/TaxGuideScreen';

// 관리자(Admin) 관련 컴포넌트 임포트
import AdminLayout from './app/admin/AdminLayout';
import AdminDashboard from './app/admin/AdminDashboard';
import SmsLogs from './app/admin/SmsLogs';
import DonationManagement from './app/admin/DonationManagement';
import AdminManagement from './app/admin/AdminManagement';
import AdminLogin from './app/admin/AdminLogin';
import AdminProfile from './app/admin/AdminProfile';
import AdminBaseCode from './app/admin/AdminBaseCode';
import AdminBankInfo from './app/admin/AdminBankInfo';
import AdminEndDate from './app/admin/AdminEndDate';
import AdminClient from './app/admin/AdminClient';
import AdminProduct from './app/admin/AdminProduct';
import AdminReceipt from './app/admin/AdminReceipt';
import AdminStock from './app/admin/AdminStock';
import AdminUser from './app/admin/AdminUser';
import AdminDonation from './app/admin/AdminDonation';
import AdminDonationCreate from './app/admin/AdminDonationCreate';
import AdminDeposit from './app/admin/AdminDeposit';
import AdminSettlement from './app/admin/AdminSettlement';
import AdminDonationDoc from './app/admin/AdminDonationDoc';
import AdminDonationComplete from './app/admin/AdminDonationComplete';
import AdminCRReceipt from './app/admin/AdminCRReceipt';
import AdminContractDoc from './app/admin/AdminContractDoc';
import { 
  InventoryManagement, 
  SystemSettings 
} from './app/admin/AdminPlaceholders';

/**
 * 관리자 전용 경로 보호 컴포넌트
 */
const AdminProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    // 로그인되지 않은 경우 관리자 로그인 페이지로 이동
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};
/**
 * 스마트나눔 App의 메인 엔트리 포인트입니다.
 * React Router를 사용하여 각 화면 간의 전환을 관리합니다.
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/calculator" element={<DonationLimitScreen />} />
        <Route path="/donation" element={<DonationScreen />} />
        <Route path="/find-id" element={<FindIdScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/profile" element={<ProfileEditScreen />} />
        <Route path="/change-password" element={<ChangePasswordScreen />} />
        <Route path="/terms" element={<TermsScreen />} />
        <Route path="/donation-history" element={<DonationHistoryScreen />} />
        <Route path="/donation-detail" element={<DonationDetailScreen />} />
        <Route path="/tax-guide" element={<TaxGuideScreen />} />

        {/* 관리자(Admin) 전용 라우트 - 보안 보호막 적용 */}
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/users" element={<AdminProtectedRoute><AdminLayout><AdminUser /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/donations" element={<AdminProtectedRoute><AdminLayout><AdminDonation /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/donations/create" element={<AdminProtectedRoute><AdminLayout><AdminDonationCreate /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/donations/docs" element={<AdminProtectedRoute><AdminLayout><AdminDonationDoc /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/donations/complete" element={<AdminProtectedRoute><AdminLayout><AdminDonationComplete /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/donations/cr-receipt" element={<AdminProtectedRoute><AdminLayout><AdminCRReceipt /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/donations/contract" element={<AdminProtectedRoute><AdminLayout><AdminContractDoc /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/deposits" element={<AdminProtectedRoute><AdminLayout><AdminDeposit /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/settlement" element={<AdminProtectedRoute><AdminLayout><AdminSettlement /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/inventory" element={<AdminProtectedRoute><AdminLayout><InventoryManagement /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/sms" element={<AdminProtectedRoute><AdminLayout><SmsLogs /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/settings" element={<AdminProtectedRoute><AdminLayout><SystemSettings /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/managers" element={<AdminProtectedRoute><AdminLayout><AdminManagement /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/profile" element={<AdminProtectedRoute><AdminLayout><AdminProfile /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/base-codes" element={<AdminProtectedRoute><AdminLayout><AdminBaseCode /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/bank-info" element={<AdminProtectedRoute><AdminLayout><AdminBankInfo /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/closing-dates" element={<AdminProtectedRoute><AdminLayout><AdminEndDate /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/clients" element={<AdminProtectedRoute><AdminLayout><AdminClient /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/products" element={<AdminProtectedRoute><AdminLayout><AdminProduct /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/receipts" element={<AdminProtectedRoute><AdminLayout><AdminReceipt /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/stock" element={<AdminProtectedRoute><AdminLayout><AdminStock /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>

    </Router>
  );
}

export default App;
