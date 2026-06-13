import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { store } from "../lib/dataStore";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowRight, ShieldCheck, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import logo from "../assets/logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Lumen — Secure Access Portal" },
      {
        name: "description",
        content: "Access your local secure personal ledger database.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("signin"); // 'signin' | 'signup'
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEmail("");
    setPassword("");
    setFullName("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (activeTab === "signup") {
      if (!fullName) {
        toast.error("Please enter your name");
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        setIsLoading(false);
        return;
      }
    }

    const processMessage =
      activeTab === "signin"
        ? "Authenticating credentials..."
        : "Creating your secure profile...";

    const toastId = toast.loading(processMessage);

    try {
      if (activeTab === "signin") {
        await api.auth.signin(email, password);
        toast.success("Welcome back! Secure session initialized.");
      } else {
        await api.auth.signup(fullName, email, password);
        toast.success("Profile created successfully! Welcome to Lumen.");
      }

      // Sync backend data to client store
      await store.syncWithBackend();

      // Mark store as logged in
      store.setLoggedIn(true);

      router.navigate({ to: "/" });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      toast.dismiss(toastId);
      setIsLoading(false);
    }
  };

  const isSignUp = activeTab === "signup";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/8 via-background to-background/60 text-foreground overflow-hidden px-4">
      {/* Encapsulated floating keyframes for high-end glass backdrop animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-slow {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-40px, 40px) scale(1.15); }
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 9s ease-in-out infinite;
        }
      `}} />

      {/* Realistic volumetric glass background glowing elements */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px] animate-float-slow" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[550px] w-[550px] rounded-full bg-primary-glow/12 blur-[140px] animate-float-medium" />
      <div className="pointer-events-none absolute top-[40%] left-[30%] h-[200px] w-[200px] rounded-full bg-primary/8 blur-[90px] animate-pulse" />

      {/* Main Container */}
      <div className="w-full max-w-[440px] relative z-10 animate-in fade-in duration-500">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logo} alt="Lumen Logo" className="h-16 w-16 object-contain mb-3.5" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold">Lumen System</p>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">Personal Finance Tracker</h1>
        </div>

        {/* HIGH-FIDELITY GLASS CARD */}
        <div className="rounded-3xl border border-white/25 dark:border-white/10 bg-white/12 dark:bg-black/25 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden">
          {/* Specular edge shine layer */}
          <div className="absolute inset-0 pointer-events-none rounded-3xl border border-t-white/35 border-l-white/20 border-r-white/5 border-b-white/5 dark:border-t-white/10 dark:border-l-white/5 dark:border-r-transparent dark:border-b-transparent" />

          {/* Security Status Panel */}
          <div className="flex items-center gap-2.5 pb-4.5 border-b border-white/15 dark:border-white/5 mb-6">
            <div className="h-7 w-7 rounded-lg bg-white/20 dark:bg-white/5 flex items-center justify-center border border-white/20 dark:border-white/5">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold leading-none">Security Environment</p>
              <h2 className="text-xs font-semibold mt-1">Local Sandbox Encrypted Mode</h2>
            </div>
          </div>

          {/* Glass Slider Tabs Selector */}
          <div className="relative flex w-full bg-black/[0.04] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full p-1 mb-6 backdrop-blur-sm">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-white/95 to-white/70 dark:from-white/15 dark:to-white/5 border border-white/60 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md pointer-events-none"
              style={{
                transform: isSignUp ? "translateX(100%)" : "translateX(0%)",
                transition: "transform 0.42s cubic-bezier(0.25, 1.35, 0.5, 1.12)",
              }}
            />
            <button
              type="button"
              onClick={() => handleTabChange("signin")}
              className={`relative z-10 w-1/2 py-2 text-xs font-semibold rounded-full transition-all duration-300 cursor-pointer ${
                !isSignUp ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className={`relative z-10 w-1/2 py-2 text-xs font-semibold rounded-full transition-all duration-300 cursor-pointer ${
                isSignUp ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {/* Dynamic Sign Up: Full Name Field */}
            {isSignUp && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={isLoading}
                    className="w-full rounded-full border border-white/20 dark:border-white/10 bg-white/15 dark:bg-black/20 pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-white/25 dark:focus:bg-black/35 focus:shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)] transition-all placeholder:text-muted-foreground/40"
                  />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                  className="w-full rounded-full border border-white/20 dark:border-white/10 bg-white/15 dark:bg-black/20 pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-white/25 dark:focus:bg-black/35 focus:shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)] transition-all placeholder:text-muted-foreground/40"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <span className="text-[10px] text-primary hover:underline cursor-pointer font-medium">Forgot?</span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  minLength={isSignUp ? 6 : undefined}
                  className="w-full rounded-full border border-white/20 dark:border-white/10 bg-white/15 dark:bg-black/20 pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-white/25 dark:focus:bg-black/35 focus:shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)] transition-all placeholder:text-muted-foreground/40"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground/70 hover:text-foreground focus:outline-none focus:text-foreground cursor-pointer transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Dynamic Sign Up: Confirm Password Field */}
            {isSignUp && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    minLength={6}
                    className="w-full rounded-full border border-white/20 dark:border-white/10 bg-white/15 dark:bg-black/20 pl-10 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-white/25 dark:focus:bg-black/35 focus:shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)] transition-all placeholder:text-muted-foreground/40"
                  />
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-muted-foreground/70 hover:text-foreground focus:outline-none focus:text-foreground cursor-pointer transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Glass Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-11 inline-flex items-center justify-center rounded-full font-semibold text-sm text-foreground bg-gradient-to-r from-white/80 to-white/60 dark:from-white/12 dark:to-white/4 hover:from-white/95 hover:to-white/75 dark:hover:from-white/18 dark:hover:to-white/8 border border-white/60 dark:border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.12)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 ease-out cursor-pointer disabled:opacity-80 disabled:pointer-events-none mt-3.5 overflow-hidden group"
            >
              {/* Inner shine sweep effect */}
              <div className="absolute inset-0 w-full h-full pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] skew-x-[-25deg] group-hover:translate-x-[150%] transition-transform duration-750 ease-in-out" />
              
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <span className="inline-flex items-center gap-1.5 font-bold">
                  {isSignUp ? "Create Account" : "Sign In"}{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 text-primary animate-pulse" />
                </span>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <p className="text-[10px] text-center text-muted-foreground/80 mt-5.5 leading-relaxed">
            Lumen does not upload metrics to cloud databases. Data keys persist securely inside the local client vault.
          </p>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-center text-muted-foreground/70 mt-6">
          Lumen Financial Studio · Sandbox Workspace v1.0.0
        </p>
      </div>
    </div>
  );
}
