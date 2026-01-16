import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { webhooksRouter } from "./routes/webhooks";
import { aoCoreRouter } from "./routes/ao-core";
import { brandsRouter } from "./routes/brands";
import { dashboardRouter } from "./routes/dashboard";
import { entitiesRouter } from "./routes/entities";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  webhooks: webhooksRouter,
  aoCore: aoCoreRouter,
  brands: brandsRouter,
  dashboard: dashboardRouter,
  entities: entitiesRouter,
});

export type AppRouter = typeof appRouter;
