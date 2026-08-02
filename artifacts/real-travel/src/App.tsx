import { Route, Switch } from "wouter";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomePage } from "@/pages/home";
import { ToursPage } from "@/pages/tours";
import { TourDetailPage } from "@/pages/tour-detail";
import { AboutPage } from "@/pages/about";
import { ContactPage } from "@/pages/contact";
import { PaymentReturnPage } from "@/pages/payment-return";

import { useState, useEffect } from "react";
import { AdminPanel } from "@/admin-panel";

export function PublicSite() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-sky-500 selection:text-white">
      <SiteHeader />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/tours" component={ToursPage} />
          <Route path="/tour/:id" component={TourDetailPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/payment/return" component={PaymentReturnPage} />
          <Route>
            <div className="pt-40 pb-32 text-center flex flex-col items-center justify-center min-h-[60vh]">
              <h1 className="text-5xl font-light text-slate-900 tracking-tight mb-4">Sahifa topilmadi</h1>
              <p className="text-slate-500 mb-8 max-w-md">Kechirasiz, siz qidirayotgan sahifa mavjud emas yoki o'chirilgan.</p>
              <a href="/" className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-2xl text-sm font-medium transition-colors">
                Bosh sahifaga qaytish
              </a>
            </div>
          </Route>
        </Switch>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (pathname.startsWith("/admin")) {
    return <AdminPanel />;
  }

  return <PublicSite />;
}
