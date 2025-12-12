import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';

// Existing Pages
import { SplashPage } from './pages/SplashPage';
import { HomePage } from './pages/HomePage';
import { GeneratePage } from './pages/GeneratePage';
import { PictureBookPage } from './pages/PictureBookPage';
import { ComicPage } from './pages/ComicPage';
import { CameraPage } from './pages/CameraPage';
import { ProfilePage } from './pages/ProfilePage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { AudioStoryPage } from './pages/AudioStoryPage';
import { AnimationPage } from './pages/AnimationPage';

// New Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StartupPage from './pages/StartupPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import EditProfilePage from './pages/EditProfilePage'; // Placeholder import, will create next
import OnboardingPage1 from './pages/onboarding/OnboardingPage1';
import OnboardingPage2 from './pages/onboarding/OnboardingPage2';
import OnboardingPage3 from './pages/onboarding/OnboardingPage3';
import OnboardingStartPage from './pages/onboarding/OnboardingStartPage';

// Protected Route Wrapper
const RequireAuth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding/page1" element={<OnboardingPage1 />} />
      <Route path="/onboarding/page2" element={<OnboardingPage2 />} />
      <Route path="/onboarding/page3" element={<OnboardingPage3 />} />
      <Route path="/onboarding/start" element={<OnboardingStartPage />} />

      {/* Public Pages (No Layout Wrapper to prevent double scrollbar) */}
      <Route path="/" element={<SplashPage />} />
      <Route path="/home" element={<HomePage />} />

      {/* Protected Routes */}
      <Route element={<RequireAuth />}>
        <Route path="/startup" element={<StartupPage />} />
        <Route path="/comic" element={<ComicPage />} />
        <Route path="/generate/comic" element={<ComicPage />} />

        {/* Protected Layout Routes */}
        <Route element={<Layout />}>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />

          {/* Generation sub-routes */}
          <Route path="/generate/picture" element={<PictureBookPage />} />
          <Route path="/picture-story" element={<PictureBookPage />} />

          <Route path="/generate/video" element={<AnimationPage />} />
          <Route path="/animation" element={<AnimationPage />} />

          <Route path="/profile/history" element={<HistoryPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Route>

        {/* Standalone Protected Routes (Custom Layouts) */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/generate/audio" element={<AudioStoryPage />} />
        <Route path="/audio" element={<AudioStoryPage />} />

      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  console.log('App component rendering...');
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{
          position: 'fixed', bottom: 12, right: 12, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', color: 'lime', padding: '4px 8px',
          borderRadius: '4px', fontSize: '10px', pointerEvents: 'none'
        }}>v2.2 PROD</div>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
