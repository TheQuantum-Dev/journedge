"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
} from "recharts";
import { Trade } from "../lib/parseFidelityCSV";
import { TrendingUp, TrendingDown, Target, Zap, Award, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";

interface Props {
  trades: Trade[];
}

export default function Analytics({ trades }: Props) {
  if (trades.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "12px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text-primary)" }}>Analytics</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Import some trades to see your analytics!</p>
      </div>
    );
  }

  // Equity curve data
  const { activeAccount } = useApp();
  const initialBalance = activeAccount?.initialBalance || 0;

  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let running = initialBalance;
  const equityCurve = sorted.map((t) => {
    running += t.pnl;
    return {
      date: t.date,
      equity: parseFloat(running.toFixed(2)),
      pnl: t.pnl,
    };
  });

  // Core stats
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.status === "win");
  const losses = trades.filter((t) => t.status === "loss");
  const winRate = Math.round((wins.length / trades.length) * 100);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
  const bestTrade = trades.reduce((best, t) => t.pnl > best.pnl ? t : best, trades[0]);
  const worstTrade = trades.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, trades[0]);

  // P&L by symbol
  const bySymbol: Record<string, number> = {};
  for (const t of trades) {
    bySymbol[t.underlying] = (bySymbol[t.underlying] || 0) + t.pnl;
  }
  const symbolData = Object.entries(bySymbol)
    .map(([symbol, pnl]) => ({ symbol, pnl: parseFloat(pnl.toFixed(2)) }))
    .sort((a, b) => b.pnl - a.pnl);

  // P&L by tag
  const byTag: Record<string, { pnl: number; count: number }> = {};
  for (const t of trades) {
    const tags = typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags || [];
    for (const tag of tags) {
      if (!byTag[tag]) byTag[tag] = { pnl: 0, count: 0 };
      byTag[tag].pnl += t.pnl;
      byTag[tag].count += 1;
    }
  }
  const tagData = Object.entries(byTag)
    .map(([tag, { pnl, count }]) => ({ tag, pnl: parseFloat(pnl.toFixed(2)), count }))
    .sort((a, b) => b.pnl - a.pnl);

  // Win/Loss pie
  const pieData = [
    { name: "Wins", value: wins.length },
    { name: "Losses", value: losses.length },
  ];

  const statCards = [
    { label: "Total P&L", value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, positive: totalPnl >= 0, icon: TrendingUp },
    { label: "Win Rate", value: `${winRate}%`, positive: winRate >= 50, icon: Target },
    { label: "Profit Factor", value: profitFactor.toFixed(2), positive: profitFactor >= 1, icon: Zap },
    { label: "Avg Win", value: `$${avgWin.toFixed(2)}`, positive: true, icon: Award },
    { label: "Avg Loss", value: `$${avgLoss.toFixed(2)}`, positive: false, icon: TrendingDown },
    { label: "Total Trades", value: String(trades.length), positive: true, icon: Clock },
  ];

  const tooltipStyle = {
    background: "#16161f",
    border: "1px solid #2a2a3a",
    borderRadius: "8px",
    color: "#f0f0ff",
    fontSize: "12px",
  };

  const tooltipLabelStyle = { color: "#f0f0ff", fontWeight: "600" as const };
  const tooltipItemStyle = { color: "#00e57a" };
  const axisStyle = { fontSize: 11, fill: "#8888aa" };
  const cursorStyle = { fill: "rgba(255, 255, 255, 0.04)" };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: "700", color: "#f0f0ff", letterSpacing: "-0.5px" }}>
          Analytics
        </h2>
        <p style={{ color: "#8888aa", fontSize: "14px", marginTop: "4px" }}>
          Deep dive into your trading performance
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {statCards.map(({ label, value, positive, icon: Icon }) => (
          <div key={label} style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: "#8888aa", fontWeight: "600" }}>{label}</span>
              <Icon size={14} color={positive ? "#00e57a" : "#ff4d6a"} />
            </div>
            <div style={{
              fontSize: "18px", fontWeight: "700", fontFamily: "'Syne', sans-serif",
              color: positive ? "#00e57a" : "#ff4d6a",
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Equity Curve */}
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "16px", padding: "24px", marginBottom: "24px",
      }}>
        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f0f0ff", marginBottom: "4px" }}>
          Equity Curve
        </h3>
        <p style={{ fontSize: "12px", color: "#8888aa", marginBottom: "20px" }}>
          Cumulative P&L — full account balance tracking will be added (hopefully) with the Accounts feature
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={equityCurve}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
            <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={{ color: "#00e57a" }}
              cursor={{ stroke: "#2a2a3a", strokeWidth: 1 }}
            />
            <Line
              type="monotone" dataKey="equity" stroke="#00e57a"
              strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#00e57a" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two column row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>

        {/* P&L by Symbol */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "24px",
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f0f0ff", marginBottom: "20px" }}>
            P&L by Symbol
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={symbolData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
              <XAxis dataKey="symbol" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={cursorStyle}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} background={{ fill: "transparent" }}>
                {symbolData.map((entry) => (
                  <Cell key={entry.symbol} fill={entry.pnl >= 0 ? "#00e57a" : "#ff4d6a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win/Loss Breakdown */}
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "24px",
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f0f0ff", marginBottom: "20px" }}>
            Win / Loss Breakdown
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  <Cell fill="#00e57a" />
                  <Cell fill="#ff4d6a" />
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={{ color: "#f0f0ff" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#8888aa", marginBottom: "4px" }}>Wins</div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#00e57a" }}>{wins.length}</div>
                <div style={{ fontSize: "11px", color: "#8888aa" }}>Avg +${avgWin.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#8888aa", marginBottom: "4px" }}>Losses</div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#ff4d6a" }}>{losses.length}</div>
                <div style={{ fontSize: "11px", color: "#8888aa" }}>Avg -${avgLoss.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best & Worst Trades */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {[
          { label: "Best Trade", trade: bestTrade, positive: true },
          { label: "Worst Trade", trade: worstTrade, positive: false },
        ].map(({ label, trade, positive }) => (
          <div key={label} style={{
            background: "var(--bg-card)", border: `1px solid ${positive ? "#00e57a" : "#ff4d6a"}`,
            borderRadius: "16px", padding: "20px",
          }}>
            <div style={{ fontSize: "12px", color: "#8888aa", marginBottom: "8px", fontWeight: "600" }}>{label}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#f0f0ff" }}>{trade.underlying}</div>
                <div style={{ fontSize: "12px", color: "#8888aa", marginTop: "2px" }}>{trade.date}</div>
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: positive ? "#00e57a" : "#ff4d6a" }}>
                {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* P&L by Tag */}
      {tagData.length > 0 && (
        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "16px", padding: "24px", marginBottom: "24px",
        }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f0f0ff", marginBottom: "20px" }}>
            P&L by Tag
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tagData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
              <XAxis dataKey="tag" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={tooltipLabelStyle}
                itemStyle={tooltipItemStyle}
                cursor={cursorStyle}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]} background={{ fill: "transparent" }}>
                {tagData.map((entry) => (
                  <Cell key={entry.tag} fill={entry.pnl >= 0 ? "#00e57a" : "#ff4d6a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}