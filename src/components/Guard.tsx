import React from "react";
import {
Navigate,
Outlet
} from "react-router-dom";
import type {
Mode
} from "../api";
import "../style.css";
import { useApp } from './useApp';
export function Guard({
  children,
  mode,
}: {
  children?: React.ReactNode;
  mode?: Mode;
}) {
  const a = useApp();
  if (!a.session) return <Navigate to="/login" state={{from:window.location.pathname+window.location.search}} replace />;
  if (mode && a.mode !== mode) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}