import { useEffect, useState, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import {
  getLatestBusinessProfile,
  restoreLaunchSystemFromProfile,
  saveUnifiedBusinessProfile,
  syncLaunchSystemSnapshot,
} from '@/lib/business-profile';
import { accountStorage } from '@/lib/account-storage';

// Pages (lazy-loaded for faster initial load)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const IdeaIntake = lazy(() => import('./pages/IdeaIntake'));
const OfferLadder = lazy(() => import('./pages/OfferLadder'));
const FreebieBuilder = lazy(() => import('./pages/FreebieBuilder'));
const FunnelBuilder = lazy(() => import('./pages/FunnelBuilder'));
const FunnelCreator = lazy(() => import('./pages/FunnelCreator'));
const FunnelCanvas = lazy(() => import('./pages/FunnelCanvas'));
const LaunchBattlePlan = lazy(() => import('./pages/LaunchBattlePlan'));
const ContentGenerator = lazy(() => import('./pages/ContentGenerator'));
const SalesScripts = lazy(() => import('./pages/SalesScripts'));
const DeploymentCenter = lazy(() => import('./pages/DeploymentCenter'));
const HormoziBot = lazy(() => import('./pages/HormoziBot'));
const AdEngine = lazy(() => import('./pages/AdEngine'));
const ClientMagnetBuilder = lazy(() => import('./pages/ClientMagnetBuilder'));
const VSLBuilder = lazy(() => import('./pages/VSLBuilder'));
const FunnelBrain = lazy(() => import('./pages/FunnelBrain'));
const OfferAgent = lazy(() => import('./pages/OfferAgent'));
const PricingAgent = lazy(() => import('./pages/PricingAgent'));
const LaunchSequenceAgent = lazy(() => import('./pages/LaunchSequenceAgent'));
const FunnelAcquisitionAgent = lazy(() => import('./pages/FunnelAcquisitionAgent'));
const BusinessSetup = lazy(() => import('./pages/BusinessSetup'));
const StrategyGenerator = lazy(() => import('./pages/StrategyGenerator'));
const LaunchCalendar = lazy(() => import('./pages/LaunchCalendar'));
const LaunchPartner = lazy(() => import('./pages/LaunchPartner'));
const EmailBriefing = lazy(() => import('./pages/EmailBriefing'));
const MoneyModelBuilder = lazy(() => import('./pages/MoneyModelBuilder'));
const BrandProfile = lazy(() => import('./pages/BrandProfile'));
const BusinessFoundation = lazy(() => import('./pages/BusinessFoundation'));
const Leads = lazy(() => import('./pages/Leads'));
const PublicFunnel = lazy(() => import('./pages/PublicFunnel'));
const PaymentFulfillment = lazy(() => import('./pages/PaymentFulfillment'));
const Login = lazy(() => import('./pages/Login'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
  </div>
);

// Apply any stored manual theme preference before first render
try {
  const storedTheme = localStorage.getItem("mbos-theme");
  if (storedTheme === "dark") document.documentElement.classList.add("dark");
  else if (storedTheme === "light") document.documentElement.classList.add("light");
} catch { /* storage unavailable */ }

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [isProfileHydrated, setIsProfileHydrated] = useState(false);

  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings || authError || !user) return;

    let cancelled = false;

    const hydrateSharedProfile = async () => {
      try {
        const stored = accountStorage.getItem("launchSystem");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.intake && parsed?.result) {
            if (parsed.profile_version === 2 && parsed.business_id) {
              const currentBusiness = await getLatestBusinessProfile();
              if (currentBusiness?.id === parsed.business_id) return;

              accountStorage.removeItem("launchSystem");
              const restored = restoreLaunchSystemFromProfile(currentBusiness);
              if (restored) {
                accountStorage.setItem("launchSystem", JSON.stringify(restored));
              }
              return;
            }

            let business = await getLatestBusinessProfile();
            if (!business) {
              business = await saveUnifiedBusinessProfile(parsed.intake, parsed.result);
            }

            const migratedLaunchSystem = {
              ...parsed,
              business_id: business.id,
              profile_version: 2,
              intake: {
                ...parsed.intake,
                business_id: business.id,
              },
            };

            accountStorage.setItem("launchSystem", JSON.stringify(migratedLaunchSystem));
            await syncLaunchSystemSnapshot(migratedLaunchSystem);
            return;
          }
          accountStorage.removeItem("launchSystem");
        }

        const business = await getLatestBusinessProfile();
        const restored = restoreLaunchSystemFromProfile(business);
        if (restored) {
          accountStorage.setItem("launchSystem", JSON.stringify(restored));
        }
      } catch (profileError) {
        console.warn("Shared business profile hydration unavailable:", profileError);
      } finally {
        if (!cancelled) setIsProfileHydrated(true);
      }
    };

    hydrateSharedProfile();

    return () => {
      cancelled = true;
    };
  }, [user, isLoadingAuth, isLoadingPublicSettings, authError]);

  if (isLoadingPublicSettings || isLoadingAuth || (!authError && user && !isProfileHydrated)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  if (!user) {
    navigateToLogin();
    return null;
  }

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/IdeaIntake" element={<IdeaIntake />} />
      <Route path="/OfferLadder" element={<OfferLadder />} />
      <Route path="/FreebieBuilder" element={<FreebieBuilder />} />
      <Route path="/FunnelBuilder" element={<FunnelBuilder />} />
      <Route path="/FunnelCreator" element={<FunnelCreator />} />
      <Route path="/FunnelCanvas" element={<FunnelCanvas />} />
      <Route path="/LaunchBattlePlan" element={<LaunchBattlePlan />} />
      <Route path="/ContentGenerator" element={<ContentGenerator />} />
      <Route path="/SalesScripts" element={<SalesScripts />} />
      <Route path="/DeploymentCenter" element={<DeploymentCenter />} />
      <Route path="/HormoziBot" element={<HormoziBot />} />
      <Route path="/AdEngine" element={<AdEngine />} />
      <Route path="/ClientMagnetBuilder" element={<ClientMagnetBuilder />} />
      <Route path="/VSLBuilder" element={<VSLBuilder />} />
      <Route path="/FunnelBrain" element={<FunnelBrain />} />
      <Route path="/OfferAgent" element={<OfferAgent />} />
      <Route path="/PricingAgent" element={<PricingAgent />} />
      <Route path="/LaunchSequenceAgent" element={<LaunchSequenceAgent />} />
      <Route path="/FunnelAcquisitionAgent" element={<FunnelAcquisitionAgent />} />
      <Route path="/BusinessFoundation" element={<BusinessFoundation />} />
      <Route path="/BusinessSetup" element={<BusinessSetup />} />
      <Route path="/BrandProfile" element={<BrandProfile />} />
      <Route path="/MoneyModelBuilder" element={<MoneyModelBuilder />} />
      <Route path="/StrategyGenerator" element={<StrategyGenerator />} />
      <Route path="/LaunchCalendar" element={<LaunchCalendar />} />
      <Route path="/LaunchPartner" element={<LaunchPartner />} />
      <Route path="/EmailBriefing" element={<EmailBriefing />} />
      <Route path="/Leads" element={<Leads />} />
      <Route path="/PaymentFulfillment" element={<PaymentFulfillment />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};

const AppRouter = () => {
  const location = useLocation();

  if (location.pathname === "/login" || location.pathname === "/reset-password") {
    return (
      <Suspense fallback={<PageLoader />}>
        <Login initialMode={location.pathname === "/reset-password" ? "reset" : "signin"} />
      </Suspense>
    );
  }

  if (location.pathname.startsWith("/f/")) {
    return (
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/f/:slug" element={<PublicFunnel />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </Suspense>
    );
  }

  return <AuthenticatedApp />;
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRouter />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;