import {
ArrowUpRight,
Flower2,
Leaf
} from "lucide-react";
import {
Link
} from "react-router-dom";
import type {
Option
} from "../api";
import "../style.css";
import { descriptions } from './descriptions';
import { useApp } from './useApp';
export function ServiceCard({ s, i }: { s: Option; i: number }) {
  const a = useApp();
  return (
    <Link
      to={a.mode === "customer" ? "/contracts/new?service=" + s.id : "/market"}
      className={"service-card service-" + i}
    >
      <div>
        {i % 2 ? <Flower2 /> : <Leaf />}
        <ArrowUpRight size={17} />
      </div>
      <h3>{s.name}</h3>
      <p>{s.description ?? descriptions[i % 4]}</p>
    </Link>
  );
}