import React from "react";
import "../style.css";

export function Stat({
  label,
  value,
  icon,
  caption,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  caption: string;
}) {
  return (
    <div className="stat">
      <div>
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value.toString().padStart(2, "0")}</strong>
      <small>{caption}</small>
    </div>
  );
}