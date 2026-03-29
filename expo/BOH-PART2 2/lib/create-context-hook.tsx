import React, { createContext, useContext, ReactNode } from 'react';

export default function createContextHook<T>(
  useValue: () => T,
  displayName?: string
): [React.FC<{ children: ReactNode }>, () => T] {
  const Context = createContext<T | undefined>(undefined);
  Context.displayName = displayName || 'CustomContext';

  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const value = useValue();
    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useContextValue = (): T => {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error(
        `use${displayName || 'Context'} must be used within a ${displayName || 'Context'}Provider`
      );
    }
    return context;
  };

  return [Provider, useContextValue];
}
