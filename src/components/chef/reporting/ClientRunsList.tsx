import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { type FilterGroup } from "@/components/chef/reporting/FilterChipBar";
import { ResultsToolbar } from "@/components/chef/reporting/ResultsToolbar";
import { StatusIcon, StatusPill } from "@/components/chef/StatusPill";
import { SortHeader } from "@/components/chef/reporting/SortHeader";
import { useTableControls } from "@/hooks/useTableControls";
import { clientRuns, type ClientRun } from "@/data/reporting";

export type ClientRunDetailPath = "/reporting/client/$runId";

const COLUMNS = [
  { key: "node", label: "Node" },
  { key: "status", label: "Status" },
  { key: "lastRun", label: "Last Run" },
  { key: "infraClientVersion", label: "Infra Client Version" },
  { key: "uptime", label: "Uptime" },
  { key: "platform", label: "Platform" },
  { key: "policyGroup", label: "Policy Group" },
  { key: "environment", label: "Environment" },
  { key: "summary", label: "Resources" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];


function SummaryChips({ summary }: { summary: ClientRun["summary"] }) {
  const items = [
    { status: "Success" as const, label: "Successful", value: summary.successful },
    { status: "Failed" as const, label: "Failed", value: summary.failed },
    { status: "Unchanged" as const, label: "Unchanged", value: summary.unchanged },
    { status: "Unprocessed" as const, label: "Unprocessed", value: summary.unprocessed },
  ];
  return (
    <div className="flex items-center gap-3">
      {items.map((item) => (
        <span
          key={item.status}
          title={`${item.label}: ${item.value}`}
          aria-label={`${item.label}: ${item.value}`}
          className="inline-flex cursor-default items-center gap-1 text-[13px] text-chef-text"
        >
          <StatusIcon status={item.status} className="h-[18px] w-[18px]" />
          {item.value}
        </span>
      ))}
    </div>
  );
}

export function ClientRunsList({
  detailTo = "/reporting/client/$runId",
}: {
  detailTo?: ClientRunDetailPath;
}) {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState<Set<ColumnKey>>(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [policyFilter, setPolicyFilter] = useState("all");

  const table = useTableControls({
    rows: clientRuns as unknown as Record<string, unknown>[],
    searchFields: ["node", "policyGroup", "platform", "environment", "id"],
    initialPageSize: 10,
  });
  const allRows = table.rows as unknown as ClientRun[];

  const uniq = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort();
  const countBy = (predicate: (run: ClientRun) => boolean) =>
    clientRuns.filter(predicate).length;

  const filterGroups: FilterGroup[] = [
    {
      id: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { key: "all", label: "All statuses", count: clientRuns.length },
        { key: "Success", label: "Success", count: countBy((r) => r.status === "Success") },
        { key: "Failed", label: "Failed", count: countBy((r) => r.status === "Failed") },
      ],
    },
    {
      id: "platform",
      label: "Platform",
      value: platformFilter,
      onChange: setPlatformFilter,
      options: [
        { key: "all", label: "All platforms" },
        ...uniq(clientRuns.map((r) => r.platform)).map((p) => ({
          key: p,
          label: p,
          count: countBy((r) => r.platform === p),
        })),
      ],
    },
    {
      id: "environment",
      label: "Environment",
      value: environmentFilter,
      onChange: setEnvironmentFilter,
      options: [
        { key: "all", label: "All environments" },
        ...uniq(clientRuns.map((r) => r.environment)).map((e) => ({
          key: e,
          label: e,
          count: countBy((r) => r.environment === e),
        })),
      ],
    },
    {
      id: "policyGroup",
      label: "Policy Group",
      value: policyFilter,
      onChange: setPolicyFilter,
      options: [
        { key: "all", label: "All policy groups" },
        ...uniq(clientRuns.map((r) => r.policyGroup)).map((g) => ({
          key: g,
          label: g,
          count: countBy((r) => r.policyGroup === g),
        })),
      ],
    },
  ];

  const rows = allRows.filter(
    (run) =>
      (statusFilter === "all" || run.status === statusFilter) &&
      (platformFilter === "all" || run.platform === platformFilter) &&
      (environmentFilter === "all" || run.environment === environmentFilter) &&
      (policyFilter === "all" || run.policyGroup === policyFilter),
  );

  const show = (key: ColumnKey) => !hidden.has(key);
  const visibleColumns = COLUMNS.filter((c) => show(c.key));

  return (
    <>
      <h1 className="text-[28px] font-semibold text-chef-text">Client Runs</h1>

      <div className="mt-6">
        <ResultsToolbar
          title="Run Records"
          resultLabel={`Showing ${rows.length} results`}
          query={table.query}
          onQueryChange={table.search}
          searchLabel="Search runs..."
          filterGroups={filterGroups}
          actions={[{ label: "Download as CSV" }, { label: "Download as JSON" }]}
          columns={COLUMNS.map((c) => ({ key: c.key, label: c.label }))}
          isColumnVisible={(key) => show(key as ColumnKey)}
          onToggleColumn={(key) =>
            setHidden((prev) => {
              const next = new Set(prev);
              const k = key as ColumnKey;
              if (next.has(k)) next.delete(k);
              else next.add(k);
              return next;
            })
          }
        />

        <div className="overflow-x-auto rounded-sm border border-chef-line bg-chef-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-chef-line bg-chef-canvas">
                {visibleColumns.map((col) =>
                  col.key === "summary" ? (
                    <th key={col.key} className="px-4 py-3 text-[13px] font-semibold text-chef-text">
                      {col.label}
                    </th>
                  ) : (
                    <SortHeader
                      key={col.key}
                      label={col.label}
                      columnKey={col.key}
                      sortKey={table.sortKey}
                      sortDirection={table.sortDirection}
                      onSort={table.toggleSort}
                    />
                  ),
                )}
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((run) => (
                <tr
                  key={run.id}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open run details for ${run.node}`}
                  onClick={() => navigate({ to: detailTo, params: { runId: run.id } })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate({ to: detailTo, params: { runId: run.id } });
                    }
                  }}
                  className="cursor-pointer border-b border-chef-line last:border-0 hover:bg-chef-canvas/70"
                >
                  {show("node") && <td className="px-4 py-3 text-[13px] text-chef-text">{run.node}</td>}
                  {show("status") && (
                    <td className="px-4 py-3">
                      <StatusPill status={run.status} />
                    </td>
                  )}
                  {show("lastRun") && <td className="px-4 py-3 text-[13px] text-chef-text">{run.lastRun}</td>}
                  {show("infraClientVersion") && (
                    <td className="px-4 py-3 text-[13px] text-chef-text">{run.infraClientVersion}</td>
                  )}
                  {show("uptime") && <td className="px-4 py-3 text-[13px] text-chef-text">{run.uptime}</td>}
                  {show("platform") && <td className="px-4 py-3 text-[13px] text-chef-text">{run.platform}</td>}
                  {show("policyGroup") && <td className="px-4 py-3 text-[13px] text-chef-text">{run.policyGroup || "—"}</td>}
                  {show("environment") && <td className="px-4 py-3 text-[13px] text-chef-text">{run.environment || "—"}</td>}
                  {show("summary") && (
                    <td className="px-4 py-3">
                      <SummaryChips summary={run.summary} />
                    </td>
                  )}
                  <td className="px-3 py-3" />
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-4 py-10 text-center text-[13px] text-chef-text-muted">
                    No client runs match the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-4 text-[13px] text-chef-text">
          <span>
            <span className="font-semibold">
              {table.rangeStart} – {table.rangeEnd}
            </span>{" "}
            of {table.total} items
          </span>
          <div className="flex items-center gap-3 text-chef-text-muted">
            <button
              type="button"
              aria-label="Previous page"
              disabled={table.page === 1}
              onClick={() => table.setPage(table.page - 1)}
              className="hover:text-chef-blue disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={table.page === table.pageCount}
              onClick={() => table.setPage(table.page + 1)}
              className="hover:text-chef-blue disabled:opacity-40"
            >
              →
            </button>
          </div>
          <select
            aria-label="Items per page"
            value={table.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-9 rounded-sm border border-chef-line bg-chef-surface px-2 text-[13px] text-chef-text outline-none"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} items per page
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
