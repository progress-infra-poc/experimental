import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, RotateCcw, Search, X } from "lucide-react";

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
 * Compact filter chip bar matching the experimental compliance-scan design:
 * each card is a label + selected value dropdown, followed by Filter and Reset.
 */
export function FilterChipBar({
  groups,
  defaultFilterIds,
}: {
  groups: FilterGroup[];
  defaultFilterIds?: string[];
}) {
  const [chips, setChips] = useState<{ id: number; field: string }[]>(() =>
    groups
      .filter((g) => !defaultFilterIds || defaultFilterIds.includes(g.id))
      .map((g) => ({ id: ++chipSeq, field: g.id })),
  );
  const [filterQuery, setFilterQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(
    () => new Set(chips.map((c) => c.field)),
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  function commitPending() {
    setChips((prev) => {
      const kept = prev.filter((c) => pendingIds.has(c.field));
      const added = Array.from(pendingIds)
        .filter((field) => !kept.some((c) => c.field === field))
        .map((field) => ({ id: ++chipSeq, field }));
      prev
        .filter((c) => !pendingIds.has(c.field))
        .forEach((c) => groups.find((g) => g.id === c.field)?.onChange("all"));
      return [...kept, ...added];
    });
  }

  useEffect(() => {
    if (!pickerOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        closePicker();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen, pendingIds]);

  const visible = chips.filter((c) => groups.some((g) => g.id === c.field));
  const matchingGroups = groups.filter((group) =>
    group.label.toLowerCase().includes(filterQuery.trim().toLowerCase()),
  );

  function togglePending(fieldId: string) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  }

  function removeChip(group: FilterGroup) {
    group.onChange("all");
    setChips((prev) => prev.filter((c) => c.field !== group.id));
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(group.id);
      return next;
    });
  }

  function closePicker() {
    commitPending();
    setPickerOpen(false);
  }

  function openPicker() {
    setPendingIds(new Set(visible.map((c) => c.field)));
    setPickerOpen(true);
  }

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((chip) => {
        const group = groups.find((g) => g.id === chip.field)!;

        return (
          <div
            key={chip.id}
            className="flex items-center gap-1 rounded-[4px] border border-chef-line bg-chef-surface pl-2 pr-1 text-[13px] text-chef-text shadow-[0_0_0_1px_rgba(18,31,52,0.02)]"
          >
            <div className="flex items-center gap-1">
              <span className="text-chef-text-muted">{group.label}:</span>
              <div className="relative">
                <select
                  aria-label={`${group.label} filter`}
                  value={group.value}
                  onChange={(e) => group.onChange(e.target.value)}
                  className="h-8 appearance-none bg-transparent pr-6 text-[13px] text-chef-text outline-none"
                >
                  {group.options.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-chef-text-muted" />
              </div>
            </div>
            <button
              type="button"
              aria-label="Remove filter"
              onClick={() => removeChip(group)}
              className="text-chef-text-muted hover:text-chef-blue"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      {groups.length > 0 && (
        <div ref={pickerRef} className="relative">
          <button
            type="button"
            aria-expanded={pickerOpen}
            onClick={() => (pickerOpen ? closePicker() : openPicker())}
            className="flex items-center gap-1 rounded-[4px] border border-transparent px-2 py-1.5 text-[13px] text-chef-blue hover:border-chef-line hover:bg-chef-canvas"
          >
            <Plus className="h-4 w-4" /> Filter
          </button>
          {pickerOpen && (
            <div className="absolute left-0 z-20 mt-1 w-[220px] rounded-sm border border-chef-line bg-chef-surface p-2 shadow-lg">
              <div className="relative mb-1">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-chef-text-muted" />
                <input
                  autoFocus
                  aria-label="Search filter columns"
                  placeholder="Search columns"
                  value={filterQuery}
                  onChange={(event) => setFilterQuery(event.target.value)}
                  className="h-8 w-full rounded-sm border border-chef-line bg-chef-canvas pl-7 pr-2 text-[13px] text-chef-text outline-none focus:border-chef-blue"
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {matchingGroups.length > 0 ? (
                  matchingGroups.map((group) => (
                    <label
                      key={group.id}
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] text-chef-text hover:bg-chef-canvas"
                    >
                      <input
                        type="checkbox"
                        checked={pendingIds.has(group.id)}
                        onChange={() => togglePending(group.id)}
                      />
                      {group.label}
                    </label>
                  ))
                ) : (
                  <span className="block px-2 py-1.5 text-[13px] text-chef-text-muted">
                    No filters found
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          groups.forEach((g) => g.onChange("all"));
          const resetChips = groups
            .filter((g) => !defaultFilterIds || defaultFilterIds.includes(g.id))
            .map((g) => ({ id: ++chipSeq, field: g.id }));
          setChips(resetChips);
          setPendingIds(new Set(resetChips.map((c) => c.field)));
          setFilterQuery("");
        }}
        className="flex items-center gap-1 rounded-[4px] border border-transparent px-2 py-1.5 text-[13px] text-chef-text-muted hover:border-chef-line hover:bg-chef-canvas hover:text-chef-blue"
      >
        <RotateCcw className="h-4 w-4" /> Reset
      </button>
    </div>
  );
}
