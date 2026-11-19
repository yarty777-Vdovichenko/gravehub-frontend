import type { SearchFilters } from "../new-api";

export type ListFilters = Omit<SearchFilters, "page" | "limit">;

const LIST_QUERY_KEYS = [
  "search",
  "serviceId",
  "regionId",
  "minRating",
  "minBudget",
  "maxBudget",
  "sortBy",
  "order",
  "page",
  "limit",
];

export function listQueryKey(params: URLSearchParams) {
  const listParams = new URLSearchParams();
  for (const key of LIST_QUERY_KEYS) {
    const value = params.get(key);
    if (value !== null) listParams.set(key, value);
  }
  return listParams.toString();
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeNumber(value: string | null) {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseListQuery(
  params: URLSearchParams,
  employee: boolean,
): { page: number; limit: number; filters: ListFilters } {
  const requestedLimit = positiveInteger(params.get("limit"), 10);
  const limit = [10, 20, 50].includes(requestedLimit) ? requestedLimit : 10;
  const requestedSort = params.get("sortBy");
  const allowedSorts = employee
    ? ["rating", "completedContracts"]
    : ["createdAt", "budget"];
  const sortBy =
    requestedSort && allowedSorts.includes(requestedSort)
      ? requestedSort
      : employee
        ? "rating"
        : "createdAt";
  const requestedOrder = params.get("order");
  const minRating = nonNegativeNumber(params.get("minRating"));

  return {
    page: positiveInteger(params.get("page"), 1),
    limit,
    filters: {
      search: params.get("search") || undefined,
      serviceId: params.get("serviceId") || undefined,
      regionId: params.get("regionId") || undefined,
      ...(employee
        ? { minRating: minRating !== undefined && minRating <= 5 ? minRating : undefined }
        : {
            minBudget: nonNegativeNumber(params.get("minBudget")),
            maxBudget: nonNegativeNumber(params.get("maxBudget")),
          }),
      sortBy,
      order: requestedOrder === "asc" ? "asc" : "desc",
    },
  };
}

export function createListQuery(
  filters: ListFilters,
  limit: number,
  page: number,
  extra: Record<string, string | undefined> = {},
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  params.set("page", String(page));
  params.set("limit", String(limit));
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  return params;
}
