import { WalletIcon, ShieldCheckIcon, ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main>
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Web3 Sample App
            </h1>
            <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
              Experience decentralized applications. Connect your wallet and explore the future of the web.
            </p>
            <Button className="mt-6">Get Started</Button>
          </div>
        </div>
      </section>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl text-center mb-8">Key Features</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center space-y-2 p-4">
              <WalletIcon className="h-8 w-8 mb-2" />
              <h3 className="text-xl font-bold">Wallet Integration</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-center text-sm">
                Connect your Web3 wallet seamlessly
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4">
              <ShieldCheckIcon className="h-8 w-8 mb-2" />
              <h3 className="text-xl font-bold">Secure Transactions</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-center text-sm">
                Execute transactions with confidence
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 p-4">
              <ArrowRightIcon className="h-8 w-8 mb-2" />
              <h3 className="text-xl font-bold">Smart Contracts</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-center text-sm">
                Interact with smart contracts easily
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
