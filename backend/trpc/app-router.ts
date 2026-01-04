import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { webhooksRouter } from "./routes/webhooks";
import { aoCoreRouter } from "./routes/ao-core";
import { brandsRouter } from "./routes/brands";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  webhooks: webhooksRouter,
  aoCore: aoCoreRouter,
  brands: brandsRouter,
});

export type AppRouter = typeof appRouter;
