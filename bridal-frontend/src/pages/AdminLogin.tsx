import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Eye, EyeOff, Lock, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminLogin() {
  const { signIn, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email.trim(), password);

      if (error) {
        toast.error(error.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      // Check user role from localStorage
      const userStr = localStorage.getItem("user");
      const loggedUser = userStr ? JSON.parse(userStr) : null;

      if (!loggedUser || loggedUser.role !== "admin") {
        // Not an admin! Log out and reject
        logout();
        toast.error("Access Denied: This portal is strictly for administrators.");
        setIsLoading(false);
        return;
      }

      toast.success("Welcome Administrator!");
      navigate("/admin", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md space-y-8 bg-slate-950/80 p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2 shadow-inner">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Satya<span className="text-amber-400">Makeovers</span>
          </h1>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Control Center &bull; Admin Portal
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Restricted area. Authorized personnel only.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-xs font-medium text-slate-300">
              Admin Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@satyamakeovers.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-xs font-medium text-slate-300">
              Admin Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10 bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-lg shadow-amber-500/20 py-2.5 transition"
          >
            {isLoading ? "Verifying Credentials..." : "Enter Admin Portal"}
          </Button>
        </form>

        {/* Back to Customer Login */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Go to Customer / Business Login
          </Link>
        </div>
      </div>
    </div>
  );
}
