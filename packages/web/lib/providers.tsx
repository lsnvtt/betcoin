'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import { useState, type ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';

const isTestnet = process.env.NODE_ENV !== 'production';
const activeChain = isTestnet ? polygonAmoy : polygon;

const wagmiConfig = createConfig({
  chains: [activeChain],
  transports: {
    [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
    [polygon.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmnf31y2604700di8dykg6lzu'}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#F7931A',
        },
        loginMethods: ['email', 'wallet', 'google'],
        defaultChain: activeChain,
        supportedChains: [polygonAmoy, polygon],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <I18nProvider>{children}</I18nProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
