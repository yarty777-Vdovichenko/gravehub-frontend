import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi, errorText } from "../api";
import "../style.css";
import { AuthLayout } from "./AuthLayout";
import { ErrorBox } from "./ErrorBox";
import { Spinner } from "./Spinner";

export function VerifyEmail() {
  const [params] = useSearchParams(),
    token = params.get("token") ?? "",
    started = useRef(false),
    [state, setState] = useState<"loading" | "ok" | "error">(
      token ? "loading" : "error",
    ),
    [text, setText] = useState(
      token ? "" : "У посиланні немає токена підтвердження.",
    );
  useEffect(() => {
    // Токен одноразовий, тому не відправляємо запит двічі.
    if (!token || started.current) return;
    started.current = true;
    authApi
      .verifyEmail(token)
      .then((r) => {
        setText(r.data.message);
        setState("ok");
      })
      .catch((e) => {
        setText(errorText(e));
        setState("error");
      });
  }, [token]);
  return (
    <AuthLayout title="Підтвердження пошти">
      {state === "loading" && <Spinner />}
      {state === "ok" && (
        <>
          <p role="status">{text || "Пошту підтверджено."} Тепер можна увійти.</p>
          <Link className="button primary" to="/login">
            Увійти в кабінет
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <ErrorBox text={text} />
          <p>
            Посилання могло прострочитися. Увійдіть зі своїми даними — ми
            запропонуємо надіслати лист ще раз.
          </p>
          <Link className="button secondary" to="/login">
            До входу
          </Link>
        </>
      )}
    </AuthLayout>
  );
}
