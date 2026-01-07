import { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = `${import.meta.env.VITE_API_URL}/api`; // change port if needed

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);

      return { error: null };
    } catch (err: any) {
      return {
        error: new Error(
          err.response?.data?.message || "Invalid email or password"
        ),
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await axios.post(`${API_URL}/auth/signup`, {
        email,
        password,
      });

      // Auto login after signup
      return await signIn(email, password);
    } catch (err: any) {
      return {
        error: new Error(
          err.response?.data?.message || "Signup failed"
        ),
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        signIn,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
