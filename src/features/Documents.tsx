import { useState, type FormEvent } from "react";
import {
  FileText,
  Folder,
  Download,
  Plus,
  Upload,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { modules } from "../domain/catalog";
import { approvalLabels } from "../domain/model";
import type { Attachment } from "../domain/model";
import { formatDate, userName } from "../domain/selectors";
import {
  Empty,
  Modal,
  RecentActivity,
  exportCsv,
  type PageProps,
} from "./workspaceUi";
const categories = [
  "Todos os Documentos",
  "Formulação",
  "Estudos e Pesquisas",
  "Qualidade e Regulatório",
  "Marketing e Mercado",
  "Produção e Escala",
];
const states = {
  draft: "Em andamento",
  review: "Em revisão",
  approved: "Concluído",
};
export function Documents(props: PageProps) {
  const { database, projects, actions, navigate } = props;
  const [category, setCategory] = useState(categories[0]);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [status, setStatus] = useState("");
  const [owner, setOwner] = useState("");
  const [month, setMonth] = useState("");
  const [sort, setSort] = useState("recent");
  const [group, setGroup] = useState("project");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Attachment | null>(null);
  const [creating, setCreating] = useState(false);
  const [upload, setUpload] = useState(false);
  const [error, setError] = useState("");
  const ids = new Set(projects.map((p) => p.id));
  const docs = database.attachments.filter((d) => ids.has(d.projectId));
  const filtered = docs
    .filter(
      (d) =>
        (category === categories[0] ||
          (d.category || "Qualidade e Regulatório") === category) &&
        d.title.toLowerCase().includes(query.toLowerCase()) &&
        (!projectId || d.projectId === projectId) &&
        (!type || d.type === type) &&
        (!moduleId || d.moduleId === moduleId) &&
        (!status || (d.status || "draft") === status) &&
        (!owner || d.createdBy === owner) &&
        (!month || d.createdAt.startsWith(month)),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title)
        : (b.updatedAt || b.createdAt).localeCompare(
            a.updatedAt || a.createdAt,
          ),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const groupKey = (d: Attachment) =>
    group === "project"
      ? d.projectId
      : group === "category"
        ? d.category || "Qualidade e Regulatório"
        : "Todos os documentos";
  const groups = [...new Set(visible.map(groupKey))];
  const featured = docs.find((d) => selected.includes(d.id)) || filtered[0];
  const projectName = (id: string) =>
    projects.find((p) => p.id === id)?.name || "";
  const reset = () => setPage(1);
  function download(d: Attachment) {
    if (d.fileData) {
      const a = document.createElement("a");
      a.href = d.fileData;
      a.download = d.fileName || d.title;
      a.click();
    } else if (d.url) {
      window.open(d.url, "_blank", "noopener,noreferrer");
    } else {
      exportCsv(`${d.title}.csv`, [
        ["Documento", "Projeto", "Tipo", "Versão", "Status"],
        [
          d.title,
          projectName(d.projectId),
          d.type,
          d.version || "1.0",
          states[d.status || "draft"],
        ],
      ]);
    }
  }
  return (
    <div className="os-board-layout">
      <div className="os-board-main">
        <div className="os-portfolio-toolbar">
          <p className="os-muted">
            Centralize, organize e acompanhe os documentos dos seus projetos.
          </p>
          <div className="os-action-row">
            <button
              className="os-button primary"
              disabled={!projects.length}
              onClick={() => {
                setCreating(true);
                setUpload(false);
                setError("");
              }}
            >
              <Plus size={16} />
              Novo documento
            </button>
            <button
              className="os-button"
              disabled={!projects.length}
              onClick={() => {
                setCreating(true);
                setUpload(true);
                setError("");
              }}
            >
              <Upload size={16} />
              Upload
            </button>
          </div>
        </div>
        <div className="os-folders">
          {categories.map((c, i) => (
            <button
              key={c}
              className={category === c ? "chosen" : ""}
              onClick={() => {
                setCategory(c);
                reset();
              }}
            >
              <Folder
                size={27}
                color={
                  [
                    "#08abd1",
                    "#efb900",
                    "#2c83f8",
                    "#9056ed",
                    "#2abd80",
                    "#ff883e",
                  ][i]
                }
              />
              <strong>{c}</strong>
              <small>
                {
                  docs.filter(
                    (d) =>
                      i === 0 ||
                      (d.category || "Qualidade e Regulatório") === c,
                  ).length
                }{" "}
                arquivos
              </small>
            </button>
          ))}
        </div>
        <section className="os-section os-document-board">
          <div className="os-filters">
            <label>
              Projeto
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  reset();
                }}
              >
                <option value="">Todos os projetos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  reset();
                }}
              >
                <option value="">Todos os tipos</option>
                {[...new Set(docs.map((d) => d.type))].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Módulo
              <select
                value={moduleId}
                onChange={(e) => {
                  setModuleId(e.target.value);
                  reset();
                }}
              >
                <option value="">Todos os módulos</option>
                {modules
                  .filter((m) =>
                    projects.some((p) => p.moduleIds.includes(m.id)),
                  )
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  reset();
                }}
              >
                <option value="">Todos os status</option>
                {Object.entries(states).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Responsável
              <select
                value={owner}
                onChange={(e) => {
                  setOwner(e.target.value);
                  reset();
                }}
              >
                <option value="">Todos</option>
                {database.users
                  .filter((u) => docs.some((d) => d.createdBy === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Data
              <input
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  reset();
                }}
              />
            </label>
            <button
              className="os-link"
              onClick={() => {
                setQuery("");
                setProjectId("");
                setType("");
                setModuleId("");
                setStatus("");
                setOwner("");
                setMonth("");
                setCategory(categories[0]);
                reset();
              }}
            >
              Limpar filtros
            </button>
          </div>
          <div className="os-board-toolbar">
            <label className="os-board-search">
              <Search size={16} />
              <input
                aria-label="Buscar documentos"
                placeholder="Buscar documentos por nome…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  reset();
                }}
              />
            </label>
            <select
              aria-label="Agrupar documentos"
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                setCollapsed([]);
              }}
            >
              <option value="project">Por projeto</option>
              <option value="category">Por pasta</option>
              <option value="none">Sem agrupamento</option>
            </select>
            <select
              aria-label="Ordenar documentos"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Mais recentes</option>
              <option value="name">Nome A–Z</option>
            </select>
            <button
              className="os-button"
              onClick={() =>
                exportCsv("documentos.csv", [
                  [
                    "Documento",
                    "Projeto",
                    "Tipo",
                    "Versão",
                    "Responsável",
                    "Status",
                  ],
                  ...filtered
                    .filter((d) => !selected.length || selected.includes(d.id))
                    .map((d) => [
                      d.title,
                      projectName(d.projectId),
                      d.type,
                      d.version || "1.0",
                      userName(database, d.createdBy),
                      states[d.status || "draft"],
                    ]),
                ])
              }
            >
              <Download size={15} />
              Exportar {selected.length ? `(${selected.length})` : ""}
            </button>
            {selected.length > 0 && (
              <button className="os-link" onClick={() => setSelected([])}>
                Limpar seleção
              </button>
            )}
          </div>
          {!filtered.length ? (
            <Empty />
          ) : (
            groups.map((g, i) => (
              <div className="os-board-group" key={g}>
                <button
                  className={`os-group-title group-${i % 3}`}
                  aria-expanded={!collapsed.includes(g)}
                  onClick={() =>
                    setCollapsed((c) =>
                      c.includes(g) ? c.filter((x) => x !== g) : [...c, g],
                    )
                  }
                >
                  {collapsed.includes(g) ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}{" "}
                  {group === "project" ? projectName(g) : g}{" "}
                  <small>
                    {visible.filter((d) => groupKey(d) === g).length}
                  </small>
                </button>
                {!collapsed.includes(g) && (
                  <div className="os-table-scroll">
                    <table className="os-table os-sheet-table">
                      <thead>
                        <tr>
                          <th>
                            <input
                              type="checkbox"
                              aria-label={`Selecionar documentos de ${g}`}
                              checked={visible
                                .filter((d) => groupKey(d) === g)
                                .every((d) => selected.includes(d.id))}
                              onChange={(e) => {
                                const groupIds = visible
                                  .filter((d) => groupKey(d) === g)
                                  .map((d) => d.id);
                                setSelected(
                                  e.target.checked
                                    ? [...new Set([...selected, ...groupIds])]
                                    : selected.filter(
                                        (id) => !groupIds.includes(id),
                                      ),
                                );
                              }}
                            />
                          </th>
                          <th>Documento</th>
                          <th>Projeto</th>
                          <th>Tipo</th>
                          <th>Versão</th>
                          <th>Responsável</th>
                          <th>Atualização</th>
                          <th>Status</th>
                          <th>Aprovação</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible
                          .filter((d) => groupKey(d) === g)
                          .map((d) => (
                            <tr
                              key={d.id}
                              className={
                                selected.includes(d.id) ? "selected-row" : ""
                              }
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  aria-label={`Selecionar ${d.title}`}
                                  checked={selected.includes(d.id)}
                                  onChange={(e) =>
                                    setSelected(
                                      e.target.checked
                                        ? [...selected, d.id]
                                        : selected.filter((id) => id !== d.id),
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <button
                                  className="os-document-name"
                                  onClick={() => {
                                    setEditing(d);
                                    setError("");
                                  }}
                                >
                                  <span
                                    className={`os-file-icon file-${d.type.toLowerCase()}`}
                                  >
                                    <FileText size={17} />
                                  </span>
                                  <span>
                                    <strong>{d.title}</strong>
                                    <small>
                                      {d.category || "Qualidade e Regulatório"}
                                    </small>
                                  </span>
                                </button>
                              </td>
                              <td>
                                <button
                                  className="os-link"
                                  onClick={() =>
                                    navigate(`/app/projects/${d.projectId}`)
                                  }
                                >
                                  {projectName(d.projectId)}
                                </button>
                              </td>
                              <td>
                                <span className="os-badge">{d.type}</span>
                              </td>
                              <td>v{d.version || "1.0"}</td>
                              <td>{userName(database, d.createdBy)}</td>
                              <td>{formatDate(d.updatedAt || d.createdAt)}</td>
                              <td>
                                <span
                                  className={`os-status-pill status-${d.status || "draft"}`}
                                >
                                  {states[d.status || "draft"]}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`os-status-pill status-${d.approvalStatus === "approved" ? "approved" : "review"}`}
                                >
                                  {
                                    approvalLabels[
                                      d.approvalStatus || "pending"
                                    ]
                                  }
                                </span>
                              </td>
                              <td>
                                <button
                                  className="os-icon-button"
                                  title={
                                    d.fileData
                                      ? "Baixar arquivo"
                                      : d.url
                                        ? "Abrir link"
                                        : "Exportar registro"
                                  }
                                  aria-label={`Baixar ou exportar ${d.title}`}
                                  onClick={() => download(d)}
                                >
                                  <Download size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
          <footer className="os-pagination">
            <small>
              {filtered.length} documentos · página {currentPage} de {pages}
            </small>
            <div>
              <button
                className="os-button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Anterior
              </button>
              <button
                className="os-button"
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Próxima
              </button>
            </div>
          </footer>
        </section>
      </div>
      <aside className="os-rail">
        <RecentActivity {...props} />
        <section className="os-section">
          <h2>Documento em destaque</h2>
          {featured ? (
            <>
              <div className="os-document-preview">
                <FileText size={54} />
                <span>{featured.type}</span>
              </div>
              <h3>{featured.title}</h3>
              <p className="os-muted">
                {projectName(featured.projectId)} · v{featured.version || "1.0"}
              </p>
              <p className="os-muted">
                {featured.fileData
                  ? "Arquivo salvo neste navegador"
                  : featured.url
                    ? "Documento externo"
                    : "Registro sem arquivo anexado"}
              </p>
              <button
                className="os-button primary"
                onClick={() => setEditing(featured)}
              >
                Abrir documento
              </button>
            </>
          ) : (
            <Empty text="Sem documentos" />
          )}
        </section>
      </aside>
      {(creating || editing) && (
        <Modal
          title={
            editing
              ? "Detalhes do documento"
              : upload
                ? "Enviar arquivo"
                : "Novo documento"
          }
          close={() => {
            setCreating(false);
            setEditing(null);
          }}
        >
          <DocumentForm
            key={editing?.id || "new"}
            projects={projects}
            database={database}
            editing={editing}
            upload={upload}
            error={error}
            setError={setError}
            save={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const file = data.get("file") as File | null;
              const url = String(data.get("url") || "").trim();
              if (url) {
                try {
                  if (!["https:", "http:"].includes(new URL(url).protocol))
                    throw Error();
                } catch {
                  setError("Informe um link http ou https válido.");
                  return;
                }
              }
              let fileData = editing?.fileData;
              if (file?.size) {
                if (file.size > 2 * 1024 * 1024) {
                  setError(
                    "O limite local é de 2 MB por arquivo. Para arquivos maiores, registre um link.",
                  );
                  return;
                }
                try {
                  fileData = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result));
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });
                } catch {
                  setError("Não foi possível ler o arquivo.");
                  return;
                }
              }
              if (upload && !file?.size && !editing) {
                setError("Selecione um arquivo.");
                return;
              }
              const details = {
                title: String(data.get("title")).trim(),
                category: String(data.get("category")),
                moduleId: String(data.get("module")) || undefined,
                type: String(data.get("type")),
                version: String(data.get("version")),
                status: String(data.get("status")) as Attachment["status"],
                approvalStatus: String(
                  data.get("approval"),
                ) as Attachment["approvalStatus"],
                createdBy: String(data.get("owner")),
                fileData,
                fileName: file?.size ? file.name : editing?.fileName,
                mimeType: file?.size ? file.type : editing?.mimeType,
                size: file?.size || editing?.size,
                url: url || undefined,
              };
              const ok = editing
                ? actions.updateDocument(editing.id, details)
                : actions.addDocument(
                    String(data.get("project")),
                    details.title,
                    details.url,
                    details,
                  );
              if (ok) {
                setCreating(false);
                setEditing(null);
              } else
                setError(
                  "Não foi possível salvar. O armazenamento local pode estar cheio.",
                );
            }}
          />
          {editing && (
            <div className="os-action-row">
              <button className="os-button" onClick={() => download(editing)}>
                <Download size={16} />
                {editing.fileData
                  ? "Baixar arquivo"
                  : editing.url
                    ? "Abrir link"
                    : "Exportar registro"}
              </button>
              {editing.url && (
                <a
                  className="os-button"
                  href={editing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={15} />
                  Link externo
                </a>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
function DocumentForm({
  projects,
  database,
  editing,
  upload,
  error,
  setError,
  save,
}: {
  projects: PageProps["projects"];
  database: PageProps["database"];
  editing: Attachment | null;
  upload: boolean;
  error: string;
  setError: (s: string) => void;
  save: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="os-record-form" onSubmit={save}>
      <label>
        Nome do documento
        <input
          name="title"
          required
          maxLength={180}
          defaultValue={editing?.title}
          placeholder="Ex.: Briefing técnico.pdf"
        />
      </label>
      <label>
        Projeto
        <select
          name="project"
          defaultValue={editing?.projectId}
          disabled={!!editing}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Pasta
        <select
          name="category"
          defaultValue={editing?.category || categories[1]}
        >
          {categories.slice(1).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Módulo
        <select name="module" defaultValue={editing?.moduleId || ""}>
          <option value="">Sem módulo</option>
          {modules
            .filter((m) => projects.some((p) => p.moduleIds.includes(m.id)))
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Tipo
        <select name="type" defaultValue={editing?.type || "PDF"}>
          {[
            ...new Set([
              "PDF",
              "DOCX",
              "XLSX",
              "PPTX",
              "Link",
              "Registro",
              editing?.type || "PDF",
            ]),
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <div className="os-date-pair">
        <label>
          Versão
          <input
            name="version"
            required
            defaultValue={editing?.version || "1.0"}
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={editing?.status || "draft"}>
            {Object.entries(states).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Aprovação
        <select
          name="approval"
          defaultValue={editing?.approvalStatus || "pending"}
        >
          {Object.entries(approvalLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Responsável
        <select name="owner" defaultValue={editing?.createdBy || "mariana"}>
          {database.users
            .filter((u) =>
              projects.some(
                (p) => p.memberIds.includes(u.id) || p.ownerId === u.id,
              ),
            )
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Link externo
        <input name="url" defaultValue={editing?.url} placeholder="https://…" />
      </label>
      <label>
        {editing
          ? "Substituir arquivo"
          : "Arquivo (até 2 MB, salvo neste navegador)"}
        <input
          name="file"
          type="file"
          required={upload && !editing}
          onChange={() => setError("")}
        />
      </label>
      {error && (
        <p role="alert" className="os-validation">
          {error}
        </p>
      )}
      <button className="os-button primary">
        {editing ? "Salvar alterações" : "Salvar documento"}
      </button>
    </form>
  );
}
