import {
ChevronLeft,
Clock,
Flower2,
MapPin,
ShieldCheck,
X
} from "lucide-react";
import {
useCallback,
useEffect,
useRef,
useState
} from "react";
import {
Link,
useNavigate,
useParams
} from "react-router-dom";
import type {
Contract,
Proposal,
Review,
ContractSpecification
} from "../api";
import {
api,
errorText,
pageGet
} from "../api";
import "../style.css";
import { Badge } from './Badge';
import { demoUuid } from './demoUuid';
import { Empty } from './Empty';
import { ErrorBox } from './ErrorBox';
import { Field } from './Field';
import { money } from './money';
import { PageTitle } from './PageTitle';
import { Pagination } from './Pagination';
import { Spinner } from './Spinner';
import { statuses } from './statuses';
import { useApp } from './useApp';
export function Details() {
  const { id } = useParams(),
    a = useApp(),
    nav = useNavigate(),
    [c, setC] = useState<Contract>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [proposals, setProposals] = useState<Proposal[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [reviewFor, setReviewFor] = useState<string>(),
    [reviews, setReviews] = useState<Review[]|undefined>(undefined),
    [reviewPage, setReviewPage] = useState(1),
    [reviewTotal, setReviewTotal] = useState(0),
    [confirmDelete, setConfirmDelete] = useState(false),
    [acceptProposal, setAcceptProposal] = useState<Proposal>(),
    [acceptSelections, setAcceptSelections] = useState<Record<string, string>>({}),
    [acceptNotes, setAcceptNotes] = useState<Record<string, string>>({});
  const loadVersion=useRef(0);
  const load = useCallback(async () => {
    const version=++loadVersion.current;
    setError("");
    try {
      if (a.demo) {
        setC(a.contracts.find((x) => x.id === id));
        setProposals(
          a.demoProposals
            .filter((p) => p.contract?.id === id)
            .slice((page - 1) * 10, page * 10),
        );
        setTotal(a.demoProposals.filter((p) => p.contract?.id === id).length);
      } else {
        const r = await api.get<Contract>(
          (a.mode === "customer" ? "/contracts/" : "/employee/contracts/") + id,
        );
        if(version!==loadVersion.current)return;
        setC(r.data);
        if (a.mode === "customer") {
          const p = await pageGet<Proposal>(
            "/contracts/" + id + "/proposals",
            page,
          );
          setProposals(p.items);
          setTotal(p.total);
        }
      }
    } catch (e) {
      if(version===loadVersion.current)setError(errorText(e));
    }
  }, [id, a.demo, a.contracts, a.mode, page, a.demoProposals]);
  useEffect(() => {
    load();
    return()=>{loadVersion.current++};
  }, [load]);
  useEffect(() => {
    setReviews(undefined);
    if (!reviewFor) return;
    if (a.demo) {
      setReviews([
        {
          id: "r1",
          rating: 5,
          text: "Дякую за акуратну роботу та уважність до деталей.",
          customer: { name: "Марія" },
        },
      ]);
      setReviewTotal(1);
    } else
      pageGet<Review>("/employees/" + reviewFor + "/reviews", reviewPage)
        .then((r) => {
          setReviews(r.items);
          setReviewTotal(r.total);
        })
        .catch((e) => a.notice(errorText(e)));
  }, [reviewFor, reviewPage, a.demo]);
  async function action(
    path: string,
    body?: object,
    demoStatus?: string,
    method: "post" | "delete" = "post",
  ) {
    if(body && ('comment' in body || 'text' in body)){const value='comment'in body?body.comment:('text'in body?body.text:'');if(typeof value!=='string'||!value.trim()){a.notice('Введіть непорожній коментар або відгук.');return;}}
    setBusy(true);
    try {
      if(!a.demo && method==='post' && path.startsWith('/employee/contracts/') && path.endsWith('/proposals')){for(let page=1;;page++){const list=await pageGet<Proposal>('/employee/proposals',page);if(list.items.some(p=>p.contract?.id===id))throw new Error('Ви вже подавали пропозицію на це замовлення.');if(page*list.limit>=list.total)break;}}

      if (a.demo) {
        if (
          path.startsWith("/employee/contracts/") &&
          path.endsWith("/proposals") &&
          body &&
          "price" in body
        ) {
          a.setDemoProposals((ps) => [
            ...ps,
            {
              id: demoUuid(),
              price: Number(body.price),
              comment: String("comment" in body ? body.comment : ""),
              status: "pending",
              contract: c,
              employee: {
                id: "demo",
                name: a.session?.user.name,
                reviewsCount: 0,
              },
            },
          ]);
        } else if (method === "delete") {
          a.setContracts((cs) => cs.filter((x) => x.id !== id));
          nav("/contracts");
        } else if (demoStatus)
          a.setContracts((cs) =>
            cs.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: demoStatus,
                    ...(body && "rating" in body
                      ? {
                          review: {
                            id: demoUuid(),
                            rating: Number(body.rating),
                            text: String("text" in body ? body.text : ""),
                          },
                        }
                      : {}),
                  }
                : x,
            ),
          );
        else
          a.setDemoProposals((ps) =>
            ps.map((p) =>
              path.includes(p.id)
                ? {
                    ...p,
                    status: path.endsWith("accept") ? "accepted" : "rejected",
                  }
                : p,
            ),
          );
      } else {
        await api[method](path, body);
        if (method === "delete") nav("/contracts");
        else await load();
      }
      a.notice("Зміни збережено");
    } catch (e) {
      a.notice(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if (error) return <ErrorBox text={error} retry={load} />;
  if (!c) return <Spinner />;
  const own = a.mode === "customer";
  return (
    <>
      <Link className="back" to={own ? "/contracts" : "/market"}>
        <ChevronLeft size={16} /> До списку
      </Link>
      <PageTitle
        title={c.title}
        subtitle={"Замовлення · " + c.id.slice(0, 8)}
      />
      <div className="detail-grid">
        <div>
          <section className="panel detail-panel">
            <div className="detail-top">
              <Badge status={c.status} />
              <strong>{money(c.budget)}</strong>
            </div>
            <h2>Опис замовлення</h2>
            <p className="description">{c.description}</p>
            <div className="detail-meta">
              <span>
                <Flower2 size={18} />
                {c.serviceTypes?.length
                  ? c.serviceTypes
                      .map((category) =>
                        category.children.length
                          ? `${category.name} (${category.children.map((service) => service.name).join(", ")})`
                          : category.name,
                      )
                      .join(", ")
                  : c.serviceType?.name ??
                    a.services.find((s) => s.id === c.serviceTypeId)?.name ??
                    "Послуга"}
              </span>
              <span>
                <MapPin size={18} />
                {c.region?.name ??
                  a.regions.find((s) => s.id === c.regionId)?.name}
              </span>
              <span>
                <Clock size={18} />
                {new Date(c.date).toLocaleString("uk-UA")}
              </span>
              <span>
                {c.locationType === "address"
                  ? `Адреса: ${c.address}`
                  : c.locationType === "burial_plot"
                    ? c.burialPlot
                      ? `Місце ${c.burialPlot.positionX + 1}-${c.burialPlot.positionY + 1} · ${c.burialPlot.cemetery.name}`
                      : `Місце на кладовищі${c.burialPlotId ? ` · № ${c.burialPlotId.slice(0, 8)}` : ""}`
                    : `Координати: ${c.positionX ?? "—"}, ${c.positionY ?? "—"}`}
              </span>
            </div>
            {!!c.specifications?.length && (
              <div className="contract-specifications">
                <h3>Узгоджені варіанти послуг</h3>
                {c.specifications.map((specification) => (
                  <div className="contract-specification" key={specification.categoryId}>
                    <b>{specification.categoryName ?? "Послуга"}</b>
                    {specification.serviceName && <span>{specification.serviceName}</span>}
                    {specification.note && <p>{specification.note}</p>}
                  </div>
                ))}
              </div>
            )}
            {c.review && (
              <div className="review">
                <b>{"★".repeat(c.review.rating)} · Відгук замовника</b>
                <p>{c.review.text}</p>
              </div>
            )}
            {own && c.status === "open" && !c.employeeId && !c.employee && (
              <div className="delete-area">
                {confirmDelete ? (
                  <>
                    <span>Видалити це замовлення?</span>
                    <button
                      disabled={busy}
                      className="danger"
                      onClick={() =>
                        action(
                          "/contracts/" + id,
                          undefined,
                          undefined,
                          "delete",
                        )
                      }
                    >
                      Так, видалити
                    </button>
                    <button onClick={() => setConfirmDelete(false)}>
                      Залишити
                    </button>
                  </>
                ) : (
                  <button
                    className="danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Видалити замовлення
                  </button>
                )}
              </div>
            )}
          </section>
          {own && (
            <section className="panel detail-panel">
              <h2>Пропозиції виконавців</h2>
              {proposals.length === 0 ? (
                <Empty text="Пропозицій поки немає" />
              ) : (
                proposals.map((p) => {
                  const e = p.employeeProfile ?? p.employee;
                  return (
                    <div className="proposal" key={p.id}>
                      <div className="proposal-head">
                        <span className="avatar">
                          {e?.name?.slice(0, 1) ?? "В"}
                        </span>
                        <div>
                          <b>{e?.name ?? e?.user?.name ?? `Виконавець ${e?.id.slice(0,8)??""}`}<p>Виконано робіт: {e?.completedContracts??"—"}</p></b>
                          <button
                            className="text-button"
                            onClick={() => {
                              if (e) {
                                setReviewPage(1);
                                setReviewFor(e.id);
                              }
                            }}
                          >
                            {!e?.reviewsCount
                              ? "Без відгуків"
                              : `★ ${e.rating ?? "—"} · ${e.reviewsCount} відгуків`}
                          </button>
                        </div>
                        <strong>{money(p.price)}</strong>
                      </div>
                      <p>{p.comment}</p>
                      {!!e?.specialization?.length && (
                        <small>
                          Послуги:{" "}
                          {e.specialization
                            .map((service) => {
                              const category =
                                service.parent?.name ?? service.categoryName;
                              return category
                                ? `${category}: ${service.name}`
                                : service.name;
                            })
                            .join(", ")}
                        </small>
                      )}
                      <Badge status={p.status} />
                      {p.status === "pending" && c.status === "open" && (
                        <div className="form-actions">
                          <button
                            disabled={busy}
                            className="button secondary"
                            onClick={() =>
                              action(
                                `/contracts/${id}/proposals/${p.id}/reject`,
                              )
                            }
                          >
                            Відхилити
                          </button>
                          <button
                            disabled={busy}
                            className="button primary"
                            onClick={() => {
                              setAcceptSelections({});
                              setAcceptNotes({});
                              setAcceptProposal(p);
                            }}
                          >
                            Прийняти
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <Pagination page={page} total={total} onChange={setPage} />
            </section>
          )}
        </div>
        <section className="panel detail-panel next-step">
          <h2>Наступний крок</h2>
          {own ? (
            ["awaiting_confirmation", "pending_completion"].includes(
              c.status,
            ) ? (
              <>
                <p>Перевірте результат та оцініть роботу виконавця.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    action(
                      `/customer/contracts/${id}/confirm`,
                      {
                        rating: Number(f.get("rating")),
                        text: String(f.get("text")).trim(),
                      },
                      "completed",
                    );
                  }}
                >
                  <Field label="Оцінка">
                    <select name="rating">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Відгук">
                    <textarea name="text" required rows={4} maxLength={1000} />
                  </Field>
                  <button disabled={busy} className="button primary">
                    Підтвердити виконання
                  </button>
                </form>
                <button
                  disabled={busy}
                  className="button secondary"
                  onClick={() =>
                    action(
                      `/customer/contracts/${id}/reject-completion`,
                      undefined,
                      "in_progress",
                    )
                  }
                >
                  На доопрацювання
                </button>
              </>
            ) : (
              <>
                <ShieldCheck className="large-icon" />
                <p>
                  {c.status === "completed"
                    ? "Дякуємо, що довіряєте турботу GraveHub."
                    : c.status === "open"
                      ? "Перегляньте пропозиції та оберіть виконавця."
                      : "Виконавець працює над вашим замовленням. Тут ви зможете підтвердити результат."}
                </p>
              </>
            )
          ) : c.status === "open" ? (
            <>
              <p>Запропонуйте свою ціну та розкажіть, як допоможете.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  action(`/employee/contracts/${id}/proposals`, {
                    price: Number(f.get("price")),
                    comment: String(f.get("comment")).trim(),
                  });
                }}
              >
                <Field label="Ваша ціна, ₴">
                  <input required type="number" name="price" min={1} step="1" />
                </Field>
                <Field label="Коментар">
                  <textarea name="comment" required maxLength={1000} rows={4} />
                </Field>
                <button className="button primary" disabled={busy}>
                  Надіслати пропозицію
                </button>
              </form>
            </>
          ) : ["in_progress", "assigned"].includes(c.status) ? (
            <>
              <p>
                Завершили всю роботу? Надішліть її замовнику на підтвердження.
              </p>
              <button
                disabled={busy}
                className="button primary"
                onClick={() =>
                  action(
                    `/employee/my-contracts/${id}/complete`,
                    undefined,
                    "awaiting_confirmation",
                  )
                }
              >
                Роботу виконано
              </button>
            </>
          ) : (
            <p>Поточний статус: {statuses[c.status] ?? c.status}</p>
          )}
        </section>
      </div>
      {acceptProposal && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) setAcceptProposal(undefined);
          }}
        >
          <section
            className="panel modal acceptance-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Уточнення замовлення"
          >
            <button
              autoFocus
              aria-label="Закрити"
              className="close"
              onClick={() => setAcceptProposal(undefined)}
            >
              <X />
            </button>
            <h2>Уточніть вибір послуг</h2>
            <p>Оберіть конкретний варіант для кожної послуги виконавця.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const employee = acceptProposal.employeeProfile ?? acceptProposal.employee;
                const selections = (c?.serviceTypes ?? []).map((category) => ({
                  categoryId: category.id,
                  serviceId: acceptSelections[category.id] || undefined,
                  note: acceptNotes[category.id]?.trim() || undefined,
                })).filter((selection, index, all) => {
                  if (selection.serviceId || selection.note) return true;
                  const category = c?.serviceTypes?.[index];
                  const hasOptions = !!employee?.specialization?.some(
                    (service) => (service.parent?.id ?? service.categoryId) === category?.id,
                  );
                  return !hasOptions;
                });
                const missing = (c?.serviceTypes ?? []).some((category) => {
                  const hasOptions = !!employee?.specialization?.some(
                    (service) => (service.parent?.id ?? service.categoryId) === category.id,
                  );
                  return hasOptions && !acceptSelections[category.id];
                });
                if (missing) {
                  a.notice("Оберіть варіант для кожної послуги.");
                  return;
                }
                action(
                  `/contracts/${id}/proposals/${acceptProposal.id}/accept`,
                  { selections },
                  "in_progress",
                ).finally(() => setAcceptProposal(undefined));
              }}
            >
              {(c?.serviceTypes ?? []).map((category) => {
                const employee = acceptProposal.employeeProfile ?? acceptProposal.employee;
                const options = employee?.specialization?.filter(
                  (service) => (service.parent?.id ?? service.categoryId) === category.id,
                ) ?? [];
                return (
                  <fieldset className="specification-group" key={category.id}>
                    <legend>{category.name}</legend>
                    {options.length ? (
                      options.map((service) => (
                        <label className="specification-option" key={service.id}>
                          <input
                            type="radio"
                            name={`service-${category.id}`}
                            value={service.id}
                            checked={acceptSelections[category.id] === service.id}
                            onChange={() =>
                              setAcceptSelections((current) => ({
                                ...current,
                                [category.id]: service.id,
                              }))
                            }
                          />
                          <span>
                            <b>{service.name}</b>
                            {service.description && <small>{service.description}</small>}
                          </span>
                        </label>
                      ))
                    ) : (
                      <p>Виконавець не надав окремих варіантів для цієї категорії.</p>
                    )}
                    <Field label="Побажання або деталі (необов’язково)">
                      <textarea
                        rows={2}
                        maxLength={500}
                        value={acceptNotes[category.id] ?? ""}
                        onChange={(event) =>
                          setAcceptNotes((current) => ({
                            ...current,
                            [category.id]: event.currentTarget.value,
                          }))
                        }
                      />
                    </Field>
                  </fieldset>
                );
              })}
              <div className="form-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setAcceptProposal(undefined)}
                >
                  Скасувати
                </button>
                <button type="submit" className="button primary" disabled={busy}>
                  Прийняти виконавця
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {reviewFor && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setReviewFor(undefined)}}>
          <section className="panel modal" role="dialog" aria-modal="true" aria-label="Відгуки виконавця" onKeyDown={e=>{if(e.key==='Escape')setReviewFor(undefined);if(e.key==='Tab'){const nodes=e.currentTarget.querySelectorAll<HTMLElement>('button,a,input,select,textarea,[tabindex="0"]');const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}}>
            <button autoFocus aria-label="Закрити відгуки" className="close" onClick={() => setReviewFor(undefined)}>
              <X />
            </button>
            <h2>Відгуки про виконавця</h2>
            {reviews===undefined ? <Spinner/> : reviews.length ? (
              reviews.map((r) => (
                <div className="review" key={r.id}>
                  <b>
                    {"★".repeat(r.rating)} {r.customer?.name}
                  </b>
                  <p>{r.text}</p>
                </div>
              ))
            ) : (
              <Empty text="Без відгуків" />
            )}
            <Pagination
              page={reviewPage}
              total={reviewTotal}
              onChange={setReviewPage}
            />
          </section>
        </div>
      )}
    </>
  );
}