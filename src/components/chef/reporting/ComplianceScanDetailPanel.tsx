import { useMemo, useState } from "react";
import { StatusIcon, StatusPill } from "../StatusPill";
import { SplitButton } from "../TableToolbar";
import { type CountFilter } from "./CountCards";
import { ResultsToolbar } from "./ResultsToolbar";
import { ControlTable } from "./ControlTable";
import { ScanResultsDrawer } from "./ScanResultsDrawer";
import { ScanHistoryPanel } from "./ScanHistoryPanel";
import type { ControlDetail, ScanDetail, ScanHistoryItem } from "@/data/complianceDetail";

function InfoCard({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <section className="rounded-sm border border-chef-line bg-chef-surface p-4">
      <h2 className="mb-3 text-[14px] font-semibold text-chef-text">{title}</h2>
      <dl className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4">
            <dt className="text-[13px] text-chef-text-muted">{row.label}</dt>
            <dd className="max-w-[60%] break-words text-right text-[13px] text-chef-text">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ComplianceScanDetailPanel({
  detail,
  history,
  showHeader = true,
}: {
  detail: ScanDetail;
  history: ScanHistoryItem[];
  showHeader?: boolean;
}) {
  const { scan, counts, controls } = detail;

  const [filter, setFilter] = useState<CountFilter>("all");
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  
  const [activeTimestamp, setActiveTimestamp] = useState(history[0]?.timestamp ?? detail.timestamp);
  const [selectedControl, setSelectedControl] = useState<ControlDetail | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return controls.filter((control) => {
      if (filter !== "all" && control.status !== filter) return false;
      if (severity !== "all" && control.severity !== severity) return false;
      if (!q) return true;
      return `${control.key} ${control.title} ${control.profileName}`.toLowerCase().includes(q);
    });
  }, [controls, filter, severity, query]);

  return (
    <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
      <div className="rounded-sm border border-chef-line bg-chef-surface">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-chef-line px-4 py-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={scan.status} />
              {showHeader ? (
                <h1 className="text-[18px] font-semibold text-chef-text">
                  {scan.node} • Compliance Scan • Last Scan: {scan.lastScan}
                </h1>
              ) : (
                <h2 className="text-[18px] font-semibold text-chef-text">
                  Compliance Scan • Last Scan: {scan.lastScan}
                </h2>
              )}
            </div>
            <p className="mt-1 text-[12px] text-chef-text-muted">
              Node ID: {detail.nodeId}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SplitButton label="Export" />
          </div>
        </div>

        <div className="grid items-start gap-4 p-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
          <section className="rounded-sm border border-chef-line bg-chef-canvas/40 p-4">
            <h3 className="text-[13px] font-semibold text-chef-text">Scan Information</h3>
            <dl className="mt-3 space-y-2">
              {[
                { label: "Last Scan", value: activeTimestamp },
                { label: "Inspec Version", value: detail.inspecVersion },
                { label: "IP Address", value: detail.ipAddress },
                { label: "Platform", value: scan.platform },
                { label: "Environment", value: scan.environment },
                { label: "Profiles", value: String(detail.profiles.length) },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4">
                  <dt className="text-[12px] text-chef-text-muted">{row.label}</dt>
                  <dd className="text-right text-[12px] text-chef-text">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-sm border border-chef-line bg-chef-canvas/40 p-4">
            <h3 className="text-[13px] font-semibold text-chef-text">Controls Overview</h3>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <li>
                <span className="text-[13px] text-chef-text">Total Controls</span>
                <span className="mt-2 block text-[22px] text-chef-text">{counts.total}</span>
              </li>
              {([
                { status: "Failed", label: "Failed", value: counts.failed },
                { status: "Passed", label: "Passed", value: counts.passed },
                { status: "Skipped", label: "Skipped", value: counts.skipped },
                { status: "Waived", label: "Waived", value: counts.waived },
              ] as const).map((item) => (
                <li key={item.label}>
                  <span className="flex items-center gap-2 text-[13px] text-chef-text">
                    <StatusIcon status={item.status} className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span className="mt-2 block text-[22px] text-chef-text">{item.value}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div>
        <ControlTable
          controls={visible}
          onScanResults={setSelectedControl}
          toolbar={
            <ResultsToolbar
              title="Controls"
              resultLabel={`Showing ${visible.length} of ${controls.length} controls`}
              query={query}
              onQueryChange={setQuery}
              searchLabel="Search controls"
              activeFilter={filter}
              onFilterChange={(key) => setFilter(key as CountFilter)}
              filterOptions={[
                { key: "all", label: "Total Controls", count: counts.total },
                { key: "Failed", label: "Failed Controls", count: counts.failed },
                { key: "Passed", label: "Passed Controls", count: counts.passed },
                { key: "Skipped", label: "Skipped Controls", count: counts.skipped },
                { key: "Waived", label: "Waived Controls", count: counts.waived },
              ]}
              filterGroups={[
                {
                  id: "severity",
                  label: "Severity",
                  value: severity,
                  onChange: setSeverity,
                  options: [
                    { key: "all", label: "All severities" },
                    { key: "Critical", label: "Critical" },
                    { key: "Major", label: "Major" },
                    { key: "Minor", label: "Minor" },
                  ],
                },
              ]}
            />
          }
        />
      </div>
      </div>

      <div className="xl:sticky xl:top-4 xl:h-full xl:max-h-[calc(100vh-2rem)]">
        <ScanHistoryPanel
          history={history}
          activeTimestamp={activeTimestamp}
          onSelect={(item) => setActiveTimestamp(item.timestamp)}
        />
      </div>
      <ScanResultsDrawer
        open={selectedControl !== null}
        onClose={() => setSelectedControl(null)}
        title="Scan Results"
        subtitle={selectedControl ? `${selectedControl.key}: ${selectedControl.title}` : ""}
        controls={selectedControl ? [selectedControl] : []}
      />
    </div>
  );
}
