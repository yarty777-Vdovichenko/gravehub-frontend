import "../style.css";
import { Empty } from './Empty';
import { ErrorBox } from './ErrorBox';
import { PageTitle } from './PageTitle';
import { ServiceCard } from './ServiceCard';
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
      ) : a.serviceCategories.length ? (
        a.serviceCategories.map((category, categoryIndex) => (
          <section className="panel detail-panel" key={category.id}>
            <h2>{category.name}</h2>
            {category.description && <p>{category.description}</p>}
            <div className="service-grid full">
              {category.children.map((service, serviceIndex) => (
                <ServiceCard
                  s={service}
                  i={categoryIndex + serviceIndex}
                  key={service.id}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <>
          <div className="service-grid full">
            {a.services.map((service, index) => (
              <ServiceCard s={service} i={index} key={service.id} />
            ))}
          </div>
          {!a.services.length && !a.servicesError && (
            <Empty text="Послуги наразі недоступні" />
          )}
        </>
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