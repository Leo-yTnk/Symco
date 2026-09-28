import { useState, type FormEvent } from "react";
import { Trash2, X } from "lucide-react";
import type { WorkspaceActions } from "../application/useWorkspace";
import { modules } from "../domain/catalog";
import type { Database, Project, Task, TaskStatus } from "../domain/model";
import { statusLabels, taskStatuses } from "../domain/model";
import { formatDate, userName } from "../domain/selectors";

export function TaskPanel({
  task,
  database,
  project,
  actions,
  close,
}: {
  task: Task;
  database: Database;
  project: Project;
  actions: WorkspaceActions;
  close: () => void;
}) {
  const [draft, setDraft] = useState(task);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const method = database.methodologies.find(
    (item) => item.id === project.methodologyId,
  );
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return setError("Informe o título.");
    actions.updateTask(task.id, draft);
    close();
  };
  return (
    <div
      className="os-overlay"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <aside
        className="os-task-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Editar tarefa"
      >
        <header>
          <div>
            <small>TAREFA</small>
            <h2>{task.title}</h2>
          </div>
          <button aria-label="Fechar" onClick={close}>
            <X size={20} />
          </button>
        </header>
        <form onSubmit={save} className="os-task-fields">
          <label>
            Título
            <input
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
            />
          </label>
          <label>
            Descrição
            <textarea
              value={draft.description || ""}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
          </label>
          <div className="os-date-pair">
            <label>
              Status
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    status: event.target.value as TaskStatus,
                  })
                }
              >
                {taskStatuses.map((item) => (
                  <option key={item} value={item}>
                    {statusLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prioridade
              <select
                value={draft.priority}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    priority: event.target.value as Task["priority"],
                  })
                }
              >
                {["low", "medium", "high", "critical"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Responsável
            <select
              value={draft.assigneeId || ""}
              onChange={(event) =>
                setDraft({ ...draft, assigneeId: event.target.value })
              }
            >
              <option value="">A definir</option>
              {database.users
                .filter((item) =>
                  database.workspaces
                    .find((workspace) => workspace.id === project.workspaceId)
                    ?.memberIds.includes(item.id),
                )
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Etapa
            <select
              value={draft.stageId || ""}
              onChange={(event) =>
                setDraft({ ...draft, stageId: event.target.value })
              }
            >
              <option value="">Sem etapa</option>
              {method?.stages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prazo
            <input
              type="date"
              value={draft.dueDate || ""}
              onChange={(event) =>
                setDraft({ ...draft, dueDate: event.target.value })
              }
            />
          </label>
          <label>
            Módulo
            <select
              value={draft.moduleId || ""}
              onChange={(event) =>
                setDraft({ ...draft, moduleId: event.target.value })
              }
            >
              <option value="">Sem módulo</option>
              {modules
                .filter((item) => project.moduleIds.includes(item.id))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          {error && <p className="os-validation">{error}</p>}
          <div className="os-panel-actions">
            <button type="submit" className="os-button primary">
              Salvar alterações
            </button>
            <button
              type="button"
              className="os-button danger"
              onClick={() => {
                if (confirm("Excluir esta tarefa e seus comentários?")) {
                  actions.deleteTask(task.id);
                  close();
                }
              }}
            >
              <Trash2 size={15} /> Excluir
            </button>
          </div>
        </form>
        <div className="os-panel-comments">
          <h3>Comentários</h3>
          {database.comments
            .filter((item) => item.taskId === task.id)
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
                actions.addComment(project.id, comment.trim(), task.id);
              setComment("");
            }}
          >
            <label>
              Novo comentário
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
            <button className="os-button" disabled={!comment.trim()}>
              Adicionar comentário
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
