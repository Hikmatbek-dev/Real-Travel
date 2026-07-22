import { STATE_PENDING, STATE_SUCCESS, sbSelect } from "./_lib";

type TourDateRow = { id: string; tour_id: string; departure_date: string; seats_total: number };
type SeatRow = { tour_date_id: string | null; travelers: number };

/**
 * GET /api/availability?tour=<tourId>
 *
 * Seats left per departure. Visitors cannot read the orders table (RLS allows
 * insert only), so the count has to be produced here. Pending orders are
 * counted as taken — they are holding a seat through checkout.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Without ?tour= this returns every upcoming departure, so the collection
  // page can label all cards from one request instead of one call per tour.
  const tourId = String(req.query?.tour ?? "").trim();

  try {
    const dates = await sbSelect<TourDateRow>(
      "tour_dates",
      tourId
        ? `tour_id=eq.${encodeURIComponent(tourId)}&select=id,tour_id,departure_date,seats_total&order=departure_date.asc`
        : `select=id,tour_id,departure_date,seats_total&order=departure_date.asc`,
    );

    if (!dates.length) return res.status(200).json({ dates: [] });

    const held = await sbSelect<SeatRow>(
      "orders",
      `tour_date_id=in.(${dates.map((d) => `"${d.id}"`).join(",")})&payment_state=in.(${STATE_PENDING},${STATE_SUCCESS})&select=tour_date_id,travelers`,
    );

    const takenByDate = new Map<string, number>();
    for (const row of held) {
      if (!row.tour_date_id) continue;
      takenByDate.set(row.tour_date_id, (takenByDate.get(row.tour_date_id) ?? 0) + (Number(row.travelers) || 0));
    }

    const today = new Date().toISOString().slice(0, 10);

    return res.status(200).json({
      dates: dates
        .filter((date) => String(date.departure_date).slice(0, 10) >= today)
        .map((date) => {
          const taken = takenByDate.get(date.id) ?? 0;
          return {
            id: date.id,
            tourId: date.tour_id,
            departureDate: String(date.departure_date).slice(0, 10),
            seatsTotal: date.seats_total,
            // 0 seats configured means "no limit set" rather than "sold out".
            seatsLeft: date.seats_total > 0 ? Math.max(0, date.seats_total - taken) : null,
          };
        }),
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
}
