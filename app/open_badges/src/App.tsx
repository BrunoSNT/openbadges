import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Home } from '@/pages/Home';
import { BadgesPage } from '@/pages/Badges';
import { ProfileManagementPage } from '@/pages/Issuer';
import { CreateIssuerPage } from '@/pages/CreateIssuer';
import ProfilePage from '@/pages/User';
import BadgeValidationPage from '@/pages/Validation';
import { AchievementsPage } from '@/pages/Achievements';
import { IssueBadgePage } from '@/pages/IssueBadge';
import { WalletProvider } from '@/components/WalletProvider';
import Docs from '@/pages/Docs';
import Dashboard from '@/pages/Dashboard';
import OAuthCallback from '@/pages/OAuthCallback';
import { ThemeProvider } from '@/components/theme-provider';
import { MainLayout } from '@/components/layout/MainLayout';
import { I18nProvider } from '@/contexts/I18nContext';
import { SolanaProvider } from '@/contexts/SolanaContext';
import { AuthProvider } from '@/contexts/AuthContext';

function App() {
  return (
    <I18nProvider>
      <ThemeProvider defaultTheme="system" enableSystem>
        <WalletProvider>
          <AuthProvider>
            <SolanaProvider>
              <Router 
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <Routes>
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="profile-management" element={<ProfileManagementPage />} />
                    <Route path="create-issuer" element={<CreateIssuerPage />} />
                    <Route path="achievements">
                      <Route index element={<AchievementsPage />} />
                      <Route path=":achievementId/issue" element={<IssueBadgePage />} />
                    </Route>
                    <Route path="badges">
                      <Route index element={<BadgesPage />} />
                    </Route>
                    <Route path="validate" element={<BadgeValidationPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="docs" element={<Docs />} />
                    <Route path="dashboard" element={<Dashboard />} />
                  </Route>
                  <Route path="oauth/callback" element={<OAuthCallback />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster position="top-center" richColors />
              </Router>
            </SolanaProvider>
          </AuthProvider>
        </WalletProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
