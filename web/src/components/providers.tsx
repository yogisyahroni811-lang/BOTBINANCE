'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLiveData } from "@/hooks/useLiveData";
import { Toaster } from "sonner";

function LiveDataManager({ children }: { children: React.ReactNode }) {
  useLiveData(); // Initialize SSE global listener
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10000,
            refetchInterval: false, // SSE handles invalidation, no need for polling
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LiveDataManager>
        {children}
        <Toaster theme="dark" position="bottom-right" closeButton richColors />
      </LiveDataManager>
    </QueryClientProvider>
  );
}
