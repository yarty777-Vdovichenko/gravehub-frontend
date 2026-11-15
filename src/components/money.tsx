import "../style.css";

export const money = (n: number) => new Intl.NumberFormat("uk-UA").format(n) + " ₴";