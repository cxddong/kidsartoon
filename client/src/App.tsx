import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { ToastProvider } from './context/ToastContext';
import { PointAnimationProvider } from './context/PointAnimationContext';
// import { SoundManager } from './components/SoundManager'; // SUSPECT 1

// Existing Pages
import { SplashPage } from './pages/SplashPage';
import { CommunityPage } from './pages/CommunityPage'; // Was HomePage
import { HomePage } from './pages/HomePage'; // Was GeneratePage
import { PictureBookPage } from './pages/PictureBookPage';
import { ComicPage } from './pages/ComicPage';
import { CameraPage } from './pages/CameraPage';
import { ProfilePage } from './pages/ProfilePage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { AudioStoryPage } from './pages/AudioStoryPage';
import { MagicMoviePage } from './pages/MagicMoviePage';
import { GreetingCardPage } from './pages/GreetingCardPage';

// New Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { MagicLabPage } from './pages/MagicLabPage'; // SUSPECT 2
import StartupPage from './pages/StartupPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import EditProfilePage from './pages/EditProfilePage';
import OnboardingPage1 from './pages/onboarding/OnboardingPage1';
import OnboardingPage2 from './pages/onboarding/OnboardingPage2';
import OnboardingPage3 from './pages/onboarding/OnboardingPage3';
import OnboardingStartPage from './pages/onboarding/OnboardingStartPage';
import { MakeCartoonPage } from './pages/MakeCartoonPage';
// Removed: MasterpieceMatchPage (duplicated by CreativeJourneyPage)
import ArtCoachPage from './pages/ArtCoachPage';
import { CartoonBookBuilderPage } from './pages/CartoonBookBuilderPage';
import { CartoonBookReaderPage } from './pages/CartoonBookReaderPage';
import { MagicMirrorPage } from './pages/MagicMirrorPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { ParentReportPage } from './pages/ParentReportPage';
import MagicPressPage from './pages/MagicPressPage';
import PublicShowcasePage from './pages/PublicShowcasePage';
import { MagicArtStudioPage } from './pages/MagicArtStudioPage';
import { MagicArtClassPage } from './pages/MagicArtClassPage';
import { ScreenTimeManager } from './components/ScreenTimeManager';
import { ImageAdjustDebugPage } from './pages/ImageAdjustDebugPage';
import { JumpIntoArtPage } from './pages/JumpIntoArtPage';
import { AuditViewPage } from './pages/AuditViewPage';
import { MagicKatLoader } from './components/ui/MagicKatLoader';



// Protected Route Wrapper
const RequireAuth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <MagicKatLoader fullScreen text="Checking magic pass..." />;

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
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding/page1" element={<OnboardingPage1 />} />
      <Route path="/onboarding/page2" element={<OnboardingPage2 />} />
      <Route path="/onboarding/page3" element={<OnboardingPage3 />} />
      <Route path="/onboarding/start" element={<OnboardingStartPage />} />

      {/* Public Pages */}
      <Route path="/" element={<SplashPage />} />
      <Route path="/splash" element={<SplashPage />} />
      <Route path="/view/:shareId" element={<PublicShowcasePage />} />
      <Route path="/audit-view" element={<AuditViewPage />} />

      {/* New Routing Structure */}
      <Route path="/home" element={<HomePage />} /> {/* Formerly GeneratePage */}
      <Route path="/community" element={<CommunityPage />} /> {/* Formerly HomePage */}

      {/* Legacy Redirects or Aliases */}
      <Route path="/generate" element={<Navigate to="/home" replace />} />

      {/* Protected Routes */}
      <Route element={<RequireAuth />}>

        <Route path="/startup" element={<StartupPage />} />
        <Route path="/comic" element={<ComicPage />} />
        <Route path="/generate/comic" element={<ComicPage />} />
        <Route path="/make-cartoon" element={<MakeCartoonPage />} />

        {/* Fullscreen Generation Pages */}
        <Route path="/generate/picture" element={<PictureBookPage />} />
        <Route path="/picture-story" element={<PictureBookPage />} />

        {/* Protected Layout Routes */}
        <Route element={<Layout />}>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/camera" element={<CameraPage />} />
          {/* <Route path="/generate" element={<GeneratePage />} /> Replaced by /home */}
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/profile/history" element={<HistoryPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Route>

        {/* Standalone Protected Routes (Custom Layouts) */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/generate/video" element={<MagicMoviePage />} />
        <Route path="/animation" element={<MagicMoviePage />} />
        <Route path="/generate/audio" element={<AudioStoryPage />} />
        <Route path="/audio" element={<AudioStoryPage />} />
        <Route path="/ask-magic-kat" element={<MagicLabPage />} />
        <Route path="/generate/greeting-card" element={<GreetingCardPage />} />
        <Route path="/jump-into-art" element={<JumpIntoArtPage />} />
        <Route path="/magic-art" element={<MagicArtStudioPage />} />
        <Route path="/art-class" element={<MagicArtClassPage />} />

        {/* Debug Routes */}
        <Route path="/debug/image-adjust" element={<ImageAdjustDebugPage />} />
        {/* Removed: masterpiece-match route (duplicated by creative-journey) */}
        <Route path="/creative-journey" element={<ArtCoachPage />} />
        <Route path="/cartoon-book/builder" element={<CartoonBookBuilderPage />} />
        <Route path="/cartoon-book/reader/:id" element={<CartoonBookReaderPage />} />
        <Route path="/magic-discovery" element={<MagicMirrorPage />} />
        <Route path="/parent" element={<ParentDashboardPage />} />
        <Route path="/parent/report" element={<ParentReportPage />} />
        <Route path="/press" element={<MagicPressPage />} />


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
        <ToastProvider>
          <PointAnimationProvider>
            <ScreenTimeManager>
              {/* <SoundManager /> */}
              <AppRoutes />
            </ScreenTimeManager>
          </PointAnimationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
