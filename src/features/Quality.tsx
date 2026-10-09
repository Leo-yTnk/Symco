import { useState } from "react";
import { Plus } from "lucide-react";
import type { QualityRecord } from "../domain/model";
import { formatDate, userName } from "../domain/selectors";
import {
  Empty,
  Metrics,
  Modal,
  RecentActivity,
  type PageProps,
} from "./workspaceUi";
const kinds = {
  audit: "Auditorias",
  nonconformity: "Não conformidades",
  capa: "Planos de ação (CAPA)",
};
const states = {
  open: "Aberto",
  in_progress: "Em andamento",
  done: "Concluído",
};
export function Quality(props: PageProps) {
  const { database, projects, actions, navigate } = props;
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [editing, setEditing] = useState<QualityRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const ids = new Set(projects.map((p) => p.id));
  const records = (database.qualityRecords || []).filter((r) =>
    ids.has(r.projectId),
  );
  const risks = database.risks.filter(
    (r) => ids.has(r.projectId) && r.status === "open",
  );
  const rows = records.filter(
    (r) =>
      (!projectId || r.projectId === projectId) &&
      `${r.title} ${r.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="os-board-layout">
      <div>
        <Metrics
          items={[
            {
              label: "Auditorias em aberto",
              value: records.filter(
                (r) => r.kind === "audit" && r.status !== "done",
              ).length,
            },
            {
              label: "Não conformidades",
              value: records.filter(
                (r) => r.kind === "nonconformity" && r.status !== "done",
              ).length,
            },
            {
              label: "CAPAs concluídos",
              value: records.filter(
                (r) => r.kind === "capa" && r.status === "done",
              ).length,
            },
            { label: "Riscos abertos", value: risks.length },
          ]}
        />
        <div className="os-portfolio-toolbar">
          <div className="os-filters">
            <label>
              Buscar
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Auditoria ou plano de ação"
              />
            </label>
            <label>
              Projeto
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Todos os projetos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="os-button primary"
            disabled={!projects.length}
            onClick={() => {
              setCreating(true);
              setError("");
            }}
          >
            <Plus size={16} />
            Novo registro
          </button>
        </div>
        <div className="os-quality-grid">
          {Object.entries(kinds).map(([kind, label]) => (
            <section className="os-section" key={kind}>
              <div className="os-section-head">
                <h2>{label}</h2>
                <small>
                  {rows.filter((r) => r.kind === kind).length} registros
                </small>
              </div>
              {rows.some((r) => r.kind === kind) ? (
                <div className="os-table-scroll">
                  <table className="os-table os-quality-table">
                    <thead>
                      <tr>
                        <th>Registro</th>
                        <th>Prazo</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .filter((r) => r.kind === kind)
                        .map((r) => (
                          <tr key={r.id}>
                            <td>
                              <button
                                className="os-link"
                                onClick={() => {
                                  setEditing(r);
                                  setError("");
                                }}
                              >
                                {r.title}
                              </button>
                              <small>
                                {
                                  projects.find((p) => p.id === r.projectId)
                                    ?.name
                                }{" "}
                                · {userName(database, r.ownerId)}
                              </small>
                            </td>
                            <td>{formatDate(r.dueDate)}</td>
                            <td>
                              <span
                                className={`os-status-pill status-${r.status === "done" ? "approved" : "draft"}`}
                              >
                                {states[r.status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty text={`Sem ${label.toLowerCase()}`} />
              )}
            </section>
          ))}
          <section className="os-section">
            <h2>Riscos de qualidade</h2>
            {risks.length ? (
              risks.map((r) => (
                <button
                  key={r.id}
                  className="os-feed-item"
                  onClick={() => navigate(`/app/projects/${r.projectId}`)}
                >
                  <span>
                    <strong>{r.title}</strong>
                    <small>
                      Impacto {r.impact} · {r.description}
                    </small>
                  </span>
                </button>
              ))
            ) : (
              <Empty text="Sem riscos abertos" />
            )}
          </section>
        </div>
      </div>
      <aside className="os-rail">
        <RecentActivity {...props} />
        <section className="os-section">
          <h2>Prioridades</h2>
          {records
            .filter((r) => r.status !== "done")
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .slice(0, 5)
            .map((r) => (
              <button
                className="os-feed-item"
                key={r.id}
                onClick={() => setEditing(r)}
              >
                {r.title}
                <small>{formatDate(r.dueDate)}</small>
              </button>
            ))}
          <p className="os-muted">
            Registre auditorias, não conformidades e ações corretivas. Os
            registros são locais ao navegador.
          </p>
        </section>
      </aside>
      {(creating || editing) && (
        <Modal
          title={editing ? "Editar registro" : "Novo registro de qualidade"}
          close={() => {
            setCreating(false);
            setEditing(null);
          }}
        >
          <form
            className="os-record-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const ok = actions.saveQuality(
                {
                  projectId: String(f.get("project")),
                  title: String(f.get("title")).trim(),
                  kind: String(f.get("kind")) as QualityRecord["kind"],
                  status: String(f.get("status")) as QualityRecord["status"],
                  ownerId: String(f.get("owner")),
                  dueDate: String(f.get("date")),
                  description: String(f.get("description")).trim(),
                },
                editing?.id,
              );
              if (ok) {
                setCreating(false);
                setEditing(null);
              } else setError("Não foi possível salvar o registro.");
            }}
          >
            <label>
              Título
              <input name="title" required defaultValue={editing?.title} />
            </label>
            <label>
              Projeto
              <select name="project" defaultValue={editing?.projectId}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <select name="kind" defaultValue={editing?.kind}>
                {Object.entries(kinds).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={editing?.status}>
                {Object.entries(states).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Responsável
              <select name="owner" defaultValue={editing?.ownerId || "mariana"}>
                {database.users
                  .filter((u) =>
                    database.workspaces
                      .find((w) => w.id === props.workspaceId)
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
              <input
                type="date"
                name="date"
                required
                defaultValue={editing?.dueDate}
              />
            </label>
            <label>
              Descrição e plano de ação
              <textarea
                name="description"
                defaultValue={editing?.description}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <button className="os-button primary">Salvar registro</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
