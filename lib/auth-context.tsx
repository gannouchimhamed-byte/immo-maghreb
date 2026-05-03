"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentUser, onAuthStateChange, signOut as authSignOut, type AuthUser } from "@/lib/auth";
import { getDeviceId } from "@/lib/saved-searches";
import { migrateDeviceSearches } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
  }, []);

  useEffect(() => {
    // Initial load
    getCurrentUser().then(u => { setUser(u); setLoading(false); });

    // Listen for auth changes (login, logout, token refresh)
    const unsub = onAuthStateChange(async (u) => {
      setUser(u);
      setLoading(false);
      // Migrate device searches to real account on first login
      if (u) {
        const deviceId = getDeviceId();
        if (deviceId && deviceId !== u.id) {
          await migrateDeviceSearches(deviceId, u.id);
        }
      }
    });
    return unsub;
  }, []);

  const handleSignOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
