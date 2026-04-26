import { useEffect, useState } from "react";

export type RegionKey = "europe" | "asia" | "americas" | "africa";
export type OrderStatus = "New" | "Confirmed" | "Cancelled";

export type SharedTour = {
  id: string;
  name: string;
  location: string;
  region: RegionKey;
  price: number;
  duration: number;
  description: string;
  image: string;
};

export type SharedOrder = {
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

const TOURS_KEY = "rt_shared_tours";
const ORDERS_KEY = "rt_shared_orders";
const UPDATE_EVENT = "rt-shared-data-update";

const INITIAL_TOURS: SharedTour[] = [
  { id: "t1", name: "Santorini Escape", location: "Santorini, Greece", region: "europe", price: 4500, duration: 5, description: "Cliffside suites, private catamaran cruising, wine tasting, and sunset dinners in Oia.", image: "/tours/santorini.png" },
  { id: "t2", name: "Kyoto Seasons", location: "Kyoto, Japan", region: "asia", price: 5200, duration: 6, description: "Temple visits, tea ceremony, boutique ryokan stay, and a slow cultural rhythm through Kyoto.", image: "/tours/kyoto.png" },
  { id: "t3", name: "Patagonia Expedition", location: "Patagonia, Chile", region: "americas", price: 6800, duration: 7, description: "Glacier trekking, striking mountain views, and warm evenings in a premium mountain lodge.", image: "/tours/patagonia.png" },
  { id: "t4", name: "Marrakech Colors", location: "Marrakech, Morocco", region: "africa", price: 3900, duration: 4, description: "Luxury riad, guided souk walks, a desert camp dinner, and vibrant city textures.", image: "/tours/marrakech.png" },
  { id: "t5", name: "Banff Alpine Retreat", location: "Banff, Canada", region: "americas", price: 4200, duration: 5, description: "Turquoise lakes, alpine viewpoints, spa time, and a grand chateau stay.", image: "/tours/banff.png" },
  { id: "t6", name: "Amalfi Coast Signature", location: "Amalfi Coast, Italy", region: "europe", price: 5800, duration: 6, description: "Sea-view villa, private boat charter, chef-led dinner, and Positano day explorations.", image: "/tours/amalfi.png" }
];

const INITIAL_ORDERS: SharedOrder[] = [
  { id: "o1", orderNumber: "RT-1042", customerName: "Sarah Jenkins", email: "sarah.jenkins@example.com", phone: "+1 (555) 123-4567", travelers: 2, tourId: "t1", date: new Date(Date.now() - 2 * 86400000).toISOString(), status: "New", totalAmount: 9000, notes: "Interested in sea-view upgrade." },
  { id: "o2", orderNumber: "RT-1043", customerName: "Michael Chen", email: "michael.chen@example.com", phone: "+1 (555) 987-6543", travelers: 1, tourId: "t2", date: new Date(Date.now() - 5 * 86400000).toISOString(), status: "Confirmed", totalAmount: 5200, notes: "Prefers vegetarian meals." },
  { id: "o3", orderNumber: "RT-1044", customerName: "Emma Thompson", email: "emma.t@example.com", phone: "+44 7700 900077", travelers: 2, tourId: "t6", date: new Date(Date.now() - 1 * 86400000).toISOString(), status: "New", totalAmount: 11600, notes: "" }
];

function normalizeTour(tour: Partial<SharedTour>): SharedTour {
  return {
    id: tour.id || `t${Date.now()}`,
    name: tour.name || "",
    location: tour.location || "",
    region: (tour.region as RegionKey) || "europe",
    price: Number(tour.price) || 0,
    duration: Number(tour.duration) || 1,
    description: tour.description || "",
    image: tour.image || ""
  };
}

function buildOrderNumber(index: number) {
  return `RT-${1042 + index}`;
}

function normalizeOrder(order: Partial<SharedOrder>, tours: SharedTour[], index: number): SharedOrder {
  const tour = tours.find((item) => item.id === order.tourId);
  const travelers = Number(order.travelers) || 1;
  const totalAmount = Number(order.totalAmount) || ((tour?.price || 0) * travelers);

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

function readTours(): SharedTour[] {
  const storedTours = localStorage.getItem(TOURS_KEY);
  if (!storedTours) {
    localStorage.setItem(TOURS_KEY, JSON.stringify(INITIAL_TOURS));
    return INITIAL_TOURS;
  }

  return JSON.parse(storedTours).map((tour: Partial<SharedTour>) => normalizeTour(tour));
}

function readOrders(tours: SharedTour[]): SharedOrder[] {
  const storedOrders = localStorage.getItem(ORDERS_KEY);
  if (!storedOrders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
    return INITIAL_ORDERS;
  }

  return JSON.parse(storedOrders).map((order: Partial<SharedOrder>, index: number) => normalizeOrder(order, tours, index));
}

function emitDataUpdate() {
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

export function useSharedTravelData() {
  const [tours, setTours] = useState<SharedTour[]>([]);
  const [orders, setOrders] = useState<SharedOrder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const sync = () => {
      const nextTours = readTours();
      const nextOrders = readOrders(nextTours);
      setTours(nextTours);
      setOrders(nextOrders);
      localStorage.setItem(TOURS_KEY, JSON.stringify(nextTours));
      localStorage.setItem(ORDERS_KEY, JSON.stringify(nextOrders));
      setIsLoaded(true);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(UPDATE_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(UPDATE_EVENT, sync);
    };
  }, []);

  const saveTours = (nextTours: SharedTour[]) => {
    const normalizedTours = nextTours.map((tour) => normalizeTour(tour));
    const normalizedOrders = orders.map((order, index) => normalizeOrder(order, normalizedTours, index));
    setTours(normalizedTours);
    setOrders(normalizedOrders);
    localStorage.setItem(TOURS_KEY, JSON.stringify(normalizedTours));
    localStorage.setItem(ORDERS_KEY, JSON.stringify(normalizedOrders));
    emitDataUpdate();
  };

  const saveOrders = (nextOrders: SharedOrder[]) => {
    const normalizedOrders = nextOrders.map((order, index) => normalizeOrder(order, tours, index));
    setOrders(normalizedOrders);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(normalizedOrders));
    emitDataUpdate();
  };

  return {
    tours,
    orders,
    saveTours,
    saveOrders,
    isLoaded
  };
}
