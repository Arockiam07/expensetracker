import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, getCurrencyFormatter, convertFromBase } from "../lib/dataStore";
import { GlassTabs } from "../components/ui/glass-tabs";
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  HandCoins,
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
  CheckCircle,
  Calendar,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/loans")({
  head: () => ({
    meta: [
      { title: "Lumen — Loan Tracker" },
      { name: "description", content: "Track money lent to and borrowed from others." },
    ],
  }),
  component: LoansPage,
});

function LoansPage() {
  const loans = useStore((s) => s.getLoans());
  const transactions = useStore((s) => s.getTransactions());
  const settings = useStore((s) => s.getSettings());

  const formatter = getCurrencyFormatter(settings.currency);
  const fmt = (n) => formatter.format(convertFromBase(n, settings.currency));
  const currencySymbol = settings.currency ? settings.currency.split(" — ")[1] || "₹" : "₹";

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedHistoryLoan, setSelectedHistoryLoan] = useState(null);

  // Form states (Add)
  const [formName, setFormName] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("Lent");
  const [formDueDate, setFormDueDate] = useState("");

  // Form states (Pay)
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toLocaleDateString("en-CA"));

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formName || !formAmount) return;

    import("../lib/dataStore").then(({ store }) => {
      store.addLoan({
        name: formName,
        note: formNote,
        amount: formType === "Lent" ? parseFloat(formAmount) : -parseFloat(formAmount),
        type: formType,
        dueDate: formDueDate || null,
      });
    });

    setFormName("");
    setFormNote("");
    setFormAmount("");
    setFormDueDate("");
    setIsAddModalOpen(false);
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    if (!selectedLoan || !payAmount) return;

    import("../lib/dataStore").then(({ store }) => {
      store.payLoan(selectedLoan.id, parseFloat(payAmount), payDate);
    });

    setPayAmount("");
    setPayDate(new Date().toLocaleDateString("en-CA"));
    setIsPayModalOpen(false);
    setSelectedLoan(null);
  };

  const handleDeleteLoan = async (id) => {
    try {
      const { store: s } = await import("../lib/dataStore");
      const toastId = toast.loading("Deleting loan record...");
      await s.deleteLoan(id);
      toast.success("Loan record removed successfully", { id: toastId });
    } catch (err) {
      toast.error("Failed to delete loan record");
    }
  };

  // Compute metrics
  const totalLent = loans
    .filter((l) => l.type === "Lent")
    .reduce((sum, l) => sum + (l.amount - l.paid), 0);
  const totalBorrowed = loans
    .filter((l) => l.type === "Borrowed")
    .reduce((sum, l) => sum + (Math.abs(l.amount) - l.paid), 0);
  const netBalance = totalLent - totalBorrowed;

  // Filter list
  const filteredLoans = loans.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.note.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" ? true : l.type === typeFilter;
    const matchesStatus = statusFilter === "all" ? true : l.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden pb-28 md:pb-12 pt-4">
      {/* ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 [background:var(--gradient-radial-brand)]" />

      <div className="relative mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Overview</p> */}
            <h1 className="text-3xl font-bold tracking-tight">Loan Tracking</h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl text-primary-foreground px-5 py-3 text-sm font-semibold transition-transform hover:scale-102 active:scale-98 cursor-pointer shadow-[0_4px_20px_-4px_var(--color-primary)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="h-4.5 w-4.5" />
            Add Loan Record
          </button>
        </div>

        {/* Summaries Row */}
        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-6">
          <div className="relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-1.5 xs:flex-row xs:items-start xs:justify-between">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Net Loan Balance
              </p>
              <div className="h-6 w-6 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl grid place-items-center bg-accent shrink-0">
                <HandCoins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
            </div>
            <div className="mt-4 sm:mt-5 flex flex-col items-start gap-1.5 xs:flex-row xs:items-end xs:justify-between">
              <p
                className={`num text-base sm:text-2xl lg:text-3xl font-bold leading-none ${netBalance >= 0 ? "text-success" : "text-foreground"}`}
              >
                {fmt(netBalance)}
              </p>
              <span
                className={`inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] font-medium rounded-full px-1.5 py-0.5 sm:px-2 sm:py-0.5 shrink-0 w-fit ${netBalance >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
              >
                {netBalance >= 0 ? (
                  <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                )}
                {netBalance >= 0 ? "Net Lent" : "Net Debt"}
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-1.5 xs:flex-row xs:items-start xs:justify-between">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Owed to Me (Lent)
              </p>
              <div className="h-6 w-6 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl grid place-items-center bg-success/10 text-success shrink-0">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-4 sm:mt-5 flex flex-col items-start gap-1.5 xs:flex-row xs:items-end xs:justify-between">
              <p className="num text-base sm:text-2xl lg:text-3xl font-bold leading-none text-success">{fmt(totalLent)}</p>
              <span className="text-[9px] sm:text-[11px] text-muted-foreground shrink-0 leading-none">Outstanding assets</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-card p-3 sm:p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-1.5 xs:flex-row xs:items-start xs:justify-between">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Owed to Others (Borrowed)
              </p>
              <div className="h-6 w-6 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl grid place-items-center bg-destructive/10 text-destructive shrink-0">
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
            <div className="mt-4 sm:mt-5 flex flex-col items-start gap-1.5 xs:flex-row xs:items-end xs:justify-between">
              <p className="num text-base sm:text-2xl lg:text-3xl font-bold leading-none">{fmt(totalBorrowed)}</p>
              <span className="text-[9px] sm:text-[11px] text-muted-foreground shrink-0 leading-none">Outstanding liabilities</span>
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
                placeholder="Search borrower, notes..."
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
                  { key: "Lent", label: "Lent" },
                  { key: "Borrowed", label: "Borrowed" },
                ]}
              />

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background text-sm rounded-xl border border-input px-3 py-2 text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loans List */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLoans.map((l) => {
            const isLent = l.type === "Lent";
            const principal = Math.abs(l.amount);
            const remaining = principal - l.paid;
            const progress = (l.paid / principal) * 100;

            return (
              <div
                key={l.id}
                onClick={() => {
                  setSelectedHistoryLoan(l);
                  setIsHistoryModalOpen(true);
                }}
                className="relative rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] flex flex-col justify-between cursor-pointer hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted font-bold text-xs flex items-center justify-center border text-muted-foreground uppercase">
                        {l.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{l.name}</h3>
                        <p className="text-xs text-muted-foreground">{l.note}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full inline-block uppercase tracking-wider font-semibold ${
                          l.status === "Paid"
                            ? "bg-success/15 text-success"
                            : l.status === "Overdue"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-primary/15 text-primary"
                        }`}
                      >
                        {l.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLoan(l.id);
                        }}
                        title="Delete loan record"
                        className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                        Principal
                      </p>
                      <p className="num text-sm font-semibold mt-0.5">{fmt(principal)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                        Paid
                      </p>
                      <p className="num text-sm font-semibold text-success mt-0.5">{fmt(l.paid)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                        Remaining
                      </p>
                      <p
                        className={`num text-sm font-semibold mt-0.5 ${remaining > 0 ? (isLent ? "text-success" : "text-foreground") : "text-muted-foreground"}`}
                      >
                        {fmt(remaining)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Repayment progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isLent ? "bg-success" : "bg-primary"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Due: {l.dueDate}</span>
                  </div>

                  {l.status !== "Paid" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLoan(l);
                        setPayDate(new Date().toLocaleDateString("en-CA"));
                        setIsPayModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-background hover:bg-accent px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      Record Payment
                    </button>
                  )}
                  {l.status === "Paid" && (
                    <div className="flex items-center gap-1 text-xs text-success font-semibold">
                      <CheckCircle className="h-4 w-4" /> Fully Paid
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredLoans.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-2 bg-card rounded-2xl border">
              <HandCoins className="h-10 w-10 text-muted-foreground/60" />
              <p className="font-semibold">No loans match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Loan Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold tracking-tight">Add Loan Record</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track money lent to or borrowed from someone
            </p>

            <form onSubmit={handleAddSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Record Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="Lent">I Lent Money (Asset)</option>
                    <option value="Borrowed">I Borrowed Money (Liability)</option>
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

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Person Name
                </label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Alex Romero, Maya Kuo"
                  required
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Description/Notes
                </label>
                <input
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="e.g. Concert tickets, Rent share"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer text-muted-foreground"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Save Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPayModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsPayModalOpen(false);
                setSelectedLoan(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold tracking-tight">Record Payment</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record a payment for <strong>{selectedLoan.name}</strong> ({selectedLoan.note})
            </p>

            <form onSubmit={handlePaySubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Payment Amount ({currencySymbol}) — Remaining:{" "}
                  {fmt(Math.abs(selectedLoan.amount) - selectedLoan.paid)}
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  min="0.01"
                  max={convertFromBase(
                    Math.abs(selectedLoan.amount) - selectedLoan.paid,
                    settings.currency,
                  )}
                  step="any"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer text-muted-foreground"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPayModalOpen(false);
                    setSelectedLoan(null);
                  }}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl text-primary-foreground px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {isHistoryModalOpen && selectedHistoryLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsHistoryModalOpen(false);
                setSelectedHistoryLoan(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-accent cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold tracking-tight">Payment History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              History for <strong>{selectedHistoryLoan.name}</strong> ({selectedHistoryLoan.note || "No notes"})
            </p>

            {/* Loan stats block inside modal */}
            <div className="mt-4 p-4 rounded-xl bg-accent/30 border text-xs grid grid-cols-3 gap-2">
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Principal</p>
                <p className="num font-semibold mt-0.5">{fmt(Math.abs(selectedHistoryLoan.amount))}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Paid</p>
                <p className="num font-semibold text-success mt-0.5">{fmt(selectedHistoryLoan.paid)}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wider">Remaining</p>
                <p className="num font-semibold mt-0.5 text-primary">
                  {fmt(Math.abs(selectedHistoryLoan.amount) - selectedHistoryLoan.paid)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Repayments List
              </p>
              
              <div className="max-h-[240px] overflow-y-auto pr-1 space-y-3">
                {transactions
                  .filter((t) => t.name === `Repayment from/to ${selectedHistoryLoan.name}`)
                  .sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first
                  .map((t, idx) => {
                    const isLent = selectedHistoryLoan.type === "Lent";
                    return (
                      <div key={t.id || idx} className="flex items-center justify-between p-3 rounded-xl border bg-background/50 hover:bg-accent/20 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${isLent ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                            {isLent ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{isLent ? "Payment Received" : "Payment Made"}</p>
                            <p className="text-[10px] text-muted-foreground">{t.when}</p>
                          </div>
                        </div>
                        <p className={`num text-xs font-bold ${isLent ? "text-success" : "text-destructive"}`}>
                          {isLent ? "+" : "-"}{fmt(Math.abs(t.amount))}
                        </p>
                      </div>
                    );
                  })}

                {transactions.filter((t) => t.name === `Repayment from/to ${selectedHistoryLoan.name}`).length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2 bg-background/40 border border-dashed rounded-xl">
                    <Calendar className="h-8 w-8 text-muted-foreground/35" />
                    <p className="font-semibold text-foreground/80">No payments logged</p>
                    <p className="text-[10px] max-w-[200px]">Use "Record Payment" to log repayments for this loan.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  setSelectedHistoryLoan(null);
                }}
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
