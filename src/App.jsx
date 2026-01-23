import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import RecoveryPassword from './pages/RecoveryPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Language from './pages/Language';
import OnBoarding from './pages/OnBoarding';
import MainLayout from './layouts/MainLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';

const ProtectedRoute = ({ children }) => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>{t('common.loading')}</div>;
  }

  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/recovery-password" element={<RecoveryPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="language" element={<Language />} />
            <Route path="onboarding" element={<OnBoarding />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
