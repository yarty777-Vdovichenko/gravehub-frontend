import "../new-pages.css";

export function Pager({
  page,
  pages,
  setPage,
}: {
  page: number;
  pages: number;
  setPage: (p: number) => void;
}) {
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
        ←
      </button>
      Сторінка {page} з {Math.max(1, pages)}
      <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
        →
      </button>
    </div>
  );
}