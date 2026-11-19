import "../style.css";
import { Empty } from './Empty';
import { ErrorBox } from './ErrorBox';
import { PageTitle } from './PageTitle';
import { ServiceTreePicker } from "./ServiceTreePicker";
import { useApp } from './useApp';
export function Services() {
  const a = useApp();
  return (
    <>
      <PageTitle
        title="Послуги з турботою"
        subtitle="Оберіть допомогу, яка потрібна вашому місцю пам’яті."
      />
      {a.servicesError && <ErrorBox text={a.servicesError} />}
      {a.servicesLoading ? (
        <p role="status">Завантаження послуг…</p>
      ) : a.serviceCategories.length || a.services.length ? (
        <ServiceTreePicker
          categories={a.serviceCategories}
          services={a.services}
          mode="catalog"
        />
      ) : (
        !a.servicesError && <Empty text="Послуги наразі недоступні" />
      )}
      <section className="panel detail-panel">
        <h2>Як це працює</h2>
        <p className="description">
          Оберіть послугу, вкажіть регіон, координати місця, дату виконання та
          бюджет. Виконавці у вашому регіоні зможуть надіслати пропозиції.
          Перегляньте їхній досвід і відгуки, оберіть виконавця та підтвердьте
          результат після завершення роботи.
        </p>
      </section>
    </>
  );
}