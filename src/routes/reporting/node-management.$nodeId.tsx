import { useMemo, useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Columns3, Filter, RotateCcw, Search, Star, Send } from "lucide-react";
import { ModuleLayout } from "@/components/chef/ModuleLayout";
import { reportingRailItems } from "@/components/chef/rails";
import { TabStrip } from "@/components/chef/TabStrip";
import { ChefButton } from "@/components/chef/Buttons";
import { NodeDetailsPanel } from "@/components/chef/NodeDetailsPanel";
import { Pager } from "@/components/chef/Pager";
import { StatusPill, type StatusKind } from "@/components/chef/StatusPill";
import { nodes } from "@/data/nodes";
import { getRunHistory, resolveBaseRunId } from "@/data/clientRunDetail";
import { getScanHistory } from "@/data/complianceDetail";
import { getRunIdForNode, getScanIdForNode } from "@/data/nodeReporting";

interface NodeEvent {
  id: string;
  type: "Client Run" | "Compliance Scan" | "Courier Job";
  name: string;
  status: StatusKind;
  when: string;
  owner: string;
  link?: { kind: "run" | "scan"; id: string };
}

const OWNERS = ["Manish", "Jon", "Nikitha", "Keerthi"];

export const Route = createFileRoute("/reporting/node-management/$nodeId")({
  loader: ({ params }) => {
    const node = nodes.find((n) => n.id === params.nodeId);
    if (!node) throw notFound();

    const runId = getRunIdForNode(node.id);
    const scanId = getScanIdForNode(node.id);
    const events: NodeEvent[] = [];

    if (runId) {
      getRunHistory(resolveBaseRunId(runId)).forEach((item, i) => {
        events.push({
          id: `run-${item.runId}`,
          type: "Client Run",
          name: node.hostname,
          status: item.status,
          when: item.relative,
          owner: OWNERS[i % OWNERS.length]!,
          link: { kind: "run", id: item.runId },
        });
      });
    }

    if (scanId) {
      getScanHistory(scanId).forEach((item, i) => {
        events.push({
          id: `scan-${item.scanId}-${i}`,
          type: "Compliance Scan",
          name: `CR-${item.scanId.slice(0, 8).toUpperCase()}`,
          status: item.status,
          when: item.relative,
          owner: OWNERS[(i + 1) % OWNERS.length]!,
          link: { kind: "scan", id: item.scanId },
        });
      });
    }

    ["enable apache2", "install apache2", "restart chef-client"].forEach((name, i) => {
      events.push({
        id: `job-${i}`,
        type: "Courier Job",
        name,
        status: i % 2 === 0 ? "Unprocessed" : "Success",
        when: "Sep 12, 2025",
        owner: OWNERS[(i + 2) % OWNERS.length]!,
      });
    });

    return { node, events };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Unavailable — Node Management Reporting" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `Node Report ${loaderData.node.ip} — Reporting`;
    const description = `Node details, attributes and all operations or jobs recorded for ${loaderData.node.ip}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: NodeReportPage,
});

function EventsTab({ events, nodeId }: { events: NodeEvent[]; nodeId: string }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (type !== "all" && e.type !== type) return false;
      if (!q) return true;
      return `${e.type} ${e.name} ${e.owner}`.toLowerCase().includes(q);
    });
  }, [events, status, type, query]);

  const reset = () => {
    setStatus("all");
    setType("all");
    setQuery("");
  };

  return (
    <section className="rounded-sm border border-chef-line bg-chef-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-chef-line px-4 py-2.5">
        <h2 className="text-[14px] font-semibold text-chef-text">
          All Event{" "}
          <span className="font-normal text-chef-text-muted">Showing {rows.length} results</span>
        </h2>
        <div className="flex items-center gap-3 text-chef-text-muted">
          {searchOpen && (
            <input
              autoFocus
              aria-label="Search events"
              placeholder="Search events"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 w-[200px] rounded-sm border border-chef-line px-2 text-[13px] text-chef-text outline-none focus:border-chef-blue"
            />
          )}
          <button
            type="button"
            aria-label="Search events"
            onClick={() => setSearchOpen((v) => !v)}
            className="hover:text-chef-blue"
          >
            <Search className="h-4 w-4" />
          </button>
          <span className="rounded-sm border border-chef-blue p-1 text-chef-blue">
            <Filter className="h-4 w-4" />
          </span>
          <button type="button" aria-label="Customize columns" className="hover:text-chef-blue">
            <Columns3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-chef-line px-4 py-2.5">
        <label className="inline-flex items-center gap-2 text-[13px] text-chef-text">
          Status:
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-8 rounded-sm border border-chef-line bg-chef-surface px-2 text-[13px] outline-none"
          >
            <option value="all">All</option>
            {["Success", "Failed", "Unchanged", "Unprocessed", "Passed"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-[13px] text-chef-text">
          Type:
          <select
            aria-label="Filter by type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-8 rounded-sm border border-chef-line bg-chef-surface px-2 text-[13px] outline-none"
          >
            <option value="all">All</option>
            {["Client Run", "Compliance Scan", "Courier Job"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-[13px] text-chef-blue hover:underline"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-chef-tablehead">
            {["Type", "Event Name", "Status", "Last Run/scan/Job Instance"].map((col) => (
              <th key={col} className="px-4 py-2.5 text-[13px] font-semibold text-chef-text">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-[13px] text-chef-text-muted">
                No events found for this node.
              </td>
            </tr>
          ) : (
            rows.map((event) => {
              const open = () => {
                if (!event.link) return;
                if (event.link.kind === "run") {
                  navigate({
                    to: "/reporting/client/$runId",
                    params: { runId: event.link.id },
                    search: { node: nodeId },
                  });
                } else {
                  navigate({
                    to: "/reporting/inspec/$scanId",
                    params: { scanId: event.link.id },
                    search: { node: nodeId },
                  });
                }
              };
              return (
              <tr
                key={event.id}
                {...(event.link
                  ? {
                      role: "link" as const,
                      tabIndex: 0,
                      "aria-label": `Open ${event.type} details for ${event.name}`,
                      onClick: open,
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          open();
                        }
                      },
                    }
                  : {})}
                className={`border-t border-chef-line hover:bg-chef-canvas/70 ${event.link ? "cursor-pointer" : ""}`}
              >
                <td className="px-4 py-3 text-[13px] text-chef-text">{event.type}</td>
                <td className="px-4 py-3 text-[13px] text-chef-text">{event.name}</td>
                <td className="px-4 py-3">
                  <StatusPill status={event.status} />
                </td>
                <td className="px-4 py-3 text-[13px] text-chef-text">{event.when}</td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>

      <Pager total={rows.length} pageSize={10} />
    </section>
  );
}

function NodeReportPage() {
  const { node, events } = Route.useLoaderData();
  const [tab, setTab] = useState("details");

  return (
    <ModuleLayout
      moduleTitle="Reporting"
      railItems={reportingRailItems}
      crumbs={[
        { label: "Reporting", to: "/reporting" },
        { label: "Node Management Reporting", to: "/reporting/node-management" },
        { label: node.hostname },
      ]}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-chef-text">
            {node.hostnameFull} <span className="text-chef-text-muted">(Node Name)</span>
          </h1>
          <p className="mt-1 text-[12px] text-chef-text-muted">Node ID: {node.nodeId}</p>
        </div>
        <div className="flex items-center gap-3">
          <ChefButton className="gap-2">
            <Star className="h-4 w-4" /> Archive Node
          </ChefButton>
          <ChefButton variant="outline" className="gap-2">
            <Send className="h-4 w-4" /> Create Courier Job
          </ChefButton>
        </div>
      </div>

      <div className="mt-5">
        <TabStrip
          tabs={[
            { id: "details", label: "Details" },
            { id: "events", label: "All Operations/Jobs" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-5">
        {tab === "details" ? <NodeDetailsPanel node={node} /> : <EventsTab events={events} nodeId={node.id} />}
      </div>
    </ModuleLayout>
  );
}
