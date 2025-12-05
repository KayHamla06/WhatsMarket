// api/auth/signup.js
import { sql } from '@vercel/postgres';
import { hashPassword } from '../../lib/auth.js';

export default async function handler(req, res) {
  const { phone, pass } = req.body;
  if (!phone || !pass) return res.status(400).json({error: "Missing fields"});

  const exists = await sql`SELECT id FROM sellers WHERE phone = ${phone}`;
  if (exists.rowCount > 0) return res.status(400).json({error: "Phone already registered"});

  const hash = await hashPassword(pass);
  await sql`
    INSERT INTO sellers (phone, password_hash, plan, item_count, max_items, is_premium)
    VALUES (${phone}, ${hash}, 'free', 0, 20, false)
  `;

  res.json({success: true});
}