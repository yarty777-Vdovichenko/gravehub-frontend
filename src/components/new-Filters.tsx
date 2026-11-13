import { useState } from "react";
import type { Option } from "../api";
import type {
SearchFilters
} from "../new-api";
import "../new-pages.css";
import { ErrorView } from './new-ErrorView';
export function Filters({
  services,
  regions,
  employee,
  onChange,
}: {
  services: Option[];
  regions: Option[];
  employee: boolean;
  onChange: (f: Omit<SearchFilters, "page" | "limit">, limit: number) => void;
}) {
  const [error, setError] = useState("");
  return (
    <form
      className="panel filter-grid"
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        const min = String(d.get("minBudget") ?? ""),
          max = String(d.get("maxBudget") ?? "");
        if (min && max && Number(min) > Number(max)) {
          setError("Мінімальний бюджет перевищує максимальний.");
          return;
        }
        setError("");
        onChange(
          {
            search: String(d.get("search") ?? "").trim() || undefined,
            serviceId: String(d.get("serviceId")) || undefined,
            regionId: String(d.get("regionId")) || undefined,
            ...(employee
              ? {
                  minRating:
                    d.get("minRating") === ""
                      ? undefined
                      : Number(d.get("minRating")),
                }
              : {
                  minBudget: min ? Number(min) : undefined,
                  maxBudget: max ? Number(max) : undefined,
                }),
            sortBy: String(d.get("sortBy")),
            order: d.get("order") === "asc" ? "asc" : "desc",
          },
          Number(d.get("limit")),
        );
      }}
    >
      <input
        name="search"
        maxLength={100}
        placeholder={employee ? "Ім’я виконавця" : "Пошук замовлень"}
        aria-label="Пошук"
      />
      <select name="regionId" aria-label="Регіон">
        <option value="">Усі регіони</option>
        {regions.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      <select name="serviceId" aria-label="Послуга">
        <option value="">Усі послуги</option>
        {services.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
      {employee ? (
        <input
          name="minRating"
          type="number"
          min={0}
          max={5}
          step="0.1"
          placeholder="Рейтинг від"
          aria-label="Мінімальний рейтинг"
        />
      ) : (
        <>
          <input
            type="number"
            name="minBudget"
            min={0}
            step={1}
            placeholder="Бюджет від"
            aria-label="Бюджет від"
          />
          <input
            type="number"
            name="maxBudget"
            min={0}
            step={1}
            placeholder="Бюджет до"
            aria-label="Бюджет до"
          />
        </>
      )}
      <select name="sortBy" aria-label="Сортування">
        {(employee
          ? [
              ["rating", "За рейтингом"],
              ["completedContracts", "За кількістю робіт"],
            ]
          : [
              ["createdAt", "За датою"],
              ["budget", "За бюджетом"],
            ]
        ).map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
      <select name="order" aria-label="Порядок">
        <option value="desc">За спаданням</option>
        <option value="asc">За зростанням</option>
      </select>
      <select name="limit" aria-label="На сторінці">
        {[10, 20, 50].map((n) => (
          <option key={n} value={n}>
            {n} на сторінці
          </option>
        ))}
      </select>
      <button className="button primary">Застосувати</button>
      <ErrorView error={error} />
    </form>
  );
}