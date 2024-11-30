import { createStorage, cookieStorage } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { chains } from ".";

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable is not set');
}

export const config = getDefaultConfig({
  appName: "Testing",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  chains: chains,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
