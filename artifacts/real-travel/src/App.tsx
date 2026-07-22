import { Route, Router, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomePage } from "@/pages/home";
import { TourDetailPage } from "@/pages/tour-detail";
import NotFound from "@/pages/not-found";
import { AdminPanel } from "@/admin-panel";
import { PaymentReturn } from "@/payment-return";
import { PaymentMock } from "@/payment-mock";
import { LanguageContext, dictionaries, languageFromPath } from "@/i18n";

/** Public pages share the header/footer chrome; payment and admin screens do not. */
function PublicSite() {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background font-sans">
      <SiteHeader />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/tours/:slug" component={TourDetailPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  // The admin panel is a separate, single-language application.
  if (window.location.pathname.startsWith("/admin")) {
    return <AdminPanel />;
  }

  // Language is taken from the URL prefix (/ru, /en) so every page is
  // shareable and indexable in the language it was written in.
  const { language, base } = languageFromPath(window.location.pathname);

  return (
    <LanguageContext.Provider value={{ language, t: dictionaries[language] }}>
      <Router base={base}>
        <TooltipProvider>
          <Switch>
            <Route path="/payment/return" component={PaymentReturn} />
            <Route path="/payment/mock" component={PaymentMock} />
            <Route component={PublicSite} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </Router>
    </LanguageContext.Provider>
  );
}
