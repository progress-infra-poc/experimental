import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ModuleLayout } from "@/components/chef/ModuleLayout";
import { reportingRailItems } from "@/components/chef/rails";
import { StatusIcon, type StatusKind } from "@/components/chef/StatusPill";
import { TabStrip } from "@/components/chef/TabStrip";
import { SortHeader } from "@/components/chef/reporting/SortHeader";
import { SeverityLabel } from "@/components/chef/reporting/CountCards";
import { ResultsToolbar } from "@/components/chef/reporting/ResultsToolbar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTableControls } from "@/hooks/useTableControls";
import {
  getLatestComplianceScans,
  getLatestControlAggregations,
  getProfileRows,
  getScanDetail,
  type AggregateControlStatus,
  type ControlAggregation,
} from "@/data/complianceDetail";

export const Route = createFileRoute("/reporting/inspec/")({
  head: () => ({
    meta: [
      { title: "Compliance Scan — InSpec Reporting — Progress Chef 360" },
      {
        name: "description",
        content:
          "Latest compliance state by node with execution history, profiles, controls, and aggregate outcomes.",
      },
      { property: "og:title", content: "Compliance Scan — InSpec Reporting — Progress Chef 360" },
      {
        property: "og:description",
        content:
          "Investigate node compliance from execution history through profile and control results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InspecReportingPage,
});

const NODE_COLUMNS = [
  { key: "node", label: "Node" },
  { key: "lastScan", label: "Last Scan" },
  { key: "platform", label: "Platform" },
  { key: "environment", label: "Environment" },
  { key: "profiles", label: "Profiles" },
  { key: "controlSummary", label: "Node Level Control Summary" },
];
const DOWNLOAD_ACTIONS = [{ label: "Download as CSV" }, { label: "Download as JSON" }];

interface NodeRow {
  id: string;
  lastScan: string;
  node: string;
  platform: string;
  environment: string;
  profiles: number;
  failed: number;
  passed: number;
  skipped: number;
  waived: number;
}

function buildNodeRows(rangeHours: number, selectedDate?: Date): NodeRow[] {
  return getLatestComplianceScans(rangeHours, selectedDate).map((scan) => {
    const detail = getScanDetail(scan.id);
    const counts = detail?.counts ?? { total: 0, failed: 0, passed: 0, skipped: 0, waived: 0 };
    return {
      id: scan.id,
      lastScan: scan.lastScan,
      node: scan.node,
      platform: scan.platform,
      environment: scan.environment,
      profiles: detail?.profiles.length ?? 0,
      failed: counts.failed,
      passed: counts.passed,
      skipped: counts.skipped,
      waived: counts.waived,
    };
  });
}

function Pager({
  rangeStart,
  rangeEnd,
  total,
  page,
  pageCount,
  setPage,
  pageSize,
  setPageSize,
}: {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-4 text-[13px] text-chef-text">
      <span>
        <span className="font-semibold">
          {rangeStart} – {rangeEnd}
        </span>{" "}
        of {total} items
      </span>
      <div className="flex items-center gap-3 text-chef-text-muted">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="hover:text-chef-blue disabled:opacity-40"
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page === pageCount}
          onClick={() => setPage(page + 1)}
          className="hover:text-chef-blue disabled:opacity-40"
        >
          →
        </button>
      </div>
      <select
        aria-label="Items per page"
        value={pageSize}
        onChange={(event) => setPageSize(Number(event.target.value))}
        className="h-9 rounded-sm border border-chef-line bg-chef-surface px-2 text-[13px] text-chef-text outline-none"
      >
        {[10, 25, 50].map((size) => (
          <option key={size} value={size}>
            {size} items per page
          </option>
        ))}
      </select>
    </div>
  );
}

function InspecReportingPage() {
  const [tab, setTab] = useState("nodes");
  const [range, setRange] = useState<"24h" | "date">("24h");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [controlRangeHours, setControlRangeHours] = useState(24);
  const nodeRows = useMemo(
    () => buildNodeRows(24, range === "date" ? selectedDate : undefined),
    [range, selectedDate],
  );
  const profileRows = useMemo(getProfileRows, []);
  const aggregations = useMemo(
    () => getLatestControlAggregations(controlRangeHours),
    [controlRangeHours],
  );

  return (
    <ModuleLayout
      moduleTitle="Reporting"
      railItems={reportingRailItems}
      crumbs={[{ label: "Reporting", to: "/reporting" }, { label: "InSpec Reporting" }]}
    >
      <div>
        <div>
          <h1 className="text-[28px] font-semibold text-chef-text">Compliance Scan</h1>
          <p className="mt-1.5 max-w-[720px] text-[13px] text-chef-text-muted">
            Latest known compliance state for every reporting node. Open a node to investigate its
            execution history, profiles, controls, and outcomes.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <TabStrip
          tabs={[
            { id: "nodes", label: "Nodes", count: nodeRows.length },
            { id: "profiles", label: "Profiles", count: profileRows.length },
            { id: "controls", label: "Controls", count: aggregations.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-5">
        {tab === "nodes" && (
          <NodesTable
            rows={nodeRows}
            dateFilter={
              <ReportingDateFilter
                range={range}
                selectedDate={selectedDate}
                onRangeChange={setRange}
                onDateChange={setSelectedDate}
              />
            }
          />
        )}
        {tab === "profiles" && <ProfilesTable rows={profileRows} />}
        {tab === "controls" && (
          <ControlAggregationSection
            rows={aggregations}
            dateFilter={
              <ControlRangeFilter value={controlRangeHours} onChange={setControlRangeHours} />
            }
          />
        )}
      </div>
    </ModuleLayout>
  );
}

const CONTROL_RANGES = [
  { label: "Last 1 day", hours: 24 },
  { label: "Last 7 days", hours: 24 * 7 },
  { label: "Last 30 days", hours: 24 * 30 },
  { label: "Last 3 months", hours: 24 * 90 },
];

function ControlRangeFilter({
  value,
  onChange,
}: {
  value: number;
  onChange: (hours: number) => void;
}) {
  return (
    <select
      aria-label="Controls reporting window"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-10 rounded-sm border border-chef-line bg-chef-surface px-3 text-[13px] text-chef-text outline-none focus:border-chef-blue"
    >
      {CONTROL_RANGES.map((range) => (
        <option key={range.hours} value={range.hours}>
          {range.label}
        </option>
      ))}
    </select>
  );
}

function ReportingDateFilter({
  range,
  selectedDate,
  onRangeChange,
  onDateChange,
}: {
  range: "24h" | "date";
  selectedDate: Date | undefined;
  onRangeChange: (range: "24h" | "date") => void;
  onDateChange: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-sm border-chef-line bg-chef-surface px-3 text-[13px] font-normal text-chef-text"
        >
          <CalendarDays className="h-4 w-4" />
          {range === "date" && selectedDate
            ? selectedDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Last 24 hours"}
          <ChevronDown className="h-4 w-4 text-chef-text-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3">
        <button
          type="button"
          className={`w-full rounded-sm px-3 py-2 text-left text-[13px] ${
            range === "24h" ? "bg-chef-blue text-white" : "text-chef-text hover:bg-chef-canvas"
          }`}
          onClick={() => {
            onRangeChange("24h");
            onDateChange(undefined);
          }}
        >
          Last 24 hours
        </button>
        <button
          type="button"
          className={`mt-1 w-full rounded-sm px-3 py-2 text-left text-[13px] ${
            range === "date" ? "bg-chef-blue text-white" : "text-chef-text hover:bg-chef-canvas"
          }`}
          onClick={() => onRangeChange("date")}
        >
          Choose date
        </button>
        {range === "date" && (
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onDateChange(date);
              if (date) onRangeChange("date");
            }}
            initialFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function ProfilesTable({ rows }: { rows: ReturnType<typeof getProfileRows> }) {
  const navigate = useNavigate();
  const table = useTableControls({
    rows,
    searchFields: ["name", "version", "id", "rootProfile"],
    sortAccessor: (row, key) => {
      return String(row[key as keyof typeof row] ?? "");
    },
  });

  return (
    <div>
      <div className="overflow-hidden rounded-sm border border-chef-line bg-chef-surface">
        <div className="border-b border-chef-line px-3 pt-3">
          <ResultsToolbar
            title="Profiles"
            resultLabel={`Showing ${table.rows.length} of ${rows.length} profiles`}
            query={table.query}
            onQueryChange={table.search}
            searchLabel="Search profiles"
            actions={DOWNLOAD_ACTIONS}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-chef-line bg-chef-canvas">
                {[
                  ["name", "Profile"],
                  ["version", "Version"],
                  ["rootProfile", "Identifier"],
                ].map(([key, label]) => (
                  <SortHeader
                    key={key}
                    label={label!}
                    columnKey={key!}
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.toggleSort}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() =>
                    navigate({
                      to: "/reporting/inspec/profile/$profileId",
                      params: { profileId: row.id },
                    })
                  }
                  className="cursor-pointer border-b border-chef-line last:border-0 hover:bg-chef-canvas/70"
                >
                  <td className="px-4 py-3 text-[13px] font-medium text-chef-blue">{row.name}</td>
                  <td className="px-4 py-3 text-[13px] text-chef-text">{row.version}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-chef-text-muted">
                    {row.rootProfile}
                  </td>
                </tr>
              ))}
              {table.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-10 text-center text-[13px] text-chef-text-muted"
                  >
                    No profiles match the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pager
        rangeStart={table.rangeStart}
        rangeEnd={table.rangeEnd}
        total={table.total}
        page={table.page}
        pageCount={table.pageCount}
        setPage={table.setPage}
        pageSize={table.pageSize}
        setPageSize={table.setPageSize}
      />
    </div>
  );
}

function NodesTable({ rows, dateFilter }: { rows: NodeRow[]; dateFilter: React.ReactNode }) {
  const [platform, setPlatform] = useState("all");
  const [environment, setEnvironment] = useState("all");
  const [status, setStatus] = useState("all");
  const [profiles, setProfiles] = useState("all");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const platforms = useMemo(
    () => Array.from(new Set(rows.map((row) => row.platform))).sort(),
    [rows],
  );
  const environments = useMemo(
    () => Array.from(new Set(rows.map((row) => row.environment))).sort(),
    [rows],
  );
  const profileCounts = useMemo(
    () => Array.from(new Set(rows.map((row) => row.profiles))).sort((a, b) => a - b),
    [rows],
  );
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (platform !== "all" && row.platform !== platform) return false;
        if (environment !== "all" && row.environment !== environment) return false;
        if (status === "compliant" && row.failed > 0) return false;
        if (status === "noncompliant" && row.failed === 0) return false;
        if (profiles !== "all" && row.profiles !== Number(profiles)) return false;
        return true;
      }),
    [rows, platform, environment, status, profiles],
  );
  const table = useTableControls({
    rows: filtered,
    searchFields: ["node", "platform", "environment"],
  });
  const show = (key: string) => !hidden.has(key);

  function toggleColumn(key: string) {
    setHidden((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div>
      <div className="overflow-hidden rounded-sm border border-chef-line bg-chef-surface">
        <div className="border-b border-chef-line px-3 pt-3">
          <ResultsToolbar
            title="Nodes"
            resultLabel={`Showing ${table.rows.length} of ${filtered.length} nodes`}
            query={table.query}
            onQueryChange={table.search}
            searchLabel="Search nodes"
            filterContent={dateFilter}
            actions={DOWNLOAD_ACTIONS}
            filterGroups={[
              {
                id: "platform",
                label: "Platform",
                value: platform,
                onChange: setPlatform,
                options: [
                  { key: "all", label: "All platforms" },
                  ...platforms.map((value) => ({ key: value, label: value })),
                ],
              },
              {
                id: "environment",
                label: "Environment",
                value: environment,
                onChange: setEnvironment,
                options: [
                  { key: "all", label: "All environments" },
                  ...environments.map((value) => ({ key: value, label: value })),
                ],
              },
              {
                id: "status",
                label: "Status",
                value: status,
                onChange: setStatus,
                options: [
                  { key: "all", label: "All statuses" },
                  { key: "compliant", label: "Compliant" },
                  { key: "noncompliant", label: "Non-compliant" },
                ],
              },
              {
                id: "profiles",
                label: "Profile count",
                value: profiles,
                onChange: setProfiles,
                options: [
                  { key: "all", label: "All profile counts" },
                  ...profileCounts.map((value) => ({
                    key: String(value),
                    label: `${value} profile${value === 1 ? "" : "s"}`,
                  })),
                ],
              },
            ]}
            columns={NODE_COLUMNS}
            isColumnVisible={show}
            onToggleColumn={toggleColumn}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-chef-line bg-chef-canvas">
                {NODE_COLUMNS.filter((column) => show(column.key)).map((column) => (
                  <SortHeader
                    key={column.key}
                    label={column.label}
                    columnKey={column.key}
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.toggleSort}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() =>
                    navigate({ to: "/reporting/inspec/$scanId", params: { scanId: row.id } })
                  }
                  className="cursor-pointer border-b border-chef-line last:border-0 hover:bg-chef-canvas/70"
                >
                  {show("node") && (
                    <td className="px-4 py-3 text-[13px] font-medium text-chef-blue">{row.node}</td>
                  )}
                  {show("lastScan") && (
                    <td className="px-4 py-3 text-[13px] text-chef-text">{row.lastScan}</td>
                  )}
                  {show("platform") && (
                    <td className="px-4 py-3 text-[13px] text-chef-text">{row.platform}</td>
                  )}
                  {show("environment") && (
                    <td className="px-4 py-3 text-[13px] text-chef-text">{row.environment}</td>
                  )}
                  {show("profiles") && (
                    <td className="px-4 py-3 text-[13px] text-chef-text">{row.profiles}</td>
                  )}
                  {show("controlSummary") && (
                    <td className="px-4 py-3">
                      <div className="inline-grid grid-cols-[repeat(4,48px)] items-center gap-x-2">
                        {(
                          [
                            ["Passed", row.passed],
                            ["Failed", row.failed],
                            ["Skipped", row.skipped],
                            ["Waived", row.waived],
                          ] as const
                        ).map(([status, count]) => (
                          <span
                            key={status}
                            title={`${status}: ${count}`}
                            aria-label={`${status}: ${count}`}
                            className="grid grid-cols-[16px_24px] items-center gap-1 whitespace-nowrap text-[13px] tabular-nums text-chef-text"
                          >
                            <StatusIcon
                              status={status}
                              className={`h-4 w-4 ${count === 0 ? "opacity-40" : ""}`}
                            />
                            {count}
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {table.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={NODE_COLUMNS.filter((column) => show(column.key)).length}
                    className="px-4 py-10 text-center text-[13px] text-chef-text-muted"
                  >
                    No nodes reported compliance data in this window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pager
        rangeStart={table.rangeStart}
        rangeEnd={table.rangeEnd}
        total={filtered.length}
        page={table.page}
        pageCount={table.pageCount}
        setPage={table.setPage}
        pageSize={table.pageSize}
        setPageSize={table.setPageSize}
      />
    </div>
  );
}

function ControlResources({ control }: { control: ControlAggregation }) {
  const resources: { label: AggregateControlStatus; iconStatus: StatusKind; value: number }[] = [
    { label: "Passed", iconStatus: "Passed", value: control.counts.passed },
    { label: "Failed", iconStatus: "Failed", value: control.counts.failed },
    { label: "Skipped", iconStatus: "Skipped", value: control.counts.skipped },
    { label: "Error", iconStatus: "Failed", value: control.counts.error },
    { label: "Other", iconStatus: "Waived", value: control.counts.other },
  ];

  return (
    <div className="flex items-center gap-3">
      {resources.map((resource) => (
        <span
          key={resource.label}
          title={`${resource.label}: ${resource.value.toLocaleString()}`}
          aria-label={`${resource.label}: ${resource.value.toLocaleString()}`}
          className="inline-flex cursor-default items-center gap-1 text-[13px] text-chef-text"
        >
          <StatusIcon
            status={resource.iconStatus}
            className={`h-[18px] w-[18px] ${resource.value === 0 ? "opacity-40" : ""}`}
          />
          {resource.value.toLocaleString()}
        </span>
      ))}
    </div>
  );
}

function ControlAggregationSection({
  rows,
  dateFilter,
}: {
  rows: ControlAggregation[];
  dateFilter: React.ReactNode;
}) {
  const table = useTableControls({
    rows,
    searchFields: ["key", "title", "profileName"],
    initialPageSize: 25,
    sortAccessor: (row, key) => {
      if (key === "control") return row.key;
      if (key === "profileName") return row.profileName;
      if (key === "impact") return row.impact;
      return "";
    },
  });

  return (
    <section>
      <div className="rounded-sm border border-chef-line bg-chef-surface px-3 pt-3">
        <ResultsToolbar
          title="Controls"
          resultLabel={`Showing ${table.rows.length} of ${rows.length} controls`}
          query={table.query}
          onQueryChange={table.search}
          searchLabel="Search controls"
          filterContent={dateFilter}
          actions={DOWNLOAD_ACTIONS}
        />
      </div>

      <div className="overflow-x-auto rounded-b-sm border-x border-b border-chef-line bg-chef-surface">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-chef-line bg-chef-canvas">
              <SortHeader
                label="Control"
                columnKey="control"
                sortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
              <SortHeader
                label="Profile"
                columnKey="profileName"
                sortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
              <SortHeader
                label="Impact"
                columnKey="impact"
                sortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
              <th className="px-4 py-3 text-[13px] font-semibold text-chef-text">
                Node Level Control Summary
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((control) => (
              <tr key={control.id} className="border-b border-chef-line last:border-0">
                <td className="max-w-[560px] px-4 py-3">
                  <div className="break-all text-[13px] font-semibold text-chef-text">
                    {control.key}
                  </div>
                  <div className="mt-0.5 text-[12px] text-chef-text-muted">{control.title}</div>
                </td>
                <td className="px-4 py-3 text-[13px] text-chef-text">
                  <div>{control.profileName}</div>
                  <div className="mt-0.5 text-[12px] text-chef-text-muted">
                    v{control.profileVersion}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <SeverityLabel severity={control.severity} impact={control.impact} />
                </td>
                <td className="px-4 py-3">
                  <ControlResources control={control} />
                </td>
              </tr>
            ))}
            {table.rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[13px] text-chef-text-muted">
                  No controls match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pager
        rangeStart={table.rangeStart}
        rangeEnd={table.rangeEnd}
        total={rows.length}
        page={table.page}
        pageCount={table.pageCount}
        setPage={table.setPage}
        pageSize={table.pageSize}
        setPageSize={table.setPageSize}
      />
    </section>
  );
}
