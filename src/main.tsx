import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { ErrorBoundary } from "./ErrorBoundary";
import "./style.css";

const savedTheme = localStorage.getItem("gravehub-theme");
const theme =
  savedTheme === "light" || savedTheme === "dark"
    ? savedTheme
    : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
document.documentElement.dataset.theme = theme;
document.documentElement.style.colorScheme = theme;
document.body.dataset.theme = theme;

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
