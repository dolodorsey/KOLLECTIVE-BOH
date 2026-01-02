import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';

import { brands as mockBrands } from '@/mocks/brands';
import { Brand } from '@/types/brand';
import { useUser } from '@/hooks/user-context';

export const [BrandsContext, useBrands] = createContextHook(() => {
  const [brands, setBrands] = useState<Brand[]>(mockBrands);
  const { user } = useUser();

  const brandsQuery = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      try {
        const storedBrands = await AsyncStorage.getItem('brands');
        if (storedBrands) {
          return JSON.parse(storedBrands) as Brand[];
        }
        await AsyncStorage.setItem('brands', JSON.stringify(mockBrands));
        return mockBrands;
      } catch (error) {
        console.error('Error fetching brands data:', error);
        return mockBrands;
      }
    },
    initialData: mockBrands
  });

  useEffect(() => {
    if (brandsQuery.data) {
      setBrands(brandsQuery.data);
    }
  }, [brandsQuery.data]);

  const userBrands = useMemo(() => {
    if (!user) return [];
    
    // Filter brands based on user's assigned brands
    return brands.filter(brand => 
      user.assignedBrands.includes(brand.id)
    );
  }, [brands, user]);

  return {
    brands: userBrands,
    allBrands: brands,
    isLoading: false,
    error: brandsQuery.error
  };
});