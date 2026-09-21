import { createFileRoute, notFound } from "@tanstack/react-router";
import { nodes } from "@/data/nodes";
import { ModuleLayout } from "@/components/chef/ModuleLayout";
import { reportingRailItems } from "@/components/chef/rails";
import { ComplianceScanDetailPanel } from "@/components/chef/reporting/ComplianceScanDetailPanel";
import { getScanDetail, getScanHistory } from "@/data/complianceDetail";

const DEFAULT_CRUMBS = [
  { label: "Reporting", to: "/reporting" },
  { label: "InSpec Reporting", to: "/reporting/inspec" },
  { label: "Node Compliance" },
];

export const Route = createFileRoute("/reporting/inspec/$scanId")({
  validateSearch: (search: Record<string, unknown>): { node?: string } =>
    typeof search["node"] === "string" ? { node: search["node"] as string } : {},
  loader: ({ params }) => {
    const detail = getScanDetail(params.scanId);
    if (!detail) throw notFound();
    return { detail, history: getScanHistory(params.scanId) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable — InSpec Reporting" }, { name: "robots", content: "noindex" }],
      };
    }
    const { scan } = loaderData.detail;
    const title = `${scan.node} — Node Compliance — Reporting`;
    const description = `Execution history, profiles, and control results for ${scan.node} on ${scan.platform}.`;
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
  component: ComplianceScanDetailsPage,
});

function ComplianceScanDetailsPage() {
  const { detail, history } = Route.useLoaderData();
  const { node: nodeId } = Route.useSearch();
  const node = nodeId ? nodes.find((n) => n.id === nodeId) : undefined;
  const crumbs = node
    ? [
        { label: "Reporting", to: "/reporting" },
        { label: "Node Management Reporting", to: "/reporting/node-management" },
        { label: node.hostname, to: `/reporting/node-management/${node.id}` },
        { label: "All Operations/Jobs", to: `/reporting/node-management/${node.id}` },
        { label: "Node Compliance" },
      ]
    : DEFAULT_CRUMBS;

  return (
    <ModuleLayout moduleTitle="Reporting" railItems={reportingRailItems} crumbs={crumbs}>
      <ComplianceScanDetailPanel
        key={detail.scan.id}
        detail={detail}
        history={history}
        showDownload={false}
      />
    </ModuleLayout>
  );
}
