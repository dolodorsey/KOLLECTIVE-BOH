import createContextHook from '@nkzw/create-context-hook';

import { User } from '@/types/user';

export const [UserContext, useUser] = createContextHook(() => {
  return {
    user: null as User | null,
    isLoading: false,
    error: null
  };
});
