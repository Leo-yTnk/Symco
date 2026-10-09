import { useState } from "react";
import { Download } from "lucide-react";
import { healthLabels, projectStatusLabels } from "../domain/model";
import {
  formatDate,
  progress,
  projectClient,
  userName,
} from "../domain/selectors";
import { modules } from "../domain/catalog";
import { Empty, Metrics, exportCsv, type PageProps } from "./workspaceUi";
export function Reports({ database, projects, navigate }: PageProps) {
  const [client, setClient] = useState("");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const filtered = projects.filter(
    (p) =>
      (!client || p.clientId === client) &&
      (!owner || p.ownerId === owner) &&
      (!status || p.status === status) &&
      (!from || p.dueDate >= from) &&
      (!to || p.startDate <= to),
  );
  const ids = new Set(filtered.map((p) => p.id));
  const tasks = database.tasks.filter((t) => ids.has(t.projectId));
  const average = filtered.length
    ? Math.round(
        filtered.reduce((sum, p) => sum + progress(database, p.id), 0) /
          filtered.length,
      )
    : 0;
  const charts = [
    {
      title: "Status do portfólio",
      items: Object.entries(projectStatusLabels).map(([key, label]) => ({
        label,
        value: filtered.filter((p) => p.status === key).length,
      })),
    },
    {
      title: "Saúde dos projetos",
      items: Object.entries(healthLabels).map(([key, label]) => ({
        label,
        value: filtered.filter((p) => p.health === key).length,
      })),
    },
    {
      title: "Distribuição por módulo",
      items: modules
        .filter((m) => filtered.some((p) => p.moduleIds.includes(m.id)))
        .map((m) => ({
          label: m.name,
          value: filtered.filter((p) => p.moduleIds.includes(m.id)).length,
        })),
    },
    {
      title: "Carga por responsável",
      items: database.users
        .filter((u) => tasks.some((t) => t.assigneeId === u.id))
        .map((u) => ({
          label: u.name,
          value: tasks.filter(
            (t) => t.assigneeId === u.id && t.status !== "done",
          ).length,
        })),
    },
  ];
  return (
    <>
      <section className="os-section">
        <div className="os-filters">
          <label>
            Cliente
            <select value={client} onChange={(e) => setClient(e.target.value)}>
              <option value="">Todos os clientes</option>
              {database.clients
                .filter((c) => projects.some((p) => p.clientId === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Responsável
            <select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">Todos</option>
              {database.users
                .filter((u) => projects.some((p) => p.ownerId === u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(projectStatusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Início do período
            <input
              type="date"
              aria-label="Início do período"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            Fim do período
            <input
              type="date"
              min={from}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button
            className="os-link"
            onClick={() => {
              setClient("");
              setOwner("");
              setStatus("");
              setFrom("");
              setTo("");
            }}
          >
            Limpar filtros
          </button>
          <button
            className="os-button primary"
            onClick={() =>
              exportCsv("relatorio-projetos.csv", [
                [
                  "Projeto",
                  "Cliente",
                  "Responsável",
                  "Status",
                  "Saúde",
                  "Progresso (%)",
                  "Prazo",
                ],
                ...filtered.map((p) => [
                  p.name,
                  projectClient(database, p),
                  userName(database, p.ownerId),
                  projectStatusLabels[p.status],
                  healthLabels[p.health],
                  progress(database, p.id),
                  p.dueDate,
                ]),
              ])
            }
          >
            <Download size={15} />
            Exportar relatório
          </button>
        </div>
        <p className="os-muted">
          O período filtra projetos cujo intervalo de execução intersecta as
          datas escolhidas.
        </p>
      </section>
      <Metrics
        items={[
          { label: "Projetos no período", value: filtered.length },
          { label: "Progresso médio", value: `${average}%` },
          {
            label: "Tarefas concluídas",
            value: tasks.filter((t) => t.status === "done").length,
          },
          {
            label: "Aprovações pendentes",
            value: database.approvals.filter(
              (a) => ids.has(a.projectId) && a.status === "pending",
            ).length,
          },
        ]}
      />
      <div className="os-report-grid">
        {charts.map((chart, i) => (
          <section className="os-section" key={chart.title}>
            <h2>{chart.title}</h2>
            {chart.items.length && filtered.length ? (
              <div
                className="os-chart"
                role="img"
                aria-label={
                  chart.title +
                  ": " +
                  chart.items.map((v) => `${v.label} ${v.value}`).join(", ")
                }
              >
                {chart.items.map((item, j) => (
                  <div className="os-chart-row" key={item.label}>
                    <span>{item.label}</span>
                    <div>
                      <span
                        className={`chart-tone-${(i + j) % 4}`}
                        style={{
                          width: `${(item.value / Math.max(1, ...chart.items.map((v) => v.value))) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Sem dados para este filtro" />
            )}
          </section>
        ))}
      </div>
      <section className="os-section">
        <h2>Principais métricas por projeto</h2>
        {filtered.length ? (
          <div className="os-table-scroll">
            <table className="os-table">
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Cliente</th>
                  <th>Responsável</th>
                  <th>Progresso</th>
                  <th>Status</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button
                        className="os-link"
                        onClick={() => navigate(`/app/projects/${p.id}`)}
                      >
                        {p.name}
                      </button>
                    </td>
                    <td>{projectClient(database, p)}</td>
                    <td>{userName(database, p.ownerId)}</td>
                    <td>
                      <span className="os-progress">
                        <span
                          style={{ width: `${progress(database, p.id)}%` }}
                        />
                      </span>
                      {progress(database, p.id)}%
                    </td>
                    <td>{projectStatusLabels[p.status]}</td>
                    <td>{formatDate(p.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </section>
    </>
  );
}
