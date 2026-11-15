import type {
Option
} from "../api";
import "../style.css";
import { Field } from './Field';
export function EmployeeFields({
  services,
  regions,
}: {
  services: Option[];
  regions: Option[];
}) {
  return (
    <>
      <Field label="Про ваш досвід">
        <textarea
          name="description"
          required
          minLength={6}
          maxLength={1000}
          rows={3}
        />
      </Field>
      <fieldset>
        <legend>Спеціалізації</legend>
        {services.map((s) => (
          <label className="checkbox" key={s.id}>
            <input type="checkbox" name="specializationIds" value={s.id} />
            {s.name}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Регіони роботи</legend>
        {regions.map((s) => (
          <label className="checkbox" key={s.id}>
            <input type="checkbox" name="regionIds" value={s.id} />
            {s.name}
          </label>
        ))}
      </fieldset>
    </>
  );
}