import { createStorage, cookieStorage } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "viem/chains";

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable is not set');
}

export default getDefaultConfig({
  appName: "Testing",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  chains: [sepolia],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
