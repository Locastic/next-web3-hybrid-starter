'use client';

import { useEffect, useState } from "react";
import { RainbowKitAuthenticationProvider, RainbowKitProvider, createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { SiweMessage } from "siwe";

import config from "@/lib/web3/config";
import { nonce, login, logout, verify } from "@/lib/actions/auth";
import { useUser } from "@/lib/hooks";

const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const { user, setUser } = useUser();
  const [authType, setAuthType] = useState<"none" | "signup" | "signin">("none");

  const status = user !== undefined ? "authenticated" : "unauthenticated";

  const [queryClient] = useState(() => new QueryClient());
  const [adapter] = useState(() => createAuthenticationAdapter({
    getNonce: async () => {
      const { data, error } = await nonce();

      if (error) {
        throw Error(error)
      }

      // TODO: make xoring data and error work
      return data!.nonce;
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
      // TODO: fix issue with redirects blocking return
      const { data, error } = await verify({
        message: JSON.stringify(message),
        signature,
      });

      if (error) {
        console.error(error);
        return false;
      }

      // TODO: make xoring data and error work
      setAuthType(data!.type || "node");

      return true;
    },
    signOut: async () => {
      await logout();

      setAuthType("none");
    },
  }));

  useEffect(() => {
    switch (authType) {
      case "none":
        setUser(undefined);
        break;
      case "signup":
        setUser(null);
        break;
      case "signin":
        login();
        break;
      default:
        break;
    }
  }, [authType]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider status={status} adapter={adapter}>
          <RainbowKitProvider modalSize="compact">
            {children}
          </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;
