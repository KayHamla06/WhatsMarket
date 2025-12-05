// api/webhook/whatsapp.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
      return res.send(req.query['hub.challenge']);
    }
    return res.status(403).send('Invalid');
  }

  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg) return res.sendStatus(200);

  const from = msg.from;
  const text = msg.text?.body?.toLowerCase().trim();

  const words = text.split(' ');
  const results = await sql`
    SELECT s.name, s.phone, s.town, i.name as item, i.price, i.photo_urls, s.is_premium
    FROM sellers s 
    JOIN items i ON i.seller_id = s.id
    WHERE ${words.map(w => `i.name ILIKE ${`%${w}%`}`).join(' OR ')}
    ORDER BY s.is_premium DESC, i.price ASC
    LIMIT 6
  `;

  if (results.rowCount === 0) {
    await sendWhatsApp(from, "No items found. Try: braids, phone case, mechanic");
    return res.sendStatus(200);
  }

  let reply = "Found these:\n\n";
  results.rows.forEach((r, i) => {
    const badge = r.is_premium ? "PREMIUM" : "";
    reply += `${i+1}. ${badge} ${r.name} – ${r.town}\n`;
    reply += `   ${r.item} – R${r.price}\n`;
    if (r.photo_urls) reply += `   Photo: ${r.photo_urls.split(',')[0]}\n`;
    reply += `   Reply ${i+1} to connect\n\n`;
  });

  global.lastSearch = { from, results: results.rows };
  await sendWhatsApp(from, reply);
  res.sendStatus(200);
}

// Transfer logic (simplified)
if (/^\d+$/.test(text) && global.lastSearch?.from === from) {
  const seller = global.lastSearch.results[parseInt(text)-1];
  if (seller) {
    const badge = seller.is_premium ? " (PREMIUM SELLER)" : "";
    await sendWhatsApp(from, `Connecting you to ${seller.name}${badge}...`);
    await sendWhatsApp(seller.phone, `New buyer wants ${seller.item}! Customer: ${from}`);
  }
}

async function sendWhatsApp(to, text) {
  await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } })
  });
}