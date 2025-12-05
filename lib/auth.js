// lib/auth.js
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export async function verifySession(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  const res = await sql`SELECT * FROM sellers WHERE session_token = ${token} AND session_expiry > NOW()`;
  return res.rowCount > 0 ? res.rows[0] : null;
}

export async function hashPassword(p) {
  return await bcrypt.hash(p, 10);
}

export async function checkPassword(p, hash) {
  return await bcrypt.compare(p, hash);
}