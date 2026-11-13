import {
Plus
} from "lucide-react";
import {
Link
} from "react-router-dom";
import "../style.css";

export function CreateButton() {
  return (
    <Link className="button primary" to="/contracts/new">
      <Plus size={18} /> Створити замовлення
    </Link>
  );
}