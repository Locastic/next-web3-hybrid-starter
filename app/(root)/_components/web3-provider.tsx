'use client';

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthenticationStatus, RainbowKitAuthenticationProvider, RainbowKitProvider, createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, WagmiProvider } from "wagmi";
import { SiweMessage } from "siwe";

import config from "@/lib/web3/config";
import { nonce, login, logout, verify } from "@/lib/actions/auth";
import { useUser } from "@/lib/hooks";

const RainbowKitProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const wagmiStatus = useRef("");
  const { status } = useAccount();
  const { user, setUser } = useUser();
  const [authStatus, setAuthStatus] = useState<AuthenticationStatus>("unauthenticated");

  useEffect(() => { wagmiStatus.current = status }, [status]);

  const [loginAction] = useState(() => async () => {
    setAuthStatus("loading");
    await login();

    router.refresh();
  });

  useEffect(() => {
    setAuthStatus(user !== undefined ? "authenticated" : "unauthenticated");
  }, [user]);

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
      const { data, error } = await verify({
        message: JSON.stringify(message),
        signature,
      });

      if (error) {
        console.error(error);
        return false;
      }

      // NOTE: workaround: issue with RainbowKit allowing closing SignIn Modal while verification
      // is still pending, checking before proceeding with verification if the wallet is disconnected
      if (wagmiStatus.current === "disconnected") {
        console.error("Verification succeeded but Modal closed! Wallet disconnected!");
        return false;
      }

      // TODO: make xoring data and error work
      if (data!.type === "signup") {
        setUser(null);
      } else {
        loginAction();
      }

      return true;
    },
    signOut: async () => {
      await logout();

      setUser(undefined);

      router.refresh();
    },
  }));

  return (
    <RainbowKitAuthenticationProvider status={authStatus} adapter={adapter}>
      <RainbowKitProvider modalSize="compact">
        {children}
      </RainbowKitProvider>
    </RainbowKitAuthenticationProvider>
  );
};

const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProviderWrapper>
          {children}
        </RainbowKitProviderWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;
