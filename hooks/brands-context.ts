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
      try {
        if (!SUPABASE_CONFIG_OK) {
          console.error('❌ Supabase not configured in brands context');
          return [];
        }

        console.log('🏢 Fetching brands from Supabase...');
        const supabase = getSupabase();
        
        const { data: brandsData, error } = await supabase
          .from('brands')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('❌ Supabase error fetching brands:', error.message || error);
          return [];
        }

        if (!brandsData || brandsData.length === 0) {
          console.log('ℹ️ No brands found (table is empty)');
          return [];
        }

        console.log(`✅ Loaded ${brandsData.length} brands`);
        
        const normalizedBrands: Brand[] = brandsData.map((brand: any) => ({
          id: brand.id,
          name: brand.name,
          mascot: brand.mascot || '🏢',
          color: brand.color || '#FFD700',
          taskCompletion: brand.task_completion || brand.taskCompletion || 0,
          activeAgents: brand.active_agents || brand.activeAgents || 0,
          recentUploads: brand.recent_uploads || brand.recentUploads || 0,
          status: brand.status || 'good',
        }));
        
        return normalizedBrands;
      } catch (error) {
        console.error('❌ Network/fetch error in brands query:', error);
        return [];
      }
    },
    retry: false,
    staleTime: 30000,
  });

  useEffect(() => {
    if (brandsQuery.data) {
      setBrands(brandsQuery.data);
    }
  }, [brandsQuery.data]);

  const userBrands = useMemo(() => {
    if (!user) return brands;
    if (user.assignedBrands.length === 0) return brands;
    
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