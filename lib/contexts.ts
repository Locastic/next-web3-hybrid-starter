import { createContext } from "react";

import type { User } from "@/lib/db/schema";

type UserContextType = {
  user: User | null | undefined,
  setUser: (user: User | null | undefined) => void,
};

export const UserContext = createContext<UserContextType | null>(null);
