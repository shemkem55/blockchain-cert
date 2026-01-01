import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/blockchain/Header";
import { Footer } from "@/components/blockchain/Footer";

const AppLayout = () => {
  const location = useLocation();
  const hideHeaderFooterPaths = [
    "/student",
    "/employer",
    "/registrar",
    "/admin-portal",
    "/login",
    "/signup",
    "/registrar-login",
    "/admin-login",
    "/set-password",
    "/verify-otp",
    "/privacy-policy",
    "/terms-of-service",
    "/security-policy",
    "/cookie-policy",
  ];

  const shouldHide = hideHeaderFooterPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-foreground">
      <div className="fixed inset-0 -z-10 bg-transparent" />
      {!shouldHide && <Header />}
      <div className="flex-1">
        <Outlet />
      </div>
      {!shouldHide && <Footer />}
    </div>
  );
};

export default AppLayout;
