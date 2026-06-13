import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useStore } from "../lib/dataStore";
import { toast } from "sonner";
import {
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  AlertTriangle,
  EyeOff,
  RefreshCw,
  Key,
  ArrowRight,
  Check,
  CreditCard,
  X,
  User,
  Mail,
  KeyRound,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Lumen — Preferences & Privacy" },
      {
        name: "description",
        content: "Manage visual themes, analytics settings, and local data parameters.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useStore((s) => s.getSettings());
  const user = useStore((s) => s.getUser());

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user && !isEditing) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user, isEditing]);

  const handleCancelEdit = () => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPassword("");
    setConfirmPassword("");
    setIsEditing(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Updating profile...");

    try {
      const profileData = { name, email };
      if (password) {
        profileData.password = password;
      }
      
      const { store } = await import("../lib/dataStore");
      await store.updateProfile(profileData);
      
      toast.success("Profile updated successfully", { id: toastId });
      setPassword("");
      setConfirmPassword("");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || "Failed to update profile", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSetting = (key, value) => {
    import("../lib/dataStore").then(({ store }) => {
      const current = store.getSettings();
      store.setSettings({ ...current, [key]: value });
    });
  };

  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [clearConfirmed, setClearConfirmed] = useState(false);

  // Sync theme to document element
  useEffect(() => {
    if (typeof window !== "undefined") {
      let isDark = settings.theme === "dark";
      if (settings.theme === "system") {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, [settings.theme]);

  const handleClearData = () => {
    import("../lib/dataStore").then(({ store }) => {
      store.clearAllData();
      setClearConfirmed(true);
      setTimeout(() => {
        setClearConfirmed(false);
        setIsClearOpen(false);
        window.location.reload();
      }, 1500);
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-28 md:pb-12 pt-4 animate-in fade-in duration-300">
      {/* ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 [background:var(--gradient-radial-brand)]" />

      <div className="relative mx-auto max-w-[800px] px-6">
        {/* Header */}
        <div>
          {/* <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Configuration</p> */}
          <h1 className="text-3xl font-bold tracking-tight">System Preferences</h1>
        </div>

        {/* User Profile Section */}
        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> User Profile Settings
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update your account details and secure passphrase
          </p>

          <form onSubmit={handleProfileUpdate} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  disabled={!isEditing || isSubmitting}
                  className="w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-white/20 dark:focus:bg-black/30 transition-all placeholder:text-muted-foreground/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  disabled={!isEditing || isSubmitting}
                  className="w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-white/20 dark:focus:bg-black/30 transition-all placeholder:text-muted-foreground/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> New Password (Optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditing ? "••••••••" : "Not Editable"}
                  disabled={!isEditing || isSubmitting}
                  className="w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-white/20 dark:focus:bg-black/30 transition-all placeholder:text-muted-foreground/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  minLength={6}
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={isEditing ? "••••••••" : "Not Editable"}
                  disabled={!isEditing || isSubmitting}
                  className="w-full rounded-xl border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/20 px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:bg-white/20 dark:focus:bg-black/30 transition-all placeholder:text-muted-foreground/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="btn-premium-secondary rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-premium-primary rounded-xl px-5 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50 text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Profile Changes"
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-premium-primary rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer text-primary-foreground"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Theme Section */}
        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" /> Visual Appearance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select your default workspace theme color
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* System Theme Card */}
            <button
              onClick={() => updateSetting("theme", "system")}
              className={`btn-glass-card group w-full p-4 border cursor-pointer ${
                settings.theme === "system" || !settings.theme
                  ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
                  : "border-black/5 dark:border-white/8 bg-background/20"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${settings.theme === "system" || !settings.theme ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <Monitor className="h-4.5 w-4.5" />
                </div>
                {(settings.theme === "system" || !settings.theme) && (
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="mt-6">
                <p className="text-sm font-semibold">System Default</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Matches operating system preferences
                </p>
              </div>
            </button>

            {/* Light Theme Card */}
            <button
              onClick={() => updateSetting("theme", "light")}
              className={`btn-glass-card group w-full p-4 border cursor-pointer ${
                settings.theme === "light"
                  ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
                  : "border-black/5 dark:border-white/8 bg-background/20"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${settings.theme === "light" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <Sun className="h-4.5 w-4.5" />
                </div>
                {settings.theme === "light" && (
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="mt-6">
                <p className="text-sm font-semibold">Light Theme</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Clean, daylight contrast aesthetics
                </p>
              </div>
            </button>

            {/* Dark Theme Card */}
            <button
              onClick={() => updateSetting("theme", "dark")}
              className={`btn-glass-card group w-full p-4 border cursor-pointer ${
                settings.theme === "dark"
                  ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
                  : "border-black/5 dark:border-white/8 bg-background/20"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${settings.theme === "dark" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  <Moon className="h-4.5 w-4.5" />
                </div>
                {settings.theme === "dark" && (
                  <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <div className="mt-6">
                <p className="text-sm font-semibold">Dark Theme</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Premium, low-light OLED styling
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Currency Preference Card */}
        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Currency Preference
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select the active currency for ledger formatting
          </p>

          <div className="mt-4">
            <select
              value={settings.currency}
              onChange={(e) => updateSetting("currency", e.target.value)}
              className="select-glass w-full text-sm rounded-xl px-3 py-2.5 text-foreground focus:outline-none cursor-pointer"
            >
              <option value="INR — ₹">Indian Rupee (₹)</option>
              <option value="USD — $">US Dollar ($)</option>
              <option value="EUR — €">Euro (€)</option>
              <option value="GBP — £">Pound Sterling (£)</option>
            </select>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] space-y-5">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-primary" /> Privacy & Local Data
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control how your personal ledger data is tracked and stored
            </p>
          </div>

          <div className="divide-y">
            {/* Toggle 1: Telemetry Data Sharing */}
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-semibold">Anonymous Analytics</p>
                <p className="text-xs text-muted-foreground">
                  Share anonymous analytical reports to help improve features
                </p>
              </div>
              <button
                onClick={() => updateSetting("dataSharing", !settings.dataSharing)}
                role="switch"
                aria-checked={settings.dataSharing}
                className="switch-glass relative h-6 w-11 rounded-full cursor-pointer"
              >
                <span
                  className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-card border border-black/5 shadow-sm transition-all"
                  style={{ transform: settings.dataSharing ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>

            {/* Toggle 2: Local Encryption */}
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-semibold">Local Storage Cryptographic Lock</p>
                <p className="text-xs text-muted-foreground">
                  Encrypt cash flow entries when saving to browser storage keys
                </p>
              </div>
              <button
                onClick={() => updateSetting("encryption", !settings.encryption)}
                role="switch"
                aria-checked={settings.encryption}
                className="switch-glass relative h-6 w-11 rounded-full cursor-pointer"
              >
                <span
                  className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-card border border-black/5 shadow-sm transition-all"
                  style={{ transform: settings.encryption ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>

            {/* Privacy Policy Link */}
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-semibold">Lumen Privacy Statement</p>
                <p className="text-xs text-muted-foreground">
                  Read about our local-first secure storage architecture
                </p>
              </div>
              <button
                onClick={() => setIsPolicyOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-background hover:bg-accent px-4 py-2 text-xs font-semibold cursor-pointer transition-colors"
              >
                View Policy <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Reset Data */}
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-semibold text-destructive">Erase Cache Database</p>
                <p className="text-xs text-muted-foreground">
                  Delete all custom transaction and loan histories and restore defaults
                </p>
              </div>
              <button
                onClick={() => setIsClearOpen(true)}
                className="rounded-lg bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground px-4 py-2 text-xs font-semibold text-destructive cursor-pointer transition-colors"
              >
                Clear Local Data
              </button>
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent grid place-items-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Device Security Context</p>
              <p className="text-xs text-muted-foreground">
                Local storage keys isolated and sandbox secured
              </p>
            </div>
          </div>
          <span className="text-xs bg-muted border rounded-md px-2 py-1 text-muted-foreground">
            Secure Context
          </span>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {isPolicyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setIsPolicyOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 text-primary">
              <Key className="h-5 w-5" /> Privacy & Local Security Policy
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">1. Zero Cloud Transmission</p>
              <p>
                Lumen operates under a strict "local-first" principle. All transactions, balance
                parameters, budget items, and loans created inside this application are stored
                completely on your local device. No data is sent to external clouds or servers.
              </p>

              <p className="font-semibold text-foreground">2. Cache & Storage Policies</p>
              <p>
                Data is stored in the browser's `localStorage` namespace (`lumen_txns`,
                `lumen_loans`, etc.). When you toggle "Local Storage Cryptographic Lock", values are
                securely formatted and encapsulated locally.
              </p>

              <p className="font-semibold text-foreground">3. Analytics & Telemetry</p>
              <p>
                If "Anonymous Analytics" is enabled, anonymous device parameters are used to verify
                client rendering speeds. This contains no private transaction descriptions or
                financial totals.
              </p>

              <p className="font-semibold text-foreground">4. Complete Control</p>
              <p>
                You maintain absolute control. You can erase the entirety of the local cache at any
                time using the "Clear Local Data" option.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={() => setIsPolicyOpen(false)}
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {isClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            {!clearConfirmed ? (
              <>
                <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Are you absolutely sure?</h2>
                <p className="text-xs text-muted-foreground mt-2">
                  This action will permanently erase your transaction ledger and loan schedules.
                  This cannot be undone.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setIsClearOpen(false)}
                    className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearData}
                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 px-5 py-2.5 text-sm font-semibold cursor-pointer transition-colors"
                  >
                    Yes, Delete Everything
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                <h3 className="text-sm font-semibold mt-2">Resetting ledger Database...</h3>
                <p className="text-xs text-muted-foreground">Erasures successfully processed.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
