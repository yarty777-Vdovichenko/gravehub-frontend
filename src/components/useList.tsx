import {
useEffect,
useState
} from "react";
import type {
Contract
} from "../api";
import {
errorText,
pageGet
} from "../api";
import "../style.css";
import { useApp } from './useApp';
export function useList(url: string, status = "", demoItems?: Contract[]) {
  const a = useApp(),
    [items, setItems] = useState<Contract[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    if (a.demo) {
      const all = (demoItems ?? a.contracts).filter(
        (c) => !status || c.status === status,
      );
      setItems(all.slice((page - 1) * 10, page * 10));
      setTotal(all.length);
      setLoading(false);
    } else
      pageGet<Contract>(url, page, status)
        .then((r) => {
          if (live) {
            setItems(r.items);
            setTotal(r.total);
          }
        })
        .catch((e) => {
          if (live) setError(errorText(e));
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    return () => {
      live = false;
    };
  }, [url, page, status, a.demo, a.contracts, tick]);
  return {
    items,
    page,
    setPage,
    total,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
  };
}