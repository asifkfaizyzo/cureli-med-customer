// src/lib/queryClient.ts (do not remove this comment)
// src/lib/queryClient.ts
//
// Shared QueryClient instance.
// Imported by app/_layout.tsx (provider) and src/store/authStore.ts (logout cleanup).

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});