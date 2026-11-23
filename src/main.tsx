import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { ErrorBoundary } from "./ErrorBoundary";
import { applyTheme, getInitialTheme } from "./theme";
import "./style.css";

applyTheme(getInitialTheme());

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
