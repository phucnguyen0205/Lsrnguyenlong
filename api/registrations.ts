import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Lấy tất cả đăng ký
      const registrations = await kv.get('lan_registrations') || {};
      return res.status(200).json({ registrations });
    }

    if (req.method === 'POST') {
      // Lưu đăng ký
      const { registrations } = req.body;
      
      if (!registrations || typeof registrations !== 'object') {
        return res.status(400).json({ error: 'Invalid data' });
      }

      await kv.set('lan_registrations', registrations);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('KV Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
