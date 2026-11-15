import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi, errorText } from "../api";
import "../style.css";
import { AuthLayout } from "./AuthLayout";
import { ErrorBox } from "./ErrorBox";
import { Field } from "./Field";

export function ResetPassword() {
  const [params] = useSearchParams(),
    token = params.get("token") ?? "",
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState("");
  if (!token)
    return (
      <AuthLayout title="Новий пароль">
        <ErrorBox text="У посиланні немає токена. Запросіть відновлення пароля ще раз." />
        <Link className="button secondary" to="/forgot-password">
          Запросити лист
        </Link>
      </AuthLayout>
    );
  return (
    <AuthLayout title="Новий пароль" subtitle="Придумайте новий пароль для входу.">
      {done ? (
        <>
          <p role="status">{done}. Увійдіть з новим паролем.</p>
          <Link className="button primary" to="/login">
            Увійти в кабінет
          </Link>
        </>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const password = String(f.get("password"));
            if (password !== String(f.get("confirm"))) {
              setError("Паролі не збігаються.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              const r = await authApi.resetPassword(token, password);
              setDone(r.data.message);
            } catch (err) {
              setError(errorText(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Новий пароль">
            <input
              required
              name="password"
              type="password"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Повторіть пароль">
            <input
              required
              name="confirm"
              type="password"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
            />
          </Field>
          {error && <ErrorBox text={error} />}
          <button className="button primary" disabled={busy}>
            {busy ? "Зачекайте…" : "Зберегти пароль"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
