import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, getCurrencyFormatter, convertFromBase } from "../lib/dataStore";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Utensils,
  Car,
  ShoppingBag,
  Home as HomeIcon,
  Plane,
  HandCoins,
  BarChart3,
  Percent,
  RefreshCw,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Lumen — Financial Reports" },
      { name: "description", content: "Analyze your income, savings and expense reports." },
    ],
  }),
  component: ReportsPage,
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
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function ReportsPage() {
  const transactions = useStore((s) => s.getTransactions());
  const settings = useStore((s) => s.getSettings());

  const formatter = getCurrencyFormatter(settings.currency);
  const fmt = (n) => formatter.format(convertFromBase(n, settings.currency));
  const currencySymbol = settings.currency ? settings.currency.split(" — ")[1] || "₹" : "₹";

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const resetFilters = () => {
    setSelectedMonth(new Date().getMonth().toString());
    setStartDate("");
    setEndDate("");
  };

  const downloadExcel = () => {
    if (filteredTxns.length === 0) {
      toast.error("No transactions found to download");
      return;
    }

    const headers = ["Description", "Category", "Amount", "Type", "Date"];
    const rows = filteredTxns.map((t) => {
      const dateStr = t.date ? new Date(t.date).toLocaleString("en-US") : t.when;
      const formattedAmount = t.amount.toFixed(2);
      
      const escapedName = t.name.replace(/"/g, '""');
      const escapedCat = t.cat.replace(/"/g, '""');

      return [
        `"${escapedName}"`,
        `"${escapedCat}"`,
        formattedAmount,
        t.type,
        `"${dateStr}"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    const monthText = selectedMonth === "all" ? "AllMonths" : monthNames[parseInt(selectedMonth)];
    const dateRangeSuffix = startDate || endDate ? `_custom` : `_${monthText}`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Lumen_Financial_Report${dateRangeSuffix}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel report exported successfully");
  };

  // Filter transactions based on selection
  const filteredTxns = transactions.filter((t) => {
    // Exclude loan transactions (lending, borrowing, and repayments)
    if (
      t.cat === "Lent" ||
      t.cat === "Borrowed" ||
      t.name.startsWith("Repayment from/to")
    ) {
      return false;
    }

    const d = new Date(t.date || t.createdAt);
    
    // Custom date range filter takes precedence if set
    if (startDate || endDate) {
      const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
      const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
      return (!start || d >= start) && (!end || d <= end);
    }

    // Otherwise, apply month filter
    if (selectedMonth === "all") return true;
    const currentYear = new Date().getFullYear();
    return d.getMonth() === parseInt(selectedMonth) && d.getFullYear() === currentYear;
  });

  // Calculate summaries
  const totalIncome = filteredTxns
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpense = filteredTxns
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const avgExpense = filteredTxns.filter(t => t.type === "expense").length > 0
    ? totalExpense / filteredTxns.filter(t => t.type === "expense").length
    : 0;

  // Category distribution for filtered transactions
  const catSpends = {};
  filteredTxns
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      catSpends[t.cat] = (catSpends[t.cat] || 0) + Math.abs(t.amount);
    });

  const categoryBreakdown = Object.keys(catSpends)
    .map((cat) => ({
      name: cat,
      amount: catSpends[cat],
      percentage: totalExpense > 0 ? (catSpends[cat] / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-28 md:pb-12 pt-4">
      {/* ambient backdrop */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl animate-pulse" />

      <div className="relative mx-auto max-w-[1200px] px-6">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Analytics</p> */}
            <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadExcel}
              className="btn-premium-primary gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer flex items-center text-primary-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              Download Excel
            </button>
            <button
              onClick={resetFilters}
              className="btn-premium-secondary gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer flex items-center"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="mt-8 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Filter by Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  // Clear date range when month is selected to prevent conflicts
                  setStartDate("");
                  setEndDate("");
                }}
                className="w-full bg-background text-sm rounded-xl border border-input px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="all">All Months (Current Year)</option>
                {monthNames.map((name, index) => (
                  <option key={index} value={index.toString()}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Custom Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-background text-sm rounded-xl border border-input px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary/50 cursor-pointer text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Custom End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-background text-sm rounded-xl border border-input px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary/50 cursor-pointer text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          {/* Monthly Expenses */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground truncate">
                Total Expenses
              </p>
              <div className="h-9 w-9 rounded-xl grid place-items-center bg-destructive/10 text-destructive shrink-0">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex flex-col justify-end">
              <p className="num text-3xl font-bold text-destructive leading-tight">
                {fmt(totalExpense)}
              </p>
              <span className="text-[10px] text-muted-foreground mt-1.5 truncate">
                From {filteredTxns.filter(t => t.type === "expense").length} debit transactions
              </span>
            </div>
          </div>

          {/* Monthly Income */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground truncate">
                Total Income
              </p>
              <div className="h-9 w-9 rounded-xl grid place-items-center bg-success/10 text-success shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex flex-col justify-end">
              <p className="num text-3xl font-bold text-success leading-tight">
                {fmt(totalIncome)}
              </p>
              <span className="text-[10px] text-muted-foreground mt-1.5 truncate">
                From {filteredTxns.filter(t => t.type === "income").length} credit transactions
              </span>
            </div>
          </div>

          {/* Net Savings */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground truncate">
                Net Savings
              </p>
              <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${netSavings >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex flex-col justify-end">
              <p className={`num text-3xl font-bold leading-tight ${netSavings >= 0 ? "text-success" : "text-destructive"}`}>
                {fmt(netSavings)}
              </p>
              <span className="mt-1.5 shrink-0 w-fit">
                {netSavings >= 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-success bg-success/10 px-1.5 py-0.5 rounded-full font-medium">
                    <ArrowUpRight className="h-3 w-3" /> Net Surplus
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full font-medium">
                    <ArrowDownRight className="h-3 w-3" /> Net Deficit
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Savings Rate */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground truncate">
                Savings Rate
              </p>
              <div className="h-9 w-9 rounded-xl grid place-items-center bg-primary/10 text-primary shrink-0">
                <Percent className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex flex-col justify-end">
              <p className="num text-3xl font-bold leading-tight">
                {savingsRate.toFixed(1)}%
              </p>
              <span className="text-[10px] text-muted-foreground mt-1.5 truncate">
                Percentage of monthly income saved
              </span>
            </div>
          </div>
        </div>

        {/* Main Split Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* List View - Left Column */}
          <div className="lg:col-span-8 rounded-2xl border bg-card shadow-[var(--shadow-card)] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold">Report Transactions</h2>
                <p className="text-xs text-muted-foreground">
                  Complete logs for the selected dates
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/60 text-muted-foreground">
                {filteredTxns.length} Records
              </span>
            </div>

            <ul className="divide-y overflow-y-auto max-h-[500px]">
              {filteredTxns.map((t) => {
                const Icon = categoryIcons[t.cat] || Receipt;
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-accent/40 transition-colors"
                  >
                    <div
                      className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ${t.type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.cat} · {t.when}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`num text-sm font-bold ${t.amount > 0 ? "text-success" : "text-destructive"}`}
                      >
                        {t.amount > 0 ? "+" : ""}
                        {fmt(t.amount)}
                      </p>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full inline-block mt-1.5 uppercase tracking-wide font-semibold ${t.type === "income" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                      >
                        {t.type}
                      </span>
                    </div>
                  </li>
                );
              })}

              {filteredTxns.length === 0 && (
                <li className="px-6 py-20 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
                  <Receipt className="h-12 w-12 text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">No records found</p>
                  <p className="text-xs max-w-[280px]">
                    No transactions fall within the selected date boundaries. Adjust your filters to see entries.
                  </p>
                </li>
              )}
            </ul>
          </div>

          {/* Summaries & Category Breakdown - Right Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Category Breakdown Card */}
            <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold">Category Breakdown</h2>
              <p className="text-xs text-muted-foreground mt-0.5 mb-5">
                Expense distribution by category
              </p>

              {categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {categoryBreakdown.map((c, index) => {
                    const Icon = categoryIcons[c.name] || Receipt;
                    return (
                      <div key={c.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="flex items-center gap-1.5 truncate">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{c.name}</span>
                          </span>
                          <span className="num font-semibold text-muted-foreground shrink-0">
                            {fmt(c.amount)} ({c.percentage.toFixed(0)}%)
                          </span>
                        </div>
                        {/* Custom Progress Bar */}
                        <div className="h-2 w-full bg-accent/40 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${c.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <TrendingDown className="h-8 w-8 text-muted-foreground/40" />
                  <p className="font-medium">No expenses</p>
                  <p className="text-[10px]">No category spends during this period</p>
                </div>
              )}
            </div>

            {/* Financial Health Summary Widget */}
            <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold">Financial Summary</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Key performance stats for this view
              </p>

              <div className="mt-5 space-y-3.5">
                <div className="flex items-center justify-between text-xs py-2 border-b">
                  <span className="text-muted-foreground">Average Expense</span>
                  <span className="num font-semibold text-destructive">{fmt(avgExpense)}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 border-b">
                  <span className="text-muted-foreground">Expense Ratio</span>
                  <span className="num font-semibold">
                    {totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(0) : "0"}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-2">
                  <span className="text-muted-foreground">Total Transactions</span>
                  <span className="num font-semibold">{filteredTxns.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
