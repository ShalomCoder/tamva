import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="content-header">
      <div style={{ minWidth: 0 }}>
        {back}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className="flex gap-8 items-center" style={{ flexWrap: "wrap" }}>
          {actions}
        </div>
      ) : null}
    </div>
  );
}
