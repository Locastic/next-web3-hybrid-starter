import Link from "next/link";
import { LayoutDashboardIcon, ShieldIcon } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="container mx-auto flex sm:flex-row flex-col px-4 lg:px-6 flex-1">
      <aside className="w-full sm:w-48 mt-4">
        <ScrollArea className="h-full">
          <div>
            <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              >
                <LayoutDashboardIcon className="h-5 w-5" />
                <span>General</span>
              </Link>
              <Link
                href="/dashboard/security"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
              >
                <ShieldIcon className="h-5 w-5" />
                <span>Security</span>
              </Link>
            </nav>
          </div>
        </ScrollArea>
      </aside>
      <div className="relative mx-8">
        <div
          className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-700 to-transparent"
          style={{
            background: 'linear-gradient(to bottom, rgba(229, 231, 235, 0) 0%, rgba(229, 231, 235, 1) 15%, rgba(229, 231, 235, 1) 85%, rgba(229, 231, 235, 0) 100%)',
          }}
        ></div>
      </div>
      <main className="flex flex-col mt-12 sm:mt-4 gap-4 flex-1">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
