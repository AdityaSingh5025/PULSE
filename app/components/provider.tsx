"use client";

import { ImageKitProvider } from "@imagekit/next";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const urlEndpoint = process.env.NEXT_PUBLIC_URL_ENDPOINT || "";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;  
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider refetchInterval={5*60}>
        <ImageKitProvider urlEndpoint={urlEndpoint}>
          {children}
        </ImageKitProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
