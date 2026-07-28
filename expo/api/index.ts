/**
 * Vercel serverless entry for The Kollective BOH API.
 *
 * Replaces the dead Replit backend (kollective-api--drdor5.replit.app).
 * The Hono app in backend/hono.ts is mounted here and served from the same
 * Vercel project as the web build, so the client can call /api/trpc on its
 * own origin with no cross-domain hop.
 */
import { handle } from 'hono/vercel';

import app from '../backend/hono';

export const config = {
  runtime: 'nodejs',
};

export default handle(app);
