import { useMemo, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ModuleLayout } from "@/components/chef/ModuleLayout";
import { reportingRailItems } from "@/components/chef/rails";
import { StatusPill } from "@/components/chef/StatusPill";
import { SplitButton } from "@/components/chef/TableToolbar";
import { ResultsToolbar } from "@/components/chef/reporting/ResultsToolbar";
import { ControlTable } from "@/components/chef/reporting/ControlTable";
import { ScanResultsDrawer } from "@/components/chef/reporting/ScanResultsDrawer";
import { getProfile, getProfileControls } from "@/data/complianceDetail";


export const Route = createFileRoute("/reporting/inspec/profile/$profileId")({
  loader: ({ params }) => {
    const profile = getProfile(params.profileId);
    if (!profile) throw notFound();
    return { profile, controls: getProfileControls(params.profileId) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Unavailable — InSpec Reporting" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.profile.name} — Profile Details — Reporting`;
    const description = `Controls and metadata for the InSpec profile ${loaderData.profile.name} v${loaderData.profile.version}.`;
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
  component: ProfileDetailsPage,
});

function ProfileDetailsPage() {
  const { profile, controls } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [selectedControl, setSelectedControl] = useState<(typeof controls)[number] | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return controls.filter((control) => {
      if (!q) return true;
      return `${control.key} ${control.title}`.toLowerCase().includes(q);
    });
  }, [controls, query]);

  return (
    <ModuleLayout
      moduleTitle="Reporting"
      railItems={reportingRailItems}
      crumbs={[
        { label: "Reporting", to: "/reporting" },
        { label: "InSpec Reporting", to: "/reporting/inspec" },
        { label: "Profile Details" },
      ]}
    >
      <div className="flex items-start justify-between gap-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-semibold text-chef-text">{profile.name}</h1>
            <StatusPill status={profile.status} />
          </div>
          <p className="mt-1.5 text-[13px] text-chef-text-muted">{profile.description}</p>
        </div>
        <SplitButton label="Export" />
      </div>

      <section className="mt-6 grid gap-4 rounded-sm border border-chef-line bg-chef-surface p-4 md:grid-cols-4">
        {[
          { label: "Version", value: profile.version },
          { label: "Identifier", value: profile.id },
          { label: "License", value: profile.license },
          { label: "Platform", value: profile.platform },
        ].map((item) => (
          <div key={item.label}>
            <div className="text-[13px] text-chef-text-muted">{item.label}</div>
            <div className="text-[14px] text-chef-text">{item.value}</div>
          </div>
        ))}
      </section>

      <div className="mt-6">
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
            />
          }
        />
      </div>

      <ScanResultsDrawer
        open={selectedControl !== null}
        onClose={() => setSelectedControl(null)}
        title="Scan Results"
        subtitle={selectedControl ? `${selectedControl.key}: ${selectedControl.title}` : ""}
        controls={selectedControl ? [selectedControl] : []}
      />
    </ModuleLayout>
  );
}
