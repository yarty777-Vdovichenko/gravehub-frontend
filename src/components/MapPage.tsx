import "../style.css";
import { useApp } from './useApp';
export function MapPage() {
  const a = useApp();
  return a.demo ? (
    <p>Демонстраційна карта вимкнена.</p>
  ) : a.mode === "customer" ? (
    <p>API місць не підтверджений документацією. Розділ недоступний.</p>
  ) : (
    <p>Карта місць доступна в режимі замовника.</p>
  );
}