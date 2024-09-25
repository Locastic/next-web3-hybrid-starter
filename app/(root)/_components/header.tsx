'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlobeIcon, Home, LogOut } from "lucide-react";
import { useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

import { cn, getChainName, shortenAddress } from "@/lib/utils";
import { useUser, useFormActionState } from "@/lib/hooks";
import { register } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function stringToColour(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = ((hash >> 16) & 0xFF) << 16 | ((hash >> 8) & 0xFF) << 8 | (hash & 0xFF);
  return `#${(0x1000000 + color).toString(16).slice(1)}`;
}

function generateColours(s: string) {
  const s1 = s.substring(0, s.length / 3);
  const s2 = s.substring(s.length / 3, (2 * s.length) / 3);
  const s3 = s.substring((2 * s.length) / 3);
  const c1 = stringToColour(s1);
  const c2 = stringToColour(s2);
  const c3 = stringToColour(s3);

  return [c1, c2, c3];
};

const ProfileImage: React.FC<{
  chain: string;
  address: string;
}> = ({ chain, address }) => {
  const [c1, c2, c3] = generateColours(`${chain}:${address}`);

  return (
    <div
      style={{
        backgroundImage: `conic-gradient(from -45deg, ${c1}, ${c2}, ${c3})`,
      }}
      className="size-9 shrink-0 rounded overflow-hidden"
    />
  );
};

const RegistrationModal = ({
  open,
  setOpen,
  onClose,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
}) => {
  const [state, formAction, isPending] = useFormActionState(register);

  useEffect(() => {
    if (!state.error) {
      handleOpenChange(false);
    }
  }, [state]);

  const handleOpenChange = (open: boolean) => {
    if (!isPending) {
      setOpen(open);
    }
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create account</DialogTitle>
          <DialogDescription>
            Type in your username and click create account. You can edit your profile later.
          </DialogDescription>
        </DialogHeader>
        <form className="contents" action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input name="username" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>Create account</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Header = () => {
  const [isHeaderShown, setIsHeaderShown] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  const { user, setUser } = useUser();

  useEffect(() => {
    if (user === null) {
      setIsRegistrationModalOpen(true);
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > (14 * 4) && currentScrollY > lastScrollY) {
        setIsHeaderShown(false);
      } else {
        setIsHeaderShown(true);
      }

      setLastScrollY(currentScrollY);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <header className={cn("fixed w-full transition-all duration-300 z-50", isHeaderShown ? "top-0" : "-top-14")}>
      <div className="container mx-auto px-4 lg:px-6 h-14 flex items-center">
        <div className="absolute inset-0 h-[125%] -z-[1] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 [mask-image:linear-gradient(0deg,transparent,#000)]" />
        <Link className="flex items-center justify-center" href="/">
          <GlobeIcon className="h-6 w-6" />
          <span className="sr-only">Web3 App</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6"></nav>
        <div className="ml-4">
          {user ? (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger>
                <ProfileImage chain={getChainName(user.chainId)} address={user.walletAddress} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="p-2">
                  <h4 className="text-sm font-bold">Hello, {user.username}!</h4>
                  <small className="text-xs">{getChainName(user.chainId)}:{shortenAddress(user.walletAddress)}</small>
                </div>
                <DropdownMenuItem className="w-full cursor-pointer" asChild>
                  <Link href="/dashboard" className="flex w-full items-center">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="w-full cursor-pointer" onClick={() => disconnect()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={openConnectModal}>
              Connect Wallet
            </Button>
          )}
        </div>
        <RegistrationModal open={isRegistrationModalOpen} setOpen={setIsRegistrationModalOpen} onClose={() => setUser(undefined)} />
      </div>
    </header>
  );
}

export default Header;
