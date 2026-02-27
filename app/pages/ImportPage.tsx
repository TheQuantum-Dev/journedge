"use client";
import ImportCSV from "../components/ImportCSV";
import { useApp } from "../context/AppContext";
import { Trade } from "../lib/types";

export default function ImportPage() {
  const { activeAccount, reloadTrades, setActivePage } = useApp();

  const handleImport = async (imported: Trade[]) => {
    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trades: imported,
        accountId: activeAccount?.id || null,
      }),
    });

    if (res.ok) {
      await reloadTrades();
      setActivePage("dashboard");
    }
  };

  return (
    <>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{
          fontSize: "26px", fontWeight: "700",
          color: "var(--text-primary)", letterSpacing: "-0.5px",
        }}>
          Import Trades
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>
          {activeAccount
            ? `Importing into: ${activeAccount.name} (${activeAccount.broker})`
            : "No account selected — trades will be unlinked"}
        </p>
      </div>
      <ImportCSV onImport={handleImport} />
    </>
  );
}