import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { StatusIcon } from "../StatusPill";
import type { ScanHistoryItem } from "@/data/complianceDetail";

const RANGES = [
  { label: "Last 24 hours", hours: 24 },
  { label: "Last 7 days", hours: 24 * 7 },
  { label: "Last 30 days", hours: 24 * 30 },
];

export function ScanHistoryPanel({
  history,
  selectedScanId,
  onSelect,
}: {
  history: ScanHistoryItem[];
  selectedScanId: string;
  onSelect: (item: ScanHistoryItem) => void;
}) {
  const [rangeHours, setRangeHours] = useState(RANGES[2]!.hours);
  const [statusFilter, setStatusFilter] = useState<"all" | "Passed" | "Failed">("all");

  const inRange = useMemo(
    () => history.filter((h) => h.hoursAgo <= rangeHours),
    [history, rangeHours],
  );
  const counts = {
    all: inRange.length,
    passed: inRange.filter((h) => h.status === "Passed").length,
    failed: inRange.filter((h) => h.status === "Failed").length,
  };
  const visible = inRange.filter((h) => statusFilter === "all" || h.status === statusFilter);

  function counterClass(active: boolean) {
    return `flex h-[52px] w-[58px] flex-col items-center justify-center gap-0.5 rounded-sm border text-[12px] transition-colors ${
      active
        ? "border-chef-blue bg-chef-pill/60"
        : "border-chef-line bg-chef-surface hover:border-chef-blue"
    }`;
  }

  return (
    <aside className="flex h-full flex-col rounded-sm border border-chef-line bg-chef-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-chef-text">Execution History</h3>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[13px] text-chef-text hover:text-chef-blue"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={counterClass(statusFilter === "all")}
        >
          <span className="text-chef-text-muted">All</span>
          <span className="font-semibold text-chef-text">{counts.all}</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("Passed")}
          className={counterClass(statusFilter === "Passed")}
        >
          <StatusIcon status="Passed" className="h-4 w-4" />
          <span className="font-semibold text-chef-text">{counts.passed}</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("Failed")}
          className={counterClass(statusFilter === "Failed")}
        >
          <StatusIcon status="Failed" className="h-4 w-4" />
          <span className="font-semibold text-chef-text">{counts.failed}</span>
        </button>
      </div>

      <select
        aria-label="Scan history range"
        value={rangeHours}
        onChange={(e) => setRangeHours(Number(e.target.value))}
        className="mt-3 h-9 w-full rounded-sm border border-chef-line bg-chef-surface px-2 text-[13px] text-chef-text outline-none focus:border-chef-blue"
      >
        {RANGES.map((r) => (
          <option key={r.hours} value={r.hours}>
            {r.label}
          </option>
        ))}
      </select>

      <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {visible.map((entry) => (
          <li key={entry.timestamp}>
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className={`flex w-full items-start gap-2.5 rounded-sm border px-3 py-2.5 text-left transition-colors ${
                entry.scanId === selectedScanId
                  ? "border-chef-blue bg-chef-pill/40"
                  : "border-chef-line hover:border-chef-blue"
              }`}
            >
              <StatusIcon status={entry.status} className="mt-0.5 h-4 w-4" />
              <span>
                <span className="block text-[13px] text-chef-text">{entry.timestamp}</span>
                <span className="block text-[12px] text-chef-text-muted">{entry.relative}</span>
              </span>
            </button>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-6 text-center text-[13px] text-chef-text-muted">
            No scans in this range.
          </li>
        )}
      </ul>
    </aside>
  );
}
