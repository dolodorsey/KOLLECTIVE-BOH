import { createTRPCRouter } from './create-context';
import { communicationsRouter } from './routes/communications';
import { dashboardRouter } from './routes/dashboard';
import { entitiesRouter } from './routes/entities';
import { executionsRouter } from './routes/executions';

export const appRouter = createTRPCRouter({
  communications: communicationsRouter,
  dashboard: dashboardRouter,
  entities: entitiesRouter,
  executions: executionsRouter,
});

export type AppRouter = typeof appRouter;
