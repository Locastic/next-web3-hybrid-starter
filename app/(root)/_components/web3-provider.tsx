'use client';

import { useState } from "react";
import { RainbowKitAuthenticationProvider, RainbowKitProvider as NextRainbowKitProvider, createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { SiweMessage } from "siwe";

import config from "@/lib/web3/config";
import { nonce, login, logout } from "@/lib/actions/auth";
import { useUser } from "./auth-provider";
import { useRouter } from "next/navigation";

const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient());
  const { user, setUser } = useUser();

  const adapter = createAuthenticationAdapter({
    getNonce: async () => {
      const data = await nonce();

      return data.nonce;
    },
    createMessage: ({ nonce, address, chainId }) => {
      return new SiweMessage({
        domain: window.location.host,
        address,
        chainId,
        statement: "Sign in with Ethereum",
        uri: window.location.origin,
        version: "1",
        nonce,
      });
    },
    getMessageBody: ({ message }) => {
      return message.prepareMessage();
    },
    verify: async ({ message, signature }) => {
      const data = await login({
        message: JSON.stringify(message),
        signature,
      });

      if (data?.new) {
        setUser(null);
        return true;
      }

      return true;
    },
    signOut: async () => {
      await logout();

      setUser(undefined);

      router.refresh();
    },
  });

  const status = user !== undefined ? "authenticated" : "unauthenticated";

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider status={status} adapter={adapter}>
          <NextRainbowKitProvider modalSize="compact">
            {children}
          </NextRainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;
