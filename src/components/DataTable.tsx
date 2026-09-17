import { useMemo, useState } from "react";
import { humanizeKey } from "../lib/format";
import { FieldValue } from "./FieldValue";
import { EmptyState } from "./StateBlock";
import { Icon } from "./Icon";

export interface RowAction {
  key: string;
  label: string;
  onClick: (row: Record<string, unknown>) => void;
  danger?: boolean;
}

interface DataTableProps {
  rows: Record<string, unknown>[];
  columns?: string[];
  rowId: (row: Record<string, unknown>) => string;
  onRowClick?: (row: Record<string, unknown>) => void;
  rowActions?: RowAction[];
  emptyTitle?: string;
  emptyText?: string;
  pageSize?: number;
}

const PRIORITY = ["id", "name", "email", "status", "risk_level", "decision", "severity", "amount", "currency", "created_at"];

export function deriveColumns(rows: Record<string, unknown>[], configured?: string[]): string[] {
  if (configured && configured.length > 0) return configured;
  if (rows.length === 0) return [];
  const keys = new Set<string>();
  for (const row of rows.slice(0, 20)) {
    for (const [k, v] of Object.entries(row)) {
      if (v === null || typeof v !== "object") keys.add(k);
    }
  }
  const ordered = [...keys].sort((a, b) => {
    const ai = PRIORITY.indexOf(a);
    const bi = PRIORITY.indexOf(b);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.localeCompare(b);
  });
  return ordered.slice(0, 9);
}

export function DataTable({
  rows,
  columns,
  rowId,
  onRowClick,
  rowActions,
  emptyTitle,
  emptyText,
  pageSize = 25,
}: DataTableProps) {
  const [page, setPage] = useState(1);
  const cols = useMemo(() => deriveColumns(rows, columns), [rows, columns]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  const view = rows.slice((current - 1) * pageSize, current * pageSize);

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle ?? "No records"} text={emptyText ?? "Nothing matched this query."} />;
  }

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c}>{humanizeKey(c)}</th>
              ))}
              {rowActions && rowActions.length > 0 ? <th style={{ width: 1 }}>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {view.map((row) => {
              const id = rowId(row);
              return (
                <tr
                  key={id}
                  className={onRowClick ? "is-clickable" : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {cols.map((c) => (
                    <td key={c}>
                      <FieldValue field={c} value={row[c]} compact />
                    </td>
                  ))}
                  {rowActions && rowActions.length > 0 ? (
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-8" style={{ justifyContent: "flex-end" }}>
                        {rowActions.map((a) => (
                          <button
                            key={a.key}
                            className={`btn btn-sm ${a.danger ? "btn-danger" : "btn-secondary"}`}
                            onClick={() => a.onClick(row)}
                          >
                            {a.label}
                          </button>
                        ))}
                        {onRowClick ? (
                          <button className="icon-btn" aria-label="Open" onClick={() => onRowClick(row)}>
                            <Icon name="chevron-right" size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > pageSize ? (
        <div className="pagination">
          <span>
            Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="pagination__controls">
            <button className="pagination__btn" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              <Icon name="chevron-left" size={14} />
            </button>
            <span className="pagination__btn active">{current}</span>
            <button className="pagination__btn" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
              <Icon name="chevron-right" size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
