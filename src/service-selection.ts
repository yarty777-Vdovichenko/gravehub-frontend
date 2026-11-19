import type { SelectableService } from "./api";

type PathItem = { id: string; name: string };

function choicesInPath(path: PathItem[]) {
  const choices = new Map<string, string>();
  for (let index = 1; index < path.length - 1; index += 1) {
    choices.set(path[index].id, path[index + 1].id);
  }
  return choices;
}

function pathsConflict(first: PathItem[], second: PathItem[]) {
  const firstChoices = choicesInPath(first);
  const secondChoices = choicesInPath(second);
  return Array.from(firstChoices).some(
    ([parentId, childId]) =>
      secondChoices.has(parentId) && secondChoices.get(parentId) !== childId,
  );
}

export function toggleServiceSelection(
  current: string[],
  id: string,
  services: SelectableService[],
) {
  if (current.includes(id)) return current.filter((value) => value !== id);
  const service = services.find((item) => item.id === id);
  const servicePath = service?.path;
  if (!servicePath) return [...current, id];
  return [
    ...current.filter((selectedId) => {
      const selected = services.find((item) => item.id === selectedId);
      const selectedPath = selected?.path;
      return !selectedPath || !pathsConflict(servicePath, selectedPath);
    }),
    id,
  ];
}

export function normalizeServiceSelection(
  selectedIds: string[],
  services: SelectableService[],
) {
  return selectedIds.reduce<string[]>((selected, id) => {
    if (!services.some((service) => service.id === id)) return selected;
    if (selected.includes(id)) return selected;
    const service = services.find((item) => item.id === id);
    const servicePath = service?.path;
    if (!servicePath) return [...selected, id];
    return [
      ...selected.filter((selectedId) => {
        const existing = services.find((item) => item.id === selectedId);
        const existingPath = existing?.path;
        return !existingPath || !pathsConflict(servicePath, existingPath);
      }),
      id,
    ];
  }, []);
}

export function servicePathChoices(path: PathItem[]) {
  return choicesInPath(path);
}

export function servicePathsConflict(first: PathItem[], second: PathItem[]) {
  return pathsConflict(first, second);
}
