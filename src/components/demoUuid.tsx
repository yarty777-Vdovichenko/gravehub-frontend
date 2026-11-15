import "../style.css";

export const demoUuid = () =>
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.floor(Math.random() * 16) >> (Number(c) / 4))).toString(
      16,
    ),
  );