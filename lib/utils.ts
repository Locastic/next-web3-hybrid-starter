import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { sepolia } from "viem/chains";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getChainName(chainId: number) {
  switch (chainId) {
    case sepolia.id:
      return "Sepolia";
    default:
      return "Unknown";
  }
}

export function shortenAddress(address: string): string {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("Invalid Ethereum address");
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
