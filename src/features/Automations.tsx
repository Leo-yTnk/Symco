import { useState } from "react";
import { Plus, Zap } from "lucide-react";
import type { Automation } from "../domain/model";
import { formatDate } from "../domain/selectors";
import {
  Empty,
  Metrics,
  Modal,
  RecentActivity,
  type PageProps,
} from "./workspaceUi";
const triggers = {
  task_done: "Quando uma tarefa for concluída",
  document_added: "Quando um documento for adicionado",
};
const effects = {
  request_approval: "Solicitar aprovação",
  add_review_task: "Criar tarefa de revisão",
};
export function Automations(props: PageProps) {
  const { database, projects, workspaceId, actions } = props;
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("rules");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [error, setError] = useState("");
  const rules = (database.automations || []).filter(
    (r) => r.workspaceId === workspaceId,
  );
  const filtered = rules.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()),
  );
  const history = database.activities.filter(
    (a) =>
      a.workspaceId === workspaceId &&
      a.summary.startsWith("executou a automação"),
  );
  const openNew = () => {
    setEditing(null);
    setCreating(true);
    setError("");
  };
  return (
    <div className="os-board-layout">
      <div>
        <Metrics
          items={[
            {
              label: "Regras ativas",
              value: rules.filter((r) => r.enabled).length,
            },
            {
              label: "Execuções",
              value: rules.reduce((sum, r) => sum + r.runs, 0),
            },
            {
              label: "Regras pausadas",
              value: rules.filter((r) => !r.enabled).length,
            },
            { label: "Regras cadastradas", value: rules.length },
          ]}
        />
        <section className="os-section">
          <div className="os-portfolio-toolbar">
            <div className="os-view-tabs">
              {[
                ["rules", "Suas regras"],
                ["models", "Modelos"],
                ["history", "Histórico de execuções"],
              ].map(([v, l]) => (
                <button
                  className={tab === v ? "active" : ""}
                  key={v}
                  onClick={() => setTab(v)}
                >
                  {l}
                </button>
              ))}
            </div>
            <button className="os-button primary" onClick={openNew}>
              <Plus size={16} />
              Nova automação
            </button>
          </div>
          <p className="os-muted">
            As regras são executadas ao alterar dados neste navegador. Não
            executam em segundo plano nem enviam mensagens externas.
          </p>
          {tab === "models" ? (
            <div className="os-module-grid">
              {Object.entries(triggers).map(([trigger, label]) => (
                <div key={trigger}>
                  <Zap size={22} />
                  <h3>{label}</h3>
                  <p>
                    Solicite uma aprovação ou crie uma tarefa para revisão pelo
                    responsável do projeto.
                  </p>
                  <button
                    className="os-button"
                    onClick={() => {
                      setEditing({
                        id: "",
                        workspaceId,
                        name: label,
                        trigger: trigger as Automation["trigger"],
                        action: "request_approval",
                        enabled: true,
                        runs: 0,
                      });
                      setCreating(true);
                      setError("");
                    }}
                  >
                    Usar modelo
                  </button>
                </div>
              ))}
            </div>
          ) : tab === "history" ? (
            history.length ? (
              <div className="os-records">
                {history.map((a) => (
                  <div key={a.id}>
                    <strong>{a.summary}</strong>
                    <small>
                      {formatDate(a.createdAt)} ·{" "}
                      {projects.find((p) => p.id === a.projectId)?.name}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Nenhuma execução ainda" />
            )
          ) : (
            <>
              <div className="os-board-toolbar">
                <input
                  aria-label="Buscar automações"
                  placeholder="Buscar regras…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {filtered.length ? (
                <div className="os-table-scroll">
                  <table className="os-table">
                    <thead>
                      <tr>
                        <th>Regra</th>
                        <th>Gatilho</th>
                        <th>Ação</th>
                        <th>Projeto</th>
                        <th>Execuções</th>
                        <th>Última execução</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <button
                              className="os-link"
                              onClick={() => {
                                setEditing(r);
                                setError("");
                              }}
                            >
                              <Zap size={14} />
                              {r.name}
                            </button>
                          </td>
                          <td>{triggers[r.trigger]}</td>
                          <td>{effects[r.action]}</td>
                          <td>
                            {projects.find((p) => p.id === r.projectId)?.name ||
                              "Todos os projetos"}
                          </td>
                          <td>{r.runs}</td>
                          <td>{r.lastRun ? formatDate(r.lastRun) : "—"}</td>
                          <td>
                            <button
                              role="switch"
                              aria-checked={r.enabled}
                              aria-label={`Ativar ${r.name}`}
                              className={`os-switch ${r.enabled ? "on" : ""}`}
                              onClick={() =>
                                actions.saveAutomation(
                                  { ...r, enabled: !r.enabled },
                                  r.id,
                                )
                              }
                            >
                              <span />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty text="Nenhuma regra cadastrada" />
              )}
            </>
          )}
        </section>
      </div>
      <aside className="os-rail">
        <RecentActivity {...props} />
        <section className="os-section">
          <h2>Como funciona</h2>
          <p className="os-muted">1. Escolha um gatilho.</p>
          <p className="os-muted">2. Defina o projeto e a ação.</p>
          <p className="os-muted">
            3. Ative a regra. As próximas alterações executarão a ação
            automaticamente.
          </p>
          <p className="os-muted">
            A ação é registrada no histórico e persistida na mesma transação dos
            dados.
          </p>
        </section>
      </aside>
      {(creating || editing) && (
        <Modal
          title={editing?.id ? "Editar automação" : "Nova automação"}
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
              const ok = actions.saveAutomation(
                {
                  workspaceId,
                  name: String(f.get("name")).trim(),
                  projectId: String(f.get("project")) || undefined,
                  trigger: String(f.get("trigger")) as Automation["trigger"],
                  action: String(f.get("action")) as Automation["action"],
                  enabled: f.get("enabled") === "on",
                },
                editing?.id || undefined,
              );
              if (ok) {
                setCreating(false);
                setEditing(null);
              } else setError("Não foi possível salvar a regra.");
            }}
          >
            <label>
              Nome
              <input required name="name" defaultValue={editing?.name} />
            </label>
            <label>
              Quando
              <select name="trigger" defaultValue={editing?.trigger}>
                {Object.entries(triggers).map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Projeto
              <select name="project" defaultValue={editing?.projectId || ""}>
                <option value="">Todos os projetos do workspace</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Então
              <select name="action" defaultValue={editing?.action}>
                {Object.entries(effects).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="os-check">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={editing?.enabled ?? true}
              />
              Regra ativa
            </label>
            {error && <p role="alert">{error}</p>}
            <button className="os-button primary">Salvar regra</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
