import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn = {
  key: string;
  label: string;
  className?: string;
};

type DataTableProps = {
  columns: DataTableColumn[];
  isEmpty: boolean;
  empty: ReactNode;
  caption?: string;
  children: ReactNode;
  className?: string;
};

export function DataTable({
  columns,
  isEmpty,
  empty,
  caption,
  children,
  className,
}: DataTableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border bg-card",
        className
      )}
    >
      <table className="w-full min-w-[720px] border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-border bg-muted/60">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "px-4 py-3 text-start text-xs font-bold text-dark",
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td colSpan={columns.length} className="p-4 sm:p-6">
                {empty}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
