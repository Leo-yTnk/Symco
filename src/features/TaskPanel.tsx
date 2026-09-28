import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, MessageCircle, Trash2, X } from "lucide-react";
import type { WorkspaceActions } from "../application/useWorkspace";
import { modules } from "../domain/catalog";
import type { Database, Project, Task, TaskStatus } from "../domain/model";
import { statusLabels, taskStatuses } from "../domain/model";
import { formatDate, userName } from "../domain/selectors";

const priorityLabels: Record<Task["priority"], string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

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
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const discardButtonRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<number>();
  const dirty = JSON.stringify(draft) !== JSON.stringify(task);
  const method = database.methodologies.find(
    (item) => item.id === project.methodologyId,
  );
  const comments = database.comments.filter((item) => item.taskId === task.id);

  const finishClose = () => {
    if (closing || timerRef.current !== undefined) return;
    setClosing(true);
    const duration = window.matchMedia?.("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 190;
    timerRef.current = window.setTimeout(close, duration);
  };
  const requestClose = () => {
    if (closing) return;
    if (dirty) setConfirmDiscard(true);
    else finishClose();
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timerRef.current);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    if (confirmDiscard) discardButtonRef.current?.focus();
    else closeButtonRef.current?.focus();
  }, [confirmDiscard]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (confirmDiscard) setConfirmDiscard(false);
        else requestClose();
      }
      if (event.key === "Tab" && panelRef.current) {
        const scope = confirmDiscard
          ? panelRef.current.querySelector<HTMLElement>(".os-discard-confirm")
          : panelRef.current;
        if (!scope) return;
        const focusable = [
          ...scope.querySelectorAll<HTMLElement>(
            "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]",
          ),
        ].filter((element) => element.getClientRects().length);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (!scope.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  });

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return setError("Informe o título da tarefa.");
    actions.updateTask(task.id, { ...draft, title: draft.title.trim() });
    finishClose();
  };

  return (
    <div
      className="os-overlay"
      data-state={closing ? "closing" : "open"}
      onMouseDown={(event) =>
        event.target === event.currentTarget && requestClose()
      }
    >
      <aside
        ref={panelRef}
        className="os-task-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-panel-title"
      >
        <header className="os-task-panel-header">
          <div className="os-task-panel-heading">
            <span className="os-panel-eyebrow">TAREFA · {project.name}</span>
            <h2 id="task-panel-title">{task.title}</h2>
            <span className={`os-badge task-${draft.status}`}>
              {statusLabels[draft.status]}
            </span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="os-icon-button"
            aria-label="Fechar detalhes da tarefa"
            onClick={requestClose}
          >
            <X size={19} />
          </button>
        </header>
        <div className="os-task-panel-scroll">
          <form id="task-edit-form" className="os-task-fields" onSubmit={save}>
            <section className="os-task-detail-section">
              <div className="os-task-section-heading">
                <h3>Detalhes</h3>
                <small>O que precisa ser entregue</small>
              </div>
              <label>
                Título
                <input
                  value={draft.title}
                  onChange={(event) => {
                    setDraft({ ...draft, title: event.target.value });
                    setError("");
                  }}
                />
              </label>
              <label>
                Descrição
                <textarea
                  value={draft.description || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                  placeholder="Contexto e critérios da tarefa"
                />
              </label>
            </section>
            <section className="os-task-detail-section">
              <div className="os-task-section-heading">
                <h3>Planejamento</h3>
                <small>Responsabilidades e andamento</small>
              </div>
              <div className="os-task-field-grid">
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
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Responsável
                  <select
                    value={draft.assigneeId || ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        assigneeId: event.target.value || undefined,
                      })
                    }
                  >
                    <option value="">A definir</option>
                    {database.users
                      .filter((item) =>
                        database.workspaces
                          .find(
                            (workspace) => workspace.id === project.workspaceId,
                          )
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
                      setDraft({
                        ...draft,
                        stageId: event.target.value || undefined,
                      })
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
                      setDraft({
                        ...draft,
                        dueDate: event.target.value || undefined,
                      })
                    }
                  />
                </label>
                <label>
                  Módulo
                  <select
                    value={draft.moduleId || ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        moduleId: event.target.value || undefined,
                      })
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
              </div>
            </section>
            {error && (
              <p className="os-validation" role="alert">
                {error}
              </p>
            )}
          </form>
          <section className="os-task-detail-section os-task-comments">
            <div className="os-task-section-heading">
              <h3>
                <MessageCircle size={16} /> Comentários{" "}
                <span>{comments.length}</span>
              </h3>
              <small>Contexto compartilhado pela equipe</small>
            </div>
            <div className="os-task-comment-list" aria-live="polite">
              {comments.length ? (
                comments.map((item) => (
                  <div className="os-task-comment" key={item.id}>
                    <span className="os-avatar mini">
                      {userName(database, item.authorId)
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <strong>{userName(database, item.authorId)}</strong>
                      <small>{formatDate(item.createdAt)}</small>
                      <p>{item.body}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="os-task-comment-empty">
                  Ainda não há comentários. Compartilhe o primeiro contexto
                  desta tarefa.
                </p>
              )}
            </div>
            <form
              className="os-task-comment-form"
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
                  placeholder="Escreva uma atualização ou decisão..."
                />
              </label>
              <button className="os-button" disabled={!comment.trim()}>
                Adicionar comentário
              </button>
            </form>
          </section>
        </div>
        {confirmDiscard && (
          <div
            className="os-discard-confirm"
            role="alertdialog"
            aria-label="Descartar alterações"
          >
            <strong>Descartar alterações?</strong>
            <p>Os campos editados nesta tarefa ainda não foram salvos.</p>
            <div>
              <button
                ref={discardButtonRef}
                className="os-button"
                onClick={() => setConfirmDiscard(false)}
              >
                Continuar editando
              </button>
              <button className="os-button danger" onClick={finishClose}>
                Descartar
              </button>
            </div>
          </div>
        )}
        <footer className="os-task-panel-footer">
          <div className="os-task-save-state">
            {dirty ? "Alterações não salvas" : "Tudo atualizado"}
          </div>
          <div className="os-task-panel-actions">
            <button
              type="button"
              className="os-button os-task-delete"
              aria-label="Excluir tarefa"
              title="Excluir tarefa"
              onClick={() => {
                if (confirm("Excluir esta tarefa e seus comentários?")) {
                  actions.deleteTask(task.id);
                  finishClose();
                }
              }}
            >
              <Trash2 size={16} />
            </button>
            <button type="button" className="os-button" onClick={requestClose}>
              Cancelar
            </button>
            <button
              type="submit"
              form="task-edit-form"
              className="os-button primary"
            >
              <Check size={15} /> Salvar
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
