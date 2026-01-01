import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Web3Provider } from "@/contexts/Web3Provider";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Index from "./pages/Index";
import Verify from "./pages/Verify";
import Issue from "./pages/Issue";
import Certificate from "./pages/Certificate";
import StudentPortal from "./pages/StudentPortal";
import EmployerPortal from "./pages/EmployerPortal";
import RegistrarPortal from "./pages/RegistrarPortal";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import SecurityPolicy from "./pages/SecurityPolicy";
import RegistrarLogin from "./pages/RegistrarLogin";
import AdminLogin from "./pages/AdminLogin";
import AdminPage from "./pages/AdminPage";
import SetPassword from "./pages/SetPassword";
import VerifyOTP from "./pages/VerifyOTP";
import News from "./pages/News";
import ArticleDetail from "./pages/ArticleDetail";
import Downloads from "./pages/Downloads";
import Tutorials from "./pages/Tutorials";
import Docs from "./pages/Docs";
import StudentGuide from "./pages/StudentGuide";
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();
const googleClientId =
  import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
  "374031083766-ge3s3fsg3jfnlube4ehuoeare904f2sq.apps.googleusercontent.com";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId={googleClientId}>
      <Web3Provider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/news" element={<News />} />
                <Route path="/article/:id" element={<ArticleDetail />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/issue" element={<Issue />} />
                <Route path="/certificate/:id" element={<Certificate />} />
                <Route path="/student" element={<StudentPortal />} />
                <Route path="/employer" element={<EmployerPortal />} />
                <Route path="/registrar" element={<RegistrarPortal />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/set-password" element={<SetPassword />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/tutorials" element={<Tutorials />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/guide" element={<StudentGuide />} />

                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/security-policy" element={<SecurityPolicy />} />
                <Route path="/registrar-login" element={<RegistrarLogin />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin-portal" element={<AdminPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </Web3Provider>
    </GoogleOAuthProvider>
  </QueryClientProvider>
);

export default App;
