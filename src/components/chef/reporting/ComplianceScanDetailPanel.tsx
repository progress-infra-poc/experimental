import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { StatusIcon, StatusPill } from "../StatusPill";
import { SplitButton } from "../TableToolbar";
import { type CountFilter } from "./CountCards";
import { ResultsToolbar } from "./ResultsToolbar";
import { ControlTable } from "./ControlTable";
import { ScanResultsDrawer } from "./ScanResultsDrawer";
import { ScanHistoryPanel } from "./ScanHistoryPanel";
import {
  getScanDetail,
  type ControlDetail,
  type ScanDetail,
  type ScanHistoryItem,
} from "@/data/complianceDetail";

export function ComplianceScanDetailPanel({
  detail,
  history,
  showHeader = true,
}: {
  detail: ScanDetail;
  history: ScanHistoryItem[];
  showHeader?: boolean;
}) {
  const [selectedScanId, setSelectedScanId] = useState(detail.scan.id);
  const [filter, setFilter] = useState<CountFilter>("all");
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  const [selectedControl, setSelectedControl] = useState<ControlDetail | null>(null);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(
    detail.profiles[0]?.id ?? null,
  );

  const selectedDetail = getScanDetail(selectedScanId) ?? detail;
  const { scan, counts, profiles, controls } = selectedDetail;

  const visibleControls = useMemo(() => {
    const q = query.trim().toLowerCase();
    return controls.filter((control) => {
      if (filter !== "all" && control.status !== filter) return false;
      if (severity !== "all" && control.severity !== severity) return false;
      if (!q) return true;
      return `${control.key} ${control.title} ${control.profileName}`.toLowerCase().includes(q);
    });
  }, [controls, filter, severity, query]);

  const profileResults = profiles
    .map((profile) => {
      const allControls = controls.filter((control) => control.profileId === profile.id);
      return {
        profile,
        controls: visibleControls.filter((control) => control.profileId === profile.id),
        allControls,
      };
    })
    .filter(
      ({ controls: profileControls }) =>
        profileControls.length > 0 || (!query && filter === "all" && severity === "all"),
    );

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <section className="rounded-sm border border-chef-line bg-chef-surface">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-chef-line px-4 py-3">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill status={scan.status} />
                {showHeader ? (
                  <h1 className="text-[20px] font-semibold text-chef-text">{scan.node}</h1>
                ) : (
                  <h2 className="text-[18px] font-semibold text-chef-text">Compliance execution</h2>
                )}
              </div>
              <p className="mt-1 text-[12px] text-chef-text-muted">
                Node ID: {selectedDetail.nodeId}
              </p>
            </div>
            <SplitButton label="Export" />
          </div>

          <div className="grid items-start gap-4 p-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
            <section className="rounded-sm border border-chef-line bg-chef-canvas/40 p-4">
              <h3 className="text-[13px] font-semibold text-chef-text">Scan Information</h3>
              <dl className="mt-3 space-y-2">
                {[
                  { label: "Last Scan", value: selectedDetail.timestamp },
                  { label: "InSpec Version", value: selectedDetail.inspecVersion },
                  { label: "IP Address", value: selectedDetail.ipAddress },
                  { label: "Platform", value: scan.platform },
                  { label: "Environment", value: scan.environment },
                  { label: "Profiles", value: String(profiles.length) },
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
                {(
                  [
                    { status: "Failed", label: "Failed", value: counts.failed },
                    { status: "Passed", label: "Passed", value: counts.passed },
                    { status: "Skipped", label: "Skipped", value: counts.skipped },
                    { status: "Waived", label: "Waived", value: counts.waived },
                  ] as const
                ).map((item) => (
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
        </section>

        <section>
          <div className="rounded-sm border border-chef-line bg-chef-surface px-3 pt-3">
            <ResultsToolbar
              title="Profile Results"
              resultLabel={`${profiles.length} profiles`}
              query={query}
              onQueryChange={setQuery}
              searchLabel="Search profiles and controls"
              activeFilter={filter}
              onFilterChange={(key) => setFilter(key as CountFilter)}
              filterOptions={[
                { key: "all", label: "All controls" },
                { key: "Failed", label: "Failed" },
                { key: "Passed", label: "Passed" },
                { key: "Skipped", label: "Skipped" },
                { key: "Waived", label: "Other" },
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
          </div>

          <div className="mt-3 space-y-3">
            {profileResults.map(({ profile, controls: profileControls, allControls }) => (
              <section
                key={profile.id}
                className="overflow-hidden rounded-sm border border-chef-line bg-chef-surface"
              >
                <button
                  type="button"
                  aria-expanded={expandedProfileId === profile.id}
                  aria-controls={`profile-controls-${profile.id}`}
                  onClick={() =>
                    setExpandedProfileId((current) => (current === profile.id ? null : profile.id))
                  }
                  className={`w-full bg-chef-canvas/50 px-4 py-3 text-left ${
                    expandedProfileId === profile.id ? "border-b border-chef-line" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-chef-text-muted transition-transform ${
                          expandedProfileId === profile.id ? "" : "-rotate-90"
                        }`}
                      />
                      <StatusPill status={profile.status} />
                      <span>
                        <span className="block text-[14px] font-semibold text-chef-text">
                          {profile.name}
                        </span>
                        <span className="block text-[12px] text-chef-text-muted">
                          {profile.rootProfile} • v{profile.version}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {(["Passed", "Failed", "Skipped", "Waived"] as const).map((status) => {
                        const count = allControls.filter(
                          (control) => control.status === status,
                        ).length;
                        return (
                          <span
                            key={status}
                            title={`${status}: ${count}`}
                            aria-label={`${status}: ${count}`}
                            className="inline-flex items-center gap-1 text-[12px] text-chef-text-muted"
                          >
                            <StatusIcon
                              status={status}
                              className={`h-4 w-4 ${count === 0 ? "opacity-40" : ""}`}
                            />
                            {count}
                          </span>
                        );
                      })}
                      <span className="text-[12px] text-chef-text-muted">
                        {allControls.length} controls
                      </span>
                    </div>
                  </div>
                </button>
                {expandedProfileId === profile.id && (
                  <div id={`profile-controls-${profile.id}`} className="p-3">
                    <ControlTable
                      controls={profileControls}
                      onScanResults={setSelectedControl}
                      showTestResults={false}
                    />
                  </div>
                )}
              </section>
            ))}
            {profileResults.length === 0 && (
              <div className="rounded-sm border border-chef-line bg-chef-surface px-4 py-10 text-center text-[13px] text-chef-text-muted">
                No profiles or controls match the current filters.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
        <ScanHistoryPanel
          history={history}
          selectedScanId={selectedScanId}
          onSelect={(item) => {
            setSelectedScanId(item.scanId);
            setSelectedControl(null);
            setExpandedProfileId(getScanDetail(item.scanId)?.profiles[0]?.id ?? null);
          }}
        />
      </div>

      <ScanResultsDrawer
        open={selectedControl !== null}
        onClose={() => setSelectedControl(null)}
        title="Control Results"
        subtitle={selectedControl ? `${selectedControl.profileName} • ${selectedControl.key}` : ""}
        controls={selectedControl ? [selectedControl] : []}
      />
    </div>
  );
}
