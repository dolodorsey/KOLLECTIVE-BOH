import createContextHook from '@nkzw/create-context-hook';

import { Brand } from '@/types/brand';

export const [BrandsContext, useBrands] = createContextHook(() => {
  return {
    brands: [] as Brand[],
    allBrands: [] as Brand[],
    isLoading: false,
    error: null
  };
});
