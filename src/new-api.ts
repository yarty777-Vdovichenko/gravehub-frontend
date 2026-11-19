import { api } from "./api";
import type {
  EmployeeSpecialization,
  Option,
  SelectableService,
  ServiceCategory,
} from "./api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeServiceOption(value: unknown): Option {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    (value.description !== undefined &&
      typeof value.description !== "string") ||
    (value.price !== undefined &&
      (typeof value.price !== "number" || !Number.isFinite(value.price)))
  ) {
    throw new Error("Сервер повернув некоректний каталог послуг.");
  }
  return {
    id: value.id,
    name: value.name,
    ...(typeof value.description === "string"
      ? { description: value.description }
      : {}),
    ...(typeof value.price === "number" ? { price: value.price } : {}),
  };
}

export function normalizeServiceCatalog(value: unknown): ServiceCategory[] {
  if (!Array.isArray(value)) {
    throw new Error("Сервер повернув некоректний каталог послуг.");
  }
  return value.map((rawCategory) => {
    if (!isRecord(rawCategory) || !Array.isArray(rawCategory.children)) {
      throw new Error("Сервер повернув некоректний каталог послуг.");
    }
    const category = normalizeServiceOption(rawCategory);
    const children: SelectableService[] = rawCategory.children.map(
      (rawService) => {
        const service = normalizeServiceOption(rawService);
        if (typeof service.price !== "number") {
          throw new Error("Сервер повернув некоректний каталог послуг.");
        }
        return {
          ...service,
          categoryId: category.id,
          categoryName: category.name,
        };
      },
    );
    return { ...category, children };
  });
}

export function flattenServiceCatalog(
  categories: ServiceCategory[],
): SelectableService[] {
  return categories.flatMap((category) => category.children);
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
  specialization: EmployeeSpecialization[];
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
function normalize(raw: unknown): Employee {
  if (!isRecord(raw) || typeof raw.id !== "string") {
    throw new Error("Некоректні дані виконавця");
  }
  const list = (value: unknown): { id: string; name: string }[] =>
    Array.isArray(value)
      ? value.filter(
          (item): item is { id: string; name: string } =>
            isRecord(item) &&
            typeof item.id === "string" &&
            typeof item.name === "string",
        )
      : [];
  const specializations = (
    value: unknown,
  ): EmployeeSpecialization[] =>
    Array.isArray(value)
      ? value.flatMap((item) => {
          if (
            !isRecord(item) ||
            typeof item.id !== "string" ||
            typeof item.name !== "string"
          ) {
            return [];
          }
          const parent =
            isRecord(item.parent) &&
            typeof item.parent.id === "string" &&
            typeof item.parent.name === "string"
              ? { id: item.parent.id, name: item.parent.name }
              : undefined;
          return [
            {
              id: item.id,
              name: item.name,
              ...(parent
                ? {
                    parent,
                    categoryId: parent.id,
                    categoryName: parent.name,
                  }
                : {}),
            },
          ];
        })
      : [];
  const user = isRecord(raw.user) ? raw.user : undefined;
  const portfolio = Array.isArray(raw.portfolio)
    ? raw.portfolio.filter(
        (item): item is NonNullable<Employee["portfolio"]>[number] =>
          isRecord(item) &&
          typeof item.id === "string" &&
          typeof item.url === "string" &&
          (item.type === "image" || item.type === "video"),
      )
    : undefined;
  return {
    id: raw.id,
    rating: typeof raw.rating === "number" ? raw.rating : 0,
    reviewsCount:
      typeof raw.reviewsCount === "number" ? raw.reviewsCount : undefined,
    completedContracts:
      typeof raw.completedContracts === "number" ? raw.completedContracts : 0,
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    portfolio,
    user: {
      id: typeof user?.id === "string" ? user.id : "",
      name: typeof user?.name === "string" ? user.name : "Виконавець",
    },
    regions: list(raw.regions),
    specialization: specializations(
      raw.specialization ?? raw.specializations ?? raw.services,
    ),
  };
}
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
