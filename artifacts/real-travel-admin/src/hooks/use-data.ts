import { useEffect, useState } from "react";

export type Tour = {
  id: string;
  name: string;
  price: number;
  location: string;
  duration: number;
  description: string;
  image: string;
};

export type OrderStatus = "New" | "Confirmed" | "Cancelled";

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  travelers: number;
  tourId: string;
  date: string;
  status: OrderStatus;
  totalAmount: number;
  notes: string;
};

const INITIAL_TOURS: Tour[] = [
  { id: "t1", name: "Aegean Escape", price: 3200, location: "Santorini, Greece", duration: 7, description: "Experience the magic of Santorini with luxury accommodations and private boat tours.", image: "/tours/santorini.png" },
  { id: "t2", name: "Autumn in Kyoto", price: 4500, location: "Kyoto, Japan", duration: 10, description: "A deeply cultural journey through ancient temples and maple-lined streets.", image: "/tours/kyoto.png" },
  { id: "t3", name: "Patagonia Expedition", price: 5800, location: "Patagonia, Chile", duration: 14, description: "An adventurous expedition into the heart of Patagonia's glaciers and peaks.", image: "/tours/patagonia.png" },
  { id: "t4", name: "Moroccan Colors", price: 2900, location: "Marrakech, Morocco", duration: 6, description: "Immerse yourself in the vibrant souks, luxury riads, and desert landscapes.", image: "/tours/marrakech.png" },
  { id: "t5", name: "Rocky Mountain High", price: 3400, location: "Banff, Canada", duration: 5, description: "Pristine alpine lakes, luxury lodges, and dramatic mountain scenery.", image: "/tours/banff.png" },
  { id: "t6", name: "Amalfi Coast Drive", price: 4100, location: "Amalfi Coast, Italy", duration: 8, description: "Breathtaking coastal views, private cooking classes, and seaside villas.", image: "/tours/amalfi.png" },
];

const INITIAL_ORDERS: Order[] = [
  { id: "o1", orderNumber: "RT-1042", customerName: "Sarah Jenkins", email: "sarah.jenkins@example.com", phone: "+1 (555) 123-4567", travelers: 2, tourId: "t1", date: new Date(Date.now() - 2 * 86400000).toISOString(), status: "New", totalAmount: 6400, notes: "Interested in sea-view upgrade." },
  { id: "o2", orderNumber: "RT-1043", customerName: "Michael Chen", email: "michael.chen@example.com", phone: "+1 (555) 987-6543", travelers: 1, tourId: "t2", date: new Date(Date.now() - 5 * 86400000).toISOString(), status: "Confirmed", totalAmount: 4500, notes: "Prefers vegetarian meals." },
  { id: "o3", orderNumber: "RT-1044", customerName: "Emma Thompson", email: "emma.t@example.com", phone: "+44 7700 900077", travelers: 2, tourId: "t6", date: new Date(Date.now() - 1 * 86400000).toISOString(), status: "New", totalAmount: 8200, notes: "" },
  { id: "o4", orderNumber: "RT-1045", customerName: "David Rodriguez", email: "david.r@example.com", phone: "+1 (555) 222-3333", travelers: 3, tourId: "t3", date: new Date(Date.now() - 10 * 86400000).toISOString(), status: "Confirmed", totalAmount: 17400, notes: "Need 3 single beds if possible." },
  { id: "o5", orderNumber: "RT-1046", customerName: "Elena Rossi", email: "elena.rossi@example.com", phone: "+39 312 345 6789", travelers: 2, tourId: "t4", date: new Date(Date.now() - 3 * 86400000).toISOString(), status: "Cancelled", totalAmount: 5800, notes: "Visa timing issue." },
  { id: "o6", orderNumber: "RT-1047", customerName: "James Wilson", email: "james.w@example.com", phone: "+1 (555) 444-5555", travelers: 2, tourId: "t5", date: new Date(Date.now() - 15 * 86400000).toISOString(), status: "Confirmed", totalAmount: 6800, notes: "" },
  { id: "o7", orderNumber: "RT-1048", customerName: "Olivia Davis", email: "olivia.d@example.com", phone: "+1 (555) 666-7777", travelers: 4, tourId: "t1", date: new Date().toISOString(), status: "New", totalAmount: 12800, notes: "Family trip, 2 rooms." },
];

function normalizeTour(tour: Partial<Tour>): Tour {
  return {
    id: tour.id || `t${Date.now()}`,
    name: tour.name || "",
    price: Number(tour.price) || 0,
    location: tour.location || "",
    duration: Number(tour.duration) || 1,
    description: tour.description || "",
    image: tour.image || ""
  };
}

function buildOrderNumber(index: number) {
  return `RT-${1042 + index}`;
}

function normalizeOrder(order: Partial<Order>, tours: Tour[], index: number): Order {
  const tour = tours.find((item) => item.id === order.tourId);
  const travelers = Number(order.travelers) || 1;
  const totalAmount = Number(order.totalAmount) || (tour ? tour.price * travelers : 0);

  return {
    id: order.id || `o${Date.now()}${index}`,
    orderNumber: order.orderNumber || buildOrderNumber(index),
    customerName: order.customerName || "",
    email: order.email || "",
    phone: order.phone || "",
    travelers,
    tourId: order.tourId || tours[0]?.id || "",
    date: order.date || new Date().toISOString(),
    status: (order.status as OrderStatus) || "New",
    totalAmount,
    notes: order.notes || ""
  };
}

export function useData() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedTours = localStorage.getItem("rt_admin_tours");
    const storedOrders = localStorage.getItem("rt_admin_orders");

    const nextTours = storedTours
      ? JSON.parse(storedTours).map((tour: Partial<Tour>) => normalizeTour(tour))
      : INITIAL_TOURS;

    const nextOrders = storedOrders
      ? JSON.parse(storedOrders).map((order: Partial<Order>, index: number) => normalizeOrder(order, nextTours, index))
      : INITIAL_ORDERS;

    setTours(nextTours);
    setOrders(nextOrders);
    localStorage.setItem("rt_admin_tours", JSON.stringify(nextTours));
    localStorage.setItem("rt_admin_orders", JSON.stringify(nextOrders));
    setIsLoaded(true);
  }, []);

  const saveTours = (newTours: Tour[]) => {
    const normalizedTours = newTours.map((tour) => normalizeTour(tour));
    setTours(normalizedTours);
    localStorage.setItem("rt_admin_tours", JSON.stringify(normalizedTours));
  };

  const saveOrders = (newOrders: Order[]) => {
    const normalizedOrders = newOrders.map((order, index) => normalizeOrder(order, tours, index));
    setOrders(normalizedOrders);
    localStorage.setItem("rt_admin_orders", JSON.stringify(normalizedOrders));
  };

  return {
    tours,
    orders,
    saveTours,
    saveOrders,
    isLoaded
  };
}
