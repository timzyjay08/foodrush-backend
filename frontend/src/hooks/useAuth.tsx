import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clearToken, getToken, setToken } from "@/api/client";
import { me } from "@/api/auth";
import type { Role, User } from "@/data/types";

/**
 * Session state for the frontend. Today it persists a mock user locally; once
 * the Spring Boot API is connected, `signIn` receives { token, user } from
 * src/api/auth.ts and nothing else has to change.
 */

const USER_KEY = "foodrush.user";

type AuthContextValue = {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (user: User, token?: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsReady(true);
      return;
    }

    me()
      .then((currentUser) => {
        setUser(currentUser);
        window.localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      })
      .catch(() => {
        clearToken();
        window.localStorage.removeItem(USER_KEY);
      })
      .finally(() => setIsReady(true));
  }, []);

  const signIn = useCallback((nextUser: User, token?: string) => {
    setUser(nextUser);
    window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    if (token) setToken(token);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(USER_KEY);
    clearToken();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isReady,
      signIn,
      signOut,
    }),
    [user, isReady, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
