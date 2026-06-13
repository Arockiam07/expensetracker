import { useEffect, useState } from "react";
import { api } from "./api";

// Default seed settings
const defaultSettings = {
  theme: typeof window !== "undefined" ? localStorage.getItem("lumen_theme") || "system" : "system",
  language: "English (US)",
  currency: "INR — ₹",
  accountStatus: "Secured",
  notifications: true,
  dataSharing: true,
  encryption: false,
};

export const EXCHANGE_RATES = {
  INR: 1.0,
  USD: 0.012, // 1 INR = 0.012 USD
  EUR: 0.011, // 1 INR = 0.011 EUR
  GBP: 0.0095, // 1 INR = 0.0095 GBP
};

export const getCurrencyCode = (currencySetting) => {
  if (currencySetting) {
    if (currencySetting.includes("USD") || currencySetting.includes("$")) return "USD";
    if (currencySetting.includes("EUR") || currencySetting.includes("€")) return "EUR";
    if (currencySetting.includes("GBP") || currencySetting.includes("£")) return "GBP";
  }
  return "INR";
};

export const convertFromBase = (amount, currencySetting) => {
  const code = getCurrencyCode(currencySetting);
  const rate = EXCHANGE_RATES[code] || 1;
  return amount * rate;
};

export const convertToBase = (amount, currencySetting) => {
  const code = getCurrencyCode(currencySetting);
  const rate = EXCHANGE_RATES[code] || 1;
  return amount / rate;
};

export const getCurrencyFormatter = (currencySetting) => {
  let currencyCode = "INR";
  let locale = "en-IN";

  if (currencySetting) {
    if (currencySetting.includes("USD") || currencySetting.includes("$")) {
      currencyCode = "USD";
      locale = "en-US";
    } else if (currencySetting.includes("EUR") || currencySetting.includes("€")) {
      currencyCode = "EUR";
      locale = "de-DE";
    } else if (currencySetting.includes("GBP") || currencySetting.includes("£")) {
      currencyCode = "GBP";
      locale = "en-GB";
    }
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  });
};

// Date formatter helper
export const formatTransactionDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  
  if (date.toDateString() === now.toDateString()) {
    return `Today · ${timeStr}`;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday · ${timeStr}`;
  }
  
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${month} ${day} · ${timeStr}`;
};

// Compute monthly statistics over the last 7 months based on transactions
export const computeMonthlyData = (transactions) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  
  const last7Months = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last7Months.push({
      m: months[d.getMonth()],
      year: d.getFullYear(),
      monthNum: d.getMonth(),
      income: 0,
      expense: 0
    });
  }
  
  transactions.forEach((t) => {
    if (t.cat === "Lent" || t.cat === "Borrowed" || t.name.startsWith("Repayment from/to")) return;

    const tDate = new Date(t.date || t.createdAt);
    const tMonth = tDate.getMonth();
    const tYear = tDate.getFullYear();
    
    const monthObj = last7Months.find(m => m.monthNum === tMonth && m.year === tYear);
    if (monthObj) {
      if (t.type === "income") {
        monthObj.income += Math.abs(t.amount);
      } else {
        monthObj.expense += Math.abs(t.amount);
      }
    }
  });
  
  return last7Months.map(({ m, income, expense }) => ({ m, income, expense }));
};

// Pub-sub listeners
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

// Check if token exists synchronously to guess login state
const initialToken = typeof window !== "undefined" ? localStorage.getItem("lumen_token") : null;

// Internal cache state
const state = {
  user: null,
  transactions: [],
  loans: [],
  settings: defaultSettings,
  monthly: [],
  isLoggedIn: !!initialToken,
  isLoading: false,
};

export const store = {
  syncWithBackend: async () => {
    if (typeof window === "undefined") return;
    if (!api.getToken()) {
      state.isLoggedIn = false;
      state.user = null;
      notify();
      return;
    }
    
    state.isLoading = true;
    notify();
    
    try {
      const user = await api.auth.getMe();
      const transactions = await api.transactions.getAll();
      const loans = await api.loans.getAll();
      const settings = await api.settings.get();
      
      state.user = user;
      state.transactions = transactions;
      state.loans = loans;
      state.settings = settings;
      if (settings?.theme) {
        localStorage.setItem("lumen_theme", settings.theme);
      }
      state.isLoggedIn = true;
      state.monthly = computeMonthlyData(transactions);
    } catch (err) {
      console.error("Failed to sync with backend:", err);
      // Only log out if the backend explicitly rejects the credentials (401 Unauthorized or 403 Forbidden).
      // Network disconnects, server restarts, or internal server errors should not clear the user session.
      if (err.status === 401 || err.status === 403) {
        api.clearToken();
        state.isLoggedIn = false;
        state.user = null;
        state.transactions = [];
        state.loans = [];
        state.settings = defaultSettings;
        state.monthly = [];
      }
    } finally {
      state.isLoading = false;
      notify();
    }
  },

  getUser: () => state.user,

  updateProfile: async (profileData) => {
    try {
      const updatedUser = await api.auth.updateProfile(profileData);
      state.user = {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      };
      notify();
      return updatedUser;
    } catch (err) {
      console.error("Failed to update profile:", err);
      throw err;
    }
  },

  getTransactions: () => {
    return state.transactions.map((t) => ({
      ...t,
      id: t._id,
      when: formatTransactionDate(t.date),
    }));
  },
  
  setTransactions: (txns) => {
    state.transactions = txns;
    state.monthly = computeMonthlyData(txns);
    notify();
  },

  addTransaction: async (txn) => {
    try {
      const settings = store.getSettings();
      const baseAmount = convertToBase(txn.amount, settings.currency);
      const signedAmount = txn.type === "expense" ? -Math.abs(baseAmount) : Math.abs(baseAmount);
      
      const newTxn = await api.transactions.create({
        name: txn.name,
        cat: txn.cat,
        amount: signedAmount,
        type: txn.type,
        date: txn.date || new Date(),
      });
      
      state.transactions = [newTxn, ...state.transactions];
      state.monthly = computeMonthlyData(state.transactions);
      notify();
      return newTxn;
    } catch (err) {
      console.error("Failed to add transaction:", err);
      throw err;
    }
  },

  deleteTransaction: async (id) => {
    try {
      await api.transactions.delete(id);
      state.transactions = state.transactions.filter((t) => (t._id || t.id) !== id);
      state.monthly = computeMonthlyData(state.transactions);
      notify();
    } catch (err) {
      console.error("Failed to delete transaction:", err);
      throw err;
    }
  },

  getLoans: () => {
    return state.loans.map((l) => ({
      ...l,
      id: l._id,
      dueDate: l.dueDate ? new Date(l.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) : "No due date",
    }));
  },
  
  setLoans: (loans) => {
    state.loans = loans;
    notify();
  },

  addLoan: async (loan) => {
    try {
      const settings = store.getSettings();
      const baseAmount = convertToBase(loan.amount, settings.currency);
      const signedAmount = loan.type === "Lent" ? Math.abs(baseAmount) : -Math.abs(baseAmount);
      
      const newLoan = await api.loans.create({
        name: loan.name,
        note: loan.note,
        amount: signedAmount,
        type: loan.type,
        dueDate: loan.dueDate ? new Date(loan.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      
      state.loans = [newLoan, ...state.loans];
      notify();
      
      // Sync transactions since the backend automatically created one
      const transactions = await api.transactions.getAll();
      state.transactions = transactions;
      state.monthly = computeMonthlyData(transactions);
      notify();
      return newLoan;
    } catch (err) {
      console.error("Failed to add loan:", err);
      throw err;
    }
  },

  payLoan: async (loanId, amount, date) => {
    try {
      const settings = store.getSettings();
      const baseAmount = convertToBase(amount, settings.currency);
      
      const updatedLoan = await api.loans.pay(loanId, baseAmount, date);
      
      state.loans = state.loans.map((l) => (l._id === loanId ? updatedLoan : l));
      notify();
      
      // Refetch transactions to get the repayment log
      const transactions = await api.transactions.getAll();
      state.transactions = transactions;
      state.monthly = computeMonthlyData(transactions);
      notify();
    } catch (err) {
      console.error("Failed to pay loan:", err);
      throw err;
    }
  },

  deleteLoan: async (id) => {
    try {
      await api.loans.delete(id);
      state.loans = state.loans.filter((l) => (l._id || l.id) !== id);
      
      // Refetch transactions to sync deleted transactions (initial loan and repayments)
      const transactions = await api.transactions.getAll();
      state.transactions = transactions;
      state.monthly = computeMonthlyData(transactions);
      
      notify();
    } catch (err) {
      console.error("Failed to delete loan:", err);
      throw err;
    }
  },

  getSettings: () => state.settings,
  
  setSettings: async (settingsData) => {
    try {
      const updated = await api.settings.update(settingsData);
      state.settings = updated;
      if (updated?.theme) {
        localStorage.setItem("lumen_theme", updated.theme);
      }
      notify();
    } catch (err) {
      console.error("Failed to update settings:", err);
      throw err;
    }
  },

  getMonthly: () => {
    return state.monthly.length > 0 ? state.monthly : computeMonthlyData(state.transactions);
  },
  
  setMonthly: (monthly) => {
    state.monthly = monthly;
    notify();
  },

  isLoggedIn: () => state.isLoggedIn,
  
  setLoggedIn: (val) => {
    state.isLoggedIn = val;
    if (!val) {
      api.clearToken();
      state.user = null;
      state.transactions = [];
      state.loans = [];
      state.settings = defaultSettings;
      state.monthly = [];
    }
    notify();
  },

  clearAllData: async () => {
    try {
      const txns = [...state.transactions];
      const lnList = [...state.loans];

      for (const t of txns) {
        await api.transactions.delete(t._id || t.id);
      }
      for (const l of lnList) {
        await api.loans.delete(l._id || l.id);
      }

      state.transactions = [];
      state.loans = [];
      state.monthly = [];
      notify();
    } catch (err) {
      console.error("Failed to clear data on server:", err);
    }
  },

  subscribe: (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

// React Hook to use the store reactively
export function useStore(selector) {
  const [value, setValue] = useState(() => selector(store));

  useEffect(() => {
    const handleUpdate = () => {
      setValue(selector(store));
    };
    return store.subscribe(handleUpdate);
  }, [selector]);

  return value;
}

// Automatically sync on load if we have a token
if (typeof window !== "undefined" && initialToken) {
  store.syncWithBackend();
}
