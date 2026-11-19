import { Select } from "../components/os/Dropdown";
import { SegmentedControl } from "../components/os/controls";
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
import { modules } from "../domain/catalog";
import { Metrics } from "./workspaceUi";
import { ProjectCard } from "../components/os/ProjectCard";

import { Schedule } from "./Schedule";

type View = "cards" | "table" | "schedule";
export function Portfolio({
  database,
  projects,
  navigate,
  initialView = "cards",
}: {
  database: Database;
  projects: Project[];
  navigate: (path: string) => void;
  initialView?: View;
}) {
  const [view, setView] = useState<View>(initialView);
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
      <Metrics
        items={[
          { label: "Projetos", value: projects.length },
          {
            label: "Em andamento",
            value: projects.filter((p) => p.status === "active").length,
          },
          {
            label: "Concluídos",
            value: projects.filter((p) => p.status === "completed").length,
          },
          {
            label: "Em risco",
            value: projects.filter((p) => p.health === "at_risk").length,
          },
        ]}
      />
      <div className="os-portfolio-toolbar">
        <SegmentedControl
          label="Visualização"
          options={{ cards: "Cards", table: "Tabela", schedule: "Cronograma" }}
          value={view}
          onChange={setView}
        />
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
          <Select
            label="Cliente"
            value={filters.client}
            onChange={(next) => set("client", next)}
            options={[
              { value: "", label: "Todos" },
              ...database.clients
                .filter((item) =>
                  projects.some((project) => project.clientId === item.id),
                )
                .map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
        </label>
        <label>
          Responsável
          <Select
            label="Responsável"
            value={filters.owner}
            onChange={(next) => set("owner", next)}
            options={[
              { value: "", label: "Todos" },
              ...database.users.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            ]}
          />
        </label>
        <label>
          Status
          <Select
            label="Status"
            value={filters.status}
            onChange={(next) => set("status", next)}
            options={[
              { value: "", label: "Todos" },
              ...Object.entries(projectStatusLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </label>
        <label>
          Etapa
          <Select
            label="Etapa"
            value={filters.stage}
            onChange={(next) => set("stage", next)}
            options={[
              { value: "", label: "Todas" },
              ...[
                ...new Map(
                  database.methodologies
                    .flatMap((item) => item.stages)
                    .map((item) => [item.id, item]),
                ).values(),
              ].map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
        </label>
        <label>
          Módulo
          <Select
            label="Módulo"
            value={filters.module}
            onChange={(next) => set("module", next)}
            options={[
              { value: "", label: "Todos" },
              ...[
                ...new Set(
                  database.workspaces.flatMap((item) => item.moduleIds),
                ),
              ].map((value) => ({
                value,
                label:
                  modules.find((module) => module.id === value)?.name || value,
              })),
            ]}
          />
        </label>
        <label>
          Saúde
          <Select
            label="Saúde"
            value={filters.health}
            onChange={(next) => set("health", next)}
            options={[
              { value: "", label: "Todas" },
              ...Object.entries(healthLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </label>
        <label>
          Tag
          <Select
            label="Tag"
            value={filters.tag}
            onChange={(next) => set("tag", next)}
            options={[
              { value: "", label: "Todas" },
              ...database.tags.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            ]}
          />
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
      {view === "schedule" ? (
        <Schedule database={database} projects={filtered} navigate={navigate} />
      ) : !filtered.length ? (
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
      ) : (
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
      )}
    </div>
  );
}
