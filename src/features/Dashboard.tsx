import {
  ArrowRight,
  CircleAlert,
  Clock3,
  FolderKanban,
  Flag,
  ShieldCheck,
} from "lucide-react";
import type { Database, Project } from "../domain/model";
import { formatDate, progress, userName } from "../domain/selectors";
import { ProjectCard } from "../components/os/ProjectCard";

export function Dashboard({
  database,
  projects,
  navigate,
}: {
  database: Database;
  projects: Project[];
  navigate: (path: string) => void;
}) {
  const ids = new Set(projects.map((project) => project.id));
  const approvals = database.approvals.filter(
    (item) => ids.has(item.projectId) && item.status === "pending",
  );
  const critical = database.risks.filter(
    (item) =>
      ids.has(item.projectId) &&
      item.status === "open" &&
      item.impact === "high",
  );
  const week = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const due = database.tasks.filter(
    (item) =>
      ids.has(item.projectId) &&
      item.status !== "done" &&
      item.dueDate &&
      item.dueDate <= week,
  );
  const metrics = [
    {
      label: "Projetos ativos",
      value: projects.filter((item) => item.status === "active").length,
      icon: FolderKanban,
      tone: "blue",
    },
    {
      label: "Em aprovação",
      value: approvals.length,
      icon: ShieldCheck,
      tone: "amber",
    },
    {
      label: "Pendências críticas",
      value: critical.length,
      icon: CircleAlert,
      tone: "red",
    },
    {
      label: "Entregas da semana",
      value: due.length,
      icon: Flag,
      tone: "purple",
    },
  ];
  const activities = database.activities
    .filter((item) => ids.has(item.projectId))
    .slice(0, 6);
  const upcoming = [
    ...database.milestones
      .filter((item) => ids.has(item.projectId) && item.status === "pending")
      .map((item) => ({
        id: item.id,
        projectId: item.projectId,
        title: item.title,
        date: item.dueDate,
      })),
    ...due.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      title: item.title,
      date: item.dueDate!,
    })),
    ...approvals
      .filter((item) => item.dueDate)
      .map((item) => ({
        id: item.id,
        projectId: item.projectId,
        title: item.title,
        date: item.dueDate!,
      })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  return (
    <div className="os-dashboard">
      <div className="os-primary">
        <div className="os-kpis" data-tour="dashboard">
          {metrics.map(({ label, value, icon: Icon, tone }) => (
            <div className={`os-kpi tone-${tone}`} key={label}>
              <Icon size={21} />
              <span>{label}</span>
              <strong>{value}</strong>
              <small>Dados do workspace</small>
            </div>
          ))}
        </div>
        <section className="os-section">
          <div className="os-section-head">
            <div>
              <h2>Projetos em destaque</h2>
              <p>Acompanhe o que está em andamento.</p>
            </div>
            <button
              className="os-link"
              onClick={() => navigate("/app/portfolio")}
            >
              Ver portfólio <ArrowRight size={15} />
            </button>
          </div>
          {projects.length ? (
            <div className="os-card-grid">
              {projects.slice(0, 3).map((project) => (
                <ProjectCard
                  key={project.id}
                  database={database}
                  project={project}
                  navigate={navigate}
                />
              ))}
            </div>
          ) : (
            <div className="os-empty">
              Nenhum projeto ainda.{" "}
              <button onClick={() => navigate("/app/projects/new")}>
                Crie seu primeiro projeto
              </button>
              .
            </div>
          )}
        </section>
        <section className="os-section os-methodology">
          <div className="os-section-head">
            <div>
              <h2>Etapas de trabalho</h2>
              <p>Metodologia configurada no workspace.</p>
            </div>
          </div>
          <div className="os-stage-track">
            {database.methodologies
              .find((item) => item.workspaceId === projects[0]?.workspaceId)
              ?.stages.map((stage) => (
                <div key={stage.id}>
                  <span>{stage.order + 1}</span>
                  <strong>{stage.name}</strong>
                  <small>
                    {
                      projects.filter(
                        (project) => project.currentStageId === stage.id,
                      ).length
                    }{" "}
                    projetos
                  </small>
                </div>
              )) || <p>Crie um projeto para começar.</p>}
          </div>
        </section>
        <section className="os-section">
          <div className="os-section-head">
            <h2>Saúde do portfólio</h2>
          </div>
          <div className="os-health-summary">
            {(["on_track", "attention", "at_risk", "blocked"] as const).map(
              (status) => (
                <div key={status}>
                  <span className={`health-dot ${status}`} />
                  <strong>
                    {projects.filter((item) => item.health === status).length}
                  </strong>
                  <small>
                    {
                      {
                        on_track: "No prazo",
                        attention: "Atenção",
                        at_risk: "Em risco",
                        blocked: "Bloqueado",
                      }[status]
                    }
                  </small>
                </div>
              ),
            )}
          </div>
          <p className="os-muted">
            Progresso médio:{" "}
            {projects.length
              ? Math.round(
                  projects.reduce(
                    (sum, item) => sum + progress(database, item.id),
                    0,
                  ) / projects.length,
                )
              : 0}
            %
          </p>
        </section>
      </div>
      <aside className="os-rail">
        <section className="os-section">
          <div className="os-section-head">
            <h2>Atividades recentes</h2>
          </div>
          {activities.length ? (
            activities.map((item) => (
              <button
                className="os-feed-item"
                key={item.id}
                onClick={() => navigate(`/app/projects/${item.projectId}`)}
              >
                <span className="os-feed-dot" />
                <span>
                  <strong>{userName(database, item.actorId)}</strong>{" "}
                  {item.summary}
                  <small>
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </small>
                </span>
              </button>
            ))
          ) : (
            <p className="os-muted">Ações dos projetos aparecerão aqui.</p>
          )}
        </section>
        <section className="os-section">
          <div className="os-section-head">
            <h2>Próximos marcos</h2>
          </div>
          {upcoming.length ? (
            upcoming.map((item) => (
              <button
                className="os-feed-item"
                key={item.id}
                onClick={() => navigate(`/app/projects/${item.projectId}`)}
              >
                <Clock3 size={16} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{formatDate(item.date)}</small>
                </span>
              </button>
            ))
          ) : (
            <p className="os-muted">Nenhum prazo próximo.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
