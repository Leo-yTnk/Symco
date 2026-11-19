import { ProjectDangerZone } from "./ProjectDangerZone";
import { EditRecordActions, Select } from "../components/os/Dropdown";
import {
  GovernanceRecordEditor,
  type GovernanceRecord,
} from "./GovernanceRecordEditor";
import { Badge, SegmentedControl } from "../components/os/controls";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
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

const sections = {
  overview: "Resumo",
  tasks: "Tarefas",
  files: "Arquivos",
  governance: "Governança",
  settings: "Configurações",
} as const;

const taskViews = {
  table: "Tabela",
  kanban: "Kanban",
  timeline: "Linha do tempo",
} as const;

const governanceViews = {
  approvals: "Aprovações",
  risks: "Riscos",
  decisions: "Decisões",
} as const;

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
  const [section, setSection] = useState<keyof typeof sections>("overview");
  const [taskView, setTaskView] = useState<keyof typeof taskViews>("table");
  const [governanceView, setGovernanceView] =
    useState<keyof typeof governanceViews>("approvals");
  const tab =
    section === "tasks"
      ? taskView
      : section === "governance"
        ? governanceView
        : section;
  const [editingRecord, setEditingRecord] = useState<GovernanceRecord | null>(
    null,
  );
  const [selected, setSelected] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [comment, setComment] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [recordError, setRecordError] = useState("");
  const board = useRef<HTMLDivElement>(null);
  const beforeMove = useRef<Map<string, DOMRect> | null>(null);
  const captureKanban = () => {
    if (!board.current) return;
    beforeMove.current = new Map(
      Array.from(
        board.current.querySelectorAll<HTMLElement>("[data-task-id]"),
        (card) => [card.dataset.taskId!, card.getBoundingClientRect()],
      ),
    );
  };
  const tasks = projectTasks(database, project.id);
  useLayoutEffect(() => {
    const previous = beforeMove.current;
    beforeMove.current = null;
    if (!previous || !board.current) return;
    const style = window.getComputedStyle(board.current);
    const duration = parseFloat(style.getPropertyValue("--duration-layout"));
    if (!duration) return;
    const easing = style.getPropertyValue("--ease-layout").trim();
    for (const card of board.current.querySelectorAll<HTMLElement>(
      "[data-task-id]",
    )) {
      const start = previous.get(card.dataset.taskId!);
      if (!start) continue;
      const end = card.getBoundingClientRect();
      const x = start.left - end.left;
      const y = start.top - end.top;
      if (x || y)
        card.animate?.(
          [{ translate: `${x}px ${y}px` }, { translate: "0px 0px" }],
          { duration, easing },
        );
    }
  }, [database.tasks]);

  const method = database.methodologies.find(
    (item) => item.id === project.methodologyId,
  );
  const projectActivities = database.activities.filter(
    (item) => item.projectId === project.id,
  );
  const addRecord = async (event: FormEvent) => {
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
    const title = newTitle.trim();
    const description = newDescription.trim();
    const saveRecord = {
      files: () =>
        actions.addDocument(project.id, title, description || undefined),
      risks: () => actions.addRisk(project.id, title, description),
      decisions: () => actions.addDecision(project.id, title, description),
    };
    if (tab !== "files" && tab !== "risks" && tab !== "decisions") return;
    if (!(await saveRecord[tab]())) return;
    setNewTitle("");
    setNewDescription("");
  };
  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    const saved = await actions.createTask({
      projectId: project.id,
      title: newTitle.trim(),
      assigneeId: project.ownerId,
      stageId: project.currentStageId,
      status: "todo",
      priority: "medium",
      dueDate: project.dueDate,
      dependencyIds: [],
    });
    if (!saved) return;
    setNewTitle("");
    setCreating(false);
    setTaskView("table");
  };
  const taskActions = (task: Task) => ({
    title: task.title,
    edit: () => setSelected(task),
    remove: () => {
      void actions.deleteTask(task.id);
    },
  });
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
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <EditRecordActions key={task.id} {...taskActions(task)}>
              {(events, trigger) => (
                <tr {...events} onClick={() => setSelected(task)}>
                  <td>
                    <strong>{task.title}</strong>
                  </td>
                  <td>{userName(database, task.assigneeId)}</td>
                  <td>
                    {modules.find((item) => item.id === task.moduleId)?.name ||
                      "—"}
                  </td>
                  <td>
                    {method?.stages.find((item) => item.id === task.stageId)
                      ?.name || "—"}
                  </td>
                  <td>
                    <Badge state={`task-${task.status}`}>
                      {statusLabels[task.status]}
                    </Badge>
                  </td>
                  <td>{task.priority}</td>
                  <td>{formatDate(task.dueDate)}</td>
                  <td>{task.dependencyIds.length || "—"}</td>
                  <td>{trigger}</td>
                </tr>
              )}
            </EditRecordActions>
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
          <Badge state={`status-${project.status}`}>
            {projectStatusLabels[project.status]}
          </Badge>
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
          <Select
            label="Saúde"
            value={project.health}
            options={(Object.keys(healthLabels) as Project["health"][]).map(
              (value) => ({ value, label: healthLabels[value] }),
            )}
            onChange={(health) => actions.updateProject(project.id, { health })}
          />
        </label>
      </div>
      <div className="os-detail-layout">
        <div className="os-detail-main">
          <SegmentedControl
            wide
            wrap
            data-tour="project-tabs"
            label="Seções do projeto"
            options={sections}
            value={section}
            onChange={(key) => {
              setSection(key);
              setNewTitle("");
              setNewDescription("");
              setRecordError("");
              setCreating(false);
            }}
          />
          <section className="os-section">
            <div className="os-section-head">
              <div>
                <h2>{sections[section]}</h2>
                {section === "tasks" && (
                  <p>
                    {tasks.length} tarefas • {progress(database, project.id)}%
                    concluído
                  </p>
                )}
              </div>
              {(section === "overview" || section === "tasks") && (
                <button
                  className="os-button primary"
                  onClick={() => {
                    setSection("tasks");
                    setNewTitle("");
                    setCreating(true);
                    setTaskView("table");
                  }}
                >
                  <Plus size={15} /> Nova tarefa
                </button>
              )}
            </div>
            {section === "tasks" && (
              <SegmentedControl
                label="Visualização de tarefas"
                options={taskViews}
                value={taskView}
                onChange={(key) => {
                  setTaskView(key);
                  setCreating(false);
                  setNewTitle("");
                }}
              />
            )}
            {section === "governance" && (
              <SegmentedControl
                label="Registros de governança"
                options={governanceViews}
                value={governanceView}
                onChange={(key) => {
                  setGovernanceView(key);
                  setNewTitle("");
                  setNewDescription("");
                  setRecordError("");
                }}
              />
            )}
            {tab === "settings" && (
              <ProjectDangerZone
                name={project.name}
                remove={async () => {
                  const removed = await actions.deleteProject(project.id);
                  if (removed) navigate("/app/projects");
                  return removed;
                }}
              />
            )}
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
              <div className="os-kanban" ref={board}>
                {taskStatuses.map((status) => (
                  <div
                    className="os-kanban-column"
                    key={status}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const taskId = event.dataTransfer.getData("text/task-id");
                      const task = tasks.find((item) => item.id === taskId);
                      if (!task || task.status === status || !board.current)
                        return;
                      captureKanban();
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
                        <EditRecordActions key={task.id} {...taskActions(task)}>
                          {(events, trigger) => (
                            <div className="os-record-with-actions" {...events}>
                              <button
                                className="os-kanban-task"
                                data-task-id={task.id}
                                draggable
                                onDragStart={(event) =>
                                  event.dataTransfer.setData(
                                    "text/task-id",
                                    task.id,
                                  )
                                }
                                onClick={() => setSelected(task)}
                              >
                                <strong>{task.title}</strong>
                                <small>
                                  {userName(database, task.assigneeId)} ·{" "}
                                  {formatDate(task.dueDate)}
                                </small>
                              </button>
                              {trigger}
                            </div>
                          )}
                        </EditRecordActions>
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
                    <EditRecordActions key={task.id} {...taskActions(task)}>
                      {(events, trigger) => (
                        <div className="os-record-with-actions" {...events}>
                          <button onClick={() => setSelected(task)}>
                            <strong>{task.title}</strong>
                            <Badge state={`task-${task.status}`}>
                              {statusLabels[task.status]}
                            </Badge>
                            <small>{formatDate(task.dueDate)}</small>
                          </button>
                          {trigger}
                        </div>
                      )}
                    </EditRecordActions>
                  ))}
              </div>
            )}
            {(tab === "files" ||
              tab === "approvals" ||
              tab === "decisions" ||
              tab === "risks") && (
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
                        <Select
                          label={`Estado de ${item.title}`}
                          value={item.status}
                          onChange={(nextValue) =>
                            actions.updateApproval(
                              item.id,
                              nextValue as typeof item.status,
                            )
                          }
                          options={Object.entries(approvalLabels).map(
                            ([key, value]) => ({ value: key, label: value }),
                          )}
                        />
                      </div>
                    ))}
                {tab === "decisions" &&
                  database.decisions
                    .filter((item) => item.projectId === project.id)
                    .map((item) => (
                      <EditRecordActions
                        key={item.id}
                        title={item.title}
                        edit={() =>
                          setEditingRecord({ kind: "decision", record: item })
                        }
                        remove={() => {
                          void actions.deleteDecision(item.id);
                        }}
                      >
                        {(events, trigger) => (
                          <div className="os-record-with-actions" {...events}>
                            <div>
                              <strong>{item.title}</strong>
                              <p>{item.description}</p>
                              <small>
                                {userName(database, item.decidedBy)} ·{" "}
                                {formatDate(item.decidedAt)}
                              </small>
                            </div>
                            {trigger}
                          </div>
                        )}
                      </EditRecordActions>
                    ))}
                {tab === "risks" &&
                  database.risks
                    .filter((item) => item.projectId === project.id)
                    .map((item) => (
                      <EditRecordActions
                        key={item.id}
                        title={item.title}
                        edit={() =>
                          setEditingRecord({ kind: "risk", record: item })
                        }
                        remove={() => {
                          void actions.deleteRisk(item.id);
                        }}
                      >
                        {(events, trigger) => (
                          <div className="os-record-with-actions" {...events}>
                            <div>
                              <strong>{item.title}</strong>
                              <p>{item.description}</p>
                              <small>
                                {item.status === "open" ? "Aberto" : "Mitigado"}{" "}
                                · Impacto {item.impact}
                              </small>
                            </div>
                            {trigger}
                          </div>
                        )}
                      </EditRecordActions>
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
              onSubmit={async (event) => {
                event.preventDefault();
                if (
                  comment.trim() &&
                  (await actions.addComment(project.id, comment.trim()))
                )
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
      {editingRecord && (
        <GovernanceRecordEditor
          entry={editingRecord}
          actions={actions}
          close={() => setEditingRecord(null)}
        />
      )}
      {selected && (
        <TaskPanel
          key={selected.id}
          task={
            database.tasks.find((item) => item.id === selected.id) || selected
          }
          database={database}
          project={project}
          actions={actions}
          beforeStatusChange={captureKanban}
          close={() => setSelected(null)}
        />
      )}
    </div>
  );
}
