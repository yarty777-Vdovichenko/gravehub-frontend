import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi, errorText } from "../api";
import "../style.css";
import { AuthLayout } from "./AuthLayout";
import { ErrorBox } from "./ErrorBox";
import { Field } from "./Field";

export function ForgotPassword() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState("");
  return (
    <AuthLayout
      title="Відновлення пароля"
      subtitle="Вкажіть пошту акаунта — ми надішлемо посилання для нового пароля."
    >
      {done ? (
        <>
          <p role="status">{done}</p>
          <Link className="button secondary" to="/login">
            Повернутися до входу
          </Link>
        </>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const email = String(new FormData(e.currentTarget).get("email"));
            setBusy(true);
            setError("");
            try {
              const r = await authApi.forgotPassword(email.trim());
              setDone(r.data.message);
            } catch (err) {
              setError(errorText(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Електронна пошта">
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>
          {error && <ErrorBox text={error} />}
          <button className="button primary" disabled={busy}>
            {busy ? "Зачекайте…" : "Надіслати посилання"}
          </button>
          <p className="auth-link">
            <Link to="/login">Повернутися до входу</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
