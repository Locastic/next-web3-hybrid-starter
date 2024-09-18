import Header from "./_components/header";
import Footer from "./_components/footer";
import Web3Provider from "./_components/web3-provider";
import AuthProvider from "./_components/auth-provider";

import { getMe as userGetMe } from "@/lib/actions/user";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider userPromise={userGetMe()}>
      <Web3Provider>
        <div className="flex flex-col min-h-[100dvh]">
          <Header />
          <div className="mt-14 flex flex-col flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </Web3Provider>
    </AuthProvider>
  );
}
