import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
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

const baseNavItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/events", label: "Events", icon: Calendar },
  { path: "/expenses", label: "Expenses", icon: Receipt },
];

export function Layout({ children }: LayoutProps) {
  const { user, isAdmin, logout } = useAuth();
  const { customers, selectedCustomerId, setSelectedCustomerId } = useData();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keep standard nav items
  const navItems = baseNavItems;

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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    <Shield className="h-3 w-3" />
                    Admin
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

            {/* Right: Admin Customer Selector + Logout */}
            <div className="flex items-center gap-3">
              {isAdmin && (
                <div className="hidden lg:flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-medium">Viewing:</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="my">My Account ({user?.email})</option>
                    <option value="all">⚡ All Customers Combined</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.email} ({c.eventsCount} events)
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
              {isAdmin && (
                <div className="pb-2 border-b">
                  <label className="text-xs text-muted-foreground block mb-1">
                    Admin Customer Switcher:
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="my">My Account ({user?.email})</option>
                    <option value="all">⚡ All Customers Combined</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.email} ({c.eventsCount} events)
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
