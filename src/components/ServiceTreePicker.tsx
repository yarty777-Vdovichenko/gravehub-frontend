import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { SelectableService, ServiceCategory } from "../api";
import { flattenServiceCatalog } from "../new-api";
import {
  normalizeServiceSelection,
  servicePathChoices,
  servicePathsConflict,
  toggleServiceSelection,
} from "../service-selection";
import "../style.css";
import { useApp } from "./useApp";

type PathItem = { id: string; name: string };
type InputType = "checkbox" | "radio";
type Mode = "contract" | "employee" | "catalog";

function collectIds(node: SelectableService, ids: Set<string>) {
  ids.add(node.id);
  (node.children ?? []).forEach((child) => collectIds(child, ids));
}

export function ServiceTreePicker({
  categories,
  services,
  mode,
  selectedIds = [],
  onChange,
  name,
}: {
  categories: ServiceCategory[];
  services: SelectableService[];
  mode: Mode;
  selectedIds?: string[];
  onChange?: (ids: string[]) => void;
  name?: string;
}) {
  const app = useApp();
  const terminalServices = useMemo(
    () => (categories.length ? flattenServiceCatalog(categories) : services),
    [categories, services],
  );
  const serviceMap = useMemo(
    () => new Map(terminalServices.map((service) => [service.id, service])),
    [terminalServices],
  );
  const nodeMap = useMemo(() => {
    const nodes = new Map<string, SelectableService>();
    const visit = (node: SelectableService) => {
      nodes.set(node.id, node);
      (node.children ?? []).forEach(visit);
    };
    categories.forEach(visit);
    terminalServices.forEach((service) => nodes.set(service.id, service));
    return nodes;
  }, [categories, terminalServices]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [branchSelections, setBranchSelections] = useState<
    Record<string, string>
  >({});
  const previousSelection = useRef(selectedIds);
  const selectedChoices = useMemo(() => {
    const choices = new Map<string, string>();
    selectedIds.forEach((id) => {
      const service = serviceMap.get(id);
      if (service?.path) {
        servicePathChoices(service.path).forEach((childId, parentId) =>
          choices.set(parentId, childId),
        );
      }
    });
    return choices;
  }, [selectedIds, serviceMap]);

  useEffect(() => {
    const added = selectedIds.filter((id) => !previousSelection.current.includes(id));
    previousSelection.current = selectedIds;
    if (!added.length) return;
    setExpandedIds((current) => {
      const next = new Set(current);
      added.forEach((id) => {
        const path = serviceMap.get(id)?.path ?? [];
        path.slice(0, -1).forEach((item) => {
          if ((nodeMap.get(item.id)?.children ?? []).length) next.add(item.id);
        });
      });
      return next;
    });
  }, [selectedIds, serviceMap, nodeMap]);

  function updateBranchSelection(
    parent: SelectableService,
    selectedNode: SelectableService,
    path: PathItem[],
  ) {
    const conflictingIds = new Set<string>();
    (parent.children ?? [])
      .filter((child) => child.id !== selectedNode.id)
      .forEach((child) => collectIds(child, conflictingIds));
    const nextIds = selectedIds.filter((id) => {
      const service = serviceMap.get(id);
      return !service?.path || !servicePathsConflict(path, service.path);
    });
    onChange?.(nextIds);
    setBranchSelections((current) => {
      const next = { ...current };
      conflictingIds.forEach((id) => delete next[id]);
      servicePathChoices(path).forEach((childId, parentId) => {
        next[parentId] = childId;
      });
      return next;
    });
    setExpandedIds((current) => new Set(current).add(selectedNode.id));
  }

  function clearBranchSelection(
    parent: SelectableService,
    selectedNode: SelectableService,
  ) {
    const subtreeIds = new Set<string>();
    collectIds(selectedNode, subtreeIds);
    onChange?.(selectedIds.filter((id) => !subtreeIds.has(id)));
    setBranchSelections((current) => {
      const next = { ...current };
      if (next[parent.id] === selectedNode.id) delete next[parent.id];
      Object.entries(next).forEach(([branchId, childId]) => {
        if (subtreeIds.has(branchId) || subtreeIds.has(childId)) {
          delete next[branchId];
        }
      });
      return next;
    });
  }

  function toggleLeaf(id: string, inputType: InputType) {
    if (!onChange || mode === "catalog") return;
    const wasSelected = selectedIds.includes(id);
    const next = toggleServiceSelection(selectedIds, id, terminalServices);
    onChange(next);
    if (mode === "contract" && inputType === "radio") {
      const service = serviceMap.get(id);
      if (!service?.path) return;
      setBranchSelections((current) => {
        const updated = { ...current };
        const path = service.path ?? [];
        if (wasSelected) {
          servicePathChoices(path).forEach((childId, parentId) => {
            if (updated[parentId] === childId) delete updated[parentId];
          });
          return updated;
        }
        for (let index = 1; index < path.length - 1; index += 1) {
          const parent = nodeMap.get(path[index].id);
          const chosenChild = path[index + 1];
          const conflictingIds = new Set<string>();
          (parent?.children ?? [])
            .filter((child) => child.id !== chosenChild.id)
            .forEach((child) => collectIds(child, conflictingIds));
          conflictingIds.forEach((conflictingId) => delete updated[conflictingId]);
        }
        servicePathChoices(path).forEach((childId, parentId) => {
          updated[parentId] = childId;
        });
        return updated;
      });
    }
  }

  function renderLeaf(
    node: SelectableService,
    inputType: InputType,
    parent?: SelectableService,
  ) {
    if (mode === "catalog") {
      const path = node.path?.map((item) => item.name).join(" / ");
      return (
        <Link
          className="service-tree-leaf service-tree-link"
          key={node.id}
          to={
            app.mode === "customer"
              ? `/contracts/new?service=${encodeURIComponent(node.id)}`
              : "/market"
          }
        >
          <span className="service-tree-link-copy">
            <b>{node.name}</b>
            {node.description && <small>{node.description}</small>}
            {path && <small className="service-tree-path">{path}</small>}
          </span>
          {typeof node.price === "number" && (
            <strong>{node.price.toLocaleString("uk-UA")} ₴</strong>
          )}
        </Link>
      );
    }

    const actualInputType =
      mode === "employee" ? "checkbox" : inputType;
    const radioParent = actualInputType === "radio" ? parent : undefined;
    const checked = radioParent
      ? (selectedChoices.get(radioParent.id) ??
          branchSelections[radioParent.id]) === node.id
      : selectedIds.includes(node.id);
    const path = node.path?.map((item) => item.name).join(" / ");
    return (
      <label className="service-checkbox service-tree-leaf" key={node.id}>
        <input
          type={actualInputType}
          name={
            actualInputType === "radio" && radioParent
              ? `service-radio-${radioParent.id}`
              : undefined
          }
          checked={checked}
          onClick={(event) => {
            if (actualInputType === "radio" && checked) {
              event.preventDefault();
              toggleLeaf(node.id, actualInputType);
            }
          }}
          onChange={() => toggleLeaf(node.id, actualInputType)}
        />
        <span>
          <b>{node.name}</b>
          {node.description && <small>{node.description}</small>}
          {path && <small>{path}</small>}
        </span>
        {typeof node.price === "number" && (
          <strong>{node.price.toLocaleString("uk-UA")} ₴</strong>
        )}
      </label>
    );
  }

  function renderNode(
    node: SelectableService,
    depth: number,
    parent?: SelectableService,
    inputType: InputType = "checkbox",
    parentPath: PathItem[] = [],
  ): ReactNode {
    const path = [...parentPath, { id: node.id, name: node.name }];
    const children = node.children ?? [];
    if (!children.length) return renderLeaf(node, inputType, parent);

    const isExpanded = expandedIds.has(node.id);
    const radioParent =
      mode === "contract" && inputType === "radio" ? parent : undefined;
    const checked = radioParent
      ? (selectedChoices.get(radioParent.id) ??
          branchSelections[radioParent.id]) === node.id
      : false;
    const childInputType: InputType = depth === 0 ? "checkbox" : "radio";
    return (
      <div className={`service-tree-group service-tree-depth-${depth}`} key={node.id}>
        <div className="service-tree-heading">
          {radioParent && (
            <input
              type="radio"
              name={`service-radio-${radioParent.id}`}
              checked={checked}
              onClick={(event) => {
                if (checked) {
                  event.preventDefault();
                  clearBranchSelection(radioParent, node);
                }
              }}
              onChange={() => updateBranchSelection(radioParent, node, path)}
            />
          )}
          <span>
            <b>{node.name}</b>
            {node.description && <small>{node.description}</small>}
          </span>
          <button
            type="button"
            className="service-category-toggle"
            aria-label={`${isExpanded ? "Згорнути" : "Розгорнути"} ${node.name}`}
            aria-expanded={isExpanded}
            aria-controls={`service-tree-${node.id}`}
            onClick={() =>
              setExpandedIds((current) => {
                const next = new Set(current);
                if (next.has(node.id)) next.delete(node.id);
                else next.add(node.id);
                return next;
              })
            }
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>
        <div
          id={`service-tree-${node.id}`}
          className="service-tree-children"
          role={childInputType === "radio" ? "radiogroup" : "group"}
          aria-label={node.name}
          hidden={!isExpanded}
        >
          {children.map((child) =>
            renderNode(
              child,
              depth + 1,
              node,
              childInputType,
              path,
            ),
          )}
        </div>
      </div>
    );
  }

  const validSelectedIds = selectedIds.filter((id) => serviceMap.has(id));
  return (
    <div className={`service-tree service-tree-${mode}`}>
      {name &&
        validSelectedIds.map((id) => (
          <input key={id} type="hidden" name={name} value={id} />
        ))}
      {categories.length
        ? categories.map((category) => renderNode(category, 0))
        : terminalServices.map((service) =>
            renderLeaf(service, "checkbox"),
          )}
    </div>
  );
}
