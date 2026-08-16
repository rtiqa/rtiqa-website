import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server.ts';

let cachedApp: any = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  return cachedApp(req, res);
}
