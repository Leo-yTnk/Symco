import { Metric } from "../components/os/controls";
export { Drawer as Modal } from "../components/os/Drawer";
import { FileText, Activity } from "lucide-react";
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
      {items.map((m) => (
        <Metric
          key={m.label}
          icon={<Activity size={18} />}
          label={m.label}
          value={m.value}
          tone={m.tone}
        />
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
