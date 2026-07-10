import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CognitoUserSession } from 'amazon-cognito-identity-js';
import {
  getCurrentSession,
  profileFromSession,
  signOut as svcSignOut,
} from '../services/auth';
import { identifyPushUser, logoutPush } from '../services/push';
import { enableDemoMode } from '../config';
import { DEMO_PROFILE } from '../demo';
import type { UserProfile } from '../types';

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  setSession: (session: CognitoUserSession) => void;
  enterDemo: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = (session: CognitoUserSession) => {
    const p = profileFromSession(session);
    setProfile(p);
    identifyPushUser(p.id);
  };

  useEffect(() => {
    getCurrentSession()
      .then((session) => {
        if (session) applySession(session);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      loading,
      setSession: (session) => applySession(session),
      enterDemo: () => {
        enableDemoMode();
        setProfile(DEMO_PROFILE);
      },
      signOut: () => {
        svcSignOut();
        logoutPush();
        setProfile(null);
      },
    }),
    [profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
