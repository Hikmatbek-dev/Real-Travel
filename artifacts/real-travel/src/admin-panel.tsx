import { useEffect, useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import { Link } from "wouter";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Eye,
  Hash,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map,
  MapPin,
  Menu,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  Star,
  TrendingUp,
  User,
  Wallet,
  Image as ImageIcon
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { OrderStatus, RegionKey, SharedOrder, SharedTour, useSharedTravelData } from "@/lib/shared-travel-data";
import { useAdminAuth } from "@/lib/use-admin-auth";
import { TourDatesDialog } from "@/components/admin/tour-dates-dialog";
import { ReviewsManager } from "@/components/admin/reviews-manager";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { uploadTourImage } from "@/lib/upload-image";
import { supabase } from "@/lib/supabase";
import { formatUzs } from "@/lib/format";

type AdminRoute = "/admin" | "/admin/dashboard" | "/admin/tours" | "/admin/orders" | "/admin/reviews" | "/admin/gallery";
type TourFormState = Partial<SharedTour>;
type OrderFormState = {
  customerName: string;
  email: string;
  phone: string;
  tourId: string;
  travelers: number;
  notes: string;
};

const emptyOrderForm: OrderFormState = {
  customerName: "",
  email: "",
  phone: "",
  tourId: "",
  travelers: 1,
  notes: ""
};

function normalizeAdminRoute(pathname: string): AdminRoute {
  if (pathname === "/admin" || pathname === "/admin/") return "/admin/dashboard";
  if (pathname.startsWith("/admin/tours")) return "/admin/tours";
  if (pathname.startsWith("/admin/orders")) return "/admin/orders";
  if (pathname.startsWith("/admin/reviews")) return "/admin/reviews";
  if (pathname.startsWith("/admin/gallery")) return "/admin/gallery";
  return "/admin/dashboard";
}

function getStatusColor(status: string) {
  switch (status) {
    case "New":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Confirmed":
      return "bg-green-100 text-green-800 border-green-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function regionLabel(region: RegionKey) {
  const labels: Record<RegionKey, string> = {
    europe: "Europe",
    asia: "Asia",
    americas: "Americas",
    africa: "Africa"
  };
  return labels[region];
}

function LoginScreen({ onSignIn }: { onSignIn: (username: string, password: string) => Promise<string | null> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    const message = await onSignIn(username, password);
    if (message) {
      setError(message === "Invalid login credentials" ? "Invalid username or password." : message);
      setIsLoading(false);
    }
    // On success, onAuthStateChange swaps this screen for the dashboard.
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left side - Image */}
      <div className="hidden md:block md:w-1/2 relative bg-slate-900">
        <img 
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2000&q=80" 
          alt="Admin Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
          <img src="/logo.jpg" alt="Real Travel Logo" className="h-20 w-auto rounded-2xl shadow-2xl mb-8 border-4 border-white/20" />
          <h2 className="text-4xl font-heading font-bold text-white mb-4">REAL TRAVEL</h2>
          <p className="text-lg text-slate-300 font-light max-w-md">Premium lyuks turlarni boshqarish uchun admin panel. Xush kelibsiz!</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="md:hidden flex flex-col items-center text-center space-y-4 mb-8">
            <img src="/logo.jpg" alt="Real Travel" className="h-16 w-auto rounded-xl object-contain shadow-sm" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Real Travel</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Tizimga kirish</h2>
            <p className="text-sm text-slate-500 mb-8">Iltimos, o'z hisobingiz ma'lumotlarini kiriting.</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {error ? <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-100">{error}</div> : null}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-medium">Foydalanuvchi nomi</Label>
                <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="h-12 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#2298F0]" placeholder="admin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Parol</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="h-12 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-[#2298F0]" placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full h-12 bg-[#2298F0] hover:bg-[#2298F0]/90 text-white rounded-xl shadow-lg shadow-[#2298F0]/20 font-medium text-base mt-4" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Kirilmoqda...</> : "Tizimga kirish"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const { tours, tourDates, orders, reviews, homeGallery, saveTours, saveTourDates, saveOrders, saveReviews, saveHomeGallery, isLoaded } = useSharedTravelData();
  const { user, displayName, loading: isAuthLoading, signIn, signOut } = useAdminAuth();
  const { toast } = useToast();
  const [route, setRoute] = useState<AdminRoute>(() => normalizeAdminRoute(window.location.pathname));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [tourQuery, setTourQuery] = useState("");
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<SharedTour | null>(null);
  const [datesTour, setDatesTour] = useState<SharedTour | null>(null);
  const [tourForm, setTourForm] = useState<TourFormState>({});
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [orderQuery, setOrderQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SharedOrder | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormState>(emptyOrderForm);

  useEffect(() => {
    const handlePopState = () => setRoute(normalizeAdminRoute(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Catch payments that settled at Paylov while the customer never came back.
  // Realtime picks up whatever this confirms, so nothing else needs to react.
  useEffect(() => {
    if (!user || route !== "/admin/orders") return;
    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      fetch("/api/reconcile", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    });
  }, [user, route]);

  const navigate = (nextRoute: AdminRoute) => {
    window.history.pushState({}, "", nextRoute);
    setRoute(nextRoute);
    setIsMobileMenuOpen(false);
  };

  const handleSignIn = async (username: string, password: string) => {
    // Admins log in with a username; map it to the Supabase Auth email.
    const email = username.includes("@") ? username : `${username.trim()}@realtravel.uz`;
    const message = await signIn(email, password);
    if (!message) navigate("/admin/dashboard");
    return message;
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/admin");
  };

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      const search = tourQuery.toLowerCase();
      return tour.name.toLowerCase().includes(search) || tour.location.toLowerCase().includes(search);
    });
  }, [tourQuery, tours]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const search = orderQuery.toLowerCase();
        const matchesSearch =
          order.customerName.toLowerCase().includes(search) ||
          order.orderNumber.toLowerCase().includes(search) ||
          order.phone.toLowerCase().includes(search) ||
          order.email.toLowerCase().includes(search);
        const matchesStatus = statusFilter === "All" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orderQuery, orders, statusFilter]);

  const pendingOrders = orders.filter((order) => order.status === "New").length;
  const confirmedOrders = orders.filter((order) => order.status === "Confirmed").length;
  /** What a customer has actually paid, in so'm. Deposits pay only a share. */
  const paidOf = (order: SharedOrder) =>
    order.paymentState === 2 ? Math.round((order.amountTiyin ?? 0) / 100) : 0;

  /** Still owed on a booking that has been paid for but only in part. */
  const owedOf = (order: SharedOrder) =>
    order.status === "Cancelled" ? 0 : Math.max(0, order.totalAmount - paidOf(order));

  const collected = orders.reduce((sum, order) => sum + paidOf(order), 0);
  const outstanding = orders
    .filter((order) => order.paymentState === 2)
    .reduce((sum, order) => sum + owedOf(order), 0);
  const confirmedRevenue = collected;

  const statusCount = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const donutData = [
    { name: "New", value: statusCount["New"] || 0, color: "hsl(var(--chart-1))" },
    { name: "Confirmed", value: statusCount["Confirmed"] || 0, color: "hsl(var(--chart-2))" },
    { name: "Cancelled", value: statusCount["Cancelled"] || 0, color: "hsl(var(--chart-3))" }
  ].filter((item) => item.value > 0);

  const revenueData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = subMonths(new Date(), 5 - index);
      const monthKey = format(date, "yyyy-MM");
      const total = orders
        .filter((order) => order.status === "Confirmed" && format(new Date(order.date), "yyyy-MM") === monthKey)
        .reduce((sum, order) => sum + order.totalAmount, 0);
      return { name: format(date, "MMM"), total };
    });
  }, [orders]);

  const recentOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <TooltipProvider>
        <LoginScreen onSignIn={handleSignIn} />
        <Toaster />
      </TooltipProvider>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    { href: "/admin/dashboard" as AdminRoute, label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/tours" as AdminRoute, label: "Tours", icon: Map },
    { href: "/admin/orders" as AdminRoute, label: "Orders", icon: ShoppingCart },
    { href: "/admin/reviews" as AdminRoute, label: "Reviews", icon: Star },
    { href: "/admin/gallery" as AdminRoute, label: "Gallery", icon: ImageIcon }
  ];

  const openAddTour = () => {
    setEditingTour(null);
    setTourForm({
      name: "",
      location: "",
      region: "europe",
      price: 0,
      priceUzs: 0,
      duration: 1,
      description: "",
      image: ""
    });
    setIsTourModalOpen(true);
  };

  const openEditTour = (tour: SharedTour) => {
    setEditingTour(tour);
    setTourForm({ ...tour });
    setIsTourModalOpen(true);
  };

  const saveTour = async () => {
    if (!tourForm.name || !tourForm.location || !tourForm.region || !tourForm.price || !tourForm.duration) {
      toast({ title: "Validation error", description: "Please fill required tour fields.", variant: "destructive" });
      return;
    }

    try {
      if (editingTour) {
        await saveTours(tours.map((tour) => (tour.id === editingTour.id ? { ...tour, ...tourForm } as SharedTour : tour)));
        toast({ title: "Tour updated", description: "Public catalog has been updated in Supabase global database." });
      } else {
        const newTourId = `t${Date.now()}`;
        await saveTours([{ ...(tourForm as SharedTour), id: newTourId }, ...tours]);
        const d1 = new Date(); d1.setDate(d1.getDate() + 10);
        const d2 = new Date(); d2.setDate(d2.getDate() + 25);
        const d3 = new Date(); d3.setDate(d3.getDate() + 40);
        await saveTourDates(newTourId, [
          { id: `d_${Date.now()}_1`, tourId: newTourId, departureDate: d1.toISOString().slice(0, 10), seatsTotal: 15 },
          { id: `d_${Date.now()}_2`, tourId: newTourId, departureDate: d2.toISOString().slice(0, 10), seatsTotal: 15 },
          { id: `d_${Date.now()}_3`, tourId: newTourId, departureDate: d3.toISOString().slice(0, 10), seatsTotal: 15 }
        ]);
        toast({ title: "Tour added", description: "New tour is now live in the global database with departure dates." });
      }

      setIsTourModalOpen(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message || "Could not save tour to Supabase.", variant: "destructive" });
    }
  };

  const deleteTour = async () => {
    if (!tourToDelete) return;
    try {
      await saveTours(tours.filter((tour) => tour.id !== tourToDelete));
      await saveOrders(orders.filter((order) => order.tourId !== tourToDelete));
      setTourToDelete(null);
      setIsDeleteAlertOpen(false);
      toast({ title: "Tour deleted", description: "Tour removed from global database." });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message || "Could not delete tour from Supabase.", variant: "destructive" });
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    saveOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)));
    if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status: newStatus });
    toast({ title: "Order updated", description: `Order marked as ${newStatus}.` });
  };

  const createOrder = () => {
    const tour = tours.find((item) => item.id === orderForm.tourId);
    if (!orderForm.customerName || !orderForm.email || !orderForm.phone || !tour) {
      toast({ title: "Missing information", description: "Customer, contact and tour data are required.", variant: "destructive" });
      return;
    }

    const order: SharedOrder = {
      id: `o${Date.now()}`,
      orderNumber: "", // assigned by the database (order_number sequence)
      customerName: orderForm.customerName,
      email: orderForm.email,
      phone: orderForm.phone,
      travelers: orderForm.travelers,
      tourId: tour.id,
      date: new Date().toISOString(),
      status: "New",
      totalAmount: tour.price * orderForm.travelers,
      notes: orderForm.notes
    };

    saveOrders([order, ...orders]);
    setOrderForm(emptyOrderForm);
    setIsCreateOrderOpen(false);
    toast({ title: "Order created", description: "The booking queue was updated." });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const url = await uploadTourImage(file);
      setTourForm((prev) => ({ ...prev, image: url }));
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload the image.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-slate-900 border-r border-slate-800 text-white shadow-xl">
      <div className="flex h-20 shrink-0 items-center px-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Real Travel" className="h-10 w-auto rounded-xl object-contain shadow-sm bg-white p-1" />
          <span className="font-heading text-lg font-bold tracking-tight text-white">REAL <span className="text-[#2298F0]">TRAVEL</span></span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="grid gap-2 px-4">
          {navItems.map((item) => {
            const active = route === item.href;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigate(item.href)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  active 
                    ? "bg-[#2298F0] text-white shadow-md shadow-[#2298F0]/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-6 mt-auto border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-10 w-10 border-2 border-[#2298F0]">
            <AvatarFallback className="bg-[#2298F0] text-white font-bold">AD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{displayName}</span>
            <span className="text-xs text-slate-400">Administrator</span>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-white border-slate-700 hover:bg-slate-800 hover:text-white rounded-xl h-11" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Tizimdan chiqish
        </Button>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full bg-background">
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10">
          <SidebarContent />
        </div>

        <div className="flex flex-col flex-1 md:pl-64 bg-slate-50">
          <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-8 shadow-sm">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <div className="flex flex-1 items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">{navItems.find((item) => item.href === route)?.label || "Dashboard"}</h1>
              <Button variant="outline" className="rounded-full border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors h-10 px-4" onClick={() => { window.history.pushState({}, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Bosh sahifaga qaytish
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="mx-auto max-w-6xl">
              {route === "/admin/dashboard" ? (
                <div className="space-y-8">
                  <div className="grid gap-6 md:grid-cols-4">
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><Map className="h-24 w-24" /></div>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Jami Turlar</CardTitle>
                        <div className="w-10 h-10 rounded-full bg-[#2298F0]/10 flex items-center justify-center"><Map className="h-5 w-5 text-[#2298F0]" /></div>
                      </CardHeader>
                      <CardContent className="z-10 relative">
                        <div className="text-4xl font-black text-slate-800">{tours.length}</div>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Barcha aktiv turlar soni</p>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><ShoppingCart className="h-24 w-24" /></div>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Jami Buyurtmalar</CardTitle>
                        <div className="w-10 h-10 rounded-full bg-[#F5B400]/10 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-[#F5B400]" /></div>
                      </CardHeader>
                      <CardContent className="z-10 relative">
                        <div className="text-4xl font-black text-slate-800">{orders.length}</div>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Platformadan kelganlar</p>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="h-24 w-24" /></div>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Yangi So'rovlar</CardTitle>
                        <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-rose-500" /></div>
                      </CardHeader>
                      <CardContent className="z-10 relative">
                        <div className="text-4xl font-black text-rose-500">{pendingOrders}</div>
                        <p className="text-sm text-slate-500 mt-2 font-medium">Tasdiq kutmoqda</p>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-[#2298F0] to-[#1E88E5] overflow-hidden relative text-white">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="h-24 w-24" /></div>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                        <CardTitle className="text-sm font-bold text-white/80 uppercase tracking-wider">Tushum</CardTitle>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Wallet className="h-5 w-5 text-white" /></div>
                      </CardHeader>
                      <CardContent className="z-10 relative">
                        <div className="text-3xl sm:text-4xl font-black">{formatUzs(collected, "uz")}</div>
                        <p className="text-sm text-white/80 mt-2 font-medium">Real tasdiqlangan summa</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-6 md:grid-cols-7">
                    <Card className="md:col-span-4 border-none shadow-md bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-800">Tushumlar grafigi</CardTitle>
                      </CardHeader>
                      <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                              <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Tushum"]} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                              <Line type="monotone" dataKey="total" stroke="#2298F0" strokeWidth={4} dot={{ r: 4, fill: "#2298F0", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, fill: "#F5B400", strokeWidth: 0 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="md:col-span-3 border-none shadow-md bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-800">Buyurtmalar holati</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center">
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={donutData.map(d => ({...d, color: d.name === 'New' ? '#3b82f6' : d.name === 'Confirmed' ? '#10b981' : '#f43f5e'}))} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                                {donutData.map((entry, index) => <Cell key={index} fill={entry.name === 'New' ? '#3b82f6' : entry.name === 'Confirmed' ? '#10b981' : '#f43f5e'} />)}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-6 w-full flex-wrap">
                          {donutData.map((entry) => (
                            <div key={entry.name} className="flex items-center gap-2 text-sm font-medium">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.name === 'New' ? '#3b82f6' : entry.name === 'Confirmed' ? '#10b981' : '#f43f5e' }} />
                              <span className="text-slate-600">{entry.name} ({entry.value})</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-none shadow-md bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-slate-800">So'nggi buyurtmalar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentOrders.map((order) => {
                          const tour = tours.find((item) => item.id === order.tourId);
                          return (
                            <div key={order.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 text-sm">{order.customerName}</span>
                                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">#{order.orderNumber}</span>
                                </div>
                                <span className="text-sm text-slate-500 font-medium">{tour?.name || "Noma'lum Tur"}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="hidden sm:inline text-sm font-bold text-[#2298F0]">${order.totalAmount.toLocaleString()}</span>
                                <Badge variant="outline" className={`${getStatusColor(order.status)} border rounded-full px-3 py-1 font-semibold`}>{order.status}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {route === "/admin/tours" ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Search tours..." className="pl-8" value={tourQuery} onChange={(e) => setTourQuery(e.target.value)} />
                    </div>
                    <Button onClick={openAddTour} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Add Tour</Button>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-[100px]">Image</TableHead>
                            <TableHead>Tour Details</TableHead>
                            <TableHead>Region</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="hidden md:table-cell">Duration</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTours.map((tour) => (
                            <TableRow key={tour.id}>
                              <TableCell><div className="h-20 w-28 rounded overflow-hidden bg-muted border border-border flex items-center justify-center p-1">{tour.image ? <img src={tour.image} alt={tour.name} className="max-h-full max-w-full object-contain" /> : null}</div></TableCell>
                              <TableCell><div className="font-medium">{tour.name}</div><div className="text-xs text-muted-foreground flex items-center mt-1"><MapPin className="h-3 w-3 mr-1" /> {tour.location}</div></TableCell>
                              <TableCell>{regionLabel(tour.region)}</TableCell>
                              <TableCell className="font-medium text-primary">
                                <div>${tour.price.toLocaleString()}</div>
                                {tour.priceUzs > 0 ? (
                                  <div className="text-xs font-normal text-muted-foreground">{tour.priceUzs.toLocaleString("uz-UZ")} so'm</div>
                                ) : (
                                  <div className="text-xs font-normal text-destructive">so'm narxi yo'q</div>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground">{tour.duration} days</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => setDatesTour(tour)}>Dates</Button>
                                  <Button variant="ghost" size="sm" onClick={() => openEditTour(tour)}>Edit</Button>
                                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setTourToDelete(tour.id); setIsDeleteAlertOpen(true); }}>Delete</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {route === "/admin/orders" ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">New requests</div><div className="mt-2 text-3xl font-semibold">{pendingOrders}</div></CardContent></Card>
                    <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Confirmed sales</div><div className="mt-2 text-3xl font-semibold">{confirmedOrders}</div></CardContent></Card>
                    <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Collected</div><div className="mt-2 text-3xl font-semibold text-primary">{formatUzs(collected, "uz")}</div></CardContent></Card>
                    <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Still owed</div><div className="mt-2 text-3xl font-semibold text-accent">{formatUzs(outstanding, "uz")}</div><p className="mt-1 text-xs text-muted-foreground">Balance on deposit bookings</p></CardContent></Card>
                  </div>

                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full md:w-auto">
                      <TabsList className="grid w-full grid-cols-4 md:w-[400px]">
                        <TabsTrigger value="All">All</TabsTrigger>
                        <TabsTrigger value="New">New</TabsTrigger>
                        <TabsTrigger value="Confirmed">Confirmed</TabsTrigger>
                        <TabsTrigger value="Cancelled">Cancelled</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <div className="flex w-full flex-col gap-3 sm:flex-row md:max-w-xl">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search orders..." className="pl-8" value={orderQuery} onChange={(e) => setOrderQuery(e.target.value)} />
                      </div>
                      <Button onClick={() => setIsCreateOrderOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add order</Button>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="hidden md:table-cell">Tour</TableHead>
                            <TableHead className="hidden lg:table-cell">Paid / total</TableHead>
                            <TableHead className="hidden sm:table-cell">Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => {
                            const tour = tours.find((item) => item.id === order.tourId);
                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-mono text-xs font-medium">{order.orderNumber}</TableCell>
                                <TableCell><div className="font-medium">{order.customerName}</div><div className="mt-1 text-xs text-muted-foreground">{order.email}</div></TableCell>
                                <TableCell className="hidden md:table-cell"><div className="flex flex-col"><span className="font-medium text-sm">{tour?.name || "Unknown Tour"}</span><span className="text-xs text-muted-foreground">{tour?.location}</span></div></TableCell>
                                <TableCell className="hidden lg:table-cell text-sm">
                                  <div className="font-medium text-primary">{formatUzs(paidOf(order), "uz")}</div>
                                  <div className="text-xs text-muted-foreground">of {formatUzs(order.totalAmount, "uz")}</div>
                                  {owedOf(order) > 0 && order.paymentState === 2 ? (
                                    <div className="text-xs font-medium text-accent">owes {formatUzs(owedOf(order), "uz")}</div>
                                  ) : null}
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{format(new Date(order.date), "MMM d, yyyy")}</TableCell>
                                <TableCell><Badge variant="outline" className={`${getStatusColor(order.status)} border rounded-full px-2.5 font-medium`}>{order.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    {order.status === "New" ? <Button size="sm" onClick={() => updateOrderStatus(order.id, "Confirmed")}>Accept</Button> : null}
                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setIsOrderSheetOpen(true); }}><Eye className="h-4 w-4" /></Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "New")}>Mark as New</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "Confirmed")}>Mark as Confirmed</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "Cancelled")} className="text-destructive">Mark as Cancelled</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {route === "/admin/reviews" ? (
                <ReviewsManager reviews={reviews} onSave={saveReviews} />
              ) : null}

              {route === "/admin/gallery" ? (
                <GalleryManager gallery={homeGallery} onSave={saveHomeGallery} />
              ) : null}
            </div>
          </main>
        </div>
      </div>

      <TourDatesDialog
        tour={datesTour}
        tourDates={tourDates}
        onSave={saveTourDates}
        onOpenChange={(open) => { if (!open) setDatesTour(null); }}
      />

      <Dialog open={isTourModalOpen} onOpenChange={setIsTourModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingTour ? "Edit Tour" : "Add Tour"}</DialogTitle>
            <DialogDescription>Changes here are reflected in the user section too.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 text-slate-900">
            <div className="grid gap-1.5">
              <Label className="text-slate-700 font-medium">Tur nomi</Label>
              <Input value={tourForm.name || ""} onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })} placeholder="Masalan: Dubay sayohati" className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-slate-700 font-medium">Davlat / Shahar</Label>
              <Input value={tourForm.location || ""} onChange={(e) => setTourForm({ ...tourForm, location: e.target.value })} placeholder="Masalan: BAA, Dubay" className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-slate-700 font-medium">Davomiyligi (kun)</Label>
                <Input type="number" min={1} value={tourForm.duration || ""} onChange={(e) => setTourForm({ ...tourForm, duration: Number(e.target.value) })} placeholder="7" className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-slate-700 font-medium">Narx (so'm)</Label>
                <Input type="number" min={0} value={tourForm.priceUzs || ""} onChange={(e) => setTourForm({ ...tourForm, priceUzs: Number(e.target.value) })} placeholder="1000000" className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400" />
                {tourForm.priceUzs ? <p className="text-xs text-slate-500">{Number(tourForm.priceUzs).toLocaleString("uz-UZ")} so'm — to'lov shu summada olinadi</p> : null}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-slate-700 font-medium">Rasm — havola (URL) yoki fayl</Label>
              <Input value={tourForm.image || ""} onChange={(e) => setTourForm({ ...tourForm, image: e.target.value })} placeholder="https://... rasm havolasi" className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">yoki fayl yuklang:</span>
                <Input type="file" accept="image/*" disabled={isUploadingImage} onChange={handleImageUpload} className="bg-white text-slate-900 border-slate-300 text-xs" />
              </div>
              {isUploadingImage ? (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Yuklanmoqda...
                </p>
              ) : null}
              {tourForm.image && (
                <div className="mt-1 relative h-40 w-full rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                  <img src={tourForm.image} alt="Ko'rinish" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTourModalOpen(false)}>Cancel</Button>
            <Button onClick={saveTour}>Save tour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tour?</AlertDialogTitle>
            <AlertDialogDescription>This removes it from both admin and public catalog.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTour} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Create booking</DialogTitle>
            <DialogDescription>Add a new order into the same shared sales queue.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Customer name</Label><Input value={orderForm.customerName} onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })} /></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2"><Label>Email</Label><Input type="email" value={orderForm.email} onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Phone</Label><Input value={orderForm.phone} onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })} /></div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
              <div className="grid gap-2">
                <Label>Tour package</Label>
                <Select value={orderForm.tourId} onValueChange={(value) => setOrderForm({ ...orderForm, tourId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select a tour" /></SelectTrigger>
                  <SelectContent>{tours.map((tour) => <SelectItem key={tour.id} value={tour.id}>{tour.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Travelers</Label><Input type="number" min={1} value={orderForm.travelers} onChange={(e) => setOrderForm({ ...orderForm, travelers: Number(e.target.value) || 1 })} /></div>
            </div>
            <div className="grid gap-2"><Label>Notes</Label><Textarea value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} className="min-h-[100px]" /></div>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">Estimated total: <span className="font-semibold text-primary">${((tours.find((tour) => tour.id === orderForm.tourId)?.price || 0) * orderForm.travelers).toLocaleString()}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOrderOpen(false)}>Cancel</Button>
            <Button onClick={createOrder}>Create order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isOrderSheetOpen} onOpenChange={setIsOrderSheetOpen}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto">
          {selectedOrder ? (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Order {selectedOrder.orderNumber}</h2>
                  <Badge variant="outline" className={`${getStatusColor(selectedOrder.status)} border rounded-full px-2.5`}>{selectedOrder.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Placed on {format(new Date(selectedOrder.date), "MMMM d, yyyy 'at' h:mm a")}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center"><User className="h-4 w-4 mr-2" /> Customer Information</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4"><span className="text-sm text-muted-foreground">Name</span><span className="text-sm font-medium text-right">{selectedOrder.customerName}</span></div>
                    <div className="flex items-center justify-between gap-4"><span className="text-sm text-muted-foreground">Email</span><span className="text-sm font-medium text-right">{selectedOrder.email}</span></div>
                    <div className="flex items-center justify-between gap-4"><span className="text-sm text-muted-foreground">Phone</span><span className="text-sm font-medium text-right">{selectedOrder.phone}</span></div>
                    <div className="flex items-center justify-between gap-4"><span className="text-sm text-muted-foreground">Travelers</span><span className="text-sm font-medium text-right">{selectedOrder.travelers}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center"><Map className="h-4 w-4 mr-2" /> Tour Details</h3>
                  {(() => {
                    const tour = tours.find((item) => item.id === selectedOrder.tourId);
                    if (!tour) return <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">Tour information unavailable</div>;
                    return (
                      <div className="bg-muted/50 rounded-lg overflow-hidden">
                        {tour.image ? <div className="h-32 w-full"><img src={tour.image} alt={tour.name} className="h-full w-full object-cover" /></div> : null}
                        <div className="p-4 space-y-3">
                          <div className="font-semibold">{tour.name}</div>
                          <div className="flex items-center text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 mr-1" /> {tour.location}</div>
                          <div className="flex items-center justify-between pt-2 border-t border-border/50"><span className="text-sm text-muted-foreground">Duration</span><span className="text-sm font-medium">{tour.duration} days</span></div>
                          <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total amount</span><span className="text-sm font-medium text-primary">${selectedOrder.totalAmount.toLocaleString()}</span></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-2 flex items-center text-sm font-medium text-muted-foreground"><Hash className="mr-2 h-4 w-4" /> Notes</div>
                  <p className="text-sm">{selectedOrder.notes || "No notes added yet."}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center"><Wallet className="h-4 w-4 mr-2" /> Actions</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant={selectedOrder.status === "New" ? "default" : "outline"} className="w-full text-xs" onClick={() => updateOrderStatus(selectedOrder.id, "New")}>New</Button>
                    <Button variant={selectedOrder.status === "Confirmed" ? "default" : "outline"} className="w-full text-xs" onClick={() => updateOrderStatus(selectedOrder.id, "Confirmed")}>Confirm</Button>
                    <Button variant={selectedOrder.status === "Cancelled" ? "destructive" : "outline"} className="w-full text-xs" onClick={() => updateOrderStatus(selectedOrder.id, "Cancelled")}>Cancel</Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Toaster />
    </TooltipProvider>
  );
}
