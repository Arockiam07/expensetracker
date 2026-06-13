import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useStore, store } from "../lib/dataStore";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";
import {
  Sun,
  Moon,
  LayoutDashboard,
  Receipt,
  HandCoins,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import logo from "../assets/logo.png";

import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const settings = useStore((s) => s.getSettings());
  const themeSetting = settings?.theme || "system";

  const [isDark, setIsDark] = useState(() => {
    if (themeSetting === "dark") return true;
    if (themeSetting === "light") return false;
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

  const isLoggedIn = useStore((s) => s.isLoggedIn());
  const user = useStore((s) => s.getUser());

  const router = useRouter();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [mounted, setMounted] = useState(false);

  const navRef = useRef(null);
  const mobileNavRef = useRef(null);
  const [highlightStyle, setHighlightStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [mobileHighlightStyle, setMobileHighlightStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (themeSetting === "dark") {
      setIsDark(true);
    } else if (themeSetting === "light") {
      setIsDark(false);
    } else if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);
      const handler = (e) => setIsDark(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [themeSetting]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Handle redirects reactively on mount
  useEffect(() => {
    if (mounted) {
      if (!isLoggedIn && currentPath !== "/login") {
        router.navigate({ to: "/login" });
      } else if (isLoggedIn && currentPath === "/login") {
        router.navigate({ to: "/" });
      }
    }
  }, [mounted, isLoggedIn, currentPath, router]);

  useEffect(() => {
    if (currentPath === "/login") return;

    const updatePosition = () => {
      // Desktop
      if (navRef.current) {
        const activeEl = navRef.current.querySelector(".active-link");
        if (activeEl) {
          setHighlightStyle({
            left: activeEl.offsetLeft,
            width: activeEl.offsetWidth,
            opacity: 1,
          });
        } else {
          setHighlightStyle((prev) => ({ ...prev, opacity: 0 }));
        }
      }

      // Mobile
      if (mobileNavRef.current) {
        const activeEl = mobileNavRef.current.querySelector(".active-link");
        if (activeEl) {
          setMobileHighlightStyle({
            left: activeEl.offsetLeft,
            width: activeEl.offsetWidth,
            opacity: 1,
          });
        } else {
          setMobileHighlightStyle((prev) => ({ ...prev, opacity: 0 }));
        }
      }
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 50);

    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      clearTimeout(timer);
    };
  }, [currentPath]);

  const toggleTheme = () => {
    import("../lib/dataStore").then(({ store }) => {
      const current = store.getSettings();
      store.setSettings({ ...current, theme: isDark ? "light" : "dark" });
    });
  };

  const handleLogout = () => {
    store.setLoggedIn(false);
    toast.success("Successfully logged out");
  };

  const isLoginPage = currentPath === "/login";

  // While checking login, show a stunning loading page to prevent flash of content
  if (mounted && !isLoggedIn && !isLoginPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground relative overflow-hidden">
        {/* ambient background glows */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-primary/15 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[480px] w-[480px] rounded-full bg-primary-glow/10 blur-3xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <img src={logo} alt="Finance Tracker Logo" className="h-16 w-16 object-contain" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">Lumen Finance</p>
            <h3 className="text-sm font-medium text-muted-foreground mt-1.5 animate-pulse">Securing session environment...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Global sticky Navigation Bar */}
        {!isLoginPage && (
          <header className="sticky top-0 z-40 w-full border-b border-white/20 dark:border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
            <div className="mx-auto max-w-[1400px] px-6 py-4 flex items-center justify-between gap-4">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 hover:opacity-90">
                <img src={logo} alt="Finance Tracker Logo" className="h-10 w-10 object-contain" />
                <div> 
                  <h2 className="text-sm font-bold leading-none mt-1">ExpenseTracker</h2>
                </div>
              </Link>

              {/* Navigation links */}
              <nav
                ref={navRef}
                className="relative hidden md:flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-full p-1"
              >
                {/* Sliding glass highlight */}
                {highlightStyle.width > 0 && (
                  <div
                    className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-white/90 to-white/60 dark:from-white/15 dark:to-white/5 border border-white/60 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.05)] pointer-events-none"
                    style={{
                      left: `${highlightStyle.left}px`,
                      width: `${highlightStyle.width}px`,
                      opacity: highlightStyle.opacity,
                      transition:
                        "left 0.42s cubic-bezier(0.25, 1.35, 0.5, 1.12), width 0.36s cubic-bezier(0.25, 1.35, 0.5, 1.12), opacity 0.2s ease",
                    }}
                  />
                )}

                <Link
                  to="/"
                  activeProps={{
                    className:
                      "active-link text-foreground font-semibold [&_svg]:scale-115 [&_svg]:-translate-y-0.5 [&_svg]:text-primary",
                  }}
                  inactiveProps={{
                    className: "text-muted-foreground hover:text-foreground",
                  }}
                  className="relative z-10 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all"
                >
                  <LayoutDashboard className="h-4 w-4 transition-all duration-300 ease-out" />
                  Home
                </Link>
                <Link
                  to="/transactions"
                  activeProps={{
                    className:
                      "active-link text-foreground font-semibold [&_svg]:scale-115 [&_svg]:-translate-y-0.5 [&_svg]:text-primary",
                  }}
                  inactiveProps={{
                    className: "text-muted-foreground hover:text-foreground",
                  }}
                  className="relative z-10 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all"
                >
                  <Receipt className="h-4 w-4 transition-all duration-300 ease-out" />
                  Transactions
                </Link>
                <Link
                  to="/loans"
                  activeProps={{
                    className:
                      "active-link text-foreground font-semibold [&_svg]:scale-115 [&_svg]:-translate-y-0.5 [&_svg]:text-primary",
                  }}
                  inactiveProps={{
                    className: "text-muted-foreground hover:text-foreground",
                  }}
                  className="relative z-10 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all"
                >
                  <HandCoins className="h-4 w-4 transition-all duration-300 ease-out" />
                  Loans
                </Link>
                <Link
                  to="/reports"
                  activeProps={{
                    className:
                      "active-link text-foreground font-semibold [&_svg]:scale-115 [&_svg]:-translate-y-0.5 [&_svg]:text-primary",
                  }}
                  inactiveProps={{
                    className: "text-muted-foreground hover:text-foreground",
                  }}
                  className="relative z-10 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all"
                >
                  <BarChart3 className="h-4 w-4 transition-all duration-300 ease-out" />
                  Reports
                </Link>
                <Link
                  to="/settings"
                  activeProps={{
                    className:
                      "active-link text-foreground font-semibold [&_svg]:scale-115 [&_svg]:-translate-y-0.5 [&_svg]:text-primary",
                  }}
                  inactiveProps={{
                    className: "text-muted-foreground hover:text-foreground",
                  }}
                  className="relative z-10 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all"
                >
                  <Settings className="h-4 w-4 transition-all duration-300 ease-out" />
                  Settings
                </Link>
              </nav>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="btn-glass-circular h-9 w-9 cursor-pointer"
                  aria-label="Toggle theme"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4 text-warning" />
                  ) : (
                    <Moon className="h-4 w-4 text-primary" />
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="btn-glass-circular h-9 w-9 cursor-pointer hover:bg-destructive/10 group transition-all"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                </button>

                <Link
                  to="/settings"
                  className="ml-1 flex items-center gap-3 rounded-full border bg-card pl-3 pr-1 py-1 shadow-[var(--shadow-card)] hover:bg-accent/30 transition-colors"
                >
                  <div className="text-right leading-tight hidden sm:block">
                    <p className="text-xs font-semibold">{user?.name || "User"}</p>
                    <p className="text-[10px] text-muted-foreground">Pro plan</p>
                  </div>
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center text-[10px] font-bold">
                    {user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase() : "U"}
                  </div>
                </Link>
              </div>
            </div>
          </header>
        )}

        {/* Mobile Navigation bar */}
        {!isLoginPage && (
          <nav
            ref={mobileNavRef}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 md:hidden border border-white/20 dark:border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-lg px-6 py-2.5 flex justify-between items-center rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)]"
          >
            {/* Sliding glass highlight */}
            {mobileHighlightStyle.width > 0 && (
              <div
                className="absolute top-1.5 bottom-1.5 rounded-full bg-gradient-to-r from-white/90 to-white/60 dark:from-white/15 dark:to-white/5 border border-white/60 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.05)] pointer-events-none"
                style={{
                  left: `${mobileHighlightStyle.left}px`,
                  width: `${mobileHighlightStyle.width}px`,
                  opacity: mobileHighlightStyle.opacity,
                  transition:
                    "left 0.42s cubic-bezier(0.25, 1.35, 0.5, 1.12), width 0.36s cubic-bezier(0.25, 1.35, 0.5, 1.12), opacity 0.2s ease",
                }}
              />
            )}

            <Link
              to="/"
              activeProps={{
                className:
                  "active-link text-foreground font-semibold [&_svg]:scale-110 [&_svg]:-translate-y-0.5 [&_svg]:text-primary",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:text-foreground",
              }}
              className="relative z-10 flex flex-col items-center gap-1 px-3 py-1.5 rounded-full text-[10px] transition-all"
            >
              <LayoutDashboard className="h-4 w-4 transition-all duration-300 ease-out" />
              Home
            </Link>
            <Link
              to="/transactions"
              activeProps={{
                className:
                  "active-link text-foreground font-semibold [&_svg]:scale-110 [&_svg]:-translate-y-0.5 [&_svg]:text-primary",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:text-foreground",
              }}
              className="relative z-10 flex flex-col items-center gap-1 px-3 py-1.5 rounded-full text-[10px] transition-all"
            >
              <Receipt className="h-4 w-4 transition-all duration-300 ease-out" />
              Ledger
            </Link>
            <Link
              to="/loans"
              activeProps={{
                className:
                  "active-link text-foreground font-semibold [&_svg]:scale-110 [&_svg]:-translate-y-0.5 [&_svg]:text-primary",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:text-foreground",
              }}
              className="relative z-10 flex flex-col items-center gap-1 px-3 py-1.5 rounded-full text-[10px] transition-all"
            >
              <HandCoins className="h-4 w-4 transition-all duration-300 ease-out" />
              Loans
            </Link>
            <Link
              to="/reports"
              activeProps={{
                className:
                  "active-link text-foreground font-semibold [&_svg]:scale-110 [&_svg]:-translate-y-0.5 [&_svg]:text-primary",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:text-foreground",
              }}
              className="relative z-10 flex flex-col items-center gap-1 px-3 py-1.5 rounded-full text-[10px] transition-all"
            >
              <BarChart3 className="h-4 w-4 transition-all duration-300 ease-out" />
              Reports
            </Link>
            <Link
              to="/settings"
              activeProps={{
                className:
                  "active-link text-foreground font-semibold [&_svg]:scale-110 [&_svg]:-translate-y-0.5 [&_svg]:text-primary",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:text-foreground",
              }}
              className="relative z-10 flex flex-col items-center gap-1 px-3 py-1.5 rounded-full text-[10px] transition-all"
            >
              <Settings className="h-4 w-4 transition-all duration-300 ease-out" />
              Settings
            </Link>
          </nav>
        )}

        {/* Child Router Outlets rendering nested route pages */}
        <main className={isLoginPage ? "" : "pb-20 md:pb-0"}>
          <Outlet />
        </main>

        {/* Premium Toasts */}
        <Toaster position="top-right" closeButton />
      </div>
    </QueryClientProvider>
  );
}
