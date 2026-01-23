import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

export const brandsRouter = createTRPCRouter({
  getBrands: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('brand_configurations')
      .select('*')
      .order('brand_display_name', { ascending: true });

    if (error) {
      console.error('❌ Failed to fetch brands:', error);
      throw new Error(`Failed to fetch brands: ${error.message}`);
    }

    return data || [];
  }),

  getBrandByKey: publicProcedure
    .input(z.object({ brand_key: z.string() }))
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('brand_configurations')
        .select('*')
        .eq('brand_key', input.brand_key)
        .single();

      if (error) {
        console.error('❌ Brand not found:', error);
        throw new Error(`Brand not found: ${error.message}`);
      }

      return data;
    }),

  createBrand: publicProcedure
    .input(
      z.object({
        brand_key: z.string(),
        brand_display_name: z.string(),
        ghl_location_id: z.string().optional(),
        email_from: z.string().email().optional(),
        instagram_account_id: z.string().optional(),
        sms_enabled: z.boolean().optional(),
        email_enabled: z.boolean().optional(),
        dm_enabled: z.boolean().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('brand_configurations')
        .insert({
          brand_key: input.brand_key,
          brand_display_name: input.brand_display_name,
          ghl_location_id: input.ghl_location_id,
          email_from: input.email_from,
          instagram_account_id: input.instagram_account_id,
          sms_enabled: input.sms_enabled || false,
          email_enabled: input.email_enabled || false,
          dm_enabled: input.dm_enabled || false,
          metadata: input.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create brand:', error);
        throw new Error(`Failed to create brand: ${error.message}`);
      }

      console.log('✅ Brand created:', data.brand_key);
      return data;
    }),

  updateBrand: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        brand_display_name: z.string().optional(),
        ghl_location_id: z.string().optional(),
        email_from: z.string().email().optional(),
        instagram_account_id: z.string().optional(),
        sms_enabled: z.boolean().optional(),
        email_enabled: z.boolean().optional(),
        dm_enabled: z.boolean().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;

      const { data, error } = await ctx.supabase
        .from('brand_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update brand:', error);
        throw new Error(`Failed to update brand: ${error.message}`);
      }

      console.log('✅ Brand updated:', data.brand_key);
      return data;
    }),

  deleteBrand: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { error } = await ctx.supabase
        .from('brand_configurations')
        .delete()
        .eq('id', input.id);

      if (error) {
        console.error('❌ Failed to delete brand:', error);
        throw new Error(`Failed to delete brand: ${error.message}`);
      }

      console.log('✅ Brand deleted');
      return { success: true };
    }),
});
