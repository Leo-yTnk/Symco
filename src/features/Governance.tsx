import { useState, type FormEvent } from "react";
import type { WorkspaceActions } from "../application/useWorkspace";
import { modules } from "../domain/catalog";
import type { Database, Project } from "../domain/model";
import { approvalLabels } from "../domain/model";
import { formatDate, userName } from "../domain/selectors";

export function Governance({
  path,
  database,
  projects,
  actions,
  navigate,
}: {
  path: string;
  database: Database;
  projects: Project[];
  actions: WorkspaceActions;
  navigate: (path: string) => void;
}) {
  const ids = new Set(projects.map((item) => item.id));
  const [clientName, setClientName] = useState("");
  const [contact, setContact] = useState("");
  const workspaceId = projects[0]?.workspaceId || database.workspaces[0].id;
  const addClient = (event: FormEvent) => {
    event.preventDefault();
    if (!clientName.trim()) return;
    actions.addClient(workspaceId, clientName.trim(), contact.trim());
    setClientName("");
    setContact("");
  };
  if (path === "/app/settings")
    return (
      <div className="os-section">
        <h2>Workspace e membros</h2>
        <p className="os-muted">
          Estrutura local de demonstração. Contas e permissões de servidor ainda
          não estão conectadas.
        </p>
        <div className="os-records">
          {database.users
            .filter((user) =>
              database.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.memberIds.includes(user.id),
            )
            .map((user) => (
              <div key={user.id}>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
            ))}
        </div>
        <h2>Clientes</h2>
        <div className="os-records">
          {database.clients
            .filter((item) => item.workspaceId === workspaceId)
            .map((item) => (
              <div key={item.id}>
                <strong>{item.name}</strong>
                <small>
                  {item.contact || "Sem contato"} ·{" "}
                  {
                    projects.filter((project) => project.clientId === item.id)
                      .length
                  }{" "}
                  projetos · {item.status}
                </small>
              </div>
            ))}
        </div>
        <form className="os-inline-form" onSubmit={addClient}>
          <label>
            Nome do cliente
            <input
              value={clientName}
              required
              onChange={(event) => setClientName(event.target.value)}
            />
          </label>
          <label>
            Contato
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
            />
          </label>
          <button className="os-button primary">Adicionar cliente</button>
        </form>
        <h2>Módulos disponíveis</h2>
        <div className="os-module-grid">
          {modules
            .filter((item) =>
              database.workspaces
                .find((workspace) => workspace.id === workspaceId)
                ?.moduleIds.includes(item.id),
            )
            .map((item) => (
              <div key={item.id}>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                {item.variants.map((variant) => (
                  <small key={variant.id}>{variant.name} </small>
                ))}
              </div>
            ))}
        </div>
      </div>
    );
  const entries =
    path === "/app/calendar"
      ? [
          ...database.tasks
            .filter((item) => ids.has(item.projectId) && item.dueDate)
            .map((item) => ({
              id: item.id,
              projectId: item.projectId,
              title: item.title,
              detail: "Tarefa",
              date: item.dueDate!,
            })),
          ...database.milestones
            .filter((item) => ids.has(item.projectId))
            .map((item) => ({
              id: item.id,
              projectId: item.projectId,
              title: item.title,
              detail: "Marco",
              date: item.dueDate,
            })),
          ...database.gates
            .filter((item) => ids.has(item.projectId) && item.dueDate)
            .map((item) => ({
              id: item.id,
              projectId: item.projectId,
              title: item.title,
              detail: "Gate",
              date: item.dueDate!,
            })),
        ].sort((a, b) => a.date.localeCompare(b.date))
      : path === "/app/documents"
        ? database.attachments
            .filter((item) => ids.has(item.projectId))
            .map((item) => ({
              id: item.id,
              projectId: item.projectId,
              title: item.title,
              detail: item.type,
              date: item.createdAt,
            }))
        : path === "/app/approvals"
          ? database.approvals
              .filter((item) => ids.has(item.projectId))
              .map((item) => ({
                id: item.id,
                projectId: item.projectId,
                title: item.title,
                detail: approvalLabels[item.status],
                date: item.dueDate || item.createdAt,
              }))
          : path === "/app/risks"
            ? database.risks
                .filter((item) => ids.has(item.projectId))
                .map((item) => ({
                  id: item.id,
                  projectId: item.projectId,
                  title: item.title,
                  detail: `${item.status === "open" ? "Aberto" : "Mitigado"} · impacto ${item.impact}`,
                  date: "",
                }))
            : database.decisions
                .filter((item) => ids.has(item.projectId))
                .map((item) => ({
                  id: item.id,
                  projectId: item.projectId,
                  title: item.title,
                  detail: `Decidido por ${userName(database, item.decidedBy)}`,
                  date: item.decidedAt,
                }));
  return (
    <div className="os-section">
      <div className="os-section-head">
        <div>
          <h2>
            {
              (
                {
                  "/app/calendar": "Prazos e marcos",
                  "/app/documents": "Documentos registrados",
                  "/app/approvals": "Aprovações",
                  "/app/risks": "Riscos",
                  "/app/decisions": "Decisões",
                } as Record<string, string>
              )[path]
            }
          </h2>
          <p>Registros dos projetos do workspace atual.</p>
        </div>
      </div>
      {entries.length ? (
        <div className="os-records">
          {entries.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/app/projects/${item.projectId}`)}
            >
              <strong>{item.title}</strong>
              <small>
                {
                  database.projects.find(
                    (project) => project.id === item.projectId,
                  )?.name
                }{" "}
                · {item.detail}
                {item.date && ` · ${formatDate(item.date)}`}
              </small>
            </button>
          ))}
        </div>
      ) : (
        <div className="os-empty">
          <h2>Nenhum registro ainda</h2>
          <p>Abra um projeto para adicionar ou acompanhar itens.</p>
          <button
            className="os-button primary"
            onClick={() => navigate("/app/projects")}
          >
            Ver projetos
          </button>
        </div>
      )}
      {path === "/app/approvals" && entries.length > 0 && (
        <p className="os-muted">
          Abra um projeto e use a aba Aprovações para registrar uma decisão.
        </p>
      )}
      {actions.error && <p role="alert">{actions.error}</p>}
    </div>
  );
}
