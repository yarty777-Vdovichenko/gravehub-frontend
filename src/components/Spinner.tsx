import {
LoaderCircle
} from "lucide-react";
import "../style.css";

export function Spinner() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" /> Завантаження…
    </div>
  );
}