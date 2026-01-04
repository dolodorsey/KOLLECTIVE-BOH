import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth-context';
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
  const { activeOrgId, orgRole, entityMemberships } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = async () => {
    if (!activeOrgId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🏢 Fetching brands/entities for role:', orgRole);

      let query = supabase
        .from('entities')
        .select('*')
        .eq('org_id', activeOrgId)
        .eq('entity_type', 'brand')
        .eq('status', 'active');

      if (orgRole === 'staff' || orgRole === 'manager') {
        const entityIds = entityMemberships.map(em => em.entity_id);
        if (entityIds.length > 0) {
          query = query.in('id', entityIds);
          console.log('🏢 Staff/Manager: filtering by entity access:', entityIds);
        } else {
          console.log('⚠️ Staff/Manager: no entity access');
          setBrands([]);
          setAllBrands([]);
          setIsLoading(false);
          return;
        }
      } else {
        console.log('🏢 Owner/Admin: showing all org entities');
      }

      const { data: entities, error: entitiesError } = await query.order('name', { ascending: true });

      if (entitiesError) {
        setError(entitiesError.message);
        return;
      }

      const mappedBrands: Brand[] = (entities || []).map((entity: Entity) => ({
        id: entity.id,
        name: entity.name,
        description: entity.meta?.description || '',
        created_at: entity.created_at,
      }));

      console.log('✅ Brands/Entities loaded:', mappedBrands.length);
      setBrands(mappedBrands);
      setAllBrands(mappedBrands);
    } catch (err: any) {
      console.error('❌ Brands fetch error:', err);
      setError(err.message || 'Failed to fetch brands');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrgId, orgRole]);

  return {
    brands,
    allBrands,
    isLoading,
    error,
    refetch: fetchBrands,
  };
});
