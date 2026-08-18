import { TRPCError, initTRPC } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { getBackendSupabase } from '../supabase';

function bearerToken(req: Request): string | null {
  const authorization = req.headers.get('authorization') || '';
  if (!authorization.toLowerCase().startsWith('bearer ')) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const accessToken = bearerToken(opts.req);
  const supabase = getBackendSupabase(accessToken || undefined);

  let user: any = null;
  let orgMemberships: any[] = [];

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data?.user) {
      user = data.user;
      const { data: memberships } = await supabase
        .from('org_members')
        .select('org_id,user_id,role,status,created_at')
        .eq('user_id', user.id)
        .eq('status', 'active');
      orgMemberships = memberships || [];
    }
  }

  return {
    req: opts.req,
    supabase,
    user,
    orgMemberships,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;

// Keep a true public procedure only for endpoints intentionally public and safe
// under anonymous RLS. Operational BOH routes should use protected/admin below.
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }
  if (!ctx.orgMemberships?.length) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Active BOH membership required' });
  }
  return next({ ctx });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const canAdmin = ctx.orgMemberships.some((membership: any) =>
    membership.status === 'active' && ['owner', 'admin'].includes(membership.role)
  );
  if (!canAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Owner/admin access required' });
  }
  return next({ ctx });
});
