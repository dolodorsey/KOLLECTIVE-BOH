import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    console.error('❌ [tRPC] EXPO_PUBLIC_RORK_API_BASE_URL is not set');
    throw new Error(
      "Rork did not set EXPO_PUBLIC_RORK_API_BASE_URL, please use support",
    );
  }

  if (url.startsWith('http://')) {
    console.warn('⚠️ [tRPC] API URL uses HTTP instead of HTTPS:', url);
  }

  if (url.includes('localhost')) {
    console.warn('⚠️ [tRPC] API URL uses localhost - this will not work on physical devices');
  }

  console.log('🔗 [tRPC] Base URL configured:', url);
  return url;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async fetch(url, options) {
        console.log(`📡 [tRPC] Fetching: ${url}`);
        try {
          const response = await fetch(url, options);
          console.log(`📥 [tRPC] Response status: ${response.status}`);
          
          if (!response.ok) {
            const text = await response.clone().text();
            console.error(`❌ [tRPC] Error ${response.status}:`, text);
          }
          
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ [tRPC] Fetch failed for ${url}:`, errorMessage);
          throw error;
        }
      },
    }),
  ],
});
