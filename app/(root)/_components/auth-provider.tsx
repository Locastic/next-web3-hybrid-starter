'use client';

import { createContext, use, useContext, useEffect, useState } from "react";

import type { User } from "@/lib/db/schema";

type UserContextType = {
  user: User | null | undefined,
  setUser: (user: User | null | undefined) => void,
};

const UserContext = createContext<UserContextType | null>(null);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);

  if (context === null) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};

const AuthProvider = ({ children, userPromise }: { children: React.ReactNode, userPromise: Promise<User | null | undefined> }) => {
  const initialUser = use(userPromise);
  const [user, setUser] = useState<User | null | undefined>(initialUser);

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
