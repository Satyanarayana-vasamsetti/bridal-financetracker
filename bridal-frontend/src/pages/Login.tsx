import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Eye, EyeOff, KeyRound, Shield } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "reset") {
      if (!email || !password) {
        toast.error("Please fill all fields");
        return;
      }
      if (password.length < 6) {
        toast.error("New password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      setIsLoading(true);
      try {
        const result = await resetPassword(email, password);
        if (result.error) {
          toast.error(result.error.message);
        } else {
          toast.success("Password reset successfully! Please sign in with your new password.");
          setMode("signin");
          setConfirmPassword("");
        }
      } catch {
        toast.error("Failed to reset password");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const result = mode === "signup"
        ? await signUp(email, password)
        : await signIn(email, password);

      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success(mode === "signup" ? "Account created!" : "Login successful!");
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 100);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-blush flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-full gradient-rose items-center justify-center mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">
            Satya<span className="text-primary">Makeovers</span>
          </h1>
          <p className="text-muted-foreground">Finance Tracker</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "signup" && "Create Account"}
              {mode === "signin" && "Welcome Back"}
              {mode === "reset" && "Reset Password"}
            </CardTitle>
            <CardDescription>
              {mode === "signup" && "Sign up to start tracking finances"}
              {mode === "signin" && "Sign in to access your dashboard"}
              {mode === "reset" && "Enter your email and choose a new password"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  placeholder="name@example.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>{mode === "reset" ? "New Password" : "Password"}</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("reset")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {mode === "reset" && (
                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <Button className="w-full gap-2" disabled={isLoading}>
                {mode === "reset" && <KeyRound className="h-4 w-4" />}
                {isLoading
                  ? mode === "signup"
                    ? "Creating Account..."
                    : mode === "reset"
                    ? "Resetting Password..."
                    : "Signing in..."
                  : mode === "signup"
                  ? "Sign Up"
                  : mode === "reset"
                  ? "Reset Password"
                  : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              {mode === "reset" ? (
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-sm text-primary hover:underline"
                >
                  Back to Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {mode === "signup"
                    ? "Already have an account? Sign in"
                    : "No account? Sign up"}
                </button>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-border/60 text-center">
              <Link
                to="/admin/login"
                className="text-xs text-muted-foreground hover:text-primary transition inline-flex items-center gap-1.5"
              >
                <Shield className="h-3 w-3" />
                Go to Admin Portal
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
