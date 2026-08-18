import { createTRPCRouter } from './create-context';
import { exampleRouter } from './routes/example';
import { communicationsRouter } from './routes/communications';
import { dashboardRouter } from './routes/dashboard';
import { entitiesRouter } from './routes/entities';
import { executionsRouter } from './routes/executions';
import { activityRouter } from './routes/activity';
import { cultureRouter } from './routes/culture';
import { profilesRouter } from './routes/profiles';
import { locationsRouter } from './routes/locations';

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  communications: communicationsRouter,
  dashboard: dashboardRouter,
  entities: entitiesRouter,
  executions: executionsRouter,
  activity: activityRouter,
  culture: cultureRouter,
  profiles: profilesRouter,
  locations: locationsRouter,
});

export type AppRouter = typeof appRouter;
