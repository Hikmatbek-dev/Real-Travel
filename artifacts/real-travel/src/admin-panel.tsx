import { useEffect, useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
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
  TrendingUp,
  User,
  Wallet
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

type AdminRoute = "/admin" | "/admin/dashboard" | "/admin/tours" | "/admin/orders";
type UserInfo = { username: string; name: string };
type TourFormState = Partial<SharedTour>;
type OrderFormState = {
  customerName: string;
  email: string;
  phone: string;
  tourId: string;
  travelers: number;
  notes: string;
};

const ADMIN_USER_KEY = "rt_admin_user";

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

function LoginScreen({ onLogin }: { onLogin: (user: UserInfo) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    if (!(username === "lamerazza" && password === "admin123")) {
      setError("Invalid login details.");
      return;
    }

    setIsLoading(true);
    window.setTimeout(() => {
      onLogin({ username, name: "Admin User" });
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
          <img src="/logo.jpg" alt="Real Travel" className="h-16 w-auto rounded-lg object-contain shadow-sm" />
          <h1 className="text-3xl font-bold tracking-tight text-primary">Real Travel</h1>
          <p className="text-muted-foreground">Admin Portal</p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign in</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error ? <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium">{error}</div> : null}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign in"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}

export function AdminPanel() {
  const { tours, orders, saveTours, saveOrders, isLoaded } = useSharedTravelData();
  const { toast } = useToast();
  const [route, setRoute] = useState<AdminRoute>(() => normalizeAdminRoute(window.location.pathname));
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [tourQuery, setTourQuery] = useState("");
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<SharedTour | null>(null);
  const [tourForm, setTourForm] = useState<TourFormState>({});
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);

  const [orderQuery, setOrderQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SharedOrder | null>(null);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderFormState>(emptyOrderForm);

  useEffect(() => {
    const storedUser = localStorage.getItem(ADMIN_USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => setRoute(normalizeAdminRoute(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextRoute: AdminRoute) => {
    window.history.pushState({}, "", nextRoute);
    setRoute(nextRoute);
    setIsMobileMenuOpen(false);
  };

  const handleLogin = (nextUser: UserInfo) => {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    navigate("/admin/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_USER_KEY);
    setUser(null);
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
  const confirmedRevenue = orders
    .filter((order) => order.status === "Confirmed")
    .reduce((sum, order) => sum + order.totalAmount, 0);

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

  if (!user) {
    return (
      <TooltipProvider>
        <LoginScreen onLogin={handleLogin} />
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
    { href: "/admin/orders" as AdminRoute, label: "Orders", icon: ShoppingCart }
  ];

  const openAddTour = () => {
    setEditingTour(null);
    setTourForm({
      name: "",
      location: "",
      region: "europe",
      price: 0,
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

  const saveTour = () => {
    if (!tourForm.name || !tourForm.location || !tourForm.region || !tourForm.price || !tourForm.duration) {
      toast({ title: "Validation error", description: "Please fill required tour fields.", variant: "destructive" });
      return;
    }

    if (editingTour) {
      saveTours(tours.map((tour) => (tour.id === editingTour.id ? { ...tour, ...tourForm } as SharedTour : tour)));
      toast({ title: "Tour updated", description: "Public catalog has been updated too." });
    } else {
      saveTours([{ ...(tourForm as SharedTour), id: `t${Date.now()}` }, ...tours]);
      toast({ title: "Tour added", description: "New tour is now visible in the user section." });
    }

    setIsTourModalOpen(false);
  };

  const deleteTour = () => {
    if (!tourToDelete) return;
    saveTours(tours.filter((tour) => tour.id !== tourToDelete));
    saveOrders(orders.filter((order) => order.tourId !== tourToDelete));
    setTourToDelete(null);
    setIsDeleteAlertOpen(false);
    toast({ title: "Tour deleted", description: "Tour and related pending references were removed." });
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
      orderNumber: `RT-${1042 + orders.length + 1}`,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/webp", 0.8);
          setTourForm({ ...tourForm, image: dataUrl });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 shrink-0 items-center px-6">
        <img src="/logo.jpg" alt="Real Travel" className="h-10 w-auto rounded-md object-contain" />
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-3">
          {navItems.map((item) => {
            const active = route === item.href;
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigate(item.href)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="p-4 mt-auto border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">AD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{user.name}</span>
            <span className="text-xs text-muted-foreground mt-1">Admin</span>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
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

        <div className="flex flex-col flex-1 md:pl-64">
          <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background/95 backdrop-blur px-4 md:px-8">
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
              <h1 className="text-lg font-semibold tracking-tight">{navItems.find((item) => item.href === route)?.label || "Dashboard"}</h1>
              <Button variant="outline" size="sm" onClick={() => { window.history.pushState({}, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); }}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Bosh sahifa
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="mx-auto max-w-6xl">
              {route === "/admin/dashboard" ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Tours</CardTitle><Map className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{tours.length}</div><p className="text-xs text-muted-foreground mt-1">Live catalog on 5173</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{orders.length}</div><p className="text-xs text-muted-foreground mt-1">Shared with user booking flow</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{pendingOrders}</div><p className="text-xs text-muted-foreground mt-1">Waiting for manager action</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Confirmed Revenue</CardTitle><Wallet className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">${confirmedRevenue.toLocaleString()}</div><p className="text-xs text-muted-foreground mt-1">Accepted orders only</p></CardContent></Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-7">
                    <Card className="md:col-span-4">
                      <CardHeader><CardTitle>Confirmed Revenue by Month</CardTitle></CardHeader>
                      <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                              <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="md:col-span-3">
                      <CardHeader><CardTitle>Order Status</CardTitle></CardHeader>
                      <CardContent className="flex flex-col items-center justify-center">
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                                {donutData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-4 w-full flex-wrap">
                          {donutData.map((entry) => <div key={entry.name} className="flex items-center gap-1.5 text-sm"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} /><span className="text-muted-foreground">{entry.name} ({entry.value})</span></div>)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentOrders.map((order) => {
                          const tour = tours.find((item) => item.id === order.tourId);
                          return (
                            <div key={order.id} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{order.customerName}</span>
                                  <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{order.orderNumber}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">{tour?.name || "Unknown Tour"}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="hidden sm:inline text-sm font-medium text-primary">${order.totalAmount.toLocaleString()}</span>
                                <Badge variant="outline" className={`${getStatusColor(order.status)} border rounded-full px-2.5 font-medium`}>{order.status}</Badge>
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
                              <TableCell className="font-medium text-primary">${tour.price.toLocaleString()}</TableCell>
                              <TableCell className="hidden md:table-cell text-muted-foreground">{tour.duration} days</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
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
                    <Card><CardContent className="p-5"><div className="text-sm text-muted-foreground">Confirmed revenue</div><div className="mt-2 text-3xl font-semibold text-primary">${confirmedRevenue.toLocaleString()}</div></CardContent></Card>
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
                            <TableHead className="hidden lg:table-cell">Amount</TableHead>
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
                                <TableCell className="hidden lg:table-cell text-sm font-medium text-primary">${order.totalAmount.toLocaleString()}</TableCell>
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
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isTourModalOpen} onOpenChange={setIsTourModalOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingTour ? "Edit Tour" : "Add Tour"}</DialogTitle>
            <DialogDescription>Changes here are reflected in the user section too.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Name</Label><Input value={tourForm.name || ""} onChange={(e) => setTourForm({ ...tourForm, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Location</Label><Input value={tourForm.location || ""} onChange={(e) => setTourForm({ ...tourForm, location: e.target.value })} /></div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Region</Label>
                <Select value={(tourForm.region as RegionKey) || "europe"} onValueChange={(value) => setTourForm({ ...tourForm, region: value as RegionKey })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="europe">Europe</SelectItem>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="americas">Americas</SelectItem>
                    <SelectItem value="africa">Africa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Price</Label><Input type="number" value={tourForm.price || ""} onChange={(e) => setTourForm({ ...tourForm, price: Number(e.target.value) })} /></div>
              <div className="grid gap-2"><Label>Duration</Label><Input type="number" value={tourForm.duration || ""} onChange={(e) => setTourForm({ ...tourForm, duration: Number(e.target.value) })} /></div>
            </div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={tourForm.description || ""} onChange={(e) => setTourForm({ ...tourForm, description: e.target.value })} className="min-h-[120px]" /></div>
            <div className="grid gap-2">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
              {tourForm.image && (
                <div className="mt-2 relative h-40 w-full rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden p-2">
                  <img src={tourForm.image} alt="Preview" className="max-h-full max-w-full object-contain" />
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
