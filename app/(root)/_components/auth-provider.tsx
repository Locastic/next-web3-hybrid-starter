'use client';

import { use, useEffect, useState } from "react";

import type { User } from "@/lib/db/schema";
import { UserContext } from "@/lib/contexts";

type UserPromise = Promise<{ data: User | null | undefined, error?: never } | { data?: never, error: string }>;

const AuthProvider = ({ children, userPromise }: { children: React.ReactNode, userPromise: UserPromise }) => {
  const { data: initialUser, error } = use(userPromise);
  const [user, setUser] = useState<User | null | undefined>(!error ? initialUser : undefined);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default AuthProvider;
