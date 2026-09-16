import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const debug = {
    hasKV_URL: !!process.env.KV_URL,
    hasKV_REST_API_URL: !!process.env.KV_REST_API_URL,
    hasKV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    hasKV_REST_API_READ_ONLY_TOKEN: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
    method: req.method
  };

  try {
    const hasKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

    if (!hasKV) {
      console.log('KV not configured:', debug);
      if (req.method === 'GET') {
        return res.status(200).json({ registrations: {}, kvConfigured: false, debug });
      }
      if (req.method === 'POST') {
        return res.status(200).json({ success: true, kvConfigured: false, note: 'Saved locally only', debug });
      }
    }

    const { kv } = await import('@vercel/kv');

    if (req.method === 'GET') {
      const registrations = (await kv.get('lan_registrations')) || {};
      console.log('KV GET:', { count: Object.keys(registrations).length });
      return res.status(200).json({ registrations, kvConfigured: true, debug });
    }

    if (req.method === 'POST') {
      const { registrations } = req.body;
      if (!registrations || typeof registrations !== 'object') {
        return res.status(400).json({ error: 'Invalid data' });
      }
      const count = Object.keys(registrations).length;
      await kv.set('lan_registrations', registrations);
      console.log('KV SET:', { count });
      return res.status(200).json({ success: true, kvConfigured: true, count, debug });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error?.message || error, debug);
    if (req.method === 'GET') {
      return res.status(200).json({ registrations: {}, kvConfigured: false, error: error?.message, debug });
    }
    return res.status(200).json({ success: true, kvConfigured: false, note: 'local only', error: error?.message, debug });
  }
}
