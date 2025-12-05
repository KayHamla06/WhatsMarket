// api/seller/upgrade.js
import { sql } from '@vercel/postgres';
import { verifySession } from '../../lib/auth.js';

export default async function handler(req, res) {
  const user = await verifySession(req);
  if (!user) return res.status(401).json({error: "Login required"});

  // In real app: integrate PayFast/Ozow here
  await sql`UPDATE sellers SET is_premium = true, max_items = 50 WHERE id = ${user.id}`;

  res.json({success: true, message: "Upgraded to Premium!"});
}