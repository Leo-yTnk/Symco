import { useEffect, useRef } from "react";
import { X, FileText, Activity } from "lucide-react";
import type { Database, Project } from "../domain/model";
import type { WorkspaceActions } from "../application/useWorkspace";
import { userName, formatDate } from "../domain/selectors";
export type PageProps = {
  database: Database;
  projects: Project[];
  workspaceId: string;
  actions: WorkspaceActions;
  navigate: (path: string) => void;
};
export function Metrics({
  items,
}: {
  items: { label: string; value: string | number; tone?: string }[];
}) {
  return (
    <div className="os-kpis">
      {items.map((m, i) => (
        <div
          className={`os-kpi tone-${m.tone || ["blue", "amber", "red", "purple"][i % 4]}`}
          key={m.label}
        >
          <Activity size={18} />
          <span>{m.label}</span>
          <strong>{m.value}</strong>
          <small>Workspace atual</small>
        </div>
      ))}
    </div>
  );
}
export function Empty({
  text = "Nenhum registro encontrado.",
}: {
  text?: string;
}) {
  return (
    <div className="os-empty">
      <FileText size={28} />
      <h2>{text}</h2>
      <p>Adicione um registro ou ajuste os filtros.</p>
    </div>
  );
}
export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const element = ref.current!;
    const focusable = () =>
      [
        ...element.querySelectorAll<HTMLElement>(
          "button,input,select,textarea,a[href]",
        ),
      ].filter((e) => !e.hasAttribute("disabled"));
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const nodes = focusable();
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    element.addEventListener("keydown", key);
    return () => {
      element.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="os-overlay" onClick={close}>
      <div
        ref={ref}
        className="os-task-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button aria-label="Fechar painel" onClick={close}>
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export function RecentActivity({
  database,
  projects,
  navigate,
}: Pick<PageProps, "database" | "projects" | "navigate">) {
  const ids = new Set(projects.map((p) => p.id));
  const items = database.activities
    .filter((a) => ids.has(a.projectId))
    .slice(0, 7);
  return (
    <section className="os-section">
      <div className="os-section-head">
        <h2>Atividades recentes</h2>
      </div>
      {items.length ? (
        items.map((a) => (
          <button
            key={a.id}
            className="os-feed-item"
            onClick={() => navigate(`/app/projects/${a.projectId}`)}
          >
            <span className="os-avatar mini">
              {userName(database, a.actorId).slice(0, 2).toUpperCase()}
            </span>
            <span>
              <strong>{userName(database, a.actorId)}</strong> {a.summary}
              <small>{formatDate(a.createdAt)}</small>
            </span>
          </button>
        ))
      ) : (
        <p className="os-muted">Sem atividades neste workspace.</p>
      )}
    </section>
  );
}
export function exportCsv(filename: string, rows: (string | number)[][]) {
  const value =
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map(
            (cell) =>
              '"' +
              String(cell)
                .replace(/"/g, '""')
                .replace(/^[=+@-]/, "'$&") +
              '"',
          )
          .join(";"),
      )
      .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([value], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
