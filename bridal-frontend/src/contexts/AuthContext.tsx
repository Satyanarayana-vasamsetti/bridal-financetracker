import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

export interface AuthUser {
  id: number;
  email: string;
  role: "admin" | "user";
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ error: Error | null; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch fresh profile on load if token exists
  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      })
      .catch(() => {
        // If token expired, clear
        logout();
      });
    }
  }, [token]);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const authToken = res.data.token;
      const authUser = res.data.user || { email, role: "user" };

      localStorage.setItem("token", authToken);
      localStorage.setItem("user", JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);

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

  const resetPassword = async (email: string, newPassword: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        newPassword,
      });
      return { error: null, message: res.data.message || "Password reset successful" };
    } catch (err: any) {
      return {
        error: new Error(
          err.response?.data?.message || "Failed to reset password"
        ),
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAdmin: user?.role === "admin",
        isAuthenticated: !!token,
        isLoading,
        signIn,
        signUp,
        resetPassword,
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
