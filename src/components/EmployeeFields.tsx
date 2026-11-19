import { useState } from "react";
import type { Option, SelectableService } from "../api";
import type { ServiceCategory } from "../api";
import "../style.css";
import { Field } from './Field';
import { ServiceTreePicker } from "./ServiceTreePicker";
export function EmployeeFields({
  services,
  serviceCategories,
  servicesLoading,
  servicesError,
  regions,
  regionsLoading,
  regionsError,
  retryRegions,
}: {
  services: SelectableService[];
  serviceCategories: ServiceCategory[];
  servicesLoading: boolean;
  servicesError: string;
  regions: Option[];
  regionsLoading: boolean;
  regionsError: string;
  retryRegions: () => void;
}) {
  const [specializationIds, setSpecializationIds] = useState<string[]>([]);
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
      <fieldset disabled={servicesLoading || !!servicesError || !services.length}>
        <legend>Спеціалізації</legend>
        {servicesLoading ? (
          <p className="catalog-state">Завантаження послуг…</p>
        ) : servicesError ? (
          <p className="catalog-state error">{servicesError}</p>
        ) : services.length ? (
          <ServiceTreePicker
            categories={serviceCategories}
            services={services}
            mode="employee"
            selectedIds={specializationIds}
            onChange={setSpecializationIds}
            name="specializationIds"
          />
        ) : (
          <p className="catalog-state error">Послуги наразі недоступні.</p>
        )}
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