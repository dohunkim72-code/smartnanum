import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
      </Routes>

    </Router>
  );
}

export default App;
