import type { IncomingMessage, ServerResponse } from 'http';
import serverModule from '../dist/server.cjs';

let cachedApp: any = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!cachedApp) {
    const createAppFn = (serverModule as any).createApp || (serverModule as any).default?.createApp;
    cachedApp = await createAppFn();
  }
  return cachedApp(req, res);
}

