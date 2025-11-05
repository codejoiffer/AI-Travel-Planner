export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { plan } = req.body || {};
  if (!plan || !Array.isArray(plan.itinerary)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }
  const days = plan.itinerary.length;
  // Simple heuristic budget estimation
  const transport = Math.round(500 * days);
  const accommodation = Math.round(600 * days);
  const food = Math.round(300 * days);
  const tickets = Math.round(200 * days);
  const total = transport + accommodation + food + tickets;
  res.status(200).json({ transport, accommodation, food, tickets, total });
}

