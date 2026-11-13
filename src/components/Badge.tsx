import "../style.css";
import { statuses } from './statuses';
export function Badge({ status }: { status: string }) {
  return (
    <span className={"badge " + status}>
      <i />
      {statuses[status] ?? status}
    </span>
  );
}