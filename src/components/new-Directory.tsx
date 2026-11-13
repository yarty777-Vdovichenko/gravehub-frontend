import axios from "axios";
import { useEffect,useState } from "react";
import { Link,useParams } from "react-router-dom";
import type { Option,Page,Review } from "../api";
import { api,configured,errorText } from "../api";
import type {
Employee,
MetaPage,
SearchFilters
} from "../new-api";
import { newApi } from "../new-api";
import "../new-pages.css";
import { ErrorView } from './new-ErrorView';
import { Filters } from './new-Filters';
import { Pager } from './new-Pager';
export function Directory({
  services,
  regions,
}: {
  services: Option[];
  regions: Option[];
}) {
  const { id } = useParams(),
    [profile, setProfile] = useState<Employee>(),
    [data, setData] = useState<MetaPage<Employee>>(),
    [reviews, setReviews] = useState<Page<Review>>(),
    [reviewPage, setReviewPage] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(1),
    [limit, setLimit] = useState(10),
    [filters, setFilters] = useState<Omit<SearchFilters, "page" | "limit">>({
      sortBy: "rating",
      order: "desc",
    });
  useEffect(() => {
    const c = new AbortController();
    setBusy(true);
    setError("");
    setData(undefined);
    setProfile(undefined);
    (id
      ? newApi.employee(id).then(x=>{if(!c.signal.aborted)setProfile(x)})
      : newApi.employees({ ...filters, page, limit }, c.signal).then(x=>{if(!c.signal.aborted)setData(x)})
    )
      .catch((e) => {
        if (!axios.isCancel(e)) setError(errorText(e));
      })
      .finally(() => setBusy(false));
    return () => c.abort();
  }, [id, page, limit, filters]);
  useEffect(() => {
    if (!id) return;
    api
      .get<Page<Review>>(`/employees/${id}/reviews`, {
        params: { page: reviewPage, limit: 10 },
      })
      .then((r) => setReviews(r.data))
      .catch((e) => setError(errorText(e)));
  }, [id, reviewPage]);
  return (
    <>
      <div className="page-title">
        <div>
          <h1>{id ? "Профіль виконавця" : "Знайти виконавця"}</h1>
          <p>Пошук за досвідом, послугами, регіоном і рейтингом.</p>
        </div>
      </div>
      {!configured && (
        <p className="error">Для цього розділу налаштуйте VITE_API_URL.</p>
      )}
      {!id && (
        <Filters
          employee
          services={services}
          regions={regions}
          onChange={(f, n) => {
            setFilters(f);
            setLimit(n);
            setPage(1);
          }}
        />
      )}
      <ErrorView error={error} />
      {busy ? (
        <div className="loading">Завантаження…</div>
      ) : profile ? (
        <section className="panel detail-panel">
          <Link to="/employees">← До пошуку</Link>
          <h2>{profile.user.name}</h2>
          <p>
            {profile.reviewsCount===0?"Без відгуків":`★ ${profile.rating}`} · Виконано робіт: {profile.completedContracts}
          </p>
          <p>{profile.specialization.map((s) => s.name).join(", ")}</p>
          <p>{profile.regions.map((s) => s.name).join(", ")}</p>
          <h3>Відгуки</h3>
          {reviews?.items.length ? (
            reviews.items.map((r) => (
              <div className="review" key={r.id}>
                <b>
                  {r.rating} ★ · {r.customer?.name}
                </b>
                <p>{r.text}</p>
              </div>
            ))
          ) : (
            <p>Без відгуків</p>
          )}
          {reviews && (
            <Pager
              page={reviewPage}
              pages={reviews.totalPages ?? Math.ceil(reviews.total / 10)}
              setPage={setReviewPage}
            />
          )}
        </section>
      ) : (
        data && (
          <>
            <div className="service-grid">
              {data.items.map((x) => (
                <Link
                  className="panel detail-panel"
                  key={x.id}
                  to={"/employees/" + x.id}
                >
                  <h2>{x.user.name}</h2>
                  <p>
                    {x.reviewsCount===0?"Без відгуків":`★ ${x.rating}`} · {x.completedContracts} виконаних робіт
                  </p>
                  <p>{x.specialization.map((s) => s.name).join(", ")}</p>
                  <p>{x.regions.map((s) => s.name).join(", ")}</p>
                  <b>Переглянути профіль →</b>
                </Link>
              ))}
            </div>
            {!data.items.length && (
              <div className="empty">Виконавців за цими умовами немає.</div>
            )}
            <Pager page={page} pages={data.meta.pages} setPage={setPage} />
          </>
        )
      )}
    </>
  );
}