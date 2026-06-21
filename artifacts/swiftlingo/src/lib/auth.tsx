import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuthenticateTelegram, useGetMe, getGetMeQueryKey, setAuthTokenGetter } from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('swiftlingo_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Wire the stored token into every API request
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem('swiftlingo_token'));
  }, []);

  const authenticateTelegram = useAuthenticateTelegram();
  const { data: meData, isLoading: isMeLoading, isError: isMeError } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey()
    }
  });

  useEffect(() => {
    if (meData) {
      setUser(meData);
      setIsLoading(false);
    }
    if (isMeError) {
      setToken(null);
      localStorage.removeItem('swiftlingo_token');
      setAuthTokenGetter(null);
      setIsLoading(false);
    }
  }, [meData, isMeError]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (initData: string) => {
    setIsLoading(true);
    try {
      const authResult = await authenticateTelegram.mutateAsync({ data: { initData } });
      const newToken = authResult.token;
      setToken(newToken);
      setUser(authResult.user as User);
      localStorage.setItem('swiftlingo_token', newToken);
      setAuthTokenGetter(() => newToken);
      queryClient.setQueryData(getGetMeQueryKey(), authResult.user);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('swiftlingo_token');
    setAuthTokenGetter(null);
    queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading: isLoading || (!!token && isMeLoading) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
