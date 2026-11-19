import axios from "axios";
import { useEffect,useState } from "react";
import { Link,useNavigate,useParams } from "react-router-dom";
import type { Option,Page,Review,SelectableService } from "../api";
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
  services: SelectableService[];
  regions: Option[];
}) {
  const { id } = useParams(),
    navigate = useNavigate(),
    [profile, setProfile] = useState<Employee>(),
    [data, setData] = useState<MetaPage<Employee>>(),
    [reviews, setReviews] = useState<Page<Review>>(),
    [reviewPage, setReviewPage] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [chatBusy, setChatBusy] = useState(false),
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
      .finally(() => {if(!c.signal.aborted)setBusy(false)});
    return () => c.abort();
  }, [id, page, limit, filters]);
  useEffect(() => {setReviews(undefined);setReviewPage(1);},[id]);
  useEffect(() => {
    if (!id) {setReviews(undefined);return;}
    const c=new AbortController();setReviews(undefined);
    api.get<Page<Review>>(`/employees/${id}/reviews`,{params:{page:reviewPage,limit:10},signal:c.signal})
      .then((r)=>{if(!c.signal.aborted)setReviews(r.data)})
      .catch((e)=>{if(!c.signal.aborted&&!axios.isCancel(e))setError(errorText(e))});
    return()=>c.abort();
  },[id,reviewPage]);
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
          {profile.description && <p className="employee-description">{profile.description}</p>}
          <button
            className="button primary"
            disabled={chatBusy}
            onClick={async () => {
              setChatBusy(true);
              try {
                const { data: conversation } = await api.post<{ id: string }>(
                  "/conversations",
                  { employeeProfileId: profile.id },
                );
                navigate(`/messages?conversation=${encodeURIComponent(conversation.id)}`);
              } catch (e) {
                setError(errorText(e));
              } finally {
                setChatBusy(false);
              }
            }}
          >
            {chatBusy ? "Відкриваємо чат…" : "Написати виконавцю"}
          </button>
          {!!profile.portfolio?.length && (
            <>
              <h3 className="portfolio-heading">Портфоліо</h3>
              <div className="portfolio-grid">
                {profile.portfolio.map((media) => (
                  <figure key={media.id}>
                    {media.type === "video" ? (
                      <video src={media.url} controls preload="metadata" />
                    ) : (
                      <img src={media.url} alt={media.caption ?? "Робота виконавця"} loading="lazy" />
                    )}
                    {media.caption && <figcaption>{media.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </>
          )}
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