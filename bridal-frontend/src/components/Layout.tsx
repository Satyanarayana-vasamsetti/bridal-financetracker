import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Calendar,
  Receipt,
  LogOut,
  Menu,
  X,
  Users,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const customerNavItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/events", label: "Events", icon: Calendar },
  { path: "/expenses", label: "Expenses", icon: Receipt },
];

const adminNavItems = [
  { path: "/admin", label: "Customer Management", icon: Users },
];

export function Layout({ children }: LayoutProps) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin only sees Customer Management; normal users see Dashboard/Events/Expenses
  const navItems = isAdmin ? adminNavItems : customerNavItems;

  return (
    <div className="min-h-screen bg-background">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-lg hover:bg-secondary"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg sm:text-xl font-semibold">
                  Satya<span className="text-primary">Makeovers</span>
                </h1>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <Shield className="h-3.5 w-3.5 text-amber-500" />
                    Admin Portal
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right: User Email + Logout */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-muted-foreground">
                {user?.email}
              </span>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ================= MOBILE NAV ================= */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card animate-fade-in">
            <div className="mx-auto max-w-7xl px-4 py-3 space-y-2">
              <div className="text-xs text-muted-foreground px-4 py-1 border-b">
                Signed in as: <strong>{user?.email}</strong>
              </div>

              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ================= CONTENT ================= */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
