/**
 * Compact prev/next pager for narrow history lists (sidebars, drawers).
 * Renders nothing when everything fits on a single page.
 */
export function HistoryPager({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-2 flex items-center justify-between text-[12px] text-chef-text-muted">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="hover:text-chef-blue disabled:opacity-40"
      >
        ← Prev
      </button>
      <span>
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        aria-label="Next page"
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
        className="hover:text-chef-blue disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}
