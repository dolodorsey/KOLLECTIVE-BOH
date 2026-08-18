import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth-context';
import type { Brand } from '@/types/brand';

function mapDirectoryRow(row: any): Brand {
  return {
    id: row.id,
    name: row.entity_name,
    description: [row.division, row.entity_type].filter(Boolean).join(' · '),
    created_at: row.created_at,
    status:
      row.current_blocker || Number(row.operational_readiness || 0) < 50
        ? 'bottleneck'
        : Number(row.operational_readiness || 0) >= 80
        ? 'good'
        : undefined,
  };
}

export const [BrandsContext, useBrands] = createContextHook(() => {
  const { activeOrgId, orgRole, entityMemberships } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const assignedEntityIds = useMemo(
    () => entityMemberships.map((membership) => membership.entity_id),
    [entityMemberships]
  );

  const fetchBrands = useCallback(async () => {
    if (!activeOrgId) {
      setBrands([]);
      setAllBrands([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Current source of truth. The legacy generic `entities` relation is no
      // longer part of the BOH client data path.
      let query = supabase
        .from('enterprise_directory_records')
        .select(
          'id,entity_key,entity_name,division,entity_type,status,priority,current_blocker,operational_readiness,created_at'
        )
        .eq('status', 'active')
        .order('entity_name', { ascending: true });

      if (orgRole === 'staff' || orgRole === 'manager') {
        if (!assignedEntityIds.length) {
          setBrands([]);
          setAllBrands([]);
          return;
        }
        query = query.in('id', assignedEntityIds);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;

      const mapped = (data || []).map(mapDirectoryRow);
      setBrands(mapped);
      setAllBrands(mapped);
    } catch (err: any) {
      console.error('Enterprise directory fetch failed:', err);
      setError(err.message || 'Failed to fetch enterprise entities');
      setBrands([]);
      setAllBrands([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeOrgId, orgRole, assignedEntityIds]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return {
    brands,
    allBrands,
    isLoading,
    error,
    refetch: fetchBrands,
  };
});
