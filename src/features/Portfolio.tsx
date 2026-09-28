import { useMemo, useState } from "react";
import type { Database, Project } from "../domain/model";
import { healthLabels, projectStatusLabels } from "../domain/model";
import {
  formatDate,
  progress,
  projectClient,
  stageName,
  userName,
} from "../domain/selectors";
import { ProjectCard } from "../components/os/ProjectCard";

type View = "cards" | "table" | "kanban" | "timeline";
export function Portfolio({
  database,
  projects,
  navigate,
}: {
  database: Database;
  projects: Project[];
  navigate: (path: string) => void;
}) {
  const [view, setView] = useState<View>("cards");
  const [filters, setFilters] = useState({
    query: "",
    client: "",
    owner: "",
    status: "",
    stage: "",
    module: "",
    health: "",
    tag: "",
    date: "",
  });
  const filtered = useMemo(
    () =>
      projects.filter(
        (project) =>
          `${project.name} ${project.description} ${projectClient(database, project)}`
            .toLowerCase()
            .includes(filters.query.toLowerCase()) &&
          (!filters.client || project.clientId === filters.client) &&
          (!filters.owner || project.ownerId === filters.owner) &&
          (!filters.status || project.status === filters.status) &&
          (!filters.stage || project.currentStageId === filters.stage) &&
          (!filters.module || project.moduleIds.includes(filters.module)) &&
          (!filters.health || project.health === filters.health) &&
          (!filters.tag || project.tags.includes(filters.tag)) &&
          (!filters.date || project.dueDate.slice(0, 7) === filters.date),
      ),
    [database, projects, filters],
  );
  const set = (key: keyof typeof filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  return (
    <div className="os-section">
      <div className="os-portfolio-toolbar">
        <div className="os-view-tabs" role="group" aria-label="Visualização">
          {(["cards", "table", "kanban", "timeline"] as const).map((item) => (
            <button
              key={item}
              className={view === item ? "active" : ""}
              aria-pressed={view === item}
              onClick={() => setView(item)}
            >
              {
                {
                  cards: "Cards",
                  table: "Tabela",
                  kanban: "Kanban",
                  timeline: "Timeline",
                }[item]
              }
            </button>
          ))}
        </div>
        <span className="os-muted">
          {filtered.length} de {projects.length} projetos
        </span>
      </div>
      <div className="os-filters">
        <label>
          Buscar
          <input
            value={filters.query}
            onChange={(event) => set("query", event.target.value)}
            placeholder="Nome, cliente ou descrição"
          />
        </label>
        <label>
          Cliente
          <select
            value={filters.client}
            onChange={(event) => set("client", event.target.value)}
          >
            <option value="">Todos</option>
            {database.clients
              .filter((item) =>
                projects.some((project) => project.clientId === item.id),
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Responsável
          <select
            value={filters.owner}
            onChange={(event) => set("owner", event.target.value)}
          >
            <option value="">Todos</option>
            {database.users.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) => set("status", event.target.value)}
          >
            <option value="">Todos</option>
            {Object.entries(projectStatusLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Etapa
          <select
            value={filters.stage}
            onChange={(event) => set("stage", event.target.value)}
          >
            <option value="">Todas</option>
            {[
              ...new Map(
                database.methodologies
                  .flatMap((item) => item.stages)
                  .map((item) => [item.id, item]),
              ).values(),
            ].map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Módulo
          <select
            value={filters.module}
            onChange={(event) => set("module", event.target.value)}
          >
            <option value="">Todos</option>
            {database.workspaces
              .flatMap((item) => item.moduleIds)
              .filter((item, index, all) => all.indexOf(item) === index)
              .map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
          </select>
        </label>
        <label>
          Saúde
          <select
            value={filters.health}
            onChange={(event) => set("health", event.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(healthLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tag
          <select
            value={filters.tag}
            onChange={(event) => set("tag", event.target.value)}
          >
            <option value="">Todas</option>
            {database.tags.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mês do prazo
          <input
            type="month"
            value={filters.date}
            onChange={(event) => set("date", event.target.value)}
          />
        </label>
        <button
          className="os-link"
          onClick={() =>
            setFilters({
              query: "",
              client: "",
              owner: "",
              status: "",
              stage: "",
              module: "",
              health: "",
              tag: "",
              date: "",
            })
          }
        >
          Limpar filtros
        </button>
      </div>
      {!filtered.length ? (
        <div className="os-empty">
          <h2>Nenhum projeto encontrado</h2>
          <p>Ajuste os filtros ou crie um projeto.</p>
          <button
            className="os-button primary"
            onClick={() => navigate("/app/projects/new")}
          >
            Novo projeto
          </button>
        </div>
      ) : view === "cards" ? (
        <div className="os-card-grid">
          {filtered.map((item) => (
            <ProjectCard
              key={item.id}
              database={database}
              project={item}
              navigate={navigate}
            />
          ))}
        </div>
      ) : view === "table" ? (
        <div className="os-table-scroll">
          <table className="os-table">
            <thead>
              <tr>
                <th>Projeto</th>
                <th>Cliente</th>
                <th>Responsável</th>
                <th>Etapa</th>
                <th>Saúde</th>
                <th>Progresso</th>
                <th>Prazo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/app/projects/${item.id}`)}
                >
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{projectClient(database, item)}</td>
                  <td>{userName(database, item.ownerId)}</td>
                  <td>{stageName(database, item)}</td>
                  <td>{healthLabels[item.health]}</td>
                  <td>{progress(database, item.id)}%</td>
                  <td>{formatDate(item.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : view === "kanban" ? (
        <div className="os-kanban">
          {Object.entries(projectStatusLabels).map(([status, label]) => (
            <div className="os-kanban-column" key={status}>
              <h3>
                {label}{" "}
                <small>
                  {filtered.filter((item) => item.status === status).length}
                </small>
              </h3>
              {filtered
                .filter((item) => item.status === status)
                .map((item) => (
                  <ProjectCard
                    key={item.id}
                    database={database}
                    project={item}
                    navigate={navigate}
                  />
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="os-timeline">
          {filtered
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/app/projects/${item.id}`)}
              >
                <strong>{item.name}</strong>
                <span className="os-progress">
                  <span style={{ width: `${progress(database, item.id)}%` }} />
                </span>
                <small>
                  {formatDate(item.startDate)} — {formatDate(item.dueDate)}
                </small>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
