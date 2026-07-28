import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { webhooksRouter } from "./routes/webhooks";
import { aoCoreRouter } from "./routes/ao-core";
import { brandsRouter } from "./routes/brands";
import { dashboardRouter } from "./routes/dashboard";
import { entitiesRouter } from "./routes/entities";
import { workflowsRouter } from "./routes/workflows";
import { activityRouter } from "./routes/activity";
import { cultureRouter } from "./routes/culture";
import { profilesRouter } from "./routes/profiles";
import { locationsRouter } from "./routes/locations";
import { tasksRouter } from "./routes/tasks";
import { rosterRouter } from "./routes/roster";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  webhooks: webhooksRouter,
  aoCore: aoCoreRouter,
  brands: brandsRouter,
  dashboard: dashboardRouter,
  entities: entitiesRouter,
  workflows: workflowsRouter,
  activity: activityRouter,
  culture: cultureRouter,
  profiles: profilesRouter,
  locations: locationsRouter,
  tasks: tasksRouter,
  roster: rosterRouter,
});

export type AppRouter = typeof appRouter;
