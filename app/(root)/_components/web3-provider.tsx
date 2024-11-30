'use client';

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RainbowKitAuthenticationProvider, RainbowKitProvider, createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useAccountEffect, useDisconnect, WagmiProvider } from "wagmi";
import { SiweMessage } from "siwe";

import config from "@/lib/web3/config";
import { nonce, login, logout, verify } from "@/lib/actions/auth";
import { useSession } from "@/lib/hooks";

const RainbowKitProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const wagmiStatusRef = useRef("");
  const { disconnect } = useDisconnect();
  const { status: wagmiStatus } = useAccount();
  const {
    data: session,
    setData: setSession,
    status: authStatus,
    setStatus: setAuthStatus
  } = useSession();

  wagmiStatusRef.current = wagmiStatus;

  const [loginAction] = useState(() => async () => {
    setAuthStatus("loading");
    await login();

    router.refresh();
  });

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
      if (wagmiStatusRef.current === "disconnected") {
        console.error("Verification succeeded but Modal closed! Wallet disconnected!");
        return false;
      }

      // TODO: make xoring data and error work
      if (data!.type === "signup") {
        setSession(null);
      } else {
        loginAction();
      }

      return true;
    },
    signOut: async () => {
      await logout();

      setSession(undefined);

      router.refresh();
    },
  }));

  useAccountEffect({
    onConnect: (status) => {
      if (status.isReconnected && session === undefined) {
        disconnect();
      }
    }
  });

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
