import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import SocialAuthCallback from './pages/SocialAuthCallback';
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
import DataDeletionRequests from './pages/DataDeletionRequests';
import ChatPage from './pages/Chat/ChatPage';
import PaymentPlatformList from './pages/PaymentPlatformList';
import PaymentPlatformForm from './pages/PaymentPlatformForm';
import DonationList from './pages/Donation/DonationList';
import DonationForm from './pages/Donation/DonationForm';
import DonationLeaderboard from './pages/Donation/DonationLeaderboard';
import FormList from './pages/Form/FormList';
import FormCategoryList from './pages/Form/FormCategoryList';
import FormForm from './pages/Form/FormForm';
import FormQuestions from './pages/Form/FormQuestions';
import FormResponseList from './pages/Form/FormResponseList';
import FormResponseDetail from './pages/Form/FormResponseDetail';
import FormResponseReport from './pages/Form/FormResponseReport';
import CustomerFormList from './pages/CustomerForm/CustomerFormList';
import CustomerFormProcess from './pages/CustomerForm/CustomerFormProcess';
import CustomerFormResult from './pages/CustomerForm/CustomerFormResult';
import DebtList from './pages/CustomerDebt/DebtList';
import DebtForm from './pages/CustomerDebt/DebtForm';
import DebtPolicy from './pages/CustomerDebt/DebtPolicy';
import StrategyList from './pages/CustomerStrategy/StrategyList';
import StrategyForm from './pages/CustomerStrategy/StrategyForm';
import StrategyVoters from './pages/CustomerStrategy/StrategyVoters';
import DopamineList from './pages/CustomerDopamine/DopamineList';
import DopamineDetail from './pages/CustomerDopamine/DopamineDetail';
import DopamineControl from './pages/CustomerDopamine/DopamineControl';
import CustomerAssistance from './pages/CustomerAssistance/CustomerAssistance';
import CustomerHelpSupport from './pages/HelpSupport/CustomerHelpSupport';
import CustomerFAQ from './pages/HelpSupport/CustomerFAQ';
import AdminFeedbackList from './pages/HelpSupport/AdminFeedbackList';
import HealthAgentAdmin from './pages/HealthAgentAdmin/HealthAgentAdmin';
import AdminDopamineList from './pages/AdminDopamine/AdminDopamineList';
import AdminDopamineForm from './pages/AdminDopamine/AdminDopamineForm';
import RelapseList from './pages/CustomerRelapse/RelapseList';
import RelapseForm from './pages/CustomerRelapse/RelapseForm';
import RelapseConclusion from './pages/CustomerRelapse/RelapseConclusion';
import SubscriptionPage from './pages/SubscriptionPage';
import MainLayout from './layouts/MainLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { HealthAgentRealtimeProvider } from './context/HealthAgentRealtimeContext';
import { NotificationProvider } from './context/NotificationContext';
import { DialogProvider } from './context/DialogContext';
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

const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  // ADMIN = 1, SUPER_ADMIN = 2, ADVISOR = 3, AUTHOR = 4, AGENT = 5
  if (![1, 2, 3, 4, 5].includes(user?.role)) {
    return <Navigate to="/posts" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <DialogProvider>
          <ChatProvider>
            <HealthAgentRealtimeProvider>
            <Router>
              <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/social-callback" element={<SocialAuthCallback />} />
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
                <Route path="news/gallery" element={<AdminRoute><NewsGallery /></AdminRoute>} />
                <Route path="news/view/:id" element={<AdminRoute><NewsDetail /></AdminRoute>} />
                <Route path="news/new" element={<AdminRoute><NewsForm /></AdminRoute>} />
                <Route path="news/edit/:id" element={<AdminRoute><NewsForm /></AdminRoute>} />

                <Route path="gamblers" element={<AdminRoute><GamblerList /></AdminRoute>} />
                <Route path="gamblers/:id" element={<AdminRoute><GamblerDetail /></AdminRoute>} />
                <Route path="data-deletion-requests" element={<AdminRoute><DataDeletionRequests /></AdminRoute>} />

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
                <Route path="subscriptions" element={<SubscriptionPage />} />

                {/* Forms Module */}
                <Route path="forms" element={<AdminRoute><FormList /></AdminRoute>} />
                <Route path="forms/categories" element={<AdminRoute><FormCategoryList /></AdminRoute>} />
                <Route path="forms/new" element={<AdminRoute><FormForm /></AdminRoute>} />
                <Route path="forms/edit/:id" element={<AdminRoute><FormForm /></AdminRoute>} />
                <Route path="forms/:id/questions" element={<AdminRoute><FormQuestions /></AdminRoute>} />
                <Route path="forms/:id/responses" element={<AdminRoute><FormResponseList /></AdminRoute>} />
                <Route path="forms/response/:id" element={<AdminRoute><FormResponseDetail /></AdminRoute>} />
                <Route path="forms/response/:id/report" element={<AdminRoute><FormResponseReport /></AdminRoute>} />

                {/* Dopamine Admin Module */}
                <Route path="dopamine" element={<AdminRoute><AdminDopamineList /></AdminRoute>} />
                <Route path="dopamine/type/:type" element={<AdminRoute><AdminDopamineForm /></AdminRoute>} />
                <Route path="support-feedback" element={<AdminRoute><AdminFeedbackList /></AdminRoute>} />
                <Route path="health-agent" element={<StaffRoute><HealthAgentAdmin /></StaffRoute>} />

                {/* Customer Forms */}
                <Route path="customer/forms" element={<CustomerFormList />} />
                <Route path="customer/forms/process/:id" element={<CustomerFormProcess />} />
                <Route path="customer/forms/result/:id" element={<CustomerFormResult />} />

                {/* Customer Debts */}
                <Route path="customer/debts" element={<DebtList />} />
                <Route path="customer/debts/new" element={<DebtForm />} />
                <Route path="customer/debts/edit/:id" element={<DebtForm />} />
                <Route path="customer/debts/policy" element={<DebtPolicy />} />

                {/* Customer Strategies */}
                <Route path="customer/strategies" element={<StrategyList />} />
                <Route path="customer/strategies/new" element={<StrategyForm />} />
                <Route path="customer/strategies/edit/:id" element={<StrategyForm />} />
                <Route path="customer/strategies/:id/voters" element={<StrategyVoters />} />

                {/* Customer Dopamine */}
                <Route path="customer/dopamine" element={<DopamineList />} />
                <Route path="customer/dopamine/content/:id" element={<DopamineDetail />} />
                <Route path="customer/dopamine/control" element={<DopamineControl />} />

                {/* Customer Assistance */}
                <Route path="customer/assistance" element={<CustomerAssistance />} />
                <Route path="customer/help-support" element={<CustomerHelpSupport />} />
                <Route path="customer/help-support/faq" element={<CustomerFAQ />} />
                <Route path="customer/relapses" element={<RelapseList />} />
                <Route path="customer/relapses/new" element={<RelapseForm />} />
                <Route path="customer/relapses/edit/:id" element={<RelapseForm />} />
                <Route path="customer/relapses/:id/conclusion" element={<RelapseConclusion />} />

              </Route>
              </Routes>
            </Router>
            </HealthAgentRealtimeProvider>
          </ChatProvider>
        </DialogProvider>
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
  return isAdmin ? <NewsList /> : <Navigate to="/posts" replace />;
};

export default App;
