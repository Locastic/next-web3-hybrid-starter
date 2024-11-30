import { createConfig } from "wagmi";
import { createClient, http, publicActions } from "viem";
import { chains } from ".";

const serverConfig = createConfig({
  chains,
  client({ chain }) {
    return createClient({ chain, transport: http() })
  }
});

export const publicClient = serverConfig.getClient().extend(publicActions);

