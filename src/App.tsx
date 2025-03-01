import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './components/auth/auth-provider';
import { ProtectedRoute } from './components/auth/protected-route';
import { LoginPage } from './pages/auth/login';
import { SignupPage } from './pages/auth/signup';
import { ForgotPasswordPage } from './pages/auth/forgot-password';
import { GoogleAdsAccountsPage } from './pages/google-ads/accounts';
import { CampaignCopyPage } from './pages/campaigns/copy-modify';
import { CampaignComparePage } from './pages/campaigns/compare';
import { SharedBudgetsPage } from './pages/shared-budgets';
import { TasksPage } from './pages/tasks';
import { TaskTemplatesPage } from './pages/tasks/templates';
import { TaskSchedulesPage } from './pages/tasks/schedules';
import { ReportsPage } from './pages/reports';
import { Header } from './components/layout/header';
import { CampaignList } from './components/campaign/campaign-list';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  return (
    <Router>
      <AuthProvider>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                      <CampaignList />
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/google-ads-accounts"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <GoogleAdsAccountsPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/copy-modify"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <CampaignCopyPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/compare"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <CampaignComparePage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shared-budgets/:accountId"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <SharedBudgetsPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <TasksPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/templates"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <TaskTemplatesPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/schedules"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <TaskSchedulesPage />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50">
                    <Header />
                    <ReportsPage />
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </GoogleOAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;