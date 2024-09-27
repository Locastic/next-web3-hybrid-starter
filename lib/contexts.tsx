'use client';

import { createContext, use, useEffect, useState } from "react";
import { AuthenticationStatus } from "@rainbow-me/rainbowkit";

import { SessionData } from "@/lib/auth/session";

type SessionContextType = {
  data: SessionData | null | undefined;
  status: AuthenticationStatus;
  setData: React.Dispatch<React.SetStateAction<SessionData | null | undefined>>;
  setStatus: React.Dispatch<React.SetStateAction<AuthenticationStatus>>;
};

export const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider = ({
  children,
  sessionPromise
}: {
  children: React.ReactNode,
  sessionPromise: Promise<SessionData | null>
}) => {
  const sessionData = use(sessionPromise);
  const [session, setSession] = useState<SessionData | null | undefined>(sessionData ?? undefined);
  const [status, setStatus] = useState<AuthenticationStatus>('loading');

  useEffect(() => {
    setSession(sessionData ?? undefined);
  }, [sessionData]);

  useEffect(() => {
    setStatus(session !== undefined ? 'authenticated' : 'unauthenticated');
  }, [session]);

  return (
    <SessionContext.Provider value={{ data: session, status: status, setData: setSession, setStatus }}>
      {children}
    </SessionContext.Provider>
  );
}
