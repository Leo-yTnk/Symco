import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, userName } from "../domain/selectors";
import { statusLabels } from "../domain/model";
import { Empty, Metrics, RecentActivity, type PageProps } from "./workspaceUi";
export function Schedule(props: PageProps) {
  const { database, projects, navigate } = props;
  const [offset, setOffset] = useState(0);
  const [weeks, setWeeks] = useState(6);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [kind, setKind] = useState("");
  const [view, setView] = useState("gantt");
  const ids = new Set(projects.map((p) => p.id));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + offset * 7);
  const end = new Date(start.getTime() + weeks * 7 * 86400000);
  const days = weeks * 7;
  const entries = [
    ...database.tasks
      .filter((t) => ids.has(t.projectId) && t.dueDate)
      .map((t) => ({
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        start: database.projects.find((p) => p.id === t.projectId)!.startDate,
        date: t.dueDate!,
        kind: "Tarefa",
        status: statusLabels[t.status],
        done: t.status === "done",
        owner: t.assigneeId,
      })),
    ...database.milestones
      .filter((m) => ids.has(m.projectId))
      .map((m) => ({
        id: m.id,
        projectId: m.projectId,
        title: m.title,
        start: m.dueDate,
        date: m.dueDate,
        kind: "Marco",
        status: m.status === "done" ? "Concluído" : "Pendente",
        done: m.status === "done",
        owner: undefined,
      })),
    ...database.gates
      .filter((g) => ids.has(g.projectId) && g.dueDate)
      .map((g) => ({
        id: g.id,
        projectId: g.projectId,
        title: g.title,
        start: g.dueDate!,
        date: g.dueDate!,
        kind: "Gate",
        status: g.status === "approved" ? "Aprovado" : "Pendente",
        done: g.status === "approved",
        owner: g.approverIds[0],
      })),
  ];
  const filtered = entries
    .filter(
      (e) =>
        (!projectId || e.projectId === projectId) &&
        (!kind || e.kind === kind) &&
        e.title.toLowerCase().includes(query.toLowerCase()) &&
        (view === "list" ||
          (new Date(e.date + "T12:00:00") >= start &&
            new Date(e.start + "T12:00:00") <= end)),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const position = (date: string) =>
    ((new Date(date + "T00:00:00").getTime() - start.getTime()) /
      86400000 /
      days) *
    100;
  return (
    <div className="os-board-layout">
      <div>
        <Metrics
          items={[
            {
              label: "Em andamento",
              value: entries.filter((e) => !e.done).length,
            },
            {
              label: "Em atraso",
              value: entries.filter(
                (e) => !e.done && new Date(e.date + "T23:59:59") < today,
              ).length,
            },
            {
              label: "Marcos",
              value: entries.filter((e) => e.kind === "Marco").length,
            },
            {
              label: "Concluídos",
              value: entries.filter((e) => e.done).length,
            },
          ]}
        />
        <section className="os-section">
          <div className="os-portfolio-toolbar">
            <div className="os-view-tabs">
              {[
                ["gantt", "Gantt"],
                ["list", "Lista de prazos"],
              ].map(([v, l]) => (
                <button
                  key={v}
                  className={view === v ? "active" : ""}
                  onClick={() => setView(v)}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="os-action-row">
              <button
                className="os-icon-button"
                aria-label="Período anterior"
                onClick={() => setOffset(offset - weeks)}
              >
                <ChevronLeft size={18} />
              </button>
              <button className="os-button" onClick={() => setOffset(0)}>
                Hoje
              </button>
              <button
                className="os-icon-button"
                aria-label="Próximo período"
                onClick={() => setOffset(offset + weeks)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="os-filters">
            <label>
              Buscar
              <input
                aria-label="Buscar no cronograma"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tarefas, gates e marcos"
              />
            </label>
            <label>
              Projeto
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Todos os projetos</option>
                {projects.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="">Todos</option>
                {["Tarefa", "Marco", "Gate"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            {view === "gantt" && (
              <label>
                Escala
                <select
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value))}
                >
                  <option value={3}>3 semanas</option>
                  <option value={6}>6 semanas</option>
                  <option value={12}>12 semanas</option>
                </select>
              </label>
            )}
          </div>
          {view === "gantt" && (
            <p className="os-muted">
              {formatDate(start.toISOString())} —{" "}
              {formatDate(end.toISOString())} · As barras representam o
              intervalo entre o início do projeto e o prazo da tarefa.
            </p>
          )}
          {!filtered.length ? (
            <Empty text="Nenhum prazo neste período" />
          ) : view === "list" ? (
            <div className="os-table-scroll">
              <table className="os-table">
                <thead>
                  <tr>
                    <th>Entrega</th>
                    <th>Projeto</th>
                    <th>Tipo</th>
                    <th>Responsável</th>
                    <th>Prazo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <button
                          className="os-link"
                          onClick={() =>
                            navigate(`/app/projects/${e.projectId}`)
                          }
                        >
                          {e.title}
                        </button>
                      </td>
                      <td>
                        {projects.find((p) => p.id === e.projectId)?.name}
                      </td>
                      <td>{e.kind}</td>
                      <td>{e.owner ? userName(database, e.owner) : "—"}</td>
                      <td>{formatDate(e.date)}</td>
                      <td>{e.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="os-table-scroll">
              <div className="os-gantt">
                <div className="os-gantt-heading">
                  <strong>Projeto / entrega</strong>
                  <div>
                    {Array.from({ length: weeks }, (_, i) => (
                      <span key={i}>
                        {formatDate(
                          new Date(
                            start.getTime() + i * 7 * 86400000,
                          ).toISOString(),
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                {projects
                  .filter((p) => filtered.some((e) => e.projectId === p.id))
                  .map((p, i) => (
                    <div key={p.id}>
                      <button
                        className="os-gantt-project"
                        onClick={() => navigate(`/app/projects/${p.id}`)}
                      >
                        <CalendarDays size={14} />
                        {p.name}
                      </button>
                      {filtered
                        .filter((e) => e.projectId === p.id)
                        .map((e) => {
                          const left = Math.max(0, position(e.start));
                          const right = Math.min(
                            100,
                            position(e.date) + 100 / days,
                          );
                          return (
                            <div className="os-gantt-row" key={e.id}>
                              <button
                                className="os-link"
                                onClick={() =>
                                  navigate(`/app/projects/${p.id}`)
                                }
                              >
                                {e.title}
                                <small>
                                  {e.kind} · {e.status}
                                </small>
                              </button>
                              <div
                                className="os-gantt-track"
                                style={{
                                  backgroundSize: `${100 / weeks}% 100%`,
                                }}
                              >
                                {position(today.toISOString().slice(0, 10)) >=
                                  0 &&
                                  position(today.toISOString().slice(0, 10)) <=
                                    100 && (
                                    <span
                                      className="os-gantt-today"
                                      style={{
                                        left: `${position(today.toISOString().slice(0, 10))}%`,
                                      }}
                                    />
                                  )}
                                <button
                                  aria-label={`${e.title}, ${formatDate(e.date)}, ${e.status}`}
                                  title={`${e.title} · ${formatDate(e.date)}`}
                                  className={`os-gantt-bar bar-${i % 4} ${e.done ? "complete" : ""}`}
                                  style={{
                                    left: `${left}%`,
                                    width: `${Math.max(1, right - left)}%`,
                                  }}
                                  onClick={() =>
                                    navigate(`/app/projects/${p.id}`)
                                  }
                                >
                                  {e.kind === "Tarefa" ? e.status : "◆"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      </div>
      <aside className="os-rail">
        <RecentActivity {...props} />
        <section className="os-section">
          <h2>Próximos marcos</h2>
          {entries
            .filter((e) => e.kind !== "Tarefa" && !e.done)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 6)
            .map((e) => (
              <button
                className="os-feed-item"
                key={e.id}
                onClick={() => navigate(`/app/projects/${e.projectId}`)}
              >
                <CalendarDays size={16} />
                <span>
                  {e.title}
                  <small>{formatDate(e.date)}</small>
                </span>
              </button>
            ))}
        </section>
      </aside>
    </div>
  );
}
