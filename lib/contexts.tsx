"use client";

import { createContext, use, useEffect, useState } from "react";
import { AuthenticationStatus } from "@rainbow-me/rainbowkit";

import { Session } from "@/lib/supabase";

type SessionContextType = {
  data: Session | null | undefined;
  status: AuthenticationStatus;
  setData: React.Dispatch<React.SetStateAction<Session | null | undefined>>;
  setStatus: React.Dispatch<React.SetStateAction<AuthenticationStatus>>;
};

export const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({
  children,
  sessionPromise,
}: {
  children: React.ReactNode;
  sessionPromise: Promise<Session | null>;
}) => {
  const sessionData = use(sessionPromise);
  const [session, setSession] = useState<Session | null | undefined>(
    sessionData ?? undefined,
  );
  const [status, setStatus] = useState<AuthenticationStatus>("loading");

  // console.log("session:", session);
  // console.log("status:", status);

  useEffect(() => {
    setSession(sessionData ?? undefined);
  }, [sessionData]);

  useEffect(() => {
    setStatus(session !== undefined ? "authenticated" : "unauthenticated");
  }, [session]);

  return (
    <SessionContext.Provider
      value={{ data: session, status: status, setData: setSession, setStatus }}
    >
      {children}
    </SessionContext.Provider>
  );
};
