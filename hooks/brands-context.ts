import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { Brand } from '@/types/brand';

type Entity = {
  id: string;
  name: string;
  entity_type: string;
  status: string;
  meta: any;
  created_at: string;
};

export const [BrandsContext, useBrands] = createContextHook(() => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch brands from entities table (not legacy brands table)
  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user's org
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('No authenticated user');
        return;
      }

      // Get user's org from org_members
      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (orgError || !orgMember) {
        setError('No active organization found');
        return;
      }

      // Query entities where entity_type = 'brand' (NEW SCHEMA)
      const { data: entities, error: entitiesError } = await supabase
        .from('entities')
        .select('*')
        .eq('org_id', orgMember.org_id)
        .eq('entity_type', 'brand')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (entitiesError) {
        setError(entitiesError.message);
        return;
      }

      // Map entities to Brand type format
      const mappedBrands: Brand[] = (entities || []).map((entity: Entity) => ({
        id: entity.id,
        name: entity.name,
        description: entity.meta?.description || '',
        created_at: entity.created_at,
      }));

      setBrands(mappedBrands);
      setAllBrands(mappedBrands);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch brands');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return {
    brands,
    allBrands,
    isLoading,
    error,
    refetch: fetchBrands,
  };
});
