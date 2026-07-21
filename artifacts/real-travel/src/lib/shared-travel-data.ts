import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type RegionKey = "europe" | "asia" | "americas" | "africa";
export type OrderStatus = "New" | "Confirmed" | "Cancelled";

// Gives each useSharedTravelData mount its own realtime channel topic.
let channelSeq = 0;

export type SharedTour = {
  id: string;
  name: string;
  location: string;
  region: RegionKey;
  price: number;
  /** Price in so'm — what customers are actually charged via Paylov. */
  priceUzs: number;
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

// ----- Row types (Supabase, snake_case) -----

type TourRow = {
  id: string;
  name: string;
  location: string;
  region: string;
  price: number;
  price_uzs: number;
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

// ----- Normalizers (defaults + type coercion) -----

function normalizeTour(tour: Partial<SharedTour>): SharedTour {
  return {
    id: tour.id || `t${Date.now()}`,
    name: tour.name || "",
    location: tour.location || "",
    region: (tour.region as RegionKey) || "europe",
    price: Number(tour.price) || 0,
    priceUzs: Number(tour.priceUzs) || 0,
    duration: Number(tour.duration) || 1,
    description: tour.description || "",
    image: tour.image || ""
  };
}

function normalizeOrder(order: Partial<SharedOrder>, tours: SharedTour[], index: number): SharedOrder {
  const tour = tours.find((item) => item.id === order.tourId);
  const travelers = Number(order.travelers) || 1;
  const totalAmount = Number(order.totalAmount) || ((tour?.price || 0) * travelers);

  return {
    id: order.id || `o${Date.now()}${index}`,
    // Empty on new orders — the DB order_number sequence assigns it on insert.
    orderNumber: order.orderNumber || "",
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

// ----- Row <-> app-model mapping -----

function rowToTour(row: TourRow): SharedTour {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    region: (row.region as RegionKey) || "europe",
    price: Number(row.price),
    priceUzs: Number(row.price_uzs ?? 0),
    duration: Number(row.duration),
    description: row.description,
    image: row.image
  };
}

function tourToRow(tour: SharedTour): TourRow {
  return {
    id: tour.id,
    name: tour.name,
    location: tour.location,
    region: tour.region,
    price: tour.price,
    price_uzs: tour.priceUzs,
    duration: tour.duration,
    description: tour.description,
    image: tour.image
  };
}

function rowToOrder(row: OrderRow): SharedOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    travelers: Number(row.travelers),
    tourId: row.tour_id || "",
    date: new Date(row.date).toISOString(),
    status: (row.status as OrderStatus) || "New",
    totalAmount: Number(row.total_amount),
    notes: row.notes || ""
  };
}

function orderToRow(order: SharedOrder): Record<string, unknown> {
  return {
    id: order.id,
    order_number: order.orderNumber,
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

/**
 * Shared data hook backed by Supabase.
 *
 * The public site and the admin panel both use this hook. Reads come from the
 * `tours` / `orders` tables; writes upsert the provided array and delete any
 * rows no longer present. A realtime subscription keeps every open tab in sync.
 */
export function useSharedTravelData() {
  const [tours, setTours] = useState<SharedTour[]>([]);
  const [orders, setOrders] = useState<SharedOrder[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [toursRes, ordersRes] = await Promise.all([
        supabase.from("tours").select("*").order("created_at", { ascending: true }),
        supabase.from("orders").select("*").order("date", { ascending: false })
      ]);

      if (!active) return;

      setTours(((toursRes.data as TourRow[] | null) ?? []).map(rowToTour));
      setOrders(((ordersRes.data as OrderRow[] | null) ?? []).map(rowToOrder));
      setIsLoaded(true);
    };

    load();

    // Unique per hook instance: the hook is mounted by more than one component
    // at once (public site + tour modal), and two channels sharing a topic name
    // collide ("cannot add postgres_changes callbacks after subscribe()").
    const channel = supabase
      .channel(`rt-shared-data-${channelSeq++}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tours" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();

    // Reload when the admin signs in or out: RLS changes which rows (e.g. orders)
    // are visible, so the initial anon fetch must be refreshed with the new role.
    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") load();
    });

    return () => {
      active = false;
      supabase.removeChannel(channel);
      authSub.subscription.unsubscribe();
    };
  }, []);

  const saveTours = async (nextTours: SharedTour[]) => {
    const normalized = nextTours.map((tour) => normalizeTour(tour));
    setTours(normalized); // optimistic

    const keepIds = normalized.map((tour) => tour.id);
    const { data: existing } = await supabase.from("tours").select("id");
    const toDelete = ((existing as { id: string }[] | null) ?? [])
      .map((row) => row.id)
      .filter((id) => !keepIds.includes(id));

    if (toDelete.length) {
      const { error } = await supabase.from("tours").delete().in("id", toDelete);
      if (error) throw new Error(error.message);
    }
    if (normalized.length) {
      const { error } = await supabase.from("tours").upsert(normalized.map(tourToRow));
      if (error) throw new Error(error.message);
    }
  };

  const saveOrders = async (nextOrders: SharedOrder[]) => {
    const knownIds = new Set(orders.map((order) => order.id));
    const normalized = nextOrders.map((order, index) => normalizeOrder(order, tours, index));
    setOrders(normalized); // optimistic

    const keepIds = normalized.map((order) => order.id);
    const { data: existing } = await supabase.from("orders").select("id");
    const toDelete = ((existing as { id: string }[] | null) ?? [])
      .map((row) => row.id)
      .filter((id) => !keepIds.includes(id));

    if (toDelete.length) {
      const { error } = await supabase.from("orders").delete().in("id", toDelete);
      if (error) throw new Error(error.message);
    }

    // Brand-new rows are plain inserts. Upsert would compile to
    // "INSERT ... ON CONFLICT DO UPDATE", which Postgres refuses for visitors
    // because they only hold an INSERT policy on orders — that is how a public
    // booking used to fail silently.
    const rows = normalized.map(orderToRow);
    const inserts = rows.filter((row) => !knownIds.has(row.id as string));
    const updates = rows.filter((row) => knownIds.has(row.id as string));

    if (inserts.length) {
      const { error } = await supabase.from("orders").insert(inserts);
      if (error) throw new Error(error.message);
    }
    if (updates.length) {
      const { error } = await supabase.from("orders").upsert(updates);
      if (error) throw new Error(error.message);
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
