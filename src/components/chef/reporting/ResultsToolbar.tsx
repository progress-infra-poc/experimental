import { useState } from "react";
import { Columns2, Filter, Search, X } from "lucide-react";
import { FilterChipBar, type FilterGroup } from "./FilterChipBar";

export interface ToolbarFilterOption {
  key: string;
  label: string;
  count?: number;
}

export interface ToolbarColumn {
  key: string;
  label: string;
}

/**
 * Heading row for a results table: title + result count on the left,
 * search / filter / customize-columns icon actions on the right.
 */
export function ResultsToolbar({
  title,
  resultLabel,
  query,
  onQueryChange,
  searchLabel,
  filterOptions,
  activeFilter,
  onFilterChange,
  filterGroups,
  actionContent,
  columns,
  isColumnVisible,
  onToggleColumn,
}: {
  title: string;
  resultLabel: string;
  query: string;
  onQueryChange: (value: string) => void;
  searchLabel: string;
  filterOptions?: ToolbarFilterOption[];
  activeFilter?: string;
  onFilterChange?: (key: string) => void;
  filterGroups?: FilterGroup[];
  actionContent?: React.ReactNode;
  columns?: ToolbarColumn[];
  isColumnVisible?: (key: string) => boolean;
  onToggleColumn?: (key: string) => void;
}) {
  const [openMenu, setOpenMenu] = useState<"search" | "filter" | "columns" | null>(null);

  function toggle(menu: "search" | "filter" | "columns") {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  const groups: FilterGroup[] = [
    ...(filterOptions && onFilterChange
      ? [
          {
            id: "status",
            label: "Status",
            options: filterOptions,
            value: activeFilter ?? "all",
            onChange: onFilterChange,
          },
        ]
      : []),
    ...(filterGroups ?? []),
  ];
  const hasFilters = groups.length > 0;

  const iconClass = (active: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors ${
      active ? "text-chef-blue" : "text-chef-text-muted hover:text-chef-blue"
    }`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[16px] font-semibold text-chef-text">{title}</h2>
          <span className="text-[13px] text-chef-text-muted">{resultLabel}</span>
        </div>

        <div className="flex items-center gap-1">
          {actionContent}

          {openMenu === "search" || query ? (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-chef-text-muted" />
              <input
                autoFocus
                aria-label={searchLabel}
                placeholder={searchLabel}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="h-9 w-[220px] rounded-sm border border-chef-line bg-chef-surface pl-8 pr-8 text-[13px] text-chef-text outline-none focus:border-chef-blue"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => onQueryChange("")}
                  className="absolute right-2.5 top-2.5 text-chef-text-muted hover:text-chef-blue"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              aria-label={searchLabel}
              onClick={() => toggle("search")}
              className={iconClass(false)}
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
          )}

          {hasFilters && (
            <button
              type="button"
              aria-label="Filter results"
              onClick={() => toggle("filter")}
              className={iconClass(openMenu === "filter" || groups.some((g) => g.value !== "all"))}
            >
              <Filter className="h-[18px] w-[18px]" />
            </button>
          )}

          {columns && (
            <div className="relative">
              <button
                type="button"
                aria-label="Customize columns"
                onClick={() => toggle("columns")}
                className={iconClass(openMenu === "columns")}
              >
                <Columns2 className="h-[18px] w-[18px]" />
              </button>
              {openMenu === "columns" && (
                <div className="absolute right-0 z-20 mt-1 w-[210px] rounded-sm border border-chef-line bg-chef-surface p-2 text-left shadow-lg">
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-chef-text"
                    >
                      <input
                        type="checkbox"
                        checked={isColumnVisible?.(col.key) ?? true}
                        onChange={() => onToggleColumn?.(col.key)}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {openMenu === "filter" && hasFilters && <FilterChipBar groups={groups} />}
    </>
  );
}
