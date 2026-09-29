import React, { createContext, useContext, useState, useEffect } from 'react';
import Storage, { STORAGE_KEYS } from '../utils/storage';

type UserRole = 'teacher' | 'parent' | 'student' | 'staff' | 'admin';

interface AuthContextType {
  role: UserRole | null;
  token: string | null;
  loading: boolean;
  login: (token: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const [savedToken, savedRole] = await Promise.all([
          Storage.get(STORAGE_KEYS.TOKEN),
          Storage.get(STORAGE_KEYS.ROLE),
        ]);
        setToken(savedToken);
        setRole((savedRole as UserRole) || 'student');
      } catch (e) {
        console.error('Failed to load auth state from Storage:', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (newToken: string, newRole: UserRole) => {
    setToken(newToken);
    setRole(newRole);
    await Storage.multiSave([
      [STORAGE_KEYS.TOKEN, newToken],
      [STORAGE_KEYS.ROLE, newRole],
    ]);
  };

  const logout = async () => {
    setToken(null);
    setRole(null);
    await Promise.all([
      Storage.remove(STORAGE_KEYS.TOKEN),
      Storage.remove(STORAGE_KEYS.ROLE),
    ]);
  };

  return (
    <AuthContext.Provider value={{ role, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
