// api/seller/create.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { name, phone, town, product, price } = req.body;

  const seller = await sql`
    INSERT INTO sellers (name, phone, town) VALUES (${name}, ${phone}, ${town}) 
    RETURNING id
  `;

  await sql`
    INSERT INTO products (seller_id, name, price) VALUES (${seller.rows[0].id}, ${product}, ${price})
  `;

  res.json({ success: true, message: "You're live! Customers can now find you." });
}