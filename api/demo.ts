import type { IncomingMessage } from 'http';

function parseJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const body = req.body || (await parseJson(req));
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const organization = (body.organization || '').trim();
    const orgType = (body.orgType || '').trim();
    const role = (body.role || '').trim();
    const subject = (body.subject || '').trim();
    const message = (body.message || '').trim();

    if (!name || !email || !organization) {
      return res.status(400).json({ success: false, error: 'REQUIRED_FIELDS_MISSING' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'INVALID_EMAIL' });
    }

    const webhookUrl = process.env.FORM_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'demo_request',
            name,
            email,
            organization,
            orgType,
            role,
            subject,
            message,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookErr) {
        console.error('Failed to dispatch demo webhook:', webhookErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Demo request received successfully',
      id: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });
  } catch (err) {
    console.error('Demo endpoint error:', err);
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
}
