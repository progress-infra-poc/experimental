import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ModuleLayout } from "@/components/chef/ModuleLayout";
import { reportingRailItems } from "@/components/chef/rails";
import { StatusPill } from "@/components/chef/StatusPill";
import { SplitButton } from "@/components/chef/TableToolbar";
import { TabStrip } from "@/components/chef/TabStrip";
import { SortHeader } from "@/components/chef/reporting/SortHeader";
import { SeverityLabel, type CountFilter } from "@/components/chef/reporting/CountCards";
import { ResultsToolbar } from "@/components/chef/reporting/ResultsToolbar";
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
      { title: "Node Compliance — InSpec Reporting — Progress Chef 360" },
      {
        name: "description",
        content:
          "Latest compliance state by node with execution history, profiles, controls, and aggregate outcomes.",
      },
      { property: "og:title", content: "Node Compliance — InSpec Reporting — Progress Chef 360" },
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
  { key: "status", label: "Latest Status" },
  { key: "lastScan", label: "Latest Execution" },
  { key: "platform", label: "Platform" },
  { key: "environment", label: "Environment" },
  { key: "profiles", label: "Profiles" },
  { key: "controlFailures", label: "Control Failures" },
];

const WINDOWS = [
  { label: "Last 24 hours", hours: 24 },
  { label: "Last 7 days", hours: 24 * 7 },
  { label: "Last 30 days", hours: 24 * 30 },
];

interface NodeRow {
  id: string;
  lastScan: string;
  status: "Passed" | "Failed";
  node: string;
  platform: string;
  environment: string;
  profiles: number;
  controlFailures: string;
  failed: number;
  passed: number;
  skipped: number;
  waived: number;
}

function buildNodeRows(rangeHours: number): NodeRow[] {
  return getLatestComplianceScans(rangeHours).map((scan) => {
    const detail = getScanDetail(scan.id);
    const counts = detail?.counts ?? { total: 0, failed: 0, passed: 0, skipped: 0, waived: 0 };
    return {
      id: scan.id,
      lastScan: scan.lastScan,
      status: scan.status,
      node: scan.node,
      platform: scan.platform,
      environment: scan.environment,
      profiles: detail?.profiles.length ?? 0,
      controlFailures: counts.failed > 0 ? `${counts.failed} Failed` : "None",
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
  const [rangeHours, setRangeHours] = useState(WINDOWS[0]!.hours);
  const nodeRows = useMemo(() => buildNodeRows(rangeHours), [rangeHours]);
  const profileRows = useMemo(getProfileRows, []);
  const aggregations = useMemo(() => getLatestControlAggregations(rangeHours), [rangeHours]);

  return (
    <ModuleLayout
      moduleTitle="Reporting"
      railItems={reportingRailItems}
      crumbs={[{ label: "Reporting", to: "/reporting" }, { label: "InSpec Reporting" }]}
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-semibold text-chef-text">Node Compliance</h1>
          <p className="mt-1.5 max-w-[720px] text-[13px] text-chef-text-muted">
            Latest known compliance state for every reporting node. Open a node to investigate its
            execution history, profiles, controls, and outcomes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            aria-label="Reporting window"
            value={rangeHours}
            onChange={(event) => setRangeHours(Number(event.target.value))}
            className="h-10 rounded-sm border border-chef-line bg-chef-surface px-3 text-[13px] text-chef-text outline-none focus:border-chef-blue"
          >
            {WINDOWS.map((window) => (
              <option key={window.hours} value={window.hours}>
                {window.label}
              </option>
            ))}
          </select>
          <SplitButton label="Export" />
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
        {tab === "nodes" && <NodesTable rows={nodeRows} />}
        {tab === "profiles" && <ProfilesTable rows={profileRows} />}
        {tab === "controls" && <ControlAggregationSection rows={aggregations} />}
      </div>
    </ModuleLayout>
  );
}

function ProfilesTable({ rows }: { rows: ReturnType<typeof getProfileRows> }) {
  const navigate = useNavigate();
  const table = useTableControls({
    rows,
    searchFields: ["name", "version", "id", "rootProfile"],
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
                  ["nodeCount", "Reporting Nodes"],
                  ["controlCount", "Controls"],
                  ["failedControls", "Failed Controls"],
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
                <th className="px-4 py-3 text-[13px] font-semibold text-chef-text">Details</th>
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
                  <td className="px-4 py-3 text-[13px] text-chef-text">{row.nodeCount}</td>
                  <td className="px-4 py-3 text-[13px] text-chef-text">{row.controlCount}</td>
                  <td className="px-4 py-3 text-[13px] text-chef-text">{row.failedControls}</td>
                  <td className="px-4 py-3 text-[13px] text-chef-blue">View profile</td>
                </tr>
              ))}
              {table.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
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

function NodesTable({ rows }: { rows: NodeRow[] }) {
  const [filter, setFilter] = useState<CountFilter>("all");
  const [platform, setPlatform] = useState("all");
  const [environment, setEnvironment] = useState("all");
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
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (platform !== "all" && row.platform !== platform) return false;
        if (environment !== "all" && row.environment !== environment) return false;
        if (filter === "Failed") return row.failed > 0;
        if (filter === "Passed") return row.failed === 0;
        if (filter === "Skipped") return row.skipped > 0;
        if (filter === "Waived") return row.waived > 0;
        return true;
      }),
    [rows, platform, environment, filter],
  );
  const table = useTableControls({
    rows: filtered,
    searchFields: ["node", "platform", "environment", "controlFailures"],
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
            activeFilter={filter}
            onFilterChange={(key) => setFilter(key as CountFilter)}
            filterOptions={[
              { key: "all", label: "All nodes" },
              { key: "Failed", label: "Failed" },
              { key: "Passed", label: "Passed" },
              { key: "Skipped", label: "Contains skipped controls" },
              { key: "Waived", label: "Contains other outcomes" },
            ]}
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
                <th className="px-4 py-3 text-[13px] font-semibold text-chef-text">
                  Investigation
                </th>
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
                  {show("status") && (
                    <td className="px-4 py-3">
                      <StatusPill status={row.status} />
                    </td>
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
                  {show("controlFailures") && (
                    <td className="px-4 py-3 text-[13px] text-chef-text">{row.controlFailures}</td>
                  )}
                  <td className="px-4 py-3 text-[13px] text-chef-blue">View execution history</td>
                </tr>
              ))}
              {table.rows.length === 0 && (
                <tr>
                  <td
                    colSpan={NODE_COLUMNS.filter((column) => show(column.key)).length + 1}
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

function AggregationCount({ status, value }: { status: AggregateControlStatus; value: number }) {
  const tone =
    status === "Passed"
      ? "bg-chef-success-bg text-chef-green"
      : status === "Failed" || status === "Error"
        ? "bg-chef-danger-bg text-chef-red"
        : status === "Skipped"
          ? "bg-chef-amber-bg text-chef-amber"
          : "bg-chef-pill text-chef-text-muted";
  return (
    <span
      className={`inline-flex min-w-[48px] justify-center rounded-full px-2 py-1 text-[12px] font-medium ${tone}`}
    >
      {value.toLocaleString()}
    </span>
  );
}

function ControlAggregationSection({ rows }: { rows: ControlAggregation[] }) {
  const [outcome, setOutcome] = useState<"all" | AggregateControlStatus>("all");
  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (
          outcome !== "all" &&
          row.counts[outcome.toLowerCase() as Lowercase<AggregateControlStatus>] === 0
        ) {
          return false;
        }
        return true;
      }),
    [rows, outcome],
  );
  const table = useTableControls({
    rows: filtered,
    searchFields: ["key", "title"],
    initialPageSize: 25,
    sortAccessor: (row, key) => {
      if (key === "control") return row.key;
      if (key === "impact") return row.impact;
      if (key === "nodeCount") return row.nodeCount;
      if (["Passed", "Failed", "Skipped", "Error", "Other"].includes(key)) {
        return row.counts[key.toLowerCase() as Lowercase<AggregateControlStatus>];
      }
      return "";
    },
  });

  return (
    <section>
      <div className="rounded-sm border border-chef-line bg-chef-surface px-3 pt-3">
        <ResultsToolbar
          title="Controls"
          resultLabel={`Showing ${table.rows.length} of ${filtered.length} controls`}
          query={table.query}
          onQueryChange={table.search}
          searchLabel="Search controls"
          filterGroups={[
            {
              id: "outcome",
              label: "Outcome",
              value: outcome,
              onChange: (value) => setOutcome(value as "all" | AggregateControlStatus),
              options: [
                { key: "all", label: "All outcomes" },
                { key: "Passed", label: "Passed" },
                { key: "Failed", label: "Failed" },
                { key: "Skipped", label: "Skipped" },
                { key: "Error", label: "Error" },
                { key: "Other", label: "Other" },
              ],
            },
          ]}
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
                label="Impact"
                columnKey="impact"
                sortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
              <SortHeader
                label="Nodes"
                columnKey="nodeCount"
                sortKey={table.sortKey}
                sortDirection={table.sortDirection}
                onSort={table.toggleSort}
              />
              {(["Passed", "Failed", "Skipped", "Error", "Other"] as const).map((status) => (
                <SortHeader
                  key={status}
                  label={status}
                  columnKey={status}
                  sortKey={table.sortKey}
                  sortDirection={table.sortDirection}
                  onSort={table.toggleSort}
                />
              ))}
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
                <td className="px-4 py-3">
                  <SeverityLabel severity={control.severity} impact={control.impact} />
                </td>
                <td className="px-4 py-3 text-center text-[13px] text-chef-text">
                  {control.nodeCount.toLocaleString()}
                </td>
                {(["Passed", "Failed", "Skipped", "Error", "Other"] as const).map((status) => (
                  <td key={status} className="px-3 py-3 text-center">
                    <AggregationCount
                      status={status}
                      value={
                        control.counts[status.toLowerCase() as Lowercase<AggregateControlStatus>]
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
            {table.rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-chef-text-muted">
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
        total={filtered.length}
        page={table.page}
        pageCount={table.pageCount}
        setPage={table.setPage}
        pageSize={table.pageSize}
        setPageSize={table.setPageSize}
      />
    </section>
  );
}
