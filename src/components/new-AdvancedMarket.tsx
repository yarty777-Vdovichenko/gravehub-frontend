import axios from "axios";
import { useEffect,useState } from "react";
import { Link } from "react-router-dom";
import type { Contract,Option } from "../api";
import { api,errorText } from "../api";
import type {
MetaPage,
SearchFilters
} from "../new-api";
import "../new-pages.css";
import { cash } from './new-cash';
import { ErrorView } from './new-ErrorView';
import { Filters } from './new-Filters';
import { Pager } from './new-Pager';
export function AdvancedMarket({
  services,
  regions,
  endpoint="/employee/contracts",
}: {
  services: Option[];
  regions: Option[];
  endpoint?:string;
}) {
  const [filters, setFilters] = useState<Omit<SearchFilters, "page" | "limit">>(
      { sortBy: "createdAt", order: "desc" },
    ),
    [page, setPage] = useState(1),
    [limit, setLimit] = useState(10),
    [data, setData] = useState<MetaPage<Contract>>(),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setData(undefined);
    setError("");
    api
      .get<MetaPage<Contract>>(endpoint, {
        params: { ...filters, page, limit },
        signal: c.signal,
      })
      .then((r) => setData(r.data))
      .catch((e) => {
        if (!axios.isCancel(e)) setError(errorText(e));
      });
    return () => c.abort();
  }, [filters, page, limit,endpoint]);
  return (
    <>
      <div className="page-title">
        <h1>{endpoint === "/contracts/my" ? "Мої замовлення" : "Знайти замовлення"}</h1>
      </div>
      <Filters
        employee={false}
        services={services}
        regions={regions}
        onChange={(f, n) => {
          setFilters(f);
          setLimit(n);
          setPage(1);
        }}
      />
      <ErrorView error={error} />
      {!data && !error ? (
        <div className="loading">Завантаження…</div>
      ) : (
        data && (
          <section className="panel">
            {data.items.length ? (
              data.items.map((c) => (
                <Link
                  className="order-row"
                  key={c.id}
                  to={"/contracts/" + c.id}
                >
                  <div>
                    <h3>{c.title}</h3>
                    <p>
                      {c.region?.name} · {c.serviceType?.name}
                    </p>
                  </div>
                  <b>{cash(c.budget)}</b>
                </Link>
              ))
            ) : (
              <div className="empty">Замовлень за цими умовами немає.</div>
            )}
            <Pager page={page} pages={data.meta.pages} setPage={setPage} />
          </section>
        )
      )}
    </>
  );
}