import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useStore, store, getCurrencyFormatter, convertFromBase } from "../lib/dataStore";
import { GlassTabs } from "../components/ui/glass-tabs";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Settings as SettingsIcon,
  Globe,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Coffee,
  ShoppingBag,
  Car,
  Home as HomeIcon,
  Utensils,
  Plane,
  HandCoins,
  Receipt,
  Filter,
  MoreHorizontal,
  Search,
  X,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ExpenseTracker" },
      {
        name: "description",
        content: "An elegant, premium expense tracker for modern personal finance.",
      },
      { property: "og:title", content: "Lumen — Personal Expense Tracker" },
      {
        property: "og:description",
        content: "Track expenses, income, and loans with a refined interface.",
      },
    ],
  }),
  component: Index,
});

const categoryIcons = {
  "Food & Dining": Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Housing: HomeIcon,
  Travel: Plane,
  Income: Wallet,
  Lent: HandCoins,
  Borrowed: HandCoins,
  Recharge: Zap,
  Other: MoreHorizontal,
};

function Index() {
  const txns = useStore((s) => s.getTransactions());
  const loans = useStore((s) => s.getLoans());
  const settings = useStore((s) => s.getSettings());
  const monthlyData = useStore((s) => s.getMonthly());

  const themeSetting = settings?.theme || "system";
  const [isDark, setIsDark] = useState(() => {
    if (themeSetting === "dark") return true;
    if (themeSetting === "light") return false;
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });

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

  const monthly = monthlyData.map((item) => ({
    ...item,
    income: convertFromBase(item.income, settings.currency),
    expense: convertFromBase(item.expense, settings.currency),
  }));

  const formatter = getCurrencyFormatter(settings.currency);
  const fmt = (n) => formatter.format(convertFromBase(n, settings.currency));
  const currencySymbol = settings.currency ? settings.currency.split(" — ")[1] || "₹" : "₹";

  const [tab, setTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for quick transaction add (Modal)
  const [formName, setFormName] = useState("");
  const [formCat, setFormCat] = useState("Food & Dining");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("expense");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formAmount) return;
    const toastId = toast.loading("Adding transaction...");
    try {
      const txnDate = formDate ? new Date(`${formDate}T${formTime || "12:00"}`) : new Date();
      await store.addTransaction({
        name: formName,
        cat: formCat,
        amount: parseFloat(formAmount),
        type: formType,
        date: txnDate,
      });
      toast.success("Transaction added successfully", { id: toastId });
      setFormName("");
      setFormAmount("");
      setFormDate("");
      setFormTime("");
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Failed to add transaction", { id: toastId });
    }
  };


  // Compute KPI card balances based on dynamic transaction history
  const currentMonthNum = new Date().getMonth();
  const currentYearNum = new Date().getFullYear();

  const prevMonth = currentMonthNum === 0 ? 11 : currentMonthNum - 1;
  const prevYear = currentMonthNum === 0 ? currentYearNum - 1 : currentYearNum;

  const incomeThisMonth = txns
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === "income" &&
        t.cat !== "Lent" &&
        t.cat !== "Borrowed" &&
        !t.name.startsWith("Repayment from/to") &&
        d.getMonth() === currentMonthNum &&
        d.getFullYear() === currentYearNum
      );
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const incomeLastMonth = txns
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === "income" &&
        t.cat !== "Lent" &&
        t.cat !== "Borrowed" &&
        !t.name.startsWith("Repayment from/to") &&
        d.getMonth() === prevMonth &&
        d.getFullYear() === prevYear
      );
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const incomeChangePercent = incomeLastMonth > 0
    ? ((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100
    : 0;

  const expenseThisMonth = txns
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === "expense" &&
        t.cat !== "Lent" &&
        t.cat !== "Borrowed" &&
        !t.name.startsWith("Repayment from/to") &&
        d.getMonth() === currentMonthNum &&
        d.getFullYear() === currentYearNum
      );
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const expenseLastMonth = txns
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === "expense" &&
        t.cat !== "Lent" &&
        t.cat !== "Borrowed" &&
        !t.name.startsWith("Repayment from/to") &&
        d.getMonth() === prevMonth &&
        d.getFullYear() === prevYear
      );
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const expenseChangePercent = expenseLastMonth > 0
    ? ((expenseThisMonth - expenseLastMonth) / expenseLastMonth) * 100
    : 0;

  const totalBalance = txns.reduce((sum, t) => sum + t.amount, 0);

  const balanceBeforeThisMonth = txns
    .filter((t) => {
      const d = new Date(t.date);
      const startOfCurrentMonth = new Date(currentYearNum, currentMonthNum, 1);
      return d < startOfCurrentMonth;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const balanceChangePercent = balanceBeforeThisMonth !== 0
    ? ((totalBalance - balanceBeforeThisMonth) / Math.abs(balanceBeforeThisMonth)) * 100
    : 0;

  // Filter lists for dashboard list
  const filtered = txns
    .filter((t) => {
      const isLoan = t.cat === "Lent" || t.cat === "Borrowed" || t.name.startsWith("Repayment from/to");
      if (tab === "all") return true;
      if (tab === "income") return t.type === "income" && !isLoan;
      if (tab === "expense") return t.type === "expense" && !isLoan;
      return isLoan;
    })
    .slice(0, 6); // show latest 6 on dashboard

  // Dynamically compute category distribution totals for the current month
  const categoryTotals = {};
  txns
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.type === "expense" &&
        t.cat !== "Lent" &&
        t.cat !== "Borrowed" &&
        !t.name.startsWith("Repayment from/to") &&
        d.getMonth() === currentMonthNum &&
        d.getFullYear() === currentYearNum
      );
    })
    .forEach((t) => {
      categoryTotals[t.cat] = (categoryTotals[t.cat] || 0) + Math.abs(t.amount);
    });

  const categoriesList = Object.keys(categoryTotals).map((catName) => ({
    name: catName,
    value: categoryTotals[catName],
  }));

  const finalCategories = categoriesList;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-28 md:pb-12 pt-4">
      {/* ambient backdrop */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12 animate-in fade-in duration-300">
          {/* Left column */}
          <section className="lg:col-span-8 space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary to-primary-glow text-primary-foreground border-transparent p-3 sm:p-5 shadow-[var(--shadow-card)]">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
                <div className="flex flex-col gap-1.5 xs:flex-row xs:items-start xs:justify-between w-full">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-primary-foreground/80 font-semibold truncate w-full">
                    Total Balance
                  </p>
                  <div className="h-6 w-6 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl grid place-items-center bg-white/15 shrink-0">
                    <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="mt-4 sm:mt-5 flex flex-col items-start gap-1.5 xs:flex-row xs:items-end xs:justify-between">
                  <p className="num text-base sm:text-2xl lg:text-3xl font-semibold leading-none truncate">
                    {fmt(totalBalance)}
                  </p>
                  {balanceChangePercent !== 0 ? (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-white/15 text-primary-foreground shrink-0 w-fit">
                      {balanceChangePercent >= 0 ? (
                        <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      ) : (
                        <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      )}
                      {balanceChangePercent >= 0 ? "+" : ""}
                      {balanceChangePercent.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-white/15 text-primary-foreground/70 shrink-0 w-fit">
                      Stable
                    </span>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-5 shadow-[var(--shadow-card)]">
                <div className="flex flex-col gap-1.5 xs:flex-row xs:items-start xs:justify-between w-full">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold truncate w-full">
                    Income — {new Date().toLocaleDateString("en-US", { month: "long" })}
                  </p>
                  <div className="h-6 w-6 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl grid place-items-center bg-accent shrink-0">
                    <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                </div>
                <div className="mt-4 sm:mt-5 flex flex-col items-start gap-1.5 xs:flex-row xs:items-end xs:justify-between">
                  <p className="num text-base sm:text-2xl lg:text-3xl font-semibold leading-none truncate">
                    {fmt(incomeThisMonth)}
                  </p>
                  {incomeChangePercent !== 0 ? (
                    <span className={`inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 shrink-0 w-fit ${incomeChangePercent >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {incomeChangePercent >= 0 ? (
                        <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      ) : (
                        <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      )}
                      {incomeChangePercent >= 0 ? "+" : ""}
                      {incomeChangePercent.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-accent/40 text-muted-foreground shrink-0 w-fit">
                      Stable
                    </span>
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-5 shadow-[var(--shadow-card)]">
                <div className="flex flex-col gap-1.5 xs:flex-row xs:items-start xs:justify-between w-full">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold truncate w-full">
                    Expenses — {new Date().toLocaleDateString("en-US", { month: "long" })}
                  </p>
                  <div className="h-6 w-6 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl grid place-items-center bg-accent shrink-0">
                    <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                </div>
                <div className="mt-4 sm:mt-5 flex flex-col items-start gap-1.5 xs:flex-row xs:items-end xs:justify-between">
                  <p className="num text-base sm:text-2xl lg:text-3xl font-semibold leading-none truncate">
                    {fmt(expenseThisMonth)}
                  </p>
                  {expenseChangePercent !== 0 ? (
                    <span className={`inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 shrink-0 w-fit ${expenseChangePercent <= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {expenseChangePercent >= 0 ? (
                        <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      ) : (
                        <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      )}
                      {expenseChangePercent >= 0 ? "+" : ""}
                      {expenseChangePercent.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-medium rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-accent/40 text-muted-foreground shrink-0 w-fit">
                      Stable
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Cash Flow</p>
                    <p className="text-xs text-muted-foreground">
                      Income vs expenses · last 7 months
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary" /> Income
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground" /> Expense
                    </span>
                  </div>
                </div>
                <div className="mt-4 h-64">
                  <ResponsiveContainer>
                    <AreaChart data={monthly} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gEx" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="var(--color-muted-foreground)"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--color-muted-foreground)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="m"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "var(--color-popover-foreground)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="var(--color-muted-foreground)"
                        strokeWidth={2}
                        fill="url(#gEx)"
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="var(--color-primary)"
                        strokeWidth={2.5}
                        fill="url(#gIn)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Monthly Breakdown</p>
                    <p className="text-xs text-muted-foreground">Net spend</p>
                  </div>
                  <Link
                    to="/transactions"
                    className="btn-premium-secondary px-3 py-1.5 rounded-lg text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Filter className="h-3 w-3" /> Filter
                  </Link>
                </div>
                <div className="mt-4 h-64">
                  <ResponsiveContainer>
                    <BarChart data={monthly} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="m"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--color-accent)", opacity: 0.5 }}
                        contentStyle={{
                          background: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          fontSize: 12,
                          color: "var(--color-popover-foreground)",
                        }}
                      />
                      <Bar
                        dataKey="expense"
                        fill="var(--color-primary)"
                        radius={[8, 8, 4, 4]}
                        maxBarSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Transactions Card Widget */}
            <div className="rounded-2xl border bg-card shadow-[var(--shadow-card)]">
              <div className="p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Recent Transactions</p>
                  <p className="text-xs text-muted-foreground">
                    A polished view of your latest activity
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/transactions"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="px-5">
                <GlassTabs
                  value={tab}
                  onChange={setTab}
                  options={[
                    { key: "all", label: "All" },
                    { key: "income", label: "Income" },
                    { key: "expense", label: "Expenses" },
                  ]}
                  roundedFull
                />
              </div>

              <ul className="mt-3 divide-y">
                {filtered.map((t) => {
                  const Icon = categoryIcons[t.cat] || Receipt;
                  return (
                    <li
                      key={t.id}
                      className="group flex items-center gap-4 px-5 py-3.5 hover:bg-accent/40 transition-colors"
                    >
                      <div
                        className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${
                          t.cat === "Lent" || t.cat === "Borrowed" || t.name.startsWith("Repayment from/to")
                            ? "bg-primary/10 text-primary"
                            : t.type === "income"
                              ? "bg-success/10 text-success"
                              : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.cat} · {t.when}
                        </p>
                      </div>
                      <p
                        className={`num text-sm font-semibold ${t.amount > 0 ? "text-success" : "text-destructive"}`}
                      >
                        {t.amount > 0 ? "+" : ""}
                        {fmt(t.amount)}
                      </p>
                    </li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No transactions in this view.
                  </li>
                )}
              </ul>
            </div>
          </section>

          {/* Right column */}
          <aside className="lg:col-span-4 space-y-6">
{/* Preferences / Settings Widget */}
            <div className="hidden lg:block rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Preferences</p>
                </div>
                <Link
                  to="/settings"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  Manage <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* theme toggle */}
              <div className="mt-4 rounded-xl border bg-gradient-to-br from-background to-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Appearance
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {isDark ? "Dark mode" : "Light mode"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      store.setSettings({
                        ...settings,
                        theme: isDark ? "light" : "dark",
                      })
                    }
                    role="switch"
                    aria-checked={isDark}
                    className="switch-glass-large relative h-9 w-16 rounded-full cursor-pointer"
                    style={{
                      boxShadow:
                        isDark
                          ? "0 0 24px -4px color-mix(in oklab, var(--primary) 30%, transparent)"
                          : "0 0 24px -4px color-mix(in oklab, var(--warning) 30%, transparent)",
                    }}
                  >
                    <span
                      className="absolute top-1 h-7 w-7 rounded-full bg-card shadow-md grid place-items-center transition-all border border-black/5"
                      style={{
                        left: isDark ? "calc(100% - 1.875rem)" : "0.25rem",
                      }}
                    >
                      {isDark ? (
                        <Moon className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Sun className="h-3.5 w-3.5 text-warning" />
                      )}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <Link
                  to="/settings"
                  className="flex items-center justify-between rounded-xl border bg-background/40 px-3 py-2.5 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-sm">Language</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {settings.language} <ChevronRight className="h-3 w-3" />
                  </div>
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center justify-between rounded-xl border bg-background/40 px-3 py-2.5 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-sm">Currency</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {settings.currency} <ChevronRight className="h-3 w-3" />
                  </div>
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center justify-between rounded-xl border bg-background/40 px-3 py-2.5 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-sm">Account</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {settings.accountStatus} <ChevronRight className="h-3 w-3" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Loan Tracking Widget */}
            <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HandCoins className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Loan Tracking</p>
                </div>
                <Link
                  to="/loans"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Outstanding metrics */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3 bg-gradient-to-br from-background to-accent/40">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Borrowed
                  </p>
                  <p className="num text-2xl font-semibold mt-1">
                    {fmt(
                      loans
                        .filter((l) => l.type === "Borrowed" && l.status !== "Paid")
                        .reduce((sum, l) => sum + (Math.abs(l.amount) - l.paid), 0),
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {loans.filter((l) => l.type === "Borrowed" && l.status !== "Paid").length} active
                  </p>
                </div>
                <div className="rounded-xl border p-3 bg-gradient-to-br from-background to-primary/10">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Lent</p>
                  <p className="num text-2xl font-semibold mt-1 text-success">
                    {fmt(
                      loans
                        .filter((l) => l.type === "Lent" && l.status !== "Paid")
                        .reduce((sum, l) => sum + (l.amount - l.paid), 0),
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {loans.filter((l) => l.type === "Lent" && l.status !== "Paid").length} active
                  </p>
                </div>
              </div>

              {/* Short list of active loans */}
              <div className="mt-3 space-y-2">
                {loans
                  .filter((l) => l.status === "Active")
                  .slice(0, 3)
                  .map((l, i) => (
                    <Link
                      key={l.id}
                      to="/loans"
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5 hover:bg-accent/40 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-[10px] font-semibold uppercase">
                        {l.name
                          .split(" ")
                          .map((s) => s[0])
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {l.type} · {l.note}
                        </p>
                      </div>
                      <p
                        className={`num text-sm font-semibold ${l.amount > 0 ? "text-success" : "text-foreground"}`}
                      >
                        {l.amount > 0 ? "+" : ""}
                        {fmt(l.amount)}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>

            {/* Category distribution */}
            <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Category Distribution</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", { month: "long" })}
                </span>
              </div>

              {finalCategories.length > 0 ? (
                <div className="mt-3 flex items-center gap-4">
                  <div className="relative h-32 w-32 shrink-0">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={finalCategories}
                          dataKey="value"
                          innerRadius={42}
                          outerRadius={60}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {finalCategories.map((_, i) => (
                            <Cell
                              key={i}
                              fill={
                                [
                                  "var(--color-chart-1)",
                                  "var(--color-chart-2)",
                                  "var(--color-chart-3)",
                                  "var(--color-chart-4)",
                                  "var(--color-chart-5)",
                                ][i % 5]
                              }
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 grid place-items-center text-center">
                      <div>
                        <p className="num text-sm font-semibold">
                          {fmt(finalCategories.reduce((a, c) => a + c.value, 0))}
                        </p>
                        <p className="text-[9px] text-muted-foreground leading-none">Total spend</p>
                      </div>
                    </div>
                  </div>
                  <ul className="flex-1 space-y-1">
                    {finalCategories.slice(0, 5).map((c, i) => (
                      <li key={c.name} className="flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{
                              background: [
                                "var(--color-chart-1)",
                                "var(--color-chart-2)",
                                "var(--color-chart-3)",
                                "var(--color-chart-4)",
                                "var(--color-chart-5)",
                              ][i % 5],
                            }}
                          />
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="num text-muted-foreground shrink-0">{fmt(c.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-3 py-8 text-center text-xs text-muted-foreground">
                  No expense records for this month.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* FAB and Modal */}
      <button
        onClick={() => setIsModalOpen(true)}
        aria-label="Add transaction"
        className="group fixed bottom-24 md:bottom-8 right-8 z-30 inline-flex h-16 w-16 items-center justify-center rounded-full text-primary-foreground transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        style={{ background: "var(--gradient-primary)", animation: "var(--animate-pulse-glow)" }}
      >
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-60" />
        <Plus
          className="relative h-7 w-7 transition-transform group-hover:rotate-90"
          strokeWidth={2.4}
        />
      </button>

      {/* Quick Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full border bg-background hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-all shadow-sm z-10"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-xl font-bold tracking-tight">New Transaction</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record a new credit or debit transaction
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Trader Joe's, Salary"
                  required
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="expense">Expense (Debit)</option>
                    <option value="income">Income (Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Amount ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    min="0.01"
                    step="any"
                    className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Transport">Transport</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Housing">Housing</option>
                    <option value="Travel">Travel</option>
                    <option value="Recharge">Recharge</option>
                    <option value="Income">Income</option>
                    <option value="Lent">Lent / Loans</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Time (Optional)
                </label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer text-muted-foreground"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-premium-secondary rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-premium-primary rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
