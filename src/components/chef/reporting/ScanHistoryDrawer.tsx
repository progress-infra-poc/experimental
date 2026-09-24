import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { StatusPill } from "../StatusPill";
import { HistoryPager } from "./HistoryPager";
import type { ScanHistoryItem } from "@/data/complianceDetail";

const RANGES = [
  { id: "24h", label: "Last 24 hours", hours: 24 },
  { id: "7d", label: "Last 7 days", hours: 168 },
  { id: "30d", label: "Last 30 days", hours: 720 },
];

const PAGE_SIZE = 10;

export function ScanHistoryDrawer({
  open,
  onClose,
  nodeName,
  history,
  activeTimestamp,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  nodeName: string;
  history: ScanHistoryItem[];
  activeTimestamp: string;
  onSelect: (item: ScanHistoryItem) => void;
}) {
  const [range, setRange] = useState("7d");
  const [filter, setFilter] = useState<"all" | "Passed" | "Failed">("all");
  const [page, setPage] = useState(1);

  const inRange = useMemo(() => {
    const hours = RANGES.find((r) => r.id === range)?.hours ?? 168;
    return history.filter((h) => h.hoursAgo <= hours);
  }, [history, range]);

  const rows = inRange.filter((h) => filter === "all" || h.status === filter);
  const counts = {
    all: inRange.length,
    passed: inRange.filter((h) => h.status === "Passed").length,
    failed: inRange.filter((h) => h.status === "Failed").length,
  };
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [range, filter]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close scan history"
        className="flex-1 bg-black/40"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-[440px] flex-col bg-chef-surface shadow-xl">
        <header className="flex items-start justify-between border-b border-chef-line px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-chef-text">Scan History</h2>
            <p className="text-[13px] text-chef-text-muted">{nodeName}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-chef-text-muted hover:text-chef-blue"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-3 border-b border-chef-line px-5 py-3">
          <select
            aria-label="Time range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="h-9 w-full rounded-sm border border-chef-line bg-chef-surface px-2 text-[13px] text-chef-text outline-none"
          >
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            {(
              [
                ["all", `All (${counts.all})`],
                ["Passed", `Passed (${counts.passed})`],
                ["Failed", `Failed (${counts.failed})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                  filter === id
                    ? "bg-chef-blue text-chef-blue-foreground"
                    : "bg-chef-pill text-chef-pill-foreground hover:bg-chef-pill/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {pagedRows.map((item) => (
            <li key={item.timestamp}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={`flex w-full items-center justify-between gap-3 border-b border-chef-line px-5 py-3 text-left hover:bg-chef-canvas ${
                  item.timestamp === activeTimestamp ? "bg-chef-pill/40" : ""
                }`}
              >
                <span>
                  <span className="block text-[13px] text-chef-text">{item.timestamp}</span>
                  <span className="block text-[12px] text-chef-text-muted">{item.relative}</span>
                </span>
                <StatusPill status={item.status} />
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="px-5 py-10 text-center text-[13px] text-chef-text-muted">
              No scans in the selected range.
            </li>
          )}
        </ul>

        <div className="border-t border-chef-line px-5 py-2">
          <HistoryPager page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </div>

        <footer className="border-t border-chef-line px-5 py-3">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-sm border border-chef-line px-3 text-[13px] text-chef-text hover:border-chef-blue hover:text-chef-blue"
          >
            <Download className="h-4 w-4" />
            Download report
          </button>
        </footer>
      </aside>
    </div>
  );
}
