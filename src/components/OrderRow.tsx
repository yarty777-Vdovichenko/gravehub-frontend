import {
ArrowUpRight,
Flower2,
MapPin
} from "lucide-react";
import {
Link
} from "react-router-dom";
import type {
Contract
} from "../api";
import "../style.css";
import { Badge } from './Badge';
import { money } from './money';
import { useApp } from './useApp';
export function OrderRow({ c }: { c: Contract }) {
  const a = useApp();
  return (
    <Link className="order-row" to={"/contracts/" + c.id}>
      <div className={"order-icon " + c.status}>
        <Flower2 size={23} />
      </div>
      <div className="order-info">
        <div>
          <h3>{c.title}</h3>
          <Badge status={c.status} />
        </div>
        <p>
          <MapPin size={12} />
          {c.region?.name ??
            a.regions.find((r) => r.id === c.regionId)?.name ??
            "Регіон замовлення"}
          <span>·</span>
          {new Date(c.date).toLocaleDateString("uk-UA")}
        </p>
        <div className="order-bottom">
          <span>
            {c.employee?.name ??
              c.employee?.user?.name ??
              (c.status === "completed"
                ? "Роботу виконано"
                : "Очікує на виконавця")}
          </span>
          {c.status === "open" && (
            <b>{c.proposalsCount ?? c._count?.proposals ?? 0} пропозицій</b>
          )}
        </div>
      </div>
      <div className="order-price">
        <b>{money(c.budget)}</b>
        <ArrowUpRight size={16} />
      </div>
    </Link>
  );
}