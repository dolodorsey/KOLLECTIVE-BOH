import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // Web (Vercel): the API is served from this same origin at /api — no cross-domain hop.
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  // Native builds: point at the deployed Vercel origin.
  const url = process.env.EXPO_PUBLIC_API_URL;

  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not set. Set it to the deployed BOH origin (e.g. https://thekollectivegroup.com).",
    );
  }

  if (url.startsWith("http://")) {
    console.warn("[tRPC] API URL uses HTTP instead of HTTPS:", url);
  }

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
