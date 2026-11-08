import { api } from "./api";
export interface MetaPage<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}
export interface Employee {
  id: string;
  rating: number;
  completedContracts: number;
  user: { id: string; name: string };
  regions: { id: string; name: string }[];
  specialization: { id: string; name: string }[];
}
export interface Cemetery {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}
export interface BurialPlot {
  id: string;
  positionX: number;
  positionY: number;
  price: number;
  status: "available" | "reserved" | "sold";
}
export interface OwnedPlot extends Omit<BurialPlot, "status"> {
  cemetery: { id: string; name: string; city: string };
  purchase: {
    paymentType: "full" | "credit";
    creditMonths: number | null;
    monthlyPayment: number | null;
    createdAt: string;
  } | null;
}
export interface Reservation {
  plotId: string;
  reservedUntil: string;
}
export interface Credit {
  months: 6 | 12 | 24;
  annualRate: number;
  downPayment: number;
  monthlyPayment: number;
  totalPaid: number;
  overpayment: number;
}
export interface Purchase {
  id: string;
  plotId: string;
  price: number;
  paymentType: "full" | "credit";
  creditMonths: number | null;
  downPayment: number | null;
  monthlyPayment: number | null;
}
export interface SearchFilters {
  search?: string;
  regionId?: string;
  serviceId?: string;
  minRating?: number;
  minBudget?: number;
  maxBudget?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  page: number;
  limit: number;
}
export const newApi = {
  employees: (params: SearchFilters, signal?: AbortSignal) =>
    api
      .get<MetaPage<Employee>>("/employees", { params, signal })
      .then((r) => r.data),
  employee: (id: string) =>
    api.get<Employee>("/employees/" + id).then((r) => r.data),
  cemeteries: () => api.get<Cemetery[]>("/cemeteries").then((r) => r.data),
  plots: (id: string) =>
    api.get<BurialPlot[]>(`/cemeteries/${id}/plots`).then((r) => r.data),
  mine: () => api.get<OwnedPlot[]>("/plots/my").then((r) => r.data),
  reserve: (id: string) =>
    api.post<Reservation>(`/plots/${id}/reserve`).then((r) => r.data),
  release: (id: string) => api.delete(`/plots/${id}/reserve`),
  credit: (id: string, months: 6 | 12 | 24, downPayment: number) =>
    api
      .get<Credit>(`/plots/${id}/credit-preview`, {
        params: { months, downPayment },
      })
      .then((r) => r.data),
  purchase: (
    id: string,
    body: {
      paymentType: "full" | "credit";
      months?: 6 | 12 | 24;
      downPayment?: number;
    },
  ) => api.post<Purchase>(`/plots/${id}/purchase`, body).then((r) => r.data),
};
