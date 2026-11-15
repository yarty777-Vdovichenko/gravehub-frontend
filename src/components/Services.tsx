import "../style.css";
import { Empty } from './Empty';
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
      <div className="service-grid full">
        {a.services.map((s, i) => (
          <ServiceCard s={s} i={i} key={s.id} />
        ))}
      </div>
      {a.services.length === 0 && <Empty text="Послуги наразі недоступні" />}
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