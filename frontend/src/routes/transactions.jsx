import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, store, getCurrencyFormatter, convertFromBase } from "../lib/dataStore";
import { GlassTabs } from "../components/ui/glass-tabs";
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Coffee,
  ShoppingBag,
  Car,
  Home as HomeIcon,
  Utensils,
  Plane,
  HandCoins,
  Receipt,
  X,
  Calendar,
  Trash2,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Lumen — Transactions Ledger" },
      { name: "description", content: "View and filter your complete transaction history." },
    ],
  }),
  component: TransactionsPage,
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

function TransactionsPage() {
  const transactions = useStore((s) => s.getTransactions());
  const settings = useStore((s) => s.getSettings());

  const formatter = getCurrencyFormatter(settings.currency);
  const fmt = (n) => formatter.format(convertFromBase(n, settings.currency));
  const currencySymbol = settings.currency ? settings.currency.split(" — ")[1] || "₹" : "₹";
  const addTransaction = async (t) => {
    const txnDate = t.date ? new Date(`${t.date}T${t.time || "12:00"}`) : new Date();
    const toastId = toast.loading("Adding transaction...");
    try {
      await store.addTransaction({
        name: t.name,
        cat: t.cat,
        amount: parseFloat(t.amount),
        type: t.type,
        date: txnDate,
      });
      toast.success("Transaction added successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to add transaction", { id: toastId });
    }
  };

  const handleDeleteTransaction = async (id) => {
    const toastId = toast.loading("Deleting transaction...");
    try {
      await store.deleteTransaction(id);
      toast.success("Transaction removed successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to delete transaction", { id: toastId });
    }
  };

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCat, setFormCat] = useState("Food & Dining");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("expense");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formName || !formAmount) return;
    addTransaction({
      name: formName,
      cat: formCat,
      amount: parseFloat(formAmount),
      type: formType,
      date: formDate,
      time: formTime,
    });
    setFormName("");
    setFormAmount("");
    setFormDate("");
    setFormTime("");
    setIsModalOpen(false);
  };

  // Compute stats
  const totalIncome = transactions
    .filter((t) => t.type === "income" && t.cat !== "Lent" && t.cat !== "Borrowed" && !t.name.startsWith("Repayment from/to"))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense" && t.cat !== "Lent" && t.cat !== "Borrowed" && !t.name.startsWith("Repayment from/to"))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netSavings = totalIncome - totalExpense;

  // Filter lists
  const filteredTxns = transactions.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.cat.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" ? true : t.type === typeFilter;
    const matchesCategory = catFilter === "all" ? true : t.cat === catFilter;

    let matchesDate = true;
    if (dateFilter === "today") {
      matchesDate = t.when.startsWith("Today");
    } else if (dateFilter === "yesterday") {
      matchesDate = t.when.startsWith("Yesterday");
    } else if (dateFilter === "this_month") {
      if (t.date) {
        const d = new Date(t.date);
        const now = new Date();
        matchesDate = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      } else {
        matchesDate = t.when.startsWith("Today") || t.when.startsWith("Yesterday") || t.when.includes(new Date().toLocaleDateString("en-US", { month: "short" }));
      }
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-28 md:pb-12 pt-4">
      {/* ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 [background:var(--gradient-radial-brand)]" />

      <div className="relative mx-auto max-w-[1200px] px-6">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Ledger</p> */}
            <h1 className="text-3xl font-bold tracking-tight">Transactions </h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-premium-primary gap-2 rounded-xl px-5 py-3 text-sm font-semibold cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Transaction
          </button>
        </div>

        {/* Summaries Row */}
        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-6">
          <div className="relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-1.5 xs:flex-row xs:items-start xs:justify-between">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Net Cash Flow
              </p>
              <div className="h-6 w-6 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl grid place-items-center bg-accent shrink-0">
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
            </div>
            <div className="mt-4 sm:mt-5 flex flex-col items-start gap-1.5 xs:flex-row xs:items-end xs:justify-between">
              <p
                className={`num text-base sm:text-2xl lg:text-3xl font-bold leading-none ${netSavings >= 0 ? "text-success" : "text-foreground"}`}
              >
                {fmt(netSavings)}
              </p>
              <span
                className={`inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] font-medium rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 shrink-0 w-fit ${netSavings >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
              >
                {netSavings >= 0 ? (
                  <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                )}
                {netSavings >= 0 ? "Surplus" : "Deficit"}
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-1.5 xs:flex-row xs:items-start xs:justify-between">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Income</p>
              <div className="h-6 w-6 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl grid place-items-center bg-success/10 text-success shrink-0">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-4 sm:mt-5 flex flex-col items-start gap-1.5 xs:flex-row xs:items-end xs:justify-between">
              <p className="num text-base sm:text-2xl lg:text-3xl font-bold leading-none text-success">{fmt(totalIncome)}</p>
              <span className="text-[9px] sm:text-[11px] text-muted-foreground shrink-0 leading-none">Total credits</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-1.5 xs:flex-row xs:items-start xs:justify-between">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Total Expenses
              </p>
              <div className="h-6 w-6 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl grid place-items-center bg-destructive/10 text-destructive shrink-0">
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-4 sm:mt-5 flex flex-col items-start gap-1.5 xs:flex-row xs:items-end xs:justify-between">
              <p className="num text-base sm:text-2xl lg:text-3xl font-bold leading-none">{fmt(totalExpense)}</p>
              <span className="text-[9px] sm:text-[11px] text-muted-foreground shrink-0 leading-none">Total debits</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="mt-8 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex items-center gap-2.5 rounded-xl border bg-background/60 px-4 py-2.5 w-full md:w-[320px] focus-within:border-primary/50 transition-colors">
              <Search className="h-4.5 w-4.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, category..."
                className="bg-transparent flex-1 text-sm focus:outline-none placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full md:w-auto">
              <GlassTabs
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { key: "all", label: "All" },
                  { key: "income", label: "Income" },
                  { key: "expense", label: "Expense" },
                ]}
              />

              {/* Category Filter */}
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="bg-background text-sm rounded-xl border border-input px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="all">All Categories</option>
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

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-background text-sm rounded-xl border border-input px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="mt-6 rounded-2xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <ul className="divide-y">
            {filteredTxns.map((t) => {
              const Icon = categoryIcons[t.cat] || Receipt;
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-accent/40 transition-colors"
                >
                  <div
                    className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ${
                      t.cat === "Lent" || t.cat === "Borrowed" || t.name.startsWith("Repayment from/to")
                        ? "bg-primary/10 text-primary"
                        : t.type === "income"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.cat} · {t.when}
                    </p>
                  </div>
                   <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p
                        className={`num text-sm font-bold ${t.amount > 0 ? "text-success" : "text-destructive"}`}
                      >
                        {t.amount > 0 ? "+" : ""}
                        {fmt(t.amount)}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase tracking-wide font-semibold ${
                          t.name.startsWith("Repayment from/to")
                            ? "bg-primary/15 text-primary"
                            : t.cat === "Lent" || t.cat === "Borrowed"
                              ? "bg-indigo-500/15 text-indigo-400"
                              : t.type === "income"
                                ? "bg-success/15 text-success"
                                : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {t.name.startsWith("Repayment from/to")
                          ? "Repayment"
                          : t.cat === "Lent" || t.cat === "Borrowed"
                            ? t.cat
                            : t.type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTransaction(t.id)}
                      title="Delete transaction"
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}

            {filteredTxns.length === 0 && (
              <li className="px-6 py-16 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Receipt className="h-10 w-10 text-muted-foreground/60" />
                <p className="font-semibold">No transactions found</p>
                <p className="text-xs">Try adjusting your filters or search query.</p>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Add Transaction Modal */}
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
