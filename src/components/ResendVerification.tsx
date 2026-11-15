import { useEffect, useState } from "react";
import { authApi, errorText } from "../api";
import "../style.css";
import { ErrorBox } from "./ErrorBox";

const COOLDOWN_SECONDS = 30;

export function ResendVerification({ email }: { email: string }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [wait, setWait] = useState(0);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  async function send() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await authApi.resendVerification(email);
      setMessage(r.data.message);
      setWait(COOLDOWN_SECONDS);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="resend-box">
      <button
        type="button"
        className="button secondary"
        disabled={busy || wait > 0 || !email}
        onClick={send}
      >
        {wait > 0
          ? `Надіслати ще раз (${wait} с)`
          : "Надіслати лист ще раз"}
      </button>
      {message && (
        <p role="status" className="resend-note">
          {message}
        </p>
      )}
      {error && <ErrorBox text={error} />}
    </div>
  );
}
