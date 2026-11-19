import { Select } from "../components/os/Dropdown";
import { Drawer } from "../components/os/Drawer";
import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import type { WorkspaceActions } from "../application/useWorkspace";
import { modules } from "../domain/catalog";
import type { Database, Project, Task } from "../domain/model";
import { statusLabels, taskStatuses } from "../domain/model";
import { formatDate, userName } from "../domain/selectors";

export function TaskPanel({
  task,
  database,
  project,
  actions,
  beforeStatusChange,
  close,
}: {
  task: Task;
  database: Database;
  project: Project;
  actions: WorkspaceActions;
  beforeStatusChange: () => void;
  close: () => void;
}) {
  const [draft, setDraft] = useState(task);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const method = database.methodologies.find(
    (item) => item.id === project.methodologyId,
  );
  const save = async (event: FormEvent, dismiss: () => void) => {
    event.preventDefault();
    if (!draft.title.trim()) return setError("Informe o título.");
    if (draft.status !== task.status) beforeStatusChange();
    if (await actions.updateTask(task.id, draft)) dismiss();
  };
  return (
    <Drawer title={task.title} caption="Tarefa" close={close}>
      {(dismiss) => (
        <>
          <form
            onSubmit={(event) => save(event, dismiss)}
            className="os-task-fields"
          >
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
                <Select
                  label="Status"
                  value={draft.status}
                  options={taskStatuses.map((value) => ({
                    value,
                    label: statusLabels[value],
                  }))}
                  onChange={(status) => setDraft({ ...draft, status })}
                />
              </label>
              <label>
                Prioridade
                <Select
                  label="Prioridade"
                  value={draft.priority}
                  options={
                    [
                      { value: "low", label: "Baixa" },
                      { value: "medium", label: "Média" },
                      { value: "high", label: "Alta" },
                      { value: "critical", label: "Crítica" },
                    ] as const
                  }
                  onChange={(priority) => setDraft({ ...draft, priority })}
                />
              </label>
            </div>
            <label>
              Responsável
              <Select
                label="Responsável"
                value={draft.assigneeId || ""}
                options={[
                  { value: "", label: "A definir" },
                  ...database.users
                    .filter((user) =>
                      database.workspaces
                        .find(
                          (workspace) => workspace.id === project.workspaceId,
                        )
                        ?.memberIds.includes(user.id),
                    )
                    .map((user) => ({ value: user.id, label: user.name })),
                ]}
                onChange={(assigneeId) => setDraft({ ...draft, assigneeId })}
              />
            </label>
            <label>
              Etapa
              <Select
                label="Etapa"
                value={draft.stageId || ""}
                options={[
                  { value: "", label: "Sem etapa" },
                  ...(method?.stages ?? []).map((stage) => ({
                    value: stage.id,
                    label: stage.name,
                  })),
                ]}
                onChange={(stageId) => setDraft({ ...draft, stageId })}
              />
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
              <Select
                label="Módulo"
                value={draft.moduleId || ""}
                options={[
                  { value: "", label: "Sem módulo" },
                  ...modules
                    .filter((module) => project.moduleIds.includes(module.id))
                    .map((module) => ({
                      value: module.id,
                      label: module.name,
                    })),
                ]}
                onChange={(moduleId) => setDraft({ ...draft, moduleId })}
              />
            </label>
            {error && <p className="os-validation">{error}</p>}
            <div className="os-panel-actions">
              <button type="submit" className="os-button primary">
                Salvar alterações
              </button>
              <button
                type="button"
                className="os-button danger"
                onClick={async () => {
                  if (await actions.deleteTask(task.id)) dismiss();
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
              onSubmit={async (event) => {
                event.preventDefault();
                if (
                  comment.trim() &&
                  (await actions.addComment(
                    project.id,
                    comment.trim(),
                    task.id,
                  ))
                )
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
        </>
      )}
    </Drawer>
  );
}
