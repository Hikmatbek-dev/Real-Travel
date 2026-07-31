import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type RegionKey = "europe" | "asia" | "americas" | "africa";
export type OrderStatus = "New" | "Confirmed" | "Cancelled";

// Gives each useSharedTravelData mount its own realtime channel topic.
let channelSeq = 0;

export type ItineraryDay = { day: number; title: string; text: string };

export type SharedTour = {
  id: string;
  /** URL-safe identifier used by /tours/:slug */
  slug: string;
  name: string;
  location: string;
  region: RegionKey;
  price: number;
  /** Price in so'm — what customers are actually charged via Paylov. */
  priceUzs: number;
  duration: number;
  description: string;
  image: string;
  /** Long-form content shown on the tour page. */
  highlights: string[];
  included: string[];
  excluded: string[];
  gallery: string[];
  itinerary: ItineraryDay[];
  /** 0 = not stated. */
  groupSize: number;
};

export type TravelerInfo = { fullName: string; birthDate: string };

export type SharedOrder = {
  id: string;
  orderNumber: string;
  /** Chosen departure, when the tour publishes dates. */
  tourDateId?: string | null;
  paymentMode?: PaymentMode;
  /** Deposit share actually charged — set by the server at checkout. */
  depositPercent?: number | null;
  /** 0 unpaid, 1 pending, 2 paid, -2 cancelled — owned by the server. */
  paymentState?: number;
  /** What was actually charged, in tiyin. Server-set. */
  amountTiyin?: number | null;
  travelersInfo?: TravelerInfo[];
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

export type TourDate = {
  id: string;
  tourId: string;
  /** ISO date (YYYY-MM-DD) — a departure, not a timestamp. */
  departureDate: string;
  seatsTotal: number;
};

export type PaymentMode = "full" | "deposit";

export type Review = {
  id: string;
  author: string;
  location: string;
  text: string;
  rating: number;
  photo: string;
  tourId: string | null;
  published: boolean;
  sortOrder: number;
};

// ----- Row types (Supabase, snake_case) -----

type TourDateRow = {
  id: string;
  tour_id: string;
  departure_date: string;
  seats_total: number;
};

type TourRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  region: string;
  price: number;
  price_uzs: number;
  duration: number;
  description: string;
  image: string;
  highlights?: string[] | null;
  included?: string[] | null;
  excluded?: string[] | null;
  gallery?: string[] | null;
  itinerary?: ItineraryDay[] | null;
  group_size?: number | null;
};

type ReviewRow = {
  id: string;
  author: string;
  location: string;
  text: string;
  rating: number;
  photo: string;
  tour_id: string | null;
  published: boolean;
  sort_order: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  tour_date_id?: string | null;
  payment_mode?: string;
  deposit_percent?: number | null;
  payment_state?: number;
  amount_tiyin?: number | null;
  travelers_info?: TravelerInfo[] | null;
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

/** "Kyoto Seasons" -> "kyoto-seasons"; used for /tours/:slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2019`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTour(tour: Partial<SharedTour>): SharedTour {
  const id = tour.id || `t${Date.now()}`;
  return {
    id,
    slug: tour.slug || slugify(tour.name || "") || `tour-${id}`,
    name: tour.name || "",
    location: tour.location || "",
    region: (tour.region as RegionKey) || "europe",
    price: Number(tour.price) || 0,
    priceUzs: Number(tour.priceUzs) || 0,
    duration: Number(tour.duration) || 1,
    description: tour.description || "",
    image: tour.image || "",
    highlights: tour.highlights ?? [],
    included: tour.included ?? [],
    excluded: tour.excluded ?? [],
    gallery: tour.gallery ?? [],
    itinerary: tour.itinerary ?? [],
    groupSize: Number(tour.groupSize) || 0
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
    notes: order.notes || "",
    tourDateId: order.tourDateId ?? null,
    paymentMode: order.paymentMode || "full",
    depositPercent: order.depositPercent ?? null,
    travelersInfo: order.travelersInfo ?? []
  };
}

// ----- Row <-> app-model mapping -----

function rowToTour(row: TourRow): SharedTour {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    region: (row.region as RegionKey) || "europe",
    price: Number(row.price),
    priceUzs: Number(row.price_uzs ?? 0),
    duration: Number(row.duration),
    description: row.description,
    image: row.image,
    highlights: row.highlights ?? [],
    included: row.included ?? [],
    excluded: row.excluded ?? [],
    gallery: row.gallery ?? [],
    itinerary: Array.isArray(row.itinerary) ? row.itinerary : [],
    groupSize: Number(row.group_size) || 0
  };
}

function tourToRow(tour: SharedTour): TourRow {
  return {
    id: tour.id,
    slug: tour.slug || slugify(tour.name) || tour.id,
    name: tour.name,
    location: tour.location,
    region: tour.region,
    price: tour.price,
    price_uzs: tour.priceUzs,
    duration: tour.duration,
    description: tour.description,
    image: tour.image,
    highlights: tour.highlights ?? [],
    included: tour.included ?? [],
    excluded: tour.excluded ?? [],
    gallery: tour.gallery ?? [],
    itinerary: tour.itinerary ?? [],
    group_size: tour.groupSize ?? 0
  };
}

function rowToTourDate(row: TourDateRow): TourDate {
  return {
    id: row.id,
    tourId: row.tour_id,
    departureDate: String(row.departure_date).slice(0, 10),
    seatsTotal: Number(row.seats_total) || 0
  };
}

function rowToReview(row: ReviewRow): Review {
  return {
    id: row.id,
    author: row.author,
    location: row.location,
    text: row.text,
    rating: Number(row.rating) || 5,
    photo: row.photo,
    tourId: row.tour_id,
    published: row.published !== false,
    sortOrder: Number(row.sort_order) || 0
  };
}

function rowToOrder(row: OrderRow): SharedOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    tourDateId: row.tour_date_id ?? null,
    paymentMode: (row.payment_mode as PaymentMode) || "full",
    depositPercent: row.deposit_percent ?? null,
    paymentState: Number(row.payment_state) || 0,
    amountTiyin: row.amount_tiyin ?? null,
    travelersInfo: Array.isArray(row.travelers_info) ? row.travelers_info : [],
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
    tour_date_id: order.tourDateId || null,
    payment_mode: order.paymentMode || "full",
    travelers_info: order.travelersInfo ?? [],
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
export const DEFAULT_TOURS: SharedTour[] = [
  {
    id: "t_turkey_2026",
    slug: "turkiya-antaliya-istanbul",
    name: "Turkiya: Antaliya & Istanbul",
    location: "Antaliya, Istanbul (Turkiya)",
    region: "europe",
    price: 360,
    priceUzs: 4500000,
    duration: 5,
    description: "Istanbulning tarixiy obidalari hamda Antaliyaning eng sara 5 yulduzli kurortlarida unutilmas hordiq chiqarish imkoniyati.",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80",
    highlights: ["5★ Mehmonxonada yashash (All Inclusive)", "Istanbul bo'ylab ekskursiya va Boshpor bo'g'ozi krossoveri", "Antaliya sohillari va sharsharalar"],
    included: ["Aviachiptalar (Toshkent-Istanbul-Antaliya)", "5★ Mehmonxona va ovqatlanish", "Transfer xizmatlari", "Tibbiy sug'urta"],
    excluded: ["Shaxsiy xarajatlar", "Qo'shimcha ekskursiyalar"],
    gallery: [
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1200&q=80"
    ],
    itinerary: [
      { day: 1, title: "Istanbulga yetib kelish", text: "Aeroportda kutib olish, mehmonxonaga joylashish va tungi Istanbul sayri." },
      { day: 2, title: "Tarixiy Obidalar", text: "Sultonahmet, Moviy Masjid va Boshpor bo'ylab katerda sayohat." },
      { day: 3, title: "Antaliyaga uchish", text: "Antaliya kurortiga joylashish va dengiz bo'yida dam olish." }
    ],
    groupSize: 15
  },
  {
    id: "t_egypt_2026",
    slug: "misr-sharm-el-sheyx",
    name: "Misr: Sharm el-Sheyx & Piramidalar",
    location: "Sharm el-Sheyx, Qohira (Misr)",
    region: "africa",
    price: 460,
    priceUzs: 5800000,
    duration: 6,
    description: "Qizil dengizning marjon qoyalari, dayving hamda Qohiraning qadimiy Piramidalariga sehrli sayohat.",
    image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Qizil dengizda dayving va snorkeling", "Giza Piramidalari va Sfinks sayri", "Sahro safarisi hamda Badaviy kechasi"],
    included: ["To'g'ridan-to'g'ri aviachipta", "All Inclusive Mehmonxona", "Transfer va gid xizmati"],
    excluded: ["Viza yig'imi", "Shaxsiy xarajatlar"],
    gallery: [
      "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1200&q=80"
    ],
    itinerary: [
      { day: 1, title: "Sharm el-Sheyxga kelish", text: "Aeroportda kutib olish va lyuks mehmonxonaga joylashish." },
      { day: 2, title: "Dengiz sayri", text: "Katerda Ras Muhammad milliy parkiga sayohat va snorkeling." },
      { day: 3, title: "Sahro Safarisi", text: "Kvadrotsikllarda sahro bo'ylab poyga va badaviylar shousi." }
    ],
    groupSize: 20
  },
  {
    id: "t_dubai_2026",
    slug: "dubay-sehrli-shahar",
    name: "BAA: Dubay & Abu Dabi Premium",
    location: "Dubay, Abu Dabi (BAA)",
    region: "asia",
    price: 440,
    priceUzs: 5500000,
    duration: 5,
    description: "Burj Xalifa, Kelajak Muzeyi va Abu Dabi Shayx Zayd Masjidi — zamonaviy mo'jizalar markaziga sayohat.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Burj Xalifa kuzatuv maydonchasi", "Kelajak Muzeyi (Museum of the Future)", "Shayx Zayd Oq Masjidi (Abu Dabi)"],
    included: ["Aviachiptalar", "4★ Mehmonxona va nonushta", "Ekskursiya va transferlar"],
    excluded: ["Tushlik va kechki ovqat", "Shaxsiy shopping"],
    gallery: [
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80"
    ],
    itinerary: [
      { day: 1, title: "Dubayga parvoz", text: "Aeroportdan kutib olish va mehmonxonaga joylashish." },
      { day: 2, title: "Zamonaviy Dubay", text: "Burj Xalifa, Dubai Mall va musiqali favvoralar shousi." }
    ],
    groupSize: 12
  },
  {
    id: "t_georgia_2026",
    slug: "gruziya-tbilisi-batumi",
    name: "Gruziya: Tbilisi & Batumi Kavkaz Turi",
    location: "Tbilisi, Batumi (Gruziya)",
    region: "europe",
    price: 300,
    priceUzs: 3800000,
    duration: 5,
    description: "Kavkaz bag'ridagi qadimiy Tbilisi, Kazbegi tog'lari va Qora dengiz bo'yidagi Batumi shahrida mehmondo'stlik.",
    image: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Tbilisi qadimgi shahar va Narikala qal'asi", "Kazbegi tog'lariga kanat yo'li sayri", "Batumi dengiz bo'yi bulvari"],
    included: ["To'g'ridan-to'g'ri parvoz", "Mehmonxona va nonushtalar", "Gid xizmati va barcha transferlar"],
    excluded: ["Tushlik va milliy taomlar restorani"],
    gallery: [
      "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=80"
    ],
    itinerary: [
      { day: 1, title: "Tbilisiga xush kelibsiz", text: "Aeroportda kutib olish, milliy taomlar bilan kutib olish." },
      { day: 2, title: "Kazbegi Turi", text: "Kavkaz tog'lari bag'ridagi Gergeti cherkoviga sayohat." }
    ],
    groupSize: 18
  },
  {
    id: "t_phuket_2026",
    slug: "tailand-phuket-orollari",
    name: "Tailand: Phuket Orollari & Tropik Janna",
    location: "Phuket, Phi Phi Orollari (Tailand)",
    region: "asia",
    price: 470,
    priceUzs: 5900000,
    duration: 7,
    description: "Phi Phi tropik orollari, zangori laguna, fil va bumeranglar bog'ida ekzotik ta'til.",
    image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=80",
    highlights: ["Phi Phi va Maya Bay orollariga speedboat sayri", "Patong va Karon tropik plyajlari", "Katta Budda ibodatxonasi"],
    included: ["Aviachiptalar", "4★ Tropik Mehmonxona", "Nonushta va orollar bo'ylab transferlar"],
    excluded: ["Milliy park kirish badallari", "Shaxsiy xarajatlar"],
    gallery: [
      "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=80"
    ],
    itinerary: [
      { day: 1, title: "Phuketga yetib kelish", text: "Aeroportdan transfer va plyaj boyidagi mehmonxonaga joylashuv." },
      { day: 2, title: "Phi Phi Orollari", text: "Tezkor katerda orollarga ekskursiya va firuza suvda suzish." }
    ],
    groupSize: 15
  }
];

export const DEFAULT_TOUR_DATES: TourDate[] = [
  { id: "td_turkey_1", tourId: "t_turkey_2026", departureDate: "2026-08-10", seatsTotal: 15 },
  { id: "td_turkey_2", tourId: "t_turkey_2026", departureDate: "2026-08-20", seatsTotal: 12 },
  { id: "td_egypt_1", tourId: "t_egypt_2026", departureDate: "2026-08-15", seatsTotal: 20 },
  { id: "td_dubai_1", tourId: "t_dubai_2026", departureDate: "2026-08-12", seatsTotal: 10 },
  { id: "td_georgia_1", tourId: "t_georgia_2026", departureDate: "2026-08-18", seatsTotal: 18 },
  { id: "td_phuket_1", tourId: "t_phuket_2026", departureDate: "2026-08-25", seatsTotal: 15 }
];

export function useSharedTravelData() {
  const [tours, setTours] = useState<SharedTour[]>(DEFAULT_TOURS);
  const [tourDates, setTourDates] = useState<TourDate[]>(DEFAULT_TOUR_DATES);
  const [orders, setOrders] = useState<SharedOrder[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [depositPercent, setDepositPercent] = useState(30);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [toursRes, datesRes, ordersRes, settingsRes, reviewsRes] = await Promise.all([
        supabase.from("tours").select("*").order("created_at", { ascending: true }),
        supabase.from("tour_dates").select("*").order("departure_date", { ascending: true }),
        supabase.from("orders").select("*").order("date", { ascending: false }),
        supabase.from("settings").select("*").eq("key", "deposit_percent").limit(1),
        supabase.from("reviews").select("*").order("sort_order", { ascending: true })
      ]);

      if (!active) return;

      const dbTours = ((toursRes.data as TourRow[] | null) ?? []).map(rowToTour);
      const dbDates = ((datesRes.data as TourDateRow[] | null) ?? []).map(rowToTourDate);

      setTours(dbTours.length > 0 ? dbTours : DEFAULT_TOURS);
      setTourDates(dbDates.length > 0 ? dbDates : DEFAULT_TOUR_DATES);
      setOrders(((ordersRes.data as OrderRow[] | null) ?? []).map(rowToOrder));
      setReviews(((reviewsRes.data as ReviewRow[] | null) ?? []).map(rowToReview));

      const percent = Number((settingsRes.data as { value: string }[] | null)?.[0]?.value);
      if (Number.isFinite(percent) && percent > 0) setDepositPercent(Math.round(percent));

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
      .on("postgres_changes", { event: "*", schema: "public", table: "tour_dates" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, load)
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

  /** Replaces the departure dates of one tour. Admin only (RLS enforces it). */
  const saveTourDates = async (tourId: string, nextDates: TourDate[]) => {
    setTourDates((prev) => [...prev.filter((d) => d.tourId !== tourId), ...nextDates]);

    const keepIds = nextDates.map((d) => d.id);
    const { data: existing } = await supabase.from("tour_dates").select("id").eq("tour_id", tourId);
    const toDelete = ((existing as { id: string }[] | null) ?? [])
      .map((row) => row.id)
      .filter((id) => !keepIds.includes(id));

    if (toDelete.length) {
      const { error } = await supabase.from("tour_dates").delete().in("id", toDelete);
      if (error) throw new Error(error.message);
    }
    if (nextDates.length) {
      const { error } = await supabase.from("tour_dates").upsert(
        nextDates.map((d) => ({
          id: d.id,
          tour_id: d.tourId,
          departure_date: d.departureDate,
          seats_total: d.seatsTotal
        }))
      );
      if (error) throw new Error(error.message);
    }
  };

  /** Replaces the full review list. Admin only (RLS enforces it). */
  const saveReviews = async (nextReviews: Review[]) => {
    setReviews(nextReviews);

    const keepIds = nextReviews.map((review) => review.id);
    const { data: existing } = await supabase.from("reviews").select("id");
    const toDelete = ((existing as { id: string }[] | null) ?? [])
      .map((row) => row.id)
      .filter((id) => !keepIds.includes(id));

    if (toDelete.length) {
      const { error } = await supabase.from("reviews").delete().in("id", toDelete);
      if (error) throw new Error(error.message);
    }
    if (nextReviews.length) {
      const { error } = await supabase.from("reviews").upsert(
        nextReviews.map((review) => ({
          id: review.id,
          author: review.author,
          location: review.location,
          text: review.text,
          rating: review.rating,
          photo: review.photo,
          tour_id: review.tourId,
          published: review.published,
          sort_order: review.sortOrder
        }))
      );
      if (error) throw new Error(error.message);
    }
  };

  const createOrder = async (order: SharedOrder) => {
    const normalized = normalizeOrder(order, tours, 0);
    setOrders((prev) => [normalized, ...prev]);
    const row = orderToRow(normalized);
    const { error } = await supabase.from("orders").insert(row);
    if (error) throw new Error(error.message);
    return normalized;
  };

  return {
    tours,
    tourDates,
    orders,
    reviews,
    saveReviews,
    depositPercent,
    saveTours,
    saveTourDates,
    saveOrders,
    createOrder,
    isLoaded
  };
}
