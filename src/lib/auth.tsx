import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Me } from '../../shared/types';
import { ApiError, call, setSignedOutHandler } from './api';

type Status = 'loading' | 'signedIn' | 'signedOut' | 'offline';

interface AuthState {
  status: Status;
  user: Me | null;
  /** Re-reads the session from the server (after sign in, sign up, reset). */
  refresh(): Promise<void>;
  signOut(): Promise<void>;
  setDisplayName(name: string): void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<Me | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const refresh = useCallback(async () => {
    try {
      const { user } = await call<{ user: Me | null }>('auth.session');
      setUser(user);
      setStatus(user ? 'signedIn' : 'signedOut');
    } catch (err) {
      // A network problem never signs anyone out. Only the first check needs a fallback.
      if (statusRef.current === 'loading' || statusRef.current === 'offline') {
        setStatus(err instanceof ApiError && err.code === 'not_signed_in' ? 'signedOut' : 'offline');
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    setSignedOutHandler(() => {
      setUser(null);
      setStatus('signedOut');
      qc.clear();
    });
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      setSignedOutHandler(null);
    };
  }, [refresh, qc]);

  const signOut = useCallback(async () => {
    await call('auth.signOut');
    setUser(null);
    setStatus('signedOut');
    qc.clear();
  }, [qc]);

  const setDisplayName = useCallback((displayName: string) => {
    setUser((u) => (u ? { ...u, displayName } : u));
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, refresh, signOut, setDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** The signed-in user. Only use under a route that requires sign-in. */
export function useMe(): Me {
  const { user } = useAuth();
  if (!user) throw new Error('Not signed in');
  return user;
}
