import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';

import { Brand } from '@/types/brand';
import { useUser } from '@/hooks/user-context';
import { getSupabase, SUPABASE_CONFIG_OK } from '@/lib/supabase';

export const [BrandsContext, useBrands] = createContextHook(() => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const { user } = useUser();

  const brandsQuery = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      if (!SUPABASE_CONFIG_OK) {
        console.error('❌ Supabase not configured in brands context');
        throw new Error('Supabase not configured');
      }

      try {
        console.log('🏢 Fetching brands from Supabase...');
        const supabase = getSupabase();
        const { data: brandsData, error } = await supabase
          .from('brands')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('❌ Error fetching brands:', error);
          throw error;
        }

        console.log(`✅ Loaded ${brandsData?.length || 0} brands`);
        return (brandsData || []) as Brand[];
      } catch (error) {
        console.error('❌ Error in brands query:', error);
        throw error;
      }
    },
    enabled: SUPABASE_CONFIG_OK,
  });

  useEffect(() => {
    if (brandsQuery.data) {
      setBrands(brandsQuery.data);
    }
  }, [brandsQuery.data]);

  const userBrands = useMemo(() => {
    if (!user) return [];
    
    return brands.filter(brand => 
      user.assignedBrands.includes(brand.id)
    );
  }, [brands, user]);

  return {
    brands: userBrands,
    allBrands: brands,
    isLoading: brandsQuery.isLoading,
    error: brandsQuery.error
  };
});