import type {
Option
} from "../api";
import "../style.css";
import { Field } from './Field';
export function EmployeeFields({
  services,
  regions,
  regionsLoading,
  regionsError,
  retryRegions,
}: {
  services: Option[];
  regions: Option[];
  regionsLoading: boolean;
  regionsError: string;
  retryRegions: () => void;
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
      <fieldset disabled={regionsLoading || !!regionsError || regions.length === 0}>
        <legend>Регіони роботи</legend>
        {regionsLoading ? (
          <p className="catalog-state">Завантаження регіонів…</p>
        ) : regionsError ? (
          <p className="catalog-state error">{regionsError}</p>
        ) : regions.length ? (
          regions.map((s) => (
            <label className="checkbox" key={s.id}>
              <input type="checkbox" name="regionIds" value={s.id} />
              {s.name}
            </label>
          ))
        ) : (
          <p className="catalog-state error">
            Регіонів немає. Повторіть завантаження або зверніться до адміністратора.
          </p>
        )}
      </fieldset>
      {!!regionsError && (
        <button type="button" className="link-button retry-catalog" onClick={retryRegions}>
          Спробувати завантажити регіони ще раз
        </button>
      )}
    </>
  );
}