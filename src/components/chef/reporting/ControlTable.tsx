import { Fragment, useState } from "react";
import { Check, Copy, Minus, Plus } from "lucide-react";
import { StatusIcon } from "../StatusPill";
import { SeverityLabel } from "./CountCards";
import type { ControlDetail } from "@/data/complianceDetail";

export function SourceBlock({ source }: { source: string }) {
  const [copied, setCopied] = useState(false);
  const lines = source.replace(/\n$/, "").split("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="overflow-hidden rounded-sm border border-chef-line bg-chef-code-bg">
      <div className="flex justify-end border-b border-chef-line px-2 py-1.5">
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-[12px] text-chef-text-muted hover:bg-chef-canvas hover:text-chef-text"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2 text-[12px] leading-relaxed text-chef-text">
        <code>
          {lines.map((line, i) => (
            <span key={i} className="grid grid-cols-[2rem_1fr] gap-2">
              <span className="select-none text-right text-chef-text-muted">{i + 1}</span>
              <span>{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border-b border-chef-line pb-2">
      <div className="text-[13px] font-semibold text-chef-text">{title}</div>
      {hint && <div className="mt-0.5 text-[12px] text-chef-text-muted">{hint}</div>}
    </div>
  );
}

export function ControlResults({ control }: { control: ControlDetail }) {
  const skipped = control.status === "Skipped" || control.status === "Waived";

  return (
    <div className="space-y-5">
      <div className="border-b border-chef-line pb-3">
        <div className="flex items-center gap-2 text-[12px] font-medium text-chef-text-muted">
          Control details
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="text-[14px] font-semibold text-chef-text">{control.key}</div>
          <SeverityLabel severity={control.severity} impact={control.impact} />
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-chef-text-muted">{control.title}</p>
      </div>

      <section className="space-y-2">
        <SectionHeading title="Results" />
        {skipped ? (
          <div className="flex items-start gap-2.5 rounded-sm border border-chef-amber/40 bg-chef-amber/10 px-3 py-2.5">
            <StatusIcon status={control.status} className="mt-0.5 h-4 w-4" />
            <span>
              <span className="block text-[13px] font-medium text-chef-text">
                {control.status} Control
              </span>
              <span className="mt-0.5 block text-[12px] text-chef-text-muted">
                {control.results[0]?.message ??
                  control.results[0]?.description ??
                  `${control.status} due to a control condition.`}
              </span>
            </span>
          </div>
        ) : (
          <ul className="space-y-2">
            {control.results.map((result, i) => (
              <li
                key={`${result.description}-${i}`}
                className="flex items-start gap-2.5 rounded-sm border border-chef-line bg-chef-surface px-3 py-2.5"
              >
                <StatusIcon status={result.status} className="mt-0.5 h-4 w-4" />
                <span className="flex-1">
                  <span className="block text-[13px] text-chef-text">{result.description}</span>
                  {result.message && (
                    <span className="mt-1 block text-[12px] text-chef-red">{result.message}</span>
                  )}
                </span>
                <span className="text-[12px] text-chef-text-muted">{result.duration}</span>
              </li>
            ))}
            {control.results.length === 0 && (
              <li className="rounded-sm border border-chef-line bg-chef-surface px-3 py-2.5 text-[12px] text-chef-text-muted">
                No test results recorded for this control.
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeading title="Source" />
        <SourceBlock source={control.source} />
      </section>
    </div>
  );
}


export function ControlTable({
  controls,
  toolbar,
  onScanResults,
}: {
  controls: ControlDetail[];
  toolbar?: React.ReactNode;
  onScanResults?: (control: ControlDetail) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-sm border border-chef-line bg-chef-surface">
      {toolbar && <div className="border-b border-chef-line px-3 pt-3">{toolbar}</div>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-chef-line bg-chef-canvas">
              <th className="px-4 py-3 text-[13px] font-semibold text-chef-text">
                {controls.length} Controls
              </th>
              <th className="w-[170px] px-4 py-3 text-[13px] font-semibold text-chef-text">Impact</th>
              <th className="w-[220px] px-4 py-3 text-[13px] font-semibold text-chef-text">
                Test Results
              </th>
              <th className="w-[150px] px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {controls.map((control) => {
              const open = expanded.has(control.id);
              const tally = {
                Failed: control.results.filter((r) => r.status === "Failed").length,
                Passed: control.results.filter((r) => r.status === "Passed").length,
                Skipped: control.results.filter((r) => r.status === "Skipped").length,
                Waived: control.status === "Waived" ? 1 : 0,
              } as const;
              return (
                <Fragment key={control.id}>
                  <tr className="border-b border-chef-line align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <StatusIcon status={control.status} className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <div className="break-all text-[13px] font-semibold text-chef-text">
                            {control.key}:
                          </div>
                          <div className="text-[13px] text-chef-text-muted">{control.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityLabel severity={control.severity} impact={control.impact} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(["Failed", "Passed", "Skipped", "Waived"] as const).map((s) => (
                          <span key={s} className="flex items-center gap-1" title={s}>
                            <StatusIcon
                              status={s}
                              className={`h-4 w-4 ${tally[s] === 0 ? "opacity-40" : ""}`}
                            />
                            <span className="text-[13px] text-chef-text-muted">{tally[s]}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (onScanResults) {
                            onScanResults(control);
                          } else {
                            toggle(control.id);
                          }
                        }}
                        className="rounded-sm border border-chef-blue px-3 py-1.5 text-[12px] font-medium text-chef-blue hover:bg-chef-blue/10"
                      >
                        Scan Results
                      </button>
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-b border-chef-line">
                      <td colSpan={4} className="bg-chef-canvas/60 px-4 py-4">
                        <ControlResults control={control} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {controls.length === 0 && (
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
  );
}

