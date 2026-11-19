import { api } from "./api";
import type { Option, SelectableService, ServiceCategory } from "./api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeServiceOption(value: unknown): Option & {
  parentId?: string | null;
} {
  const price = isRecord(value) ? value.price : undefined;
  const parentId = isRecord(value) ? value.parentId : undefined;
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    (value.description !== undefined &&
      typeof value.description !== "string") ||
    (price !== undefined &&
      price !== null &&
      (typeof price !== "number" || !Number.isFinite(price))) ||
    (parentId !== undefined &&
      parentId !== null &&
      typeof parentId !== "string")
  ) {
    throw new Error("Сервер повернув некоректний каталог послуг.");
  }
  const normalized: Option & { parentId?: string | null } = {
    id: value.id,
    name: value.name,
    ...(typeof value.description === "string"
      ? { description: value.description }
      : {}),
  };
  if (price === null || typeof price === "number") normalized.price = price;
  if (parentId === null || typeof parentId === "string") {
    normalized.parentId = parentId;
  }
  return normalized;
}

export function normalizeServiceCatalog(value: unknown): ServiceCategory[] {
  if (!Array.isArray(value)) {
    throw new Error("Сервер повернув некоректний каталог послуг.");
  }
  const normalizeNode = (
    rawNode: unknown,
    ancestors: { id: string; name: string }[],
  ): ServiceCategory => {
    if (!isRecord(rawNode)) {
      throw new Error("Сервер повернув некоректний каталог послуг.");
    }
    const node = normalizeServiceOption(rawNode);
    if (
      rawNode.children !== undefined &&
      !Array.isArray(rawNode.children)
    ) {
      throw new Error("Сервер повернув некоректний каталог послуг.");
    }
    const path = [...ancestors, { id: node.id, name: node.name }];
    const root = path[0];
    const children = Array.isArray(rawNode.children)
      ? rawNode.children.map((child) => normalizeNode(child, path))
      : [];
    return {
      ...node,
      categoryId: root.id,
      categoryName: root.name,
      path,
      children,
    };
  };
  return value.map((rawNode) => normalizeNode(rawNode, []));
}

export function flattenServiceCatalog(
  categories: ServiceCategory[],
): SelectableService[] {
  const services: SelectableService[] = [];
  const visit = (node: SelectableService) => {
    const children = node.children ?? [];
    if (!children.length) {
      services.push(node);
      return;
    }
    children.forEach(visit);
  };
  categories.forEach(visit);
  return services;
}

export function servicePathLabel(
  services: SelectableService[],
  serviceId: string,
  fallbackName?: string,
) {
  const service = services.find((item) => item.id === serviceId);
  if (service?.path?.length) {
    return service.path.map((part) => part.name).join(" / ");
  }
  if (service?.categoryName) {
    return `${service.categoryName} / ${service.name}`;
  }
  return service?.name ?? fallbackName ?? serviceId;
}

export interface MetaPage<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}
export interface Employee {
  id: string;
  rating: number;
  reviewsCount?:number;
  completedContracts: number;
  description?: string;
  portfolio?: {
    id: string;
    url: string;
    type: "image" | "video";
    caption?: string | null;
    createdAt: string;
  }[];
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
function normalize(raw:unknown):Employee{if(!raw||typeof raw!=='object'||!('id'in raw)||typeof raw.id!=='string')throw new Error('Некоректні дані виконавця');const r=raw as Record<string,unknown>;const list=(value:unknown):{id:string;name:string}[]=>Array.isArray(value)?value.filter((v):v is {id:string;name:string}=>!!v&&typeof v==='object'&&typeof v.id==='string'&&typeof v.name==='string'):[];const u=r.user as Record<string,unknown>|undefined;const portfolio=Array.isArray(r.portfolio)?r.portfolio.filter((item):item is NonNullable<Employee["portfolio"]>[number]=>!!item&&typeof item==="object"&&"id"in item&&typeof item.id==="string"&&"url"in item&&typeof item.url==="string"&&"type"in item&&(item.type==="image"||item.type==="video")):undefined;return {id:raw.id,rating:typeof r.rating==='number'?r.rating:0,reviewsCount:typeof r.reviewsCount==='number'?r.reviewsCount:undefined,completedContracts:typeof r.completedContracts==='number'?r.completedContracts:0,description:typeof r.description==="string"?r.description:undefined,portfolio,user:{id:typeof u?.id==='string'?u.id:'',name:typeof u?.name==='string'?u.name:'Виконавець'},regions:list(r.regions),specialization:list(r.specialization??r.specializations??r.services)}}
export const newApi = {
  serviceCatalog: async () => {
    const { data } = await api.get<unknown>("/services");
    return normalizeServiceCatalog(data);
  },
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
    const { data } = await api.get<unknown>(`/employees/${encodeURIComponent(id)}`);
    const profile = normalize(data);
    profiles.set(profile.id, profile);
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
