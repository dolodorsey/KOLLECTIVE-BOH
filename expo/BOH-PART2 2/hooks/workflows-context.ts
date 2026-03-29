import { trpc } from '@/lib/trpc';

export function useBrands() {
  return trpc.brands.getBrands.useQuery();
}

export function useBrandByKey(brandKey: string) {
  return trpc.brands.getBrandByKey.useQuery({ brand_key: brandKey });
}

export function useCreateBrand() {
  const utils = trpc.useContext();
  
  return trpc.brands.createBrand.useMutation({
    onSuccess: () => {
      utils.brands.getBrands.invalidate();
    },
  });
}

export function useUpdateBrand() {
  const utils = trpc.useContext();
  
  return trpc.brands.updateBrand.useMutation({
    onSuccess: () => {
      utils.brands.getBrands.invalidate();
    },
  });
}

export function useDeleteBrand() {
  const utils = trpc.useContext();
  
  return trpc.brands.deleteBrand.useMutation({
    onSuccess: () => {
      utils.brands.getBrands.invalidate();
    },
  });
}
