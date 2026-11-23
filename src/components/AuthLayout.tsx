import { Leaf } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import "../style.css";
import { ThemeToggle } from "./ThemeToggle";

// Спрощена обгортка для сторінок без сесії (пошта, пароль).
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page auth-page-single">
      <section className="auth-form-area">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>
        <div className="auth-form">
          <Link className="brand" to="/login">
            <span className="brand-icon">
              <Leaf />
            </span>
            Grave<span>Hub</span>
          </Link>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {children}
        </div>
        <small className="auth-footer">
          З турботою про тих, кого пам’ятаємо.
        </small>
      </section>
    </div>
  );
}
