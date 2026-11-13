import {
useEffect,
useState
} from "react";
import type {
Proposal
} from "../api";
import {
api,
errorText,
pageGet
} from "../api";
import "../style.css";
import { Badge } from './Badge';
import { Empty } from './Empty';
import { ErrorBox } from './ErrorBox';
import { money } from './money';
import { PageTitle } from './PageTitle';
import { Pagination } from './Pagination';
import { Spinner } from './Spinner';
import { statuses } from './statuses';
import { useApp } from './useApp';
export function Proposals() {
  const a = useApp(),
    [items, setItems] = useState<Proposal[]>([]),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live=true;
    setLoading(true);
    setError("");
    if (a.demo) {
      const ps = a.demoProposals.filter((p) => !status || p.status === status);
      setItems(ps.slice((page - 1) * 10, page * 10));
      setTotal(ps.length);
      setLoading(false);
    } else
      pageGet<Proposal>("/employee/proposals", page, status)
        .then((r) => {
          if(!live)return;
          setItems(r.items);
          setTotal(r.total);
        })
        .catch((e) => {if(live)setError(errorText(e))})
        .finally(() => {if(live)setLoading(false)});
    return()=>{live=false};
  }, [a.demo, page, status, tick, a.demoProposals]);
  return (
    <>
      <PageTitle
        title="Мої пропозиції"
        subtitle="Стежте за відповідями замовників та керуйте своїми пропозиціями."
      />
      <section className="panel detail-panel">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Усі статуси</option>
          {["pending", "accepted", "rejected"].map((s) => (
            <option key={s} value={s}>
              {statuses[s]}
            </option>
          ))}
        </select>
        {loading ? (
          <Spinner />
        ) : error ? (
          <ErrorBox text={error} retry={() => setTick((t) => t + 1)} />
        ) : items.length ? (
          items.map((p) => (
            <div className="proposal" key={p.id}>
              <div>
                <h3>{p.contract?.title ?? "Замовлення"}</h3>
              </div>
              <Badge status={p.status} />
              <p>{p.comment}</p>
              <b>{money(p.price)}</b>
              {p.status === "pending" && (
                <button
                  disabled={busy}
                  className="button secondary"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      if (a.demo)
                        a.setDemoProposals((ps) =>
                          ps.filter((x) => x.id !== p.id),
                        );
                      else await api.delete("/employee/proposals/" + p.id);
                      setTick((t) => t + 1);
                      a.notice("Пропозицію скасовано");
                    } catch (e) {
                      a.notice(errorText(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Скасувати пропозицію
                </button>
              )}
            </div>
          ))
        ) : (
          <Empty text="Ви ще не надсилали пропозицій" />
        )}
        <Pagination page={page} total={total} onChange={setPage} />
      </section>
    </>
  );
}