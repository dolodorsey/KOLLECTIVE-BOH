import { initTRPC } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { getSupabase } from "../../lib/supabase";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const supabase = getSupabase();
  
  return {
    req: opts.req,
    supabase,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
