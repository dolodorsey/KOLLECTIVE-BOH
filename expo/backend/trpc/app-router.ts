import { createTRPCRouter } from './create-context';
import { exampleRouter } from './routes/example';
import { brandsRouter } from './routes/brands';
import { dashboardRouter } from './routes/dashboard';
import { entitiesRouter } from './routes/entities';
import { executionsRouter } from './routes/executions';
import { activityRouter } from './routes/activity';
import { cultureRouter } from './routes/culture';
import { profilesRouter } from './routes/profiles';
import { locationsRouter } from './routes/locations';

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  brands: brandsRouter,
  dashboard: dashboardRouter,
  entities: entitiesRouter,
  executions: executionsRouter,
  activity: activityRouter,
  culture: cultureRouter,
  profiles: profilesRouter,
  locations: locationsRouter,
});

export type AppRouter = typeof appRouter;
