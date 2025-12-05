// api/seller/dashboard.js
import { sql } from '@vercel/postgres';
import { verifySession } from '../../lib/auth.js';

export default async function handler(req, res) {
  const user = await verifySession(req);
  if (!user) return res.status(401).json({error: "Login required"});

  const items = await sql`SELECT * FROM items WHERE seller_id = ${user.id} ORDER BY created_at DESC`;

  res.json({
    premium: user.is_premium,
    itemCount: user.item_count,
    maxItems: user.is_premium ? 50 : 20,
    items: items.rows.map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      photos: i.photo_urls ? i.photo_urls.split(',') : []
    }))
  });
}