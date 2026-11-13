import {
ArrowRight,
ArrowUpRight,
CheckCheck,
ClipboardList,
Clock,
Flower2,
Leaf,
Mail,
MapPin,
Search,
ShieldCheck
} from "lucide-react";
import {
useState
} from "react";
import {
Link
} from "react-router-dom";
import "../style.css";
import { CreateButton } from './CreateButton';
import { Empty } from './Empty';
import { ErrorBox } from './ErrorBox';
import { OrderRow } from './OrderRow';
import { PageTitle } from './PageTitle';
import { ServiceCard } from './ServiceCard';
import { Spinner } from './Spinner';
import { Stat } from './Stat';
import { useApp } from './useApp';
import { useList } from './useList';
export function Dashboard() {
  const a = useApp(),
    list = useList(
      a.mode === "customer" ? "/contracts/my" : "/employee/my-contracts",
    ),
    [filter, setFilter] = useState("all");
  const active = list.items.filter((c) =>
    ["in_progress", "assigned"].includes(c.status),
  ).length;
  return (
    <>
      <PageTitle
        title={`Вітаємо, ${a.session?.user.name?.split(" ")[0] ?? "друже"} 👋`}
        subtitle="Турбота про пам’ять починається з простих кроків."
        action={
          a.mode === "customer" ? (
            <CreateButton />
          ) : (
            <Link to="/market" className="button primary">
              <Search size={17} /> Знайти замовлення
            </Link>
          )
        }
      />
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-tag">
            <span /> ТУРБОТА, ЩО МАЄ ЗНАЧЕННЯ
          </span>
          <h2>
            Бережемо пам’ять.
            <br />
            Піклуємося разом.
          </h2>
          <p>
            Довірте догляд перевіреним людям.
            <br />
            Ми допоможемо бути поруч, навіть на відстані.
          </p>
          <Link to="/services">
            Обрати послугу <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hero-art">
          <div className="sun" />
          <div className="hill hill-back" />
          <div className="hill" />
          <div className="plant p1" />
          <div className="plant p2" />
          <div className="plant p3" />
          <span className="art-note">
            <Leaf size={17} /> З повагою до кожної історії
          </span>
        </div>
      </section>
      <Link className="map-dashboard-link" to="/employees">
        <div>
          <h2>Знайдіть виконавця</h2>
          <p>
            Інтерактивний план кладовища · вибір ділянки · навчальна
            демонстрація
          </p>
        </div>
        <MapPin size={26} />
      </Link>
      <section className="stats">
        <Stat
          label="Усього замовлень"
          value={list.total}
          icon={<ClipboardList />}
          caption="Усі ваші замовлення"
        />
        <Stat
          label="У роботі"
          value={active}
          icon={<Clock />}
          caption={a.demo ? "Турбота вже триває" : "На поточній сторінці"}
        />
        <Stat
          label="Очікують на рішення"
          value={list.items.filter((c) => c.status === "open").length}
          icon={<Mail />}
          caption={a.demo ? "Перегляньте пропозиції" : "На поточній сторінці"}
        />
        <Stat
          label="Завершено"
          value={list.items.filter((c) => c.status === "completed").length}
          icon={<CheckCheck />}
          caption={
            a.demo ? "Збережені моменти турботи" : "На поточній сторінці"
          }
        />
      </section>
      <div className="dashboard-grid">
        <section className="panel orders">
          <div className="panel-title">
            <h2>
              Мої замовлення <span>{list.total}</span>
            </h2>
            <Link to="/contracts">
              Усі замовлення <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="tabs">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              Усі замовлення
            </button>
            <button
              className={filter === "active" ? "active" : ""}
              onClick={() => setFilter("active")}
            >
              Активні
            </button>
            <button
              className={filter === "completed" ? "active" : ""}
              onClick={() => setFilter("completed")}
            >
              Завершені
            </button>
          </div>
          {list.loading ? (
            <Spinner />
          ) : list.error ? (
            <ErrorBox text={list.error} retry={list.reload} />
          ) : (
            <>
              {list.items
                .filter(
                  (c) =>
                    filter === "all" ||
                    (filter === "completed"
                      ? c.status === "completed"
                      : ["open","in_progress","awaiting_confirmation"].includes(c.status)),
                )
                .slice(0, 3)
                .map((c) => (
                  <OrderRow key={c.id} c={c} />
                ))}
              {list.items.length === 0 && <Empty />}
            </>
          )}
          <div className="panel-foot">
            <ShieldCheck size={14} /> Ваші замовлення та особисті дані захищені
          </div>
        </section>
        <section className="panel steps">
          <span className="tiny-icon">
            <Flower2 size={19} />
          </span>
          <h2>Турбота — це просто</h2>
          <p>Від першого кроку до результату</p>
          {[
            ["Створіть замовлення", "Опишіть, яка допомога потрібна."],
            ["Оберіть виконавця", "Перегляньте пропозиції та відгуки."],
            ["Прийміть результат", "Підтвердьте виконання й залиште відгук."],
          ].map(([t, d], i) => (
            <div className="step" key={t}>
              <span>{i + 1}</span>
              <div>
                <b>{t}</b>
                <p>{d}</p>
              </div>
            </div>
          ))}
          <Link to="/services">
            Дізнатись про послуги <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="section-heading">
        <div>
          <h2>Як ми можемо допомогти</h2>
          <p>Дбайливий догляд у кожній деталі</p>
        </div>
        <Link to="/services">
          Усі послуги <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="service-grid">
        {a.services.slice(0, 4).map((s, i) => (
          <ServiceCard key={s.id} s={s} i={i} />
        ))}
      </div>
    </>
  );
}