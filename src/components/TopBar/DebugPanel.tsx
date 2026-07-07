"use client";
import { useState, useEffect } from "react";
import { Icon } from "@/components/Shared/Icons";
import type { DebugLogRecord, DebugLogsResponse } from "@/app/api/debug/logs/route";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterRoute, setFilterRoute] = useState<string>("");
  const [filterReason, setFilterReason] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const fetchLogs = async (newOffset = 0) => {
    setLoading(true);
    try {
      const res = await fetch("/api/debug/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: 50,
          offset: newOffset,
          filterRoute: filterRoute || undefined,
          filterReason: filterReason || undefined,
        }),
      });
      const data = (await res.json()) as DebugLogsResponse;
      setLogs(data.logs || []);
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);
      setLastRefresh(data.refreshedAt);
      setOffset(newOffset);
    } catch (err) {
      console.error("[DebugPanel] fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setOffset(0);
    fetchLogs(0);
  }, [filterRoute, filterReason]);

  useEffect(() => {
    if (!autoRefresh || !isOpen) return;
    const interval = setInterval(() => {
      fetchLogs(0);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, isOpen]);

  const downloadCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "Route", "Reason", "Status", "Message", "Retry Count"];
    const rows = logs.map((log) => [
      log.ts,
      log.route,
      log.reason,
      log.status || "—",
      log.message,
      log.retryCount || "—",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear all debug logs?")) return;
    try {
      await fetch("/api/debug/logs/clear", { method: "POST" });
      setLogs([]);
      setTotalCount(0);
    } catch (err) {
      console.error("[DebugPanel] clear failed:", err);
    }
  };

  if (!isOpen) {
    return (
      <button
        className="btn ghost sm"
        title="View AI debug logs"
        onClick={() => setIsOpen(true)}
        aria-label="Open debug logs"
      >
        <Icon name="code" size={14} />Logs
      </button>
    );
  }

  const uniqueRoutes = [...new Set(logs.map((l) => l.route))].sort();
  const uniqueReasons = [...new Set(logs.map((l) => l.reason))].sort();

  return (
    <div className="debug-panel">
      <div className="debug-head">
        <span className="debug-title">Debug Logs</span>
        <button
          className="debug-close"
          onClick={() => setIsOpen(false)}
          aria-label="Close debug panel"
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="debug-controls">
        <select value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)} className="debug-filter" title="Filter by API route">
          <option value="">All routes</option>
          {uniqueRoutes.map((route) => (
            <option key={route} value={route}>
              {route}
            </option>
          ))}
        </select>

        <select value={filterReason} onChange={(e) => setFilterReason(e.target.value)} className="debug-filter" title="Filter by error type">
          <option value="">All error types</option>
          {uniqueReasons.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>

        <label className="debug-checkbox" title="Auto-refresh logs every 5 seconds">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto
        </label>

        <button onClick={() => fetchLogs(0)} disabled={loading} className="debug-btn" title="Refresh logs">
          {loading ? "…" : "Refresh"}
        </button>

        <button onClick={downloadCSV} disabled={logs.length === 0} className="debug-btn" title="Download visible logs as CSV">
          Download
        </button>

        <button onClick={clearLogs} className="debug-btn danger" title="Delete all debug logs">
          Clear
        </button>
      </div>

      <div className="debug-info">
        {totalCount > 0 ? (
          <span className="debug-count">
            Showing {logs.length} of {totalCount} {hasMore ? "• more available" : "• all logs"}
          </span>
        ) : (
          <span className="debug-count">No logs yet</span>
        )}
        {lastRefresh && <span className="debug-time">Last updated: {new Date(lastRefresh).toLocaleTimeString()}</span>}
      </div>

      <div className="debug-logs">
        {logs.length === 0 ? (
          <div className="debug-empty">No logs found • Check filters or refresh</div>
        ) : (
          <table className="debug-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Route</th>
                <th>Error Type</th>
                <th>HTTP</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className={`debug-row ${expandedIdx === i ? "expanded" : ""}`}>
                  <td className="debug-ts">
                    <span title={log.ts}>{log.ts.slice(11, 19)}</span>
                  </td>
                  <td className="debug-route">
                    <span title={log.route}>{log.route}</span>
                  </td>
                  <td>
                    <span className={`debug-reason reason-${log.reason}`}>{log.reason}</span>
                  </td>
                  <td className="debug-status">{log.status || "—"}</td>
                  <td
                    className="debug-msg"
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                    title={expandedIdx === i ? "Click to collapse" : "Click to see full message"}
                    role="button"
                  >
                    <span className="msg-preview">
                      {expandedIdx === i ? "▼ " : "▶ "}
                      {log.message.slice(0, 60)}{log.message.length > 60 ? "…" : ""}
                    </span>
                    {expandedIdx === i && <div className="msg-full">{log.message}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {hasMore && (
        <div className="debug-footer">
          <button onClick={() => fetchLogs(offset + 50)} disabled={loading} className="debug-btn">
            {loading ? "Loading…" : `Load more (${totalCount - (offset + logs.length)} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
