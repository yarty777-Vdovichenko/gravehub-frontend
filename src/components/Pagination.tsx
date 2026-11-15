import {
ChevronLeft,
ChevronRight
} from "lucide-react";
import "../style.css";

export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="pagination">
      <span>Знайдено: {total}</span>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />
      </button>
      <span>
        Сторінка {page} з {Math.max(1, Math.ceil(total / 10))}
      </span>
      <button disabled={page * 10 >= total} onClick={() => onChange(page + 1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}