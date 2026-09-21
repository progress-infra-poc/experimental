import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ModuleLayout } from "@/components/chef/ModuleLayout";
import { reportingRailItems } from "@/components/chef/rails";
import { StatusIcon, StatusPill } from "@/components/chef/StatusPill";
import { SplitButton } from "@/components/chef/TableToolbar";
import { TabStrip } from "@/components/chef/TabStrip";
import { SortHeader } from "@/components/chef/reporting/SortHeader";
import { SeverityLabel, type CountFilter } from "@/components/chef/reporting/CountCards";
import { ResultsToolbar } from "@/components/chef/reporting/ResultsToolbar";
import { ScanResultsDrawer, type DrawerItem } from "@/components/chef/reporting/ScanResultsDrawer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTableControls } from "@/hooks/useTableControls";
import { complianceScans } from "@/data/reporting";
import {
  getControlRows,
  getProfileRows,
  getScanDetail,
  getProfileNodes,
  getProfileControlsForScan,
  type ControlDetail,
} from "@/data/complianceDetail";

export const Route = createFileRoute("/reporting/inspec/")({
  head: () => ({
    meta: [
      { title: "Compliance Scan — InSpec Reporting — Progress Chef 360" },
      {
        name: "description",
        content: "InSpec compliance results across nodes, profiles and controls with filters and drill-down.",
      },
      { property: "og:title", content: "Compliance Scan — InSpec Reporting — Progress Chef 360" },
      {
        property: "og:description",
        content: "Review InSpec scan results by node, profile or control and drill into failing tests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InspecReportingPage,
});

const NODE_COLUMNS = [
  { key: "node", label: "Node" },
  { key: "status", label: "Status" },
  { key: "lastScan", label: "Last Scan" },
  { key: "platform", label: "Platform" },
  { key: "environment", label: "Environment" },
  { key: "controlFailures", label: "Control Failures" },
];

interface NodeRow {
  id: string;
  lastScan: string;
  status: "Passed" | "Failed";
  node: string;
  platform: string;
  environment: string;
  controlFailures: string;
  failed: number;
  passed: number;
  skipped: number;
  waived: number;
}

function buildNodeRows(): NodeRow[] {
  return complianceScans.map((scan) => {
    const detail = getScanDetail(scan.id);
    const counts = detail?.counts ?? { total: 0, failed: 0, passed: 0, skipped: 0, waived: 0 };
    return {
      id: scan.id,
      lastScan: scan.lastScan,
      status: scan.status,
      node: scan.node,
      platform: scan.platform,
      environment: scan.environment,
      controlFailures: counts.failed > 0 ? `${counts.failed} Failed` : "Passed",
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
  setPage: (n: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
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
        onChange={(e) => setPageSize(Number(e.target.value))}
        className="h-9 rounded-sm border border-chef-line bg-chef-surface px-2 text-[13px] text-chef-text outline-none"
      >
        {[10, 25, 50].map((n) => (
          <option key={n} value={n}>
            {n} items per page
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
  const [drawer, setDrawer] = useState<DrawerPayload | null>(null);

  const nodeRows = useMemo(buildNodeRows, []);
  const profileRows = useMemo(getProfileRows, []);
  const controlRows = useMemo(getControlRows, []);

  return (
    <ModuleLayout
      moduleTitle="Reporting"
      railItems={reportingRailItems}
      crumbs={[{ label: "Reporting", to: "/reporting" }, { label: "InSpec Reporting" }]}
    >
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1 className="text-[28px] font-semibold text-chef-text">Compliance Scan</h1>
          <p className="mt-1.5 text-[13px] text-chef-text-muted">
            InSpec compliance results across nodes, profiles and controls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-sm border-chef-line bg-chef-surface px-3 text-[13px] font-normal text-chef-text"
              >
                <CalendarDays className="h-4 w-4" />
                {selectedDate
                  ? selectedDate.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Last 24 hours"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-3">
              <button
                type="button"
                className={`w-full rounded-sm px-3 py-2 text-left text-[13px] ${
                  range === "24h"
                    ? "bg-chef-blue text-white"
                    : "text-chef-text hover:bg-chef-canvas"
                }`}
                onClick={() => {
                  setRange("24h");
                  setSelectedDate(undefined);
                }}
              >
                Last 24 hours
              </button>
              <button
                type="button"
                className={`mt-1 w-full rounded-sm px-3 py-2 text-left text-[13px] ${
                  range === "date"
                    ? "bg-chef-blue text-white"
                    : "text-chef-text hover:bg-chef-canvas"
                }`}
                onClick={() => setRange("date")}
              >
                Choose date
              </button>
              {range === "date" && (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) setRange("date");
                  }}
                  initialFocus
                />
              )}
            </PopoverContent>
          </Popover>
          <SplitButton label="Export" />
        </div>
      </div>

      <div className="mt-4">
        <TabStrip
          tabs={[
            { id: "nodes", label: "Nodes", count: nodeRows.length },
            { id: "profiles", label: "Profiles", count: profileRows.length },
            { id: "controls", label: "Controls", count: controlRows.length },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-5">
        {tab === "nodes" && <NodesTab rows={nodeRows} onOpenResults={setDrawer} />}
        {tab === "profiles" && <ProfilesTab rows={profileRows} onOpenResults={setDrawer} />}
        {tab === "controls" && <ControlsTab rows={controlRows} onOpenResults={setDrawer} />}
      </div>

      <ScanResultsDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        title={drawer?.title ?? ""}
        subtitle={drawer?.subtitle ?? ""}
        controls={drawer?.controls ?? []}
        items={drawer?.items}
        getControlsForItem={drawer?.getControlsForItem}
      />
    </ModuleLayout>
  );
}

type DrawerPayload = {
  title: string;
  subtitle: string;
  controls: ControlDetail[];
  items?: DrawerItem[];
  getControlsForItem?: (item: DrawerItem) => ControlDetail[];
};

type OpenResults = (payload: DrawerPayload) => void;

function NodesTab({ rows, onOpenResults }: { rows: NodeRow[]; onOpenResults: OpenResults }) {
  const [filter, setFilter] = useState<CountFilter>("all");
  const [platform, setPlatform] = useState("all");
  const [environment, setEnvironment] = useState("all");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const navigate = useNavigate();


  const platforms = useMemo(() => Array.from(new Set(rows.map((r) => r.platform))).sort(), [rows]);
  const environments = useMemo(() => Array.from(new Set(rows.map((r) => r.environment))).sort(), [rows]);

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

  const counts = {
    total: rows.length,
    failed: rows.filter((r) => r.failed > 0).length,
    passed: rows.filter((r) => r.failed === 0).length,
    skipped: rows.filter((r) => r.skipped > 0).length,
    waived: rows.filter((r) => r.waived > 0).length,
  };

  const show = (key: string) => !hidden.has(key);

  function toggleColumn(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-sm border border-chef-line bg-chef-surface">
        <div className="border-b border-chef-line px-3 pt-3">
          <ResultsToolbar
            title="Scan Results"
            resultLabel={`Showing ${table.rows.length} of ${filtered.length} nodes`}
            query={table.query}
            onQueryChange={table.search}
            searchLabel="Search nodes"
            activeFilter={filter}
            onFilterChange={(key) => setFilter(key as CountFilter)}
            filterOptions={[
              { key: "all", label: "Total Nodes", count: counts.total },
              { key: "Failed", label: "Failed Nodes", count: counts.failed },
              { key: "Passed", label: "Passed Nodes", count: counts.passed },
              { key: "Skipped", label: "Skipped Nodes", count: counts.skipped },
              { key: "Waived", label: "Waived Nodes", count: counts.waived },
            ]}
            filterGroups={[
              {
                id: "platform",
                label: "Platform",
                value: platform,
                onChange: setPlatform,
                options: [
                  { key: "all", label: "All platforms" },
                  ...platforms.map((p) => ({ key: p, label: p })),
                ],
              },
              {
                id: "environment",
                label: "Environment",
                value: environment,
                onChange: setEnvironment,
                options: [
                  { key: "all", label: "All environments" },
                  ...environments.map((e) => ({ key: e, label: e })),
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
                {NODE_COLUMNS.filter((c) => show(c.key)).map((col) => (
                  <SortHeader
                    key={col.key}
                    label={col.label}
                    columnKey={col.key}
                    sortKey={table.sortKey}
                    sortDirection={table.sortDirection}
                    onSort={table.toggleSort}
                  />
                ))}
                <th className="px-4 py-3 text-[13px] font-semibold text-chef-text">Scan Results</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate({ to: "/reporting/inspec/$scanId", params: { scanId: row.id } })}
                  className="cursor-pointer border-b border-chef-line last:border-0 hover:bg-chef-canvas/70"
                >
                  {show("node") && (
                    <td className="px-4 py-3 text-[13px] text-chef-text hover:text-chef-blue">{row.node}</td>
                  )}
                  {show("status") && (
                    <td className="px-4 py-3">
                      <StatusPill status={row.status} />
                    </td>
                  )}
                  {show("lastScan") && <td className="px-4 py-3 text-[13px] text-chef-text">{row.lastScan}</td>}
                  {show("platform") && <td className="px-4 py-3 text-[13px] text-chef-text">{row.platform}</td>}
                  {show("environment") && (
                    <td className="px-4 py-3 text-[13px] text-chef-text">{row.environment}</td>
                  )}
                  {show("controlFailures") && (
                    <td className="px-4 py-3 text-[13px] text-chef-text">{row.controlFailures}</td>
                  )}
                  <td className="px-4 py-3 text-[13px]" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenResults({
                          title: "Scan results for node:",
                          subtitle: row.node,
                          controls: [],
                          items: (getScanDetail(row.id)?.profiles ?? []).map((p) => ({
                            id: p.id,
                            label: p.name,
                            sublabel: `v${p.version}`,
                            status: p.status === "Failed" ? ("Failed" as const) : ("Passed" as const),
                          })),
                          getControlsForItem: (item) => getProfileControlsForScan(item.id, row.id),
                        })
                      }
                      className="text-chef-blue hover:underline"
                    >
                      View results
                    </button>
                  </td>
                </tr>
              ))}
              {table.rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-chef-text-muted">
                    No nodes match the current filters.
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


function ProfilesTab({
  rows,
  onOpenResults,
}: {
  rows: ReturnType<typeof getProfileRows>;
  onOpenResults: OpenResults;
}) {
  const navigate = useNavigate();

  const filtered = rows;

  const table = useTableControls({
    rows: filtered,
    searchFields: ["name", "version", "id", "rootProfile"],
  });


  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-sm border border-chef-line bg-chef-surface">
        <div className="border-b border-chef-line px-3 pt-3">
          <ResultsToolbar
            title="Profiles"
            resultLabel={`Showing ${table.rows.length} of ${filtered.length} profiles`}
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
                  ["id", "Identifier"],
                  ["rootProfile", "Root Profile"],
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
                <th className="px-4 py-3 text-[13px] font-semibold text-chef-text">Scan Results</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() =>
                    navigate({ to: "/reporting/inspec/profile/$profileId", params: { profileId: row.id } })
                  }
                  className="cursor-pointer border-b border-chef-line last:border-0 hover:bg-chef-canvas/70"
                >
                  <td className="px-4 py-3 text-[13px] text-chef-text hover:text-chef-blue">{row.name}</td>
                  <td className="px-4 py-3 text-[13px] text-chef-text">{row.version}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-chef-text-muted">{row.id}</td>
                  <td className="px-4 py-3 text-[13px] text-chef-text">{row.rootProfile}</td>
                  <td className="px-4 py-3 text-[13px]" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenResults({
                          title: "Scan results for profile:",
                          subtitle: row.name,
                          controls: [],
                          items: getProfileNodes(row.id).map((n) => ({
                            id: n.scanId,
                            label: n.nodeName,
                            sublabel: n.relative,
                            status: n.status,
                          })),
                          getControlsForItem: (item) => getProfileControlsForScan(row.id, item.id),
                        })
                      }
                      className="text-chef-blue hover:underline"
                    >
                      View results
                    </button>
                  </td>
                </tr>
              ))}
              {table.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-chef-text-muted">

                    No profiles match the current filters.
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

function ControlsTab({
  rows,
  onOpenResults,
}: {
  rows: ReturnType<typeof getControlRows>;
  onOpenResults: OpenResults;
}) {
  const [severity, setSeverity] = useState("all");

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (severity !== "all" && row.severity !== severity) return false;
        return true;
      }),
    [rows, severity],
  );

  const table = useTableControls({
    rows: filtered,
    searchFields: ["key", "title", "profileName", "severity"],
  });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-sm border border-chef-line bg-chef-surface">
        <div className="border-b border-chef-line px-3 pt-3">
          <ResultsToolbar
            title="Controls"
            resultLabel={`Showing ${table.rows.length} of ${filtered.length} controls`}
            query={table.query}
            onQueryChange={table.search}
            searchLabel="Search controls"
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

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-chef-line bg-chef-canvas">
                {[
                  ["key", "Control"],
                  ["profileName", "Profile"],
                  ["severity", "Severity"],
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
                <th className="px-4 py-3 text-[13px] font-semibold text-chef-text">Node Status</th>

              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() =>
                    onOpenResults({
                      title: `${row.key}: ${row.title}`,
                      subtitle: `${row.profileName} v${row.profileVersion}`,
                      controls: [row],
                    })
                  }
                  className="cursor-pointer border-b border-chef-line last:border-0 hover:bg-chef-canvas/70"
                >
                  <td className="w-[42%] max-w-[520px] break-words px-4 py-3 align-top text-[13px] text-chef-text">
                    <span className="font-semibold">{row.key}</span>: {row.title}
                  </td>
                  <td className="w-[20%] break-words px-4 py-3 align-top text-[13px] text-chef-text">{row.profileName}</td>
                  <td className="px-4 py-3 align-top">
                    <SeverityLabel severity={row.severity} impact={row.impact} />
                  </td>
                  <td className="px-4 py-3 align-top text-[13px] text-chef-text">
                    <span className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          ["Failed", row.nodeStatus.failed],
                          ["Passed", row.nodeStatus.passed],
                          ["Skipped", row.nodeStatus.skipped],
                          ["Waived", row.nodeStatus.waived],
                        ] as const
                      ).map(([status, count]) => (
                        <span
                          key={status}
                          className="inline-flex items-center gap-1"
                          title={`${count} ${status.toLowerCase()}`}
                          aria-label={`${count} ${status.toLowerCase()}`}
                        >
                          <StatusIcon status={status} className="h-4 w-4" />
                          <span className="text-chef-text-muted">{count}</span>
                        </span>
                      ))}
                    </span>
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
