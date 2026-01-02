import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UserRole } from "@shared/schema";
import { storage } from "@/lib/storage";

// Simple client-side auth context since we don't have a real backend auth
// This persists session in sessionStorage so refresh works

interface User {
  name: string;
  role: UserRole;
  currentBatchId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (name: string, role: UserRole, batchId: string) => void;
  logout: () => void;
  switchBatch: (batchId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Restore session on load
    const saved = sessionStorage.getItem("sop_user_session");
    if (saved) {
      setUser(JSON.parse(saved));
    }
  }, []);

  const login = (name: string, role: UserRole, batchId: string) => {
    const newUser = { name, role, currentBatchId: batchId };
    setUser(newUser);
    sessionStorage.setItem("sop_user_session", JSON.stringify(newUser));
    
    // Ensure batch exists in registry
    storage.createBatch(batchId);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("sop_user_session");
  };

  const switchBatch = (batchId: string) => {
    if (!user) return;
    const updated = { ...user, currentBatchId: batchId };
    setUser(updated);
    sessionStorage.setItem("sop_user_session", JSON.stringify(updated));
    
    // Ensure batch exists
    storage.createBatch(batchId);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchBatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
