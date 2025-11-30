import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  display_name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on load
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:3001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Session check failed', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('auth_token', data.session.access_token);
      setUser(data.session.user);

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente."
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error de inicio de sesión",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada. Por favor inicia sesión."
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error de registro",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente."
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut
    }}>
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