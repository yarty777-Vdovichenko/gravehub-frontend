import {
Flower2
} from "lucide-react";
import "../style.css";

export function Empty({ text = "Поки що тут немає замовлень" }: { text?: string }) {
  return (
    <div className="empty">
      <Flower2 size={30} />
      <h3>{text}</h3>
      <p>Нові записи з’являться тут після створення.</p>
    </div>
  );
}