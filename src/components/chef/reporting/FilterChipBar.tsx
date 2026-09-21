import { useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";

export interface FilterGroupOption {
  key: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterGroupOption[];
  value: string;
  onChange: (value: string) => void;
}

let chipSeq = 0;

/**
 * Additive filter bar (same design as Resource Execution): each chip is a
 * field + value pair, with "+ Filter" to add another field and "Reset".
 */
export function FilterChipBar({ groups }: { groups: FilterGroup[] }) {
  const [chips, setChips] = useState<{ id: number; field: string }[]>(() =>
    groups.map((g) => ({ id: ++chipSeq, field: g.id })),
  );

  const visible = chips.filter((c) => groups.some((g) => g.id === c.field));

  function addChip() {
    const used = new Set(visible.map((c) => c.field));
    const next = groups.find((g) => !used.has(g.id)) ?? groups[0];
    if (!next) return;
    setChips((prev) => [...prev, { id: ++chipSeq, field: next.id }]);
  }

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 pb-3">
      {visible.map((chip) => {
        const group = groups.find((g) => g.id === chip.field)!;
        return (
          <div
            key={chip.id}
            className="flex items-center gap-1 rounded-sm border border-chef-line bg-chef-surface pl-2 pr-1 text-[13px] text-chef-text"
          >
            <select
              aria-label="Filter field"
              value={chip.field}
              onChange={(e) => {
                const field = e.target.value;
                group.onChange("all");
                setChips((prev) => prev.map((c) => (c.id === chip.id ? { ...c, field } : c)));
              }}
              className="h-8 bg-transparent text-[13px] text-chef-text outline-none"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
            <span className="text-chef-text-muted">:</span>
            <select
              aria-label="Filter value"
              value={group.value}
              onChange={(e) => group.onChange(e.target.value)}
              className="h-8 max-w-[180px] bg-transparent text-[13px] text-chef-text outline-none"
            >
              {group.options.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Remove filter"
              onClick={() => {
                group.onChange("all");
                setChips((prev) => prev.filter((c) => c.id !== chip.id));
              }}
              className="text-chef-text-muted hover:text-chef-blue"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addChip}
        className="flex items-center gap-1 rounded-sm px-2 py-1.5 text-[13px] text-chef-green hover:text-chef-blue"
      >
        <Plus className="h-4 w-4" /> Filter
      </button>
      <button
        type="button"
        onClick={() => groups.forEach((g) => g.onChange("all"))}
        className="flex items-center gap-1 rounded-sm px-2 py-1.5 text-[13px] text-chef-text-muted hover:text-chef-blue"
      >
        <RotateCcw className="h-4 w-4" /> Reset
      </button>
    </div>
  );
}
