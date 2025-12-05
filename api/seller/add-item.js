// api/seller/add-item.js
import { sql } from '@vercel/postgres';
import { verifySession } from '../../lib/auth.js';
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  const user = await verifySession(req);
  if (!user) return res.status(401).json({error: "Login required"});

  if (user.item_count >= (user.is_premium ? 50 : 20)) {
    return res.status(403).json({error: "Upgrade to add more items"});
  }

  const { name, price } = req.body;
  const files = req.files?.photo || [];

  const maxPhotos = user.is_premium ? 5 : 1;
  if (files.length > maxPhotos) {
    return res.status(403).json({error: `Max ${maxPhotos} photos allowed`});
  }

  const urls = [];
  for (let file of files.slice(0, maxPhotos)) {
    const { url } = await put(`items/${Date.now()}-${file.originalname}`, file.buffer, { access: 'public' });
    urls.push(url);
  }

  await sql`
    INSERT INTO items (seller_id, name, price, photo_urls)
    VALUES (${user.id}, ${name}, ${price}, ${urls.join(',')})
  `;

  await sql`UPDATE sellers SET item_count = item_count + 1 WHERE id = ${user.id}`;

  res.json({success: true});
}