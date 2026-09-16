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

  // LUÔN trả 200 với JSON - không bao giờ throw 500
  try {
    const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

    if (!hasKV) {
      if (req.method === 'GET') {
        return res.status(200).json({ registrations: {}, kvConfigured: false, debug });
      }
      return res.status(200).json({ success: true, kvConfigured: false, debug, note: 'Saved locally only' });
    }

    // Có KV - dùng dynamic import
    let kv: any;
    try {
      const kvModule = await import('@vercel/kv');
      kv = kvModule.kv;
    } catch (importErr: any) {
      console.error('KV import failed:', importErr?.message);
      if (req.method === 'GET') {
        return res.status(200).json({ registrations: {}, kvConfigured: false, debug, importError: importErr?.message });
      }
      return res.status(200).json({ success: true, kvConfigured: false, debug, importError: importErr?.message });
    }

    if (req.method === 'GET') {
      try {
        const registrations = (await kv.get('lan_registrations')) || {};
        return res.status(200).json({ registrations, kvConfigured: true, debug });
      } catch (kvErr: any) {
        console.error('KV GET failed:', kvErr?.message);
        return res.status(200).json({ registrations: {}, kvConfigured: false, debug, kvError: kvErr?.message });
      }
    }

    if (req.method === 'POST') {
      const { registrations } = req.body || {};
      if (!registrations || typeof registrations !== 'object') {
        return res.status(200).json({ success: false, debug, error: 'Invalid data' });
      }
      try {
        const count = Object.keys(registrations).length;
        await kv.set('lan_registrations', registrations);
        return res.status(200).json({ success: true, kvConfigured: true, count, debug });
      } catch (kvErr: any) {
        console.error('KV SET failed:', kvErr?.message);
        return res.status(200).json({ success: true, kvConfigured: false, debug, kvError: kvErr?.message });
      }
    }

    return res.status(200).json({ error: 'Method not allowed', debug });
  } catch (outerErr: any) {
    console.error('Outer error:', outerErr?.message);
    return res.status(200).json({ success: true, kvConfigured: false, debug, fatalError: outerErr?.message });
  }
}
