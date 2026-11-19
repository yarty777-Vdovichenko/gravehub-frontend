import {
ArrowUpRight,
Flower2,
Leaf
} from "lucide-react";
import {
Link
} from "react-router-dom";
import type { SelectableService, ServiceCategory } from "../api";
import "../style.css";
import { descriptions } from './descriptions';
import { useApp } from './useApp';
export function ServiceCard({
  s,
  i,
}: {
  s: SelectableService | ServiceCategory;
  i: number;
}) {
  const a = useApp();
  const category = "children" in s;
  const serviceId = category ? s.id : s.categoryId ?? s.id;
  const summary = category
    ? s.description ?? s.children.map((service) => service.name).join(", ")
    : s.description;
  return (
    <Link
      to={a.mode === "customer" ? "/contracts/new?service=" + serviceId : "/market"}
      className={"service-card service-" + i}
    >
      <div>
        {i % 2 ? <Flower2 /> : <Leaf />}
        <ArrowUpRight size={17} />
      </div>
      {!category && s.categoryName && <small>{s.categoryName}</small>}
      <h3>{s.name}</h3>
      <p>{summary || descriptions[i % 4]}</p>
    </Link>
  );
}