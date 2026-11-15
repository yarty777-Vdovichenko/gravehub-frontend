import { api } from "./api";
export interface MetaPage<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}
export interface Employee {
  id: string;
  rating: number;
  reviewsCount?:number;
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
export const plotsApi = {
  creditPreview: async (
    plotId: string,
    months: Credit["months"],
    downPayment: number,
  ) => {
    const { data } = await api.get<Credit>(
      `/plots/${encodeURIComponent(plotId)}/credit-preview`,
      { params: { months, downPayment } },
    );
    return data;
  },
  reserve: async (plotId: string) => {
    const { data } = await api.post<Reservation>(
      `/plots/${encodeURIComponent(plotId)}/reserve`,
    );
    return data;
  },
  release: async (plotId: string) => {
    await api.delete(`/plots/${encodeURIComponent(plotId)}/reserve`);
  },
  purchase: (
    plotId: string,
    input:
      | { paymentType: "full" }
      | { paymentType: "credit"; months: Credit["months"]; downPayment: number },
  ) =>
    api
      .post<Purchase>(`/plots/${encodeURIComponent(plotId)}/purchase`, input)
      .then((r) => r.data),
};
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
const profiles=new Map<string,Employee>();
function normalize(raw:unknown):Employee{if(!raw||typeof raw!=='object'||!('id'in raw)||typeof raw.id!=='string')throw new Error('Некоректні дані виконавця');const r=raw as Record<string,unknown>;const list=(value:unknown):{id:string;name:string}[]=>Array.isArray(value)?value.filter((v):v is {id:string;name:string}=>!!v&&typeof v==='object'&&typeof v.id==='string'&&typeof v.name==='string'):[];const u=r.user as Record<string,unknown>|undefined;return {id:raw.id,rating:typeof r.rating==='number'?r.rating:0,reviewsCount:typeof r.reviewsCount==='number'?r.reviewsCount:undefined,completedContracts:typeof r.completedContracts==='number'?r.completedContracts:0,user:{id:typeof u?.id==='string'?u.id:'',name:typeof u?.name==='string'?u.name:'Виконавець'},regions:list(r.regions),specialization:list(r.specialization??r.specializations??r.services)}}
export const newApi = {
  employees: async (params: SearchFilters, signal?: AbortSignal) => {
    const { data } = await api.get<MetaPage<unknown>>("/employees", {
      params,
      signal,
    });
    const items = data.items.map(normalize);
    items.forEach((item) => profiles.set(item.id, item));
    return { ...data, items };
  },
  employee: async (id: string) => {
    const profile = profiles.get(id);
    if (!profile)
      throw new Error(
        "Профіль недоступний після перезавантаження. Відкрийте його зі списку виконавців. Окремий endpoint профілю не використовується.",
      );
    return profile;
  },
  cemeteries: async () => {
    const { data } = await api.get<Cemetery[]>("/cemeteries");
    return data;
  },
  plots: async (cemeteryId: string, signal?: AbortSignal) => {
    const { data } = await api.get<BurialPlot[]>(
      `/cemeteries/${encodeURIComponent(cemeteryId)}/plots`,
      { signal },
    );
    return data;
  },
  mine: async () => {
    const { data } = await api.get<OwnedPlot[]>("/plots/my");
    return data;
  },
};
