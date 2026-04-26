import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, Eye, Hash, Map, MapPin, Plus, Search, User, Wallet } from "lucide-react";
import { useData, Order, OrderStatus } from "@/hooks/use-data";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type OrderFormState = {
  customerName: string;
  email: string;
  phone: string;
  tourId: string;
  travelers: number;
  notes: string;
};

const initialFormState: OrderFormState = {
  customerName: "",
  email: "",
  phone: "",
  tourId: "",
  travelers: 1,
  notes: ""
};

export default function Orders() {
  const { orders, tours, saveOrders, isLoaded } = useData();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<OrderFormState>(initialFormState);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || order.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, searchQuery, statusFilter]);

  const newCount = orders.filter((order) => order.status === "New").length;
  const confirmedCount = orders.filter((order) => order.status === "Confirmed").length;
  const confirmedRevenue = orders
    .filter((order) => order.status === "Confirmed")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  if (!isLoaded) return null;

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    saveOrders(updatedOrders);
    toast({
      title: "Order updated",
      description: `Order is now marked as ${newStatus}.`
    });
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsSheetOpen(true);
  };

  const handleCreateOrder = () => {
    const selectedTour = tours.find((tour) => tour.id === formData.tourId);
    if (!formData.customerName || !formData.email || !formData.phone || !selectedTour) {
      toast({
        title: "Missing information",
        description: "Customer, contact and tour details are required.",
        variant: "destructive"
      });
      return;
    }

    const nextOrderNumber = `RT-${1050 + orders.length + 1}`;
    const nextOrder: Order = {
      id: `o${Date.now()}`,
      orderNumber: nextOrderNumber,
      customerName: formData.customerName,
      email: formData.email,
      phone: formData.phone,
      travelers: formData.travelers,
      tourId: selectedTour.id,
      date: new Date().toISOString(),
      status: "New",
      totalAmount: selectedTour.price * formData.travelers,
      notes: formData.notes
    };

    saveOrders([nextOrder, ...orders]);
    setFormData(initialFormState);
    setIsCreateModalOpen(false);
    toast({
      title: "Order created",
      description: `${nextOrder.orderNumber} has been added to incoming bookings.`
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "Confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout title="Orders & Sales">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">New requests</div>
              <div className="mt-2 text-3xl font-semibold">{newCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Confirmed sales</div>
              <div className="mt-2 text-3xl font-semibold">{confirmedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Confirmed revenue</div>
              <div className="mt-2 text-3xl font-semibold text-primary">${confirmedRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
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
              <Input
                type="search"
                placeholder="Search orders, phone, email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add order
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Tour</TableHead>
                  <TableHead className="hidden lg:table-cell">Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No orders found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const tour = tours.find((item) => item.id === order.tourId);
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{order.email}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{tour?.name || "Unknown Tour"}</span>
                            <span className="text-xs text-muted-foreground">{tour?.location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm font-medium text-primary">
                          ${order.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {format(new Date(order.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${getStatusColor(order.status)} border rounded-full px-2.5 font-medium`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {order.status === "New" && (
                              <Button size="sm" onClick={() => handleStatusChange(order.id, "Confirmed")}>
                                Accept
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDetails(order)}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <ChevronDown className="h-4 w-4" />
                                  <span className="sr-only">Change Status</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, "New")}>Mark as New</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Confirmed")}>Mark as Confirmed</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(order.id, "Cancelled")} className="text-destructive">
                                  Mark as Cancelled
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Create booking</DialogTitle>
            <DialogDescription>Add a new customer order and place it into the queue.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer name</Label>
              <Input id="customerName" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
              <div className="grid gap-2">
                <Label>Tour package</Label>
                <Select value={formData.tourId} onValueChange={(value) => setFormData({ ...formData, tourId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tour" />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map((tour) => (
                      <SelectItem key={tour.id} value={tour.id}>
                        {tour.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="travelers">Travelers</Label>
                <Input
                  id="travelers"
                  type="number"
                  min={1}
                  value={formData.travelers}
                  onChange={(e) => setFormData({ ...formData, travelers: Number(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="min-h-[100px]" />
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              Estimated total: <span className="font-semibold text-primary">${((tours.find((tour) => tour.id === formData.tourId)?.price || 0) * formData.travelers).toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrder}>Create order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  Order {selectedOrder.orderNumber}
                  <Badge variant="outline" className={`${getStatusColor(selectedOrder.status)} ml-2 border rounded-full px-2.5`}>
                    {selectedOrder.status}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  Placed on {format(new Date(selectedOrder.date), "MMMM d, yyyy 'at' h:mm a")}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" /> Customer Information
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="text-sm font-medium text-right">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <span className="text-sm font-medium text-right">{selectedOrder.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      <span className="text-sm font-medium text-right">{selectedOrder.phone}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Travelers</span>
                      <span className="text-sm font-medium text-right">{selectedOrder.travelers}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center">
                    <Map className="h-4 w-4 mr-2" /> Tour Details
                  </h3>
                  {(() => {
                    const tour = tours.find((item) => item.id === selectedOrder.tourId);
                    if (!tour) {
                      return <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">Tour information unavailable</div>;
                    }

                    return (
                      <div className="bg-muted/50 rounded-lg overflow-hidden">
                        {tour.image && (
                          <div className="h-32 w-full">
                            <img src={tour.image} alt={tour.name} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div className="p-4 space-y-3">
                          <div className="font-semibold">{tour.name}</div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mr-1" /> {tour.location}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <span className="text-sm text-muted-foreground">Duration</span>
                            <span className="text-sm font-medium">{tour.duration} days</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total amount</span>
                            <span className="text-sm font-medium text-primary">${selectedOrder.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-2 flex items-center text-sm font-medium text-muted-foreground">
                    <Hash className="mr-2 h-4 w-4" /> Notes
                  </div>
                  <p className="text-sm">{selectedOrder.notes || "No notes added yet."}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-3 flex items-center">
                    <Wallet className="h-4 w-4 mr-2" /> Actions
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant={selectedOrder.status === "New" ? "default" : "outline"} className="w-full text-xs" onClick={() => handleStatusChange(selectedOrder.id, "New")}>
                      New
                    </Button>
                    <Button variant={selectedOrder.status === "Confirmed" ? "default" : "outline"} className="w-full text-xs" onClick={() => handleStatusChange(selectedOrder.id, "Confirmed")}>
                      Confirm
                    </Button>
                    <Button variant={selectedOrder.status === "Cancelled" ? "destructive" : "outline"} className="w-full text-xs" onClick={() => handleStatusChange(selectedOrder.id, "Cancelled")}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
