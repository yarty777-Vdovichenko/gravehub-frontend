import "../new-pages.css";

export const cash = (n: number) => new Intl.NumberFormat("uk-UA").format(n) + " ₴";