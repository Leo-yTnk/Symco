import { useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { approvalLabels, type Approval } from "../domain/model";
import { formatDate, userName } from "../domain/selectors";
import {
  Empty,
  Metrics,
  Modal,
  RecentActivity,
  type PageProps,
} from "./workspaceUi";
export function Approvals(props: PageProps) {
  const { database, projects, workspaceId, actions, navigate } = props;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState("");
  const [selected, setSelected] = useState<Approval | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const ids = new Set(projects.map((p) => p.id));
  const rows = database.approvals.filter((a) => ids.has(a.projectId));
  const current = rows.find((a) => a.id === selected?.id);
  const filtered = rows.filter(
    (a) =>
      (!status || a.status === status) &&
      (!projectId || a.projectId === projectId) &&
      a.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="os-board-layout">
      <div>
        <Metrics
          items={Object.entries(approvalLabels).map(([key, label]) => ({
            label,
            value: rows.filter((a) => a.status === key).length,
          }))}
        />
        <section className="os-section">
          <div className="os-portfolio-toolbar">
            <div className="os-view-tabs">
              <button
                className={!status ? "active" : ""}
                onClick={() => setStatus("")}
              >
                Todas as solicitações
              </button>
              <button
                className={status === "pending" ? "active" : ""}
                onClick={() => setStatus("pending")}
              >
                Pendentes
              </button>
              <button
                className={status === "approved" ? "active" : ""}
                onClick={() => setStatus("approved")}
              >
                Aprovadas
              </button>
            </div>
            <button
              disabled={!projects.length}
              className="os-button primary"
              onClick={() => {
                setCreating(true);
                setError("");
              }}
            >
              <Plus size={16} />
              Nova solicitação
            </button>
          </div>
          <div className="os-filters">
            <label>
              Buscar
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Solicitação…"
              />
            </label>
            <label>
              Projeto
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Todos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Todos</option>
                {Object.entries(approvalLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {filtered.length ? (
            <div className="os-table-scroll">
              <table className="os-table">
                <thead>
                  <tr>
                    <th>Solicitação</th>
                    <th>Projeto</th>
                    <th>Solicitante</th>
                    <th>Aprovadores</th>
                    <th>Prazo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <button
                          className="os-link"
                          onClick={() => setSelected(a)}
                        >
                          <CheckCircle2 size={15} />
                          {a.title}
                        </button>
                      </td>
                      <td>
                        <button
                          className="os-link"
                          onClick={() =>
                            navigate(`/app/projects/${a.projectId}`)
                          }
                        >
                          {projects.find((p) => p.id === a.projectId)?.name}
                        </button>
                      </td>
                      <td>{userName(database, a.requestedBy)}</td>
                      <td>
                        {a.approverIds
                          .map((id) => userName(database, id))
                          .join(", ")}
                      </td>
                      <td>{a.dueDate ? formatDate(a.dueDate) : "Sem prazo"}</td>
                      <td>
                        <span
                          className={`os-status-pill status-${a.status === "approved" ? "approved" : a.status === "pending" ? "draft" : "review"}`}
                        >
                          {approvalLabels[a.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty />
          )}
        </section>
      </div>
      <aside className="os-rail">
        <RecentActivity {...props} />
        <section className="os-section">
          <h2>Governança de aprovações</h2>
          <p className="os-muted">
            Abra uma solicitação para revisar e registrar sua decisão. As
            decisões são locais e não aplicam permissões de servidor.
          </p>
          <p className="os-muted">
            Aprovar uma solicitação não libera automaticamente um gate.
          </p>
        </section>
      </aside>
      {current && (
        <Modal title={current.title} close={() => setSelected(null)}>
          <div className="os-records">
            <div>
              <strong>
                {projects.find((p) => p.id === current.projectId)?.name}
              </strong>
              <small>
                {approvalLabels[current.status]} ·{" "}
                {current.dueDate ? formatDate(current.dueDate) : "Sem prazo"}
              </small>
            </div>
          </div>
          <h3>Documentos do projeto</h3>
          {database.attachments
            .filter((d) => d.projectId === current.projectId)
            .map((d) => (
              <p className="os-muted" key={d.id}>
                {d.title} · {d.type}
              </p>
            ))}
          <h3>Registrar decisão</h3>
          <div className="os-action-row">
            {Object.entries(approvalLabels)
              .filter(([v]) => v !== "pending")
              .map(([v, l]) => (
                <button
                  className={`os-button ${v === "approved" ? "primary" : ""}`}
                  key={v}
                  onClick={() =>
                    actions.updateApproval(current.id, v as Approval["status"])
                  }
                >
                  {l}
                </button>
              ))}
          </div>
        </Modal>
      )}
      {creating && (
        <Modal
          title="Nova solicitação de aprovação"
          close={() => setCreating(false)}
        >
          <form
            className="os-record-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const ok = actions.requestApproval(
                String(f.get("project")),
                String(f.get("title")).trim(),
                [String(f.get("approver"))],
                String(f.get("date")) || undefined,
              );
              if (ok) setCreating(false);
              else setError("Não foi possível salvar.");
            }}
          >
            <label>
              Título
              <input name="title" required />
            </label>
            <label>
              Projeto
              <select name="project">
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Aprovador
              <select name="approver">
                {database.users
                  .filter((u) =>
                    database.workspaces
                      .find((w) => w.id === workspaceId)
                      ?.memberIds.includes(u.id),
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Prazo
              <input name="date" type="date" />
            </label>
            {error && <p role="alert">{error}</p>}
            <button className="os-button primary">Criar solicitação</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
