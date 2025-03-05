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
import CampaignCloneWizardPage from './pages/campaigns/clone-wizard';
import { SharedBudgetsPage } from './pages/shared-budgets';
import { TasksPage } from './pages/tasks';
import { TaskTemplatesPage } from './pages/tasks/templates';
import { TaskSchedulesPage } from './pages/tasks/schedules';
import { ReportsPage } from './pages/reports';
import { OperationDashboardPage } from './pages/operations/operation-dashboard';
import { AppContainer } from './components/layout/app-container';
import { CampaignList } from './components/campaign/campaign-list';
import ApiResilienceTest from './components/test/api-resilience-test';

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
                  <AppContainer>
                    <CampaignList />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/google-ads-accounts"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <GoogleAdsAccountsPage />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/copy-modify"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <CampaignCopyPage />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/compare"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <CampaignComparePage />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/campaigns/clone-wizard"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <CampaignCloneWizardPage />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/shared-budgets/:accountId"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <SharedBudgetsPage />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <TasksPage />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/templates"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <TaskTemplatesPage />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/schedules"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <TaskSchedulesPage />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <ReportsPage />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <OperationDashboardPage />
                  </AppContainer>
                </ProtectedRoute>
              }
            />
            <Route
              path="/test/api-resilience"
              element={
                <ProtectedRoute>
                  <AppContainer>
                    <ApiResilienceTest />
                  </AppContainer>
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