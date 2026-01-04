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
      fetch(url, options) {
        console.log(`📡 [tRPC] Fetching: ${url}`);
        return fetch(url, options)
          .then(response => {
            console.log(`✅ [tRPC] Response ${response.status}:`, url);
            return response;
          })
          .catch(error => {
            console.error(`❌ [tRPC] Fetch failed for ${url}:`, {
              message: error.message,
              name: error.name,
              cause: error.cause,
            });
            throw error;
          });
      },
    }),
  ],
});
