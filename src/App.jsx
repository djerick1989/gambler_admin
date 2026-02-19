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
import OnBoardingForm from './pages/OnBoardingForm';
import Namespaces from './pages/I18n/Namespaces';
import Keys from './pages/I18n/Keys';
import KeyForm from './pages/I18n/KeyForm';
import NewsList from './pages/NewsList';
import NewsForm from './pages/NewsForm';
import NewsGallery from './pages/NewsGallery';
import NewsDetail from './pages/NewsDetail';
import GamblerList from './pages/GamblerList';
import GamblerDetail from './pages/GamblerDetail';
import PostList from './pages/PostList';
import PostForm from './pages/PostForm';
import MediaList from './pages/MediaList';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import AchievementList from './pages/Achievement/AchievementList';
import AchievementForm from './pages/Achievement/AchievementForm';
import UserAchievements from './pages/Achievement/UserAchievements';
import Profile from './pages/Profile';
import UserProfileView from './pages/UserProfileView';
import ChatPage from './pages/Chat/ChatPage';
import PaymentPlatformList from './pages/PaymentPlatformList';
import PaymentPlatformForm from './pages/PaymentPlatformForm';
import DonationList from './pages/Donation/DonationList';
import DonationForm from './pages/Donation/DonationForm';
import DonationLeaderboard from './pages/Donation/DonationLeaderboard';
import MainLayout from './layouts/MainLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
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

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  // ADMIN = 1, SUPER_ADMIN = 2
  if (user?.role !== 1 && user?.role !== 2) {
    return <Navigate to="/posts" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>
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
                <Route index element={
                  <AdminRoute>
                    <Dashboard />
                  </AdminRoute>
                } />
                <Route path="language" element={<AdminRoute><Language /></AdminRoute>} />
                <Route path="onboarding" element={<AdminRoute><OnBoarding /></AdminRoute>} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="onboarding/new" element={<AdminRoute><OnBoardingForm /></AdminRoute>} />
                <Route path="onboarding/edit/:id" element={<AdminRoute><OnBoardingForm /></AdminRoute>} />

                <Route path="i18n" element={<AdminRoute><Namespaces /></AdminRoute>} />
                <Route path="i18n/namespace/:id" element={<AdminRoute><Keys /></AdminRoute>} />
                <Route path="i18n/namespace/:namespaceId/key/new" element={<AdminRoute><KeyForm /></AdminRoute>} />
                <Route path="i18n/namespace/:namespaceId/key/edit/:id" element={<AdminRoute><KeyForm /></AdminRoute>} />

                <Route path="news" element={<NewsSwitch />} />
                <Route path="news/gallery" element={<NewsGallery />} />
                <Route path="news/view/:id" element={<NewsDetail />} />
                <Route path="news/new" element={<AdminRoute><NewsForm /></AdminRoute>} />
                <Route path="news/edit/:id" element={<AdminRoute><NewsForm /></AdminRoute>} />

                <Route path="gamblers" element={<AdminRoute><GamblerList /></AdminRoute>} />
                <Route path="gamblers/:id" element={<AdminRoute><GamblerDetail /></AdminRoute>} />

                <Route path="posts" element={<PostList />} />
                <Route path="posts/new" element={<PostForm />} />
                <Route path="posts/edit/:id" element={<PostForm />} />

                <Route path="media" element={<AdminRoute><MediaList /></AdminRoute>} />
                <Route path="profile" element={<Profile />} />
                <Route path="user/:userId" element={<UserProfileView />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="chat/:chatId" element={<ChatPage />} />

                <Route path="achievements" element={
                  <ProtectedRoute>
                    <AchievementSwitch />
                  </ProtectedRoute>
                } />
                <Route path="achievements/new" element={<AchievementForm />} />
                <Route path="achievements/edit/:id" element={<AchievementForm />} />

                <Route path="payment-platforms" element={<AdminRoute><PaymentPlatformList /></AdminRoute>} />
                <Route path="payment-platforms/new" element={<AdminRoute><PaymentPlatformForm /></AdminRoute>} />
                <Route path="payment-platforms/edit/:id" element={<AdminRoute><PaymentPlatformForm /></AdminRoute>} />

                <Route path="donations" element={<DonationList />} />
                <Route path="donations/leaderboard" element={<DonationLeaderboard />} />
                <Route path="donations/new/:type" element={<DonationForm />} />
              </Route>
            </Routes>
          </Router>
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

const AchievementSwitch = () => {
  const { user } = useAuth();
  // ADMIN = 1, SUPER_ADMIN = 2
  const isAdmin = user?.role === 1 || user?.role === 2;
  return isAdmin ? <AchievementList /> : <UserAchievements />;
};

const NewsSwitch = () => {
  const { user } = useAuth();
  // ADMIN = 1, SUPER_ADMIN = 2
  const isAdmin = user?.role === 1 || user?.role === 2;
  return isAdmin ? <NewsList /> : <NewsGallery />;
};

export default App;
