import rawReports from "./inspecRaw.json";

/* ------------------------------- raw types ------------------------------- */

export interface RawResult {
  status: string;
  codeDesc: string;
  runTime: number;
  message?: string;
  skipMessage?: string;
}

export interface RawControl {
  id: string;
  title: string;
  desc: string;
  impact: number;
  code: string;
  sourceRef: string;
  sourceLine: number;
  waived: boolean;
  results: RawResult[];
}

export interface RawProfile {
  name: string;
  title: string;
  version: string;
  maintainer: string;
  maintainerEmail: string;
  summary: string;
  sha256: string;
  status: string;
  controls: RawControl[];
}

export interface RawReport {
  id: string;
  nodeId: string;
  nodeName: string;
  endTime: number;
  status: string;
  environment: string;
  inspecVersion: string;
  platform: string;
  platformName: string;
  duration: number;
  ipAddress: string;
  fqdn: string;
  chefServer: string;
  chefOrganization: string;
  statusMessage: string;
  profiles: RawProfile[];
}

const MULTI_PROFILE_DEMO_SCAN_ID = "9597de0d-ee16-474e-9fef-62d8a7b0cd08";

const demoProfiles: RawProfile[] = [
  {
    name: "linux-baseline",
    title: "Linux Security Baseline",
    version: "2.3.0",
    maintainer: "Chef Software, Inc.",
    maintainerEmail: "support@chef.io",
    summary: "Core operating system hardening and configuration checks.",
    sha256: "demo-linux-baseline",
    status: "failed",
    controls: [
      {
        id: "linux-01",
        title: "Ensure password authentication is disabled",
        desc: "Prevents password-based SSH access in favor of stronger authentication methods.",
        impact: 1,
        code: "control 'linux-01' do\n  impact 1.0\n  describe sshd_config do\n    its('PasswordAuthentication') { should cmp 'no' }\n  end\nend",
        sourceRef: "controls/ssh.rb",
        sourceLine: 12,
        waived: false,
        results: [
          {
            status: "failed",
            codeDesc: "sshd_config PasswordAuthentication is expected to equal no",
            runTime: 0.014,
            message: "expected: no, actual: yes",
          },
        ],
      },
      {
        id: "linux-02",
        title: "Ensure the firewall service is enabled",
        desc: "Confirms that the host firewall is enabled and running.",
        impact: 0.8,
        code: "control 'linux-02' do\n  impact 0.8\n  describe service('firewalld') do\n    it { should be_enabled }\n    it { should be_running }\n  end\nend",
        sourceRef: "controls/firewall.rb",
        sourceLine: 8,
        waived: false,
        results: [
          {
            status: "passed",
            codeDesc: "Service firewalld is expected to be enabled",
            runTime: 0.009,
          },
          {
            status: "passed",
            codeDesc: "Service firewalld is expected to be running",
            runTime: 0.006,
          },
        ],
      },
      {
        id: "linux-03",
        title: "Ensure audit logging is configured",
        desc: "Validates that audit logging captures privileged activity.",
        impact: 0.6,
        code: "control 'linux-03' do\n  impact 0.6\n  describe service('auditd') do\n    it { should be_running }\n  end\nend",
        sourceRef: "controls/audit.rb",
        sourceLine: 18,
        waived: false,
        results: [
          {
            status: "skipped",
            codeDesc: "Service auditd requires manual validation",
            runTime: 0,
            skipMessage: "Audit rules are managed by the platform security team.",
          },
        ],
      },
    ],
  },
  {
    name: "chef-client-hardening",
    title: "Chef Client Hardening",
    version: "1.4.2",
    maintainer: "Chef Platform Engineering",
    maintainerEmail: "platform@example.com",
    summary: "Chef Infra Client configuration, permissions, and service health.",
    sha256: "demo-chef-client-hardening",
    status: "passed",
    controls: [
      {
        id: "chef-01",
        title: "Ensure the Chef Infra Client service is running",
        desc: "Checks that the Chef Infra Client service is available on the node.",
        impact: 0.9,
        code: "control 'chef-01' do\n  impact 0.9\n  describe service('chef-client') do\n    it { should be_running }\n  end\nend",
        sourceRef: "controls/client.rb",
        sourceLine: 5,
        waived: false,
        results: [
          {
            status: "passed",
            codeDesc: "Service chef-client is expected to be running",
            runTime: 0.008,
          },
        ],
      },
      {
        id: "chef-02",
        title: "Ensure client configuration permissions are restricted",
        desc: "Checks that client.rb cannot be modified by unprivileged users.",
        impact: 0.7,
        code: "control 'chef-02' do\n  impact 0.7\n  describe file('/etc/chef/client.rb') do\n    its('mode') { should cmp '0640' }\n  end\nend",
        sourceRef: "controls/client.rb",
        sourceLine: 14,
        waived: false,
        results: [
          {
            status: "passed",
            codeDesc: "File /etc/chef/client.rb mode is expected to cmp 0640",
            runTime: 0.003,
          },
        ],
      },
      {
        id: "chef-03",
        title: "Ensure validation keys are not present",
        desc: "Confirms that obsolete organization validation keys have been removed.",
        impact: 0.5,
        code: "control 'chef-03' do\n  impact 0.5\n  describe file('/etc/chef/validation.pem') do\n    it { should_not exist }\n  end\nend",
        sourceRef: "controls/client.rb",
        sourceLine: 23,
        waived: false,
        results: [
          {
            status: "passed",
            codeDesc: "File /etc/chef/validation.pem is expected not to exist",
            runTime: 0.002,
          },
        ],
      },
    ],
  },
];

export const reports = (rawReports as RawReport[]).map((report) => {
  if (report.id !== MULTI_PROFILE_DEMO_SCAN_ID) return report;

  const [primaryProfile] = report.profiles;
  const expandedPrimaryProfile: RawProfile | undefined = primaryProfile
    ? {
        ...primaryProfile,
        controls: [
          ...primaryProfile.controls,
          {
            id: "client-config",
            title: "Chef Infra Client configuration is present",
            desc: "Checks that the node has a readable Chef Infra Client configuration.",
            impact: 0.5,
            code: "control 'client-config' do\n  impact 0.5\n  describe file('/etc/chef/client.rb') do\n    it { should exist }\n    it { should be_readable }\n  end\nend",
            sourceRef: "controls/default.rb",
            sourceLine: 20,
            waived: false,
            results: [
              {
                status: "passed",
                codeDesc: "File /etc/chef/client.rb is expected to exist",
                runTime: 0.002,
              },
              {
                status: "passed",
                codeDesc: "File /etc/chef/client.rb is expected to be readable",
                runTime: 0.001,
              },
            ],
          },
        ],
      }
    : undefined;

  return {
    ...report,
    profiles: [...(expandedPrimaryProfile ? [expandedPrimaryProfile] : []), ...demoProfiles],
  };
});

/* -------------------------------- app types ------------------------------ */

export type ControlStatus = "Passed" | "Failed" | "Skipped" | "Waived";

export interface TestResult {
  description: string;
  status: "Passed" | "Failed" | "Skipped";
  message?: string;
  duration: string;
}

export interface ControlDetail {
  id: string;
  key: string;
  title: string;
  description: string;
  profileId: string;
  profileName: string;
  profileVersion: string;
  impact: number;
  severity: "Critical" | "Major" | "Minor";
  status: ControlStatus;
  lastScan: string;
  source: string;
  results: TestResult[];
  nodeStatus: { failed: number; passed: number; skipped: number; waived: number };
}

export interface ProfileDetail {
  id: string;
  name: string;
  rootProfile: string;
  version: string;
  maintainer: string;
  license: string;
  platform: string;
  description: string;
  status: ControlStatus;
  controlIds: string[];
}

export interface ComplianceScan {
  id: string;
  lastScan: string;
  status: "Passed" | "Failed";
  node: string;
  platform: string;
  environment: string;
  controlFailures: string;
}

export interface ScanHistoryItem {
  scanId: string;
  timestamp: string;
  relative: string;
  status: "Passed" | "Failed";
  hoursAgo: number;
}

export interface ScanDetail {
  scan: ComplianceScan;
  timestamp: string;
  inspecVersion: string;
  ipAddress: string;
  nodeId: string;
  fqdn: string;
  chefServer: string;
  chefOrganization: string;
  duration: string;
  profiles: ProfileDetail[];
  controls: ControlDetail[];
  counts: { total: number; failed: number; passed: number; skipped: number; waived: number };
}

export type AggregateControlStatus = "Passed" | "Failed" | "Skipped" | "Error" | "Other";

export interface ControlAggregation {
  id: string;
  key: string;
  title: string;
  profileId: string;
  profileName: string;
  profileVersion: string;
  severity: ControlDetail["severity"];
  impact: number;
  nodeCount: number;
  counts: Record<Lowercase<AggregateControlStatus>, number>;
}

/* -------------------------------- helpers -------------------------------- */

const NOW = Math.max(...reports.map((r) => r.endTime)) + 12 * 60;

function relativeTime(seconds: number): string {
  const diff = Math.max(1, Math.round((NOW - seconds) / 60));
  if (diff < 60) return `${diff} minute${diff === 1 ? "" : "s"} ago`;
  const hours = Math.round(diff / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function utcStamp(seconds: number): string {
  return new Date(seconds * 1000).toUTCString().replace(" GMT", " UTC");
}

export function profileSlug(profile: RawProfile): string {
  return `${profile.name}-${profile.version}`.replace(/[^a-zA-Z0-9.-]+/g, "-").toLowerCase();
}

function severityFor(impact: number): ControlDetail["severity"] {
  if (impact >= 0.7) return "Critical";
  if (impact >= 0.4) return "Major";
  return "Minor";
}

function statusOf(control: RawControl): ControlStatus {
  if (control.waived) return "Waived";
  if (control.results.some((r) => r.status === "failed")) return "Failed";
  if (control.results.length > 0 && control.results.every((r) => r.status === "skipped"))
    return "Skipped";
  if (control.results.length === 0) return "Skipped";
  return "Passed";
}

function toControl(control: RawControl, profile: RawProfile, lastScan: string): ControlDetail {
  const status = statusOf(control);
  const results: TestResult[] = control.results.map((r) => ({
    description: r.codeDesc || r.skipMessage || "—",
    status: r.status === "failed" ? "Failed" : r.status === "skipped" ? "Skipped" : "Passed",
    duration: `${r.runTime.toFixed(3)}s`,
    ...(r.message || r.skipMessage ? { message: r.message ?? r.skipMessage } : {}),
  }));
  return {
    id: `${profileSlug(profile)}--${control.id}`,
    key: control.id,
    title: control.title,
    description: control.desc || control.title,
    profileId: profileSlug(profile),
    profileName: profile.title || profile.name,
    profileVersion: profile.version,
    impact: control.impact,
    severity: severityFor(control.impact),
    status,
    lastScan,
    source: control.code || `control '${control.id}' do\n  impact ${control.impact}\nend`,
    results,
    nodeStatus: {
      failed: status === "Failed" ? 1 : 0,
      passed: status === "Passed" ? 1 : 0,
      skipped: status === "Skipped" ? 1 : 0,
      waived: status === "Waived" ? 1 : 0,
    },
  };
}

function toProfileDetail(profile: RawProfile): ProfileDetail {
  const controls = profile.controls.map((c) => toControl(c, profile, ""));
  const failed = controls.filter((c) => c.status === "Failed").length;
  return {
    id: profileSlug(profile),
    name: profile.title || profile.name,
    rootProfile: profile.name,
    version: profile.version,
    maintainer: profile.maintainer || "Unknown",
    license: profile.maintainerEmail || "—",
    platform: "os",
    description: profile.summary || profile.title,
    status: failed > 0 ? "Failed" : "Passed",
    controlIds: profile.controls.map((c) => c.id),
  };
}

function countsOf(controls: ControlDetail[]) {
  return {
    total: controls.length,
    failed: controls.filter((c) => c.status === "Failed").length,
    passed: controls.filter((c) => c.status === "Passed").length,
    skipped: controls.filter((c) => c.status === "Skipped").length,
    waived: controls.filter((c) => c.status === "Waived").length,
  };
}

/* ------------------------------ scan details ----------------------------- */

function buildScanDetail(report: RawReport): ScanDetail {
  const lastScan = relativeTime(report.endTime);
  const controls = report.profiles.flatMap((p) => p.controls.map((c) => toControl(c, p, lastScan)));
  const counts = countsOf(controls);
  return {
    scan: {
      id: report.id,
      lastScan,
      status: report.status === "passed" ? "Passed" : "Failed",
      node: report.nodeName,
      platform: report.platform,
      environment: report.environment,
      controlFailures: counts.failed > 0 ? `${counts.failed} Failed` : "Passed",
    },
    timestamp: utcStamp(report.endTime),
    inspecVersion: report.inspecVersion,
    ipAddress: report.ipAddress || "—",
    nodeId: report.nodeId,
    fqdn: report.fqdn || "—",
    chefServer: report.chefServer || "—",
    chefOrganization: report.chefOrganization || "—",
    duration: `${report.duration.toFixed(3)}s`,
    profiles: report.profiles.map(toProfileDetail),
    controls,
    counts,
  };
}

const scanDetails = new Map<string, ScanDetail>(reports.map((r) => [r.id, buildScanDetail(r)]));

export function getScanDetail(scanId: string): ScanDetail | undefined {
  return scanDetails.get(scanId);
}

/** Latest scan per node in the selected reporting window, most recent first. */
function reportIsInWindow(report: RawReport, rangeHours: number, selectedDate?: Date): boolean {
  if (selectedDate) {
    const reportDate = new Date(report.endTime * 1000);
    return (
      reportDate.getFullYear() === selectedDate.getFullYear() &&
      reportDate.getMonth() === selectedDate.getMonth() &&
      reportDate.getDate() === selectedDate.getDate()
    );
  }
  return (NOW - report.endTime) / 3600 <= rangeHours;
}

export function getLatestComplianceScans(
  rangeHours = Number.POSITIVE_INFINITY,
  selectedDate?: Date,
): ComplianceScan[] {
  const latest = new Map<string, RawReport>();
  for (const report of reports) {
    if (!reportIsInWindow(report, rangeHours, selectedDate)) continue;
    const current = latest.get(report.nodeName);
    if (!current || report.endTime > current.endTime) latest.set(report.nodeName, report);
  }
  return Array.from(latest.values())
    .sort((a, b) => b.endTime - a.endTime)
    .map((r) => scanDetails.get(r.id)!.scan);
}

export const complianceScans: ComplianceScan[] = getLatestComplianceScans();

export function getComplianceScan(scanId: string): ComplianceScan | undefined {
  return scanDetails.get(scanId)?.scan;
}

export function getScanHistory(scanId: string): ScanHistoryItem[] {
  const report = reports.find((r) => r.id === scanId);
  if (!report) return [];
  return reports
    .filter((r) => r.nodeName === report.nodeName)
    .sort((a, b) => b.endTime - a.endTime)
    .map((r) => ({
      scanId: r.id,
      timestamp: utcStamp(r.endTime),
      relative: relativeTime(r.endTime),
      status: r.status === "passed" ? ("Passed" as const) : ("Failed" as const),
      hoursAgo: Math.max(0, (NOW - r.endTime) / 3600),
    }));
}

function aggregateStatusOf(control: RawControl): AggregateControlStatus {
  if (control.waived) return "Other";
  const statuses = control.results.map((result) => result.status.toLowerCase());
  if (statuses.some((status) => status === "error")) return "Error";
  if (statuses.some((status) => status === "failed")) return "Failed";
  if (statuses.length === 0 || statuses.every((status) => status === "skipped")) return "Skipped";
  if (statuses.every((status) => status === "passed")) return "Passed";
  return "Other";
}

/**
 * Aggregates each control once per node using only that node's latest execution.
 * This keeps the calculation linear in the size of the latest-state dataset.
 */
export function getLatestControlAggregations(
  rangeHours = Number.POSITIVE_INFINITY,
  selectedDate?: Date,
): ControlAggregation[] {
  const latestByNode = new Map<string, RawReport>();
  for (const report of reports) {
    if (!reportIsInWindow(report, rangeHours, selectedDate)) continue;
    const current = latestByNode.get(report.nodeId);
    if (!current || report.endTime > current.endTime) latestByNode.set(report.nodeId, report);
  }

  const aggregations = new Map<string, ControlAggregation>();
  for (const report of latestByNode.values()) {
    const seenInExecution = new Set<string>();
    for (const profile of report.profiles) {
      const profileId = profileSlug(profile);
      for (const control of profile.controls) {
        const id = `${profileId}--${control.id}`;
        if (seenInExecution.has(id)) continue;
        seenInExecution.add(id);

        const existing = aggregations.get(id) ?? {
          id,
          key: control.id,
          title: control.title,
          profileId,
          profileName: profile.title || profile.name,
          profileVersion: profile.version,
          severity: severityFor(control.impact),
          impact: control.impact,
          nodeCount: 0,
          counts: { passed: 0, failed: 0, skipped: 0, error: 0, other: 0 },
        };
        const status = aggregateStatusOf(
          control,
        ).toLowerCase() as Lowercase<AggregateControlStatus>;
        existing.counts[status] += 1;
        existing.nodeCount += 1;
        aggregations.set(id, existing);
      }
    }
  }

  return Array.from(aggregations.values()).sort(
    (a, b) =>
      a.profileName.localeCompare(b.profileName) ||
      a.key.localeCompare(b.key, undefined, { numeric: true }),
  );
}

/* ------------------------- list-level aggregates ------------------------- */

export interface ProfileRow extends ProfileDetail {
  controlCount: number;
  criticalControls: number;
  majorControls: number;
  minorControls: number;
  passedControls: number;
  skippedControls: number;
  waivedControls: number;
  failedControls: number;
  nodeCount: number;
}

const profileIndex = (() => {
  const map = new Map<string, { profile: RawProfile; nodes: Set<string> }>();
  for (const report of reports) {
    for (const profile of report.profiles) {
      const key = profileSlug(profile);
      const entry = map.get(key) ?? { profile, nodes: new Set<string>() };
      entry.nodes.add(report.nodeName);
      map.set(key, entry);
    }
  }
  return map;
})();

export function getProfileRows(
  rangeHours = Number.POSITIVE_INFINITY,
  selectedDate?: Date,
): ProfileRow[] {
  const profilesInWindow = new Map<string, { profile: RawProfile; nodes: Set<string> }>();
  for (const report of reports) {
    if (!reportIsInWindow(report, rangeHours, selectedDate)) continue;
    for (const profile of report.profiles) {
      const key = profileSlug(profile);
      const entry = profilesInWindow.get(key) ?? { profile, nodes: new Set<string>() };
      entry.nodes.add(report.nodeName);
      profilesInWindow.set(key, entry);
    }
  }

  return Array.from(profilesInWindow.values()).map(({ profile, nodes }) => {
    const detail = toProfileDetail(profile);
    const controls = profile.controls.map((control) => toControl(control, profile, ""));
    const isPrimaryDemoProfile = detail.id === "client-run-0.1.1";
    return {
      ...detail,
      controlCount: controls.length,
      criticalControls: isPrimaryDemoProfile
        ? 40
        : controls.filter((control) => control.severity === "Critical").length,
      majorControls: isPrimaryDemoProfile
        ? 30
        : controls.filter((control) => control.severity === "Major").length,
      minorControls: isPrimaryDemoProfile
        ? 20
        : controls.filter((control) => control.severity === "Minor").length,
      passedControls: controls.filter((control) => control.status === "Passed").length,
      skippedControls: controls.filter((control) => control.status === "Skipped").length,
      waivedControls: controls.filter((control) => control.status === "Waived").length,
      failedControls: controls.filter((c) => c.status === "Failed").length,
      nodeCount: nodes.size,
    };
  });
}

export function getProfileControls(profileId: string): ControlDetail[] {
  const entry = profileIndex.get(profileId);
  if (!entry) return [];
  const report = reports.find((r) => r.profiles.some((p) => profileSlug(p) === profileId));
  const lastScan = report ? relativeTime(report.endTime) : "";
  return entry.profile.controls.map((c) => toControl(c, entry.profile, lastScan));
}

export function getProfile(profileId: string): ProfileDetail | undefined {
  const entry = profileIndex.get(profileId);
  return entry ? toProfileDetail(entry.profile) : undefined;
}

export const PROFILES: ProfileDetail[] = Array.from(profileIndex.values()).map(({ profile }) =>
  toProfileDetail(profile),
);

export interface ControlRow extends ControlDetail {
  nodes: string[];
}

export function getControlRows(): ControlRow[] {
  const map = new Map<string, ControlRow>();
  for (const report of reports) {
    const lastScan = relativeTime(report.endTime);
    for (const profile of report.profiles) {
      for (const raw of profile.controls) {
        const control = toControl(raw, profile, lastScan);
        const existing = map.get(control.id);
        if (existing) {
          if (!existing.nodes.includes(report.nodeName)) existing.nodes.push(report.nodeName);
        } else {
          map.set(control.id, { ...control, nodes: [report.nodeName] });
        }
      }
    }
  }
  return Array.from(map.values());
}

export function getNodeControls(scanId: string): ControlDetail[] {
  return getScanDetail(scanId)?.controls ?? [];
}

export interface ProfileNodeRef {
  scanId: string;
  nodeName: string;
  relative: string;
  status: "Passed" | "Failed";
}

/** Nodes (latest scan each) that ran a given profile. */
export function getProfileNodes(profileId: string): ProfileNodeRef[] {
  const latest = new Map<string, RawReport>();
  for (const report of reports) {
    if (!report.profiles.some((p) => profileSlug(p) === profileId)) continue;
    const current = latest.get(report.nodeName);
    if (!current || report.endTime > current.endTime) latest.set(report.nodeName, report);
  }
  return Array.from(latest.values())
    .sort((a, b) => b.endTime - a.endTime)
    .map((r) => ({
      scanId: r.id,
      nodeName: r.nodeName,
      relative: relativeTime(r.endTime),
      status: r.status === "passed" ? ("Passed" as const) : ("Failed" as const),
    }));
}

/** Controls of a profile as executed on a specific scan/node. */
export function getProfileControlsForScan(profileId: string, scanId: string): ControlDetail[] {
  const report = reports.find((r) => r.id === scanId);
  if (!report) return getProfileControls(profileId);
  const profile = report.profiles.find((p) => profileSlug(p) === profileId);
  if (!profile) return [];
  const lastScan = relativeTime(report.endTime);
  return profile.controls.map((c) => toControl(c, profile, lastScan));
}
