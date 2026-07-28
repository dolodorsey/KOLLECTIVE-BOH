import { createTRPCRouter, publicProcedure } from '../create-context';

/** The BOH roster — 23 real people seeded from team_members. */
export const rosterRouter = createTRPCRouter({
  me: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.rpc('current_member');
    if (error) throw new Error(error.message);
    return data ?? null;
  }),

  list: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .schema('boh')
      .from('org_members')
      .select('member_code, full_name, preferred_name, role_title, boh_role, primary_brand, status')
      .eq('status', 'active')
      .order('boh_role')
      .order('preferred_name');
    if (error) throw new Error(error.message);
    return data ?? [];
  }),

  divisions: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .schema('boh')
      .from('organizations')
      .select('*')
      .order('sort_order');
    if (error) throw new Error(error.message);
    return data ?? [];
  }),
});
