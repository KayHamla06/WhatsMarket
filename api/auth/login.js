// api/auth/login.js
import { sql } from '@vercel/postgres';
import { checkPassword } from '../../lib/auth.js';

export default async function handler(req, res) {
  const { phone, pass } = req.body;
  const user = await sql`SELECT * FROM sellers WHERE phone = ${phone}`;
  if (user.rowCount === 0) return res.status(401).json({error: "Invalid credentials"});

  const valid = await checkPassword(pass, user.rows[0].password_hash);
  if (!valid) return res.status(401).json({error: "Invalid credentials"});

  const token = Math.random().toString(36).substr(2);
  await sql`UPDATE sellers SET session_token = ${token}, session_expiry = NOW() + INTERVAL '30 days' WHERE id = ${user.rows[0].id}`;

  res.json({success: true, token});
}