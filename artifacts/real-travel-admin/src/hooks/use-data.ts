import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type Tour = {
  id: string;
  name: string;
  price: number;
  location: string;
  duration: number;
  description: string;
  image: string;
  region?: string;
  priceUzs?: number;
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

type TourRow = {
  id: string;
  slug?: string;
  name: string;
  location: string;
  region?: string;
  price: number;
  price_uzs?: number;
  duration: number;
  description: string;
  image: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  travelers: number;
  tour_id: string | null;
  date: string;
  status: string;
  total_amount: number;
  notes: string | null;
};

function rowToTour(row: TourRow): Tour {
  return {
    id: row.id,
    name: row.name || "",
    location: row.location || "",
    price: Number(row.price) || 0,
    priceUzs: Number(row.price_uzs) || 0,
    duration: Number(row.duration) || 1,
    description: row.description || "",
    image: row.image || "",
    region: row.region || "europe"
  };
}

function tourToRow(tour: Tour): TourRow {
  return {
    id: tour.id,
    slug: tour.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || tour.id,
    name: tour.name,
    location: tour.location,
    region: tour.region || "europe",
    price: tour.price,
    price_uzs: tour.priceUzs || 0,
    duration: tour.duration,
    description: tour.description,
    image: tour.image
  };
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number || "",
    customerName: row.customer_name || "",
    email: row.email || "",
    phone: row.phone || "",
    travelers: Number(row.travelers) || 1,
    tourId: row.tour_id || "",
    date: row.date || new Date().toISOString(),
    status: (row.status as OrderStatus) || "New",
    totalAmount: Number(row.total_amount) || 0,
    notes: row.notes || ""
  };
}

function orderToRow(order: Order): OrderRow {
  return {
    id: order.id,
    order_number: order.orderNumber || "",
    customer_name: order.customerName,
    email: order.email,
    phone: order.phone,
    travelers: order.travelers,
    tour_id: order.tourId || null,
    date: order.date,
    status: order.status,
    total_amount: order.totalAmount,
    notes: order.notes
  };
}

export function useData() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [toursRes, ordersRes] = await Promise.all([
          supabase.from("tours").select("*").order("created_at", { ascending: true }),
          supabase.from("orders").select("*").order("date", { ascending: false })
        ]);

        if (!active) return;

        if (toursRes.data) {
          setTours((toursRes.data as TourRow[]).map(rowToTour));
        }
        if (ordersRes.data) {
          setOrders((ordersRes.data as OrderRow[]).map(rowToOrder));
        }
      } catch (e) {
        console.error("Failed to load global Supabase data", e);
      } finally {
        if (active) setIsLoaded(true);
      }
    };

    loadData();

    const channel = supabase
      .channel("rt-admin-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "tours" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, loadData)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const saveTours = async (newTours: Tour[]) => {
    setTours(newTours); // optimistic update

    const keepIds = newTours.map((tour) => tour.id);
    const { data: existing } = await supabase.from("tours").select("id");
    const toDelete = ((existing as { id: string }[] | null) ?? [])
      .map((row) => row.id)
      .filter((id) => !keepIds.includes(id));

    if (toDelete.length) {
      const { error } = await supabase.from("tours").delete().in("id", toDelete);
      if (error) throw new Error(`Supabase delete error: ${error.message}`);
    }
    if (newTours.length) {
      const { error } = await supabase.from("tours").upsert(newTours.map(tourToRow));
      if (error) throw new Error(`Supabase upsert error: ${error.message}`);
    }
  };

  const saveOrders = async (newOrders: Order[]) => {
    setOrders(newOrders); // optimistic update

    const keepIds = newOrders.map((order) => order.id);
    const { data: existing } = await supabase.from("orders").select("id");
    const toDelete = ((existing as { id: string }[] | null) ?? [])
      .map((row) => row.id)
      .filter((id) => !keepIds.includes(id));

    if (toDelete.length) {
      const { error } = await supabase.from("orders").delete().in("id", toDelete);
      if (error) throw new Error(`Supabase delete error: ${error.message}`);
    }
    if (newOrders.length) {
      const { error } = await supabase.from("orders").upsert(newOrders.map(orderToRow));
      if (error) throw new Error(`Supabase upsert error: ${error.message}`);
    }
  };

  return {
    tours,
    orders,
    saveTours,
    saveOrders,
    isLoaded
  };
}
