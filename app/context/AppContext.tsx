"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Trade, Account, PageId } from "../lib/types";

interface AppContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  trades: Trade[];
  allTrades: Trade[];
  setTrades: (trades: Trade[]) => void;
  reloadTrades: () => Promise<void>;
  selectedTrade: Trade | null;
  setSelectedTrade: (trade: Trade | null) => void;
  loading: boolean;
  accounts: Account[];
  activeAccount: Account | null;
  setActiveAccount: (account: Account) => void;
  addAccount: (account: Account) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function parseTrades(data: Trade[]): Trade[] {
  return data.map((t: Trade) => ({
    ...t,
    tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags || [],
    imageUrls: typeof t.imageUrls === "string" ? JSON.parse(t.imageUrls) : t.imageUrls || [],
  }));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccountState] = useState<Account | null>(null);

  // Trades filtered by active account
  const trades = activeAccount
    ? allTrades.filter((t) => t.accountId === activeAccount.id)
    : allTrades;

  const reloadTrades = async () => {
    try {
      const res = await fetch("/api/trades");
      const data = await res.json();
      if (Array.isArray(data)) setAllTrades(parseTrades(data));
    } catch (err) {
      console.error("Failed to load trades:", err);
    }
  };

  // Load trades on mount
  useEffect(() => {
    const load = async () => {
      await reloadTrades();
      setLoading(false);
    };
    load();
  }, []);

  // Load accounts on mount
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetch("/api/accounts");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAccounts(data);
          setActiveAccountState(data[0]);
        }
      } catch (err) {
        console.error("Failed to load accounts:", err);
      }
    };
    loadAccounts();
  }, []);

  const setTrades = (newTrades: Trade[]) => setAllTrades(newTrades);

  const setActiveAccount = (account: Account) => {
    setActiveAccountState(account);
  };

  const addAccount = (account: Account) => {
    setAccounts((prev) => [...prev, account]);
    if (!activeAccount) setActiveAccountState(account);
  };

  return (
    <AppContext.Provider value={{
      activePage, setActivePage,
      trades, allTrades, setTrades, reloadTrades,
      selectedTrade, setSelectedTrade,
      loading,
      accounts, activeAccount, setActiveAccount, addAccount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}