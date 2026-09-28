import { useState, type FormEvent } from "react";
import { ChevronRight, Plus, Star } from "lucide-react";
import type { WorkspaceActions } from "../application/useWorkspace";
import { modules } from "../domain/catalog";
import { TaskPanel } from "./TaskPanel";
import type { Database, Project, Task } from "../domain/model";
import {
  approvalLabels,
  healthLabels,
  projectStatusLabels,
  statusLabels,
  taskStatuses,
} from "../domain/model";
import {
  formatDate,
  progress,
  projectClient,
  projectTasks,
  stageName,
  userName,
} from "../domain/selectors";

type Tab =
  | "overview"
  | "table"
  | "kanban"
  | "timeline"
  | "files"
  | "approvals"
  | "decisions"
  | "risks";
const tabs: Record<Tab, string> = {
  overview: "Visão geral",
  table: "Tabela",
  kanban: "Kanban",
  timeline: "Timeline",
  files: "Arquivos",
  approvals: "Aprovações",
  decisions: "Decisões",
  risks: "Riscos",
};

export function ProjectDetail({
  database,
  project,
  actions,
  navigate,
}: {
  database: Database;
  project: Project;
  actions: WorkspaceActions;
  navigate: (path: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [selected, setSelected] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [comment, setComment] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [recordError, setRecordError] = useState("");
  const tasks = projectTasks(database, project.id);
  const method = database.methodologies.find(
    (item) => item.id === project.methodologyId,
  );
  const projectActivities = database.activities.filter(
    (item) => item.projectId === project.id,
  );
  const addRecord = (event: FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    if (tab === "files" && newDescription.trim()) {
      try {
        const url = new URL(newDescription.trim());
        if (!["http:", "https:"].includes(url.protocol))
          throw new Error("Invalid protocol");
      } catch {
        setRecordError("Informe um link http ou https válido.");
        return;
      }
    }
    setRecordError("");
    if (tab === "files")
      actions.addDocument(
        project.id,
        newTitle.trim(),
        newDescription.trim() || undefined,
      );
    if (tab === "risks")
      actions.addRisk(project.id, newTitle.trim(), newDescription.trim());
    if (tab === "decisions")
      actions.addDecision(project.id, newTitle.trim(), newDescription.trim());
    setNewTitle("");
    setNewDescription("");
  };
  const createTask = (event: FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    actions.createTask({
      projectId: project.id,
      title: newTitle.trim(),
      assigneeId: project.ownerId,
      stageId: project.currentStageId,
      status: "todo",
      priority: "medium",
      dueDate: project.dueDate,
      dependencyIds: [],
    });
    setNewTitle("");
    setCreating(false);
    setTab("table");
  };
  const renderTaskTable = () => (
    <div className="os-table-scroll">
      <table className="os-table">
        <thead>
          <tr>
            <th>Tarefa</th>
            <th>Responsável</th>
            <th>Módulo</th>
            <th>Etapa</th>
            <th>Status</th>
            <th>Prioridade</th>
            <th>Prazo</th>
            <th>Dependências</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} onClick={() => setSelected(task)}>
              <td>
                <strong>{task.title}</strong>
              </td>
              <td>{userName(database, task.assigneeId)}</td>
              <td>
                {modules.find((item) => item.id === task.moduleId)?.name || "—"}
              </td>
              <td>
                {method?.stages.find((item) => item.id === task.stageId)
                  ?.name || "—"}
              </td>
              <td>
                <span className={`os-badge task-${task.status}`}>
                  {statusLabels[task.status]}
                </span>
              </td>
              <td>{task.priority}</td>
              <td>{formatDate(task.dueDate)}</td>
              <td>{task.dependencyIds.length || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="os-detail">
      <div className="os-breadcrumb">
        <button onClick={() => navigate("/app/projects")}>Projetos</button>
        <ChevronRight size={14} />
        {projectClient(database, project)}
        <ChevronRight size={14} />
        {project.name}
      </div>
      <div className="os-detail-title">
        <div>
          <span className={`os-badge status-${project.status}`}>
            {projectStatusLabels[project.status]}
          </span>
          <p>
            {project.description ||
              "Adicione uma descrição para compartilhar o objetivo deste projeto."}
          </p>
        </div>
        <button
          className="os-icon-button"
          aria-label={project.favorite ? "Remover favorito" : "Favoritar"}
          title="Favoritar"
          onClick={() =>
            actions.updateProject(project.id, { favorite: !project.favorite })
          }
        >
          <Star size={19} fill={project.favorite ? "#f5b942" : "none"} />
        </button>
      </div>
      <div className="os-project-summary">
        {[
          { label: "Responsável", value: userName(database, project.ownerId) },
          { label: "Cliente", value: projectClient(database, project) },
          { label: "Etapa atual", value: stageName(database, project) },
          {
            label: "Próximo marco",
            value: formatDate(
              database.milestones
                .filter(
                  (item) =>
                    item.projectId === project.id && item.status === "pending",
                )
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate,
            ),
          },
          {
            label: "Progresso geral",
            value: `${progress(database, project.id)}%`,
          },
        ].map((item) => (
          <div key={item.label}>
            <small>{item.label}</small>
            <strong>{item.value}</strong>
          </div>
        ))}
        <label>
          Saúde
          <select
            value={project.health}
            onChange={(event) =>
              actions.updateProject(project.id, {
                health: event.target.value as Project["health"],
              })
            }
          >
            {Object.entries(healthLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="os-detail-layout">
        <div className="os-detail-main">
          <div
            className="os-tabs"
            data-tour="project-tabs"
            role="tablist"
            aria-label="Seções do projeto"
          >
            {(Object.entries(tabs) as [Tab, string][]).map(([key, label]) => (
              <button
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? "active" : ""}
                key={key}
                onClick={() => {
                  setTab(key);
                  setCreating(false);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <section className="os-section">
            <div className="os-section-head">
              <div>
                <h2>{tabs[tab]}</h2>
                <p>
                  {tab === "overview"
                    ? "Contexto, etapas e execução do projeto."
                    : `${tasks.length} tarefas • ${progress(database, project.id)}% concluído`}
                </p>
              </div>
              {["overview", "table", "kanban", "timeline"].includes(tab) && (
                <button
                  className="os-button primary"
                  onClick={() => {
                    setCreating(true);
                    setTab("table");
                  }}
                >
                  <Plus size={15} /> Nova tarefa
                </button>
              )}
            </div>
            {tab === "overview" && (
              <>
                <div className="os-stage-track">
                  {method?.stages.map((stage) => (
                    <button
                      key={stage.id}
                      className={
                        stage.id === project.currentStageId ? "current" : ""
                      }
                      onClick={() =>
                        actions.updateProject(project.id, {
                          currentStageId: stage.id,
                        })
                      }
                    >
                      <span>{stage.order + 1}</span>
                      <strong>{stage.name}</strong>
                      <small>
                        {
                          tasks.filter((task) => task.stageId === stage.id)
                            .length
                        }{" "}
                        tarefas
                      </small>
                    </button>
                  ))}
                </div>
                <h3>Tarefas do projeto</h3>
                {renderTaskTable()}
              </>
            )}
            {tab === "table" && (
              <>
                {creating && (
                  <form className="os-inline-form" onSubmit={createTask}>
                    <label>
                      Título da tarefa
                      <input
                        autoFocus
                        value={newTitle}
                        onChange={(event) => setNewTitle(event.target.value)}
                        required
                        placeholder="O que precisa ser feito?"
                      />
                    </label>
                    <button className="os-button primary">Criar</button>
                    <button
                      type="button"
                      className="os-button"
                      onClick={() => setCreating(false)}
                    >
                      Cancelar
                    </button>
                  </form>
                )}
                {renderTaskTable()}
                {!tasks.length && (
                  <p className="os-muted">
                    Crie a primeira tarefa para começar.
                  </p>
                )}
              </>
            )}
            {tab === "kanban" && (
              <div className="os-kanban">
                {taskStatuses.map((status) => (
                  <div
                    className="os-kanban-column"
                    key={status}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const taskId = event.dataTransfer.getData("text/task-id");
                      if (tasks.some((task) => task.id === taskId))
                        actions.updateTask(taskId, { status });
                    }}
                  >
                    <h3>
                      {statusLabels[status]}{" "}
                      <small>
                        {tasks.filter((task) => task.status === status).length}
                      </small>
                    </h3>
                    {tasks
                      .filter((task) => task.status === status)
                      .map((task) => (
                        <button
                          className="os-kanban-task"
                          key={task.id}
                          draggable
                          onDragStart={(event) =>
                            event.dataTransfer.setData("text/task-id", task.id)
                          }
                          onClick={() => setSelected(task)}
                        >
                          <strong>{task.title}</strong>
                          <small>
                            {userName(database, task.assigneeId)} ·{" "}
                            {formatDate(task.dueDate)}
                          </small>
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            )}
            {tab === "timeline" && (
              <div className="os-timeline">
                {tasks
                  .filter((task) => task.dueDate)
                  .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
                  .map((task) => (
                    <button key={task.id} onClick={() => setSelected(task)}>
                      <strong>{task.title}</strong>
                      <span className={`os-badge task-${task.status}`}>
                        {statusLabels[task.status]}
                      </span>
                      <small>{formatDate(task.dueDate)}</small>
                    </button>
                  ))}
              </div>
            )}
            {(["files", "approvals", "decisions", "risks"] as Tab[]).includes(
              tab,
            ) && (
              <div className="os-records">
                {tab === "files" &&
                  database.attachments
                    .filter((item) => item.projectId === project.id)
                    .map((item) => (
                      <div key={item.id}>
                        <strong>{item.title}</strong>
                        <small>
                          {item.type} · {formatDate(item.createdAt)}
                        </small>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noreferrer">
                            Abrir link
                          </a>
                        )}
                      </div>
                    ))}
                {tab === "approvals" &&
                  database.approvals
                    .filter((item) => item.projectId === project.id)
                    .map((item) => (
                      <div key={item.id}>
                        <strong>{item.title}</strong>
                        <small>
                          {approvalLabels[item.status]} ·{" "}
                          {formatDate(item.dueDate)}
                        </small>
                        <select
                          aria-label={`Estado de ${item.title}`}
                          value={item.status}
                          onChange={(event) =>
                            actions.updateApproval(
                              item.id,
                              event.target.value as typeof item.status,
                            )
                          }
                        >
                          {Object.entries(approvalLabels).map(
                            ([key, value]) => (
                              <option key={key} value={key}>
                                {value}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    ))}
                {tab === "decisions" &&
                  database.decisions
                    .filter((item) => item.projectId === project.id)
                    .map((item) => (
                      <div key={item.id}>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                        <small>
                          {userName(database, item.decidedBy)} ·{" "}
                          {formatDate(item.decidedAt)}
                        </small>
                      </div>
                    ))}
                {tab === "risks" &&
                  database.risks
                    .filter((item) => item.projectId === project.id)
                    .map((item) => (
                      <div key={item.id}>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                        <small>
                          {item.status === "open" ? "Aberto" : "Mitigado"} ·
                          Impacto {item.impact}
                        </small>
                      </div>
                    ))}
                {tab !== "approvals" && (
                  <form className="os-record-form" onSubmit={addRecord}>
                    <h3>
                      Adicionar{" "}
                      {
                        (
                          {
                            files: "documento",
                            decisions: "decisão",
                            risks: "risco",
                          } as Record<string, string>
                        )[tab]
                      }
                    </h3>
                    <label>
                      Título
                      <input
                        value={newTitle}
                        onChange={(event) => setNewTitle(event.target.value)}
                        required
                      />
                    </label>
                    <label>
                      {tab === "files"
                        ? "URL (opcional; registro sem upload)"
                        : "Descrição"}
                      <textarea
                        value={newDescription}
                        onChange={(event) =>
                          setNewDescription(event.target.value)
                        }
                      />
                    </label>
                    {recordError && (
                      <p className="os-validation" role="alert">
                        {recordError}
                      </p>
                    )}
                    <button className="os-button primary">Adicionar</button>
                  </form>
                )}
              </div>
            )}
          </section>
        </div>
        <aside className="os-detail-rail">
          <section className="os-section">
            <h2>Comentários</h2>
            {database.comments
              .filter((item) => item.projectId === project.id && !item.taskId)
              .map((item) => (
                <div className="os-comment" key={item.id}>
                  <strong>{userName(database, item.authorId)}</strong>
                  <small>{formatDate(item.createdAt)}</small>
                  <p>{item.body}</p>
                </div>
              ))}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (comment.trim())
                  actions.addComment(project.id, comment.trim());
                setComment("");
              }}
            >
              <label>
                Novo comentário
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Compartilhe uma atualização"
                />
              </label>
              <button className="os-button primary" disabled={!comment.trim()}>
                Comentar
              </button>
            </form>
          </section>
          <section className="os-section">
            <h2>Atividade</h2>
            {projectActivities.slice(0, 8).map((item) => (
              <div className="os-activity" key={item.id}>
                <strong>{userName(database, item.actorId)}</strong>{" "}
                {item.summary}
                <small>{formatDate(item.createdAt)}</small>
              </div>
            ))}
          </section>
        </aside>
      </div>
      {selected && (
        <TaskPanel
          key={selected.id}
          task={
            database.tasks.find((item) => item.id === selected.id) || selected
          }
          database={database}
          project={project}
          actions={actions}
          close={() => setSelected(null)}
        />
      )}
    </div>
  );
}
