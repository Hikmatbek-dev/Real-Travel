import { lazy, Suspense } from "react";
import { Route, Router, Switch } from "wouter";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomePage } from "@/pages/home";
import { OrderLookupPage } from "@/pages/order-lookup";
import { LegalPage } from "@/pages/legal";
import NotFound from "@/pages/not-found";
import { LanguageContext, dictionaries, languageFromPath } from "@/i18n";

// Split out of the initial bundle. The admin panel pulls in recharts and was
// shipped to every public visitor; payment and tour-detail screens are only
// reached on demand. Each becomes its own chunk, loaded when first visited.
const AdminPanel = lazy(() => import("@/admin-panel").then((m) => ({ default: m.AdminPanel })));
const TourDetailPage = lazy(() => import("@/pages/tour-detail").then((m) => ({ default: m.TourDetailPage })));
const PaymentReturn = lazy(() => import("@/payment-return").then((m) => ({ default: m.PaymentReturn })));
const PaymentMock = lazy(() => import("@/payment-mock").then((m) => ({ default: m.PaymentMock })));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

/** Public pages share the header/footer chrome; payment and admin screens do not. */
function PublicSite() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background font-sans">
      <SiteHeader />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/tours/:slug" component={TourDetailPage} />
            <Route path="/order" component={OrderLookupPage} />
            <Route path="/legal/:doc" component={LegalPage} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  // The admin panel is a separate, single-language application.
  if (window.location.pathname.startsWith("/admin")) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AdminPanel />
      </Suspense>
    );
  }

  // Language is taken from the URL prefix (/ru, /en) so every page is
  // shareable and indexable in the language it was written in.
  const { language, base } = languageFromPath(window.location.pathname);

  return (
    <LanguageContext.Provider value={{ language, t: dictionaries[language] }}>
      <Router base={base}>
        <TooltipProvider>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/payment/return" component={PaymentReturn} />
              <Route path="/payment/mock" component={PaymentMock} />
              <Route component={PublicSite} />
            </Switch>
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </Router>
    </LanguageContext.Provider>
  );
}
