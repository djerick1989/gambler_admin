import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { HealthAgentRealtimeProvider } from './context/HealthAgentRealtimeContext';
import { NotificationProvider } from './context/NotificationContext';
import { DialogProvider } from './context/DialogContext';
import { useTranslation } from 'react-i18next';


// Cada pantalla se descarga cuando alguien la abre, no al entrar. Antes el navegador tenia que
// traerse el editor de texto, el selector de emojis y las graficas para poder pintar el muro.
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const SocialAuthCallback = lazy(() => import('./pages/SocialAuthCallback'));
const RecoveryPassword = lazy(() => import('./pages/RecoveryPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Language = lazy(() => import('./pages/Language'));
const OnBoarding = lazy(() => import('./pages/OnBoarding'));
const OnBoardingForm = lazy(() => import('./pages/OnBoardingForm'));
const Namespaces = lazy(() => import('./pages/I18n/Namespaces'));
const Keys = lazy(() => import('./pages/I18n/Keys'));
const KeyForm = lazy(() => import('./pages/I18n/KeyForm'));
const NewsList = lazy(() => import('./pages/NewsList'));
const NewsForm = lazy(() => import('./pages/NewsForm'));
const NewsGallery = lazy(() => import('./pages/NewsGallery'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const GamblerList = lazy(() => import('./pages/GamblerList'));
const GamblerDetail = lazy(() => import('./pages/GamblerDetail'));
const PostList = lazy(() => import('./pages/PostList'));
const PostForm = lazy(() => import('./pages/PostForm'));
const MediaList = lazy(() => import('./pages/MediaList'));
const PostModerationList = lazy(() => import('./pages/PostModeration/PostModerationList'));
const NotificationsPage = lazy(() => import('./pages/Notifications/NotificationsPage'));
const AchievementList = lazy(() => import('./pages/Achievement/AchievementList'));
const AchievementForm = lazy(() => import('./pages/Achievement/AchievementForm'));
const UserAchievements = lazy(() => import('./pages/Achievement/UserAchievements'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfileView = lazy(() => import('./pages/UserProfileView'));
const DataDeletionRequests = lazy(() => import('./pages/DataDeletionRequests'));
const ChatPage = lazy(() => import('./pages/Chat/ChatPage'));
const PaymentPlatformList = lazy(() => import('./pages/PaymentPlatformList'));
const PaymentPlatformForm = lazy(() => import('./pages/PaymentPlatformForm'));
const DonationList = lazy(() => import('./pages/Donation/DonationList'));
const DonationForm = lazy(() => import('./pages/Donation/DonationForm'));
const DonationLeaderboard = lazy(() => import('./pages/Donation/DonationLeaderboard'));
const FormList = lazy(() => import('./pages/Form/FormList'));
const FormCategoryList = lazy(() => import('./pages/Form/FormCategoryList'));
const FormForm = lazy(() => import('./pages/Form/FormForm'));
const FormQuestions = lazy(() => import('./pages/Form/FormQuestions'));
const FormResponseList = lazy(() => import('./pages/Form/FormResponseList'));
const FormResponseDetail = lazy(() => import('./pages/Form/FormResponseDetail'));
const FormResponseReport = lazy(() => import('./pages/Form/FormResponseReport'));
const CustomerFormList = lazy(() => import('./pages/CustomerForm/CustomerFormList'));
const CustomerFormProcess = lazy(() => import('./pages/CustomerForm/CustomerFormProcess'));
const CustomerFormResult = lazy(() => import('./pages/CustomerForm/CustomerFormResult'));
const DebtList = lazy(() => import('./pages/CustomerDebt/DebtList'));
const DebtForm = lazy(() => import('./pages/CustomerDebt/DebtForm'));
const DebtPolicy = lazy(() => import('./pages/CustomerDebt/DebtPolicy'));
const StrategyList = lazy(() => import('./pages/CustomerStrategy/StrategyList'));
const StrategyForm = lazy(() => import('./pages/CustomerStrategy/StrategyForm'));
const StrategyVoters = lazy(() => import('./pages/CustomerStrategy/StrategyVoters'));
const DopamineList = lazy(() => import('./pages/CustomerDopamine/DopamineList'));
const DopamineDetail = lazy(() => import('./pages/CustomerDopamine/DopamineDetail'));
const DopamineControl = lazy(() => import('./pages/CustomerDopamine/DopamineControl'));
const CustomerAssistance = lazy(() => import('./pages/CustomerAssistance/CustomerAssistance'));
const CustomerHelpSupport = lazy(() => import('./pages/HelpSupport/CustomerHelpSupport'));
const CustomerFAQ = lazy(() => import('./pages/HelpSupport/CustomerFAQ'));
const AdminFeedbackList = lazy(() => import('./pages/HelpSupport/AdminFeedbackList'));
const HealthAgentAdmin = lazy(() => import('./pages/HealthAgentAdmin/HealthAgentAdmin'));
const AdminDopamineList = lazy(() => import('./pages/AdminDopamine/AdminDopamineList'));
const AdminDopamineForm = lazy(() => import('./pages/AdminDopamine/AdminDopamineForm'));
const RelapseList = lazy(() => import('./pages/CustomerRelapse/RelapseList'));
const RelapseForm = lazy(() => import('./pages/CustomerRelapse/RelapseForm'));
const RelapseConclusion = lazy(() => import('./pages/CustomerRelapse/RelapseConclusion'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));

const CargandoPantalla = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }} />
);

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
              <Suspense fallback={<CargandoPantalla />}>
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
                <Route path="post-moderation" element={<AdminRoute><PostModerationList /></AdminRoute>} />
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
              </Suspense>
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
