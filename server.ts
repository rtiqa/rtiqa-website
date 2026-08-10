import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // SEC-01: HTTP Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https: ws: wss:",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];
    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

    next();
  });

  // SEC-03: Production CORS Restriction for /api routes
  app.use('/api', (req, res, next) => {
    const isProd = process.env.NODE_ENV === 'production';
    const origin = req.headers.origin;
    const appUrl = process.env.APP_URL;

    const allowedOrigins = [
      appUrl,
      'https://rtiqa.com',
      'https://www.rtiqa.com',
    ].filter(Boolean) as string[];

    if (isProd) {
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else if (!origin) {
        // Same-origin request
      } else if (allowedOrigins.length > 0) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
      }
    } else {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json({ limit: '10kb' }));

  // SEC-02: API Rate Limiting for Form Endpoints
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  const formRateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    const clientIp = rawIp.trim();
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 5;

    const record = rateLimitStore.get(clientIp);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(clientIp, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again in 15 minutes.',
      });
    }

    record.count += 1;
    next();
  };

  // Input sanitization helper
  const sanitize = (val: unknown): string => {
    if (typeof val !== 'string') return '';
    return val.trim();
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // API Route: Contact Form
  app.post('/api/contact', formRateLimiter, async (req, res) => {
    try {
      const name = sanitize(req.body?.name);
      const email = sanitize(req.body?.email);
      const organization = sanitize(req.body?.organization);
      const subject = sanitize(req.body?.subject);
      const message = sanitize(req.body?.message);

      if (!name || name.length > 100) {
        return res.status(400).json({ success: false, error: 'INVALID_NAME' });
      }
      if (!email || !isValidEmail(email) || email.length > 100) {
        return res.status(400).json({ success: false, error: 'INVALID_EMAIL' });
      }
      if (!organization || organization.length > 100) {
        return res.status(400).json({ success: false, error: 'INVALID_ORGANIZATION' });
      }
      if (!subject || subject.length > 150) {
        return res.status(400).json({ success: false, error: 'INVALID_SUBJECT' });
      }
      if (!message || message.length > 2000) {
        return res.status(400).json({ success: false, error: 'INVALID_MESSAGE' });
      }

      // Webhook integration if configured
      const webhookUrl = process.env.FORM_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'contact_inquiry',
              name,
              email,
              organization,
              subject,
              message,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (webhookErr) {
          console.error('Failed to dispatch webhook:', webhookErr);
        }
      }

      return res.json({
        success: true,
        message: 'Inquiry received successfully',
        id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    } catch (err) {
      console.error('Contact endpoint error:', err);
      return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  });

  // API Route: Demo Request Form
  app.post('/api/demo', formRateLimiter, async (req, res) => {
    try {
      const name = sanitize(req.body?.name);
      const email = sanitize(req.body?.email);
      const organization = sanitize(req.body?.organization);
      const orgType = sanitize(req.body?.orgType);
      const role = sanitize(req.body?.role);
      const subject = sanitize(req.body?.subject);
      const message = sanitize(req.body?.message);

      if (!name || name.length > 100) {
        return res.status(400).json({ success: false, error: 'INVALID_NAME' });
      }
      if (!email || !isValidEmail(email) || email.length > 100) {
        return res.status(400).json({ success: false, error: 'INVALID_EMAIL' });
      }
      if (!organization || organization.length > 100) {
        return res.status(400).json({ success: false, error: 'INVALID_ORGANIZATION' });
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

      return res.json({
        success: true,
        message: 'Demo request received successfully',
        id: `demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      });
    } catch (err) {
      console.error('Demo endpoint error:', err);
      return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  });

  // API Route: Newsletter Subscription
  app.post('/api/subscribe', formRateLimiter, async (req, res) => {
    try {
      const email = sanitize(req.body?.email);
      if (!email || !isValidEmail(email) || email.length > 100) {
        return res.status(400).json({ success: false, error: 'INVALID_EMAIL' });
      }

      const webhookUrl = process.env.FORM_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'newsletter_subscription',
              email,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (webhookErr) {
          console.error('Failed to dispatch subscription webhook:', webhookErr);
        }
      }

      return res.json({
        success: true,
        message: 'Subscribed successfully',
        id: `sub_${Date.now()}`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  });

  // Vite middleware for development vs static build serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
