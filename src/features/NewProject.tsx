import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { modules, templates } from "../domain/catalog";
import type { Database, Project, Task, Workspace } from "../domain/model";

export function NewProject({
  database,
  workspace,
  create,
  navigate,
}: {
  database: Database;
  workspace: Workspace;
  create: (
    input: Omit<Project, "id" | "createdAt">,
    tasks: Pick<Task, "title" | "stageId" | "priority">[],
    customStages?: string[],
  ) => string;
  navigate: (path: string) => void;
}) {
  const [kind, setKind] = useState<Project["kind"]>(
    workspace.moduleIds.length ? "symco" : "independent",
  );
  const [templateId, setTemplateId] = useState(
    workspace.moduleIds.length ? "product" : "blank",
  );
  const [form, setForm] = useState({
    name: "",
    description: "",
    clientId: "",
    ownerId: "mariana",
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    methodologyId: workspace.id === "personal" ? "simple" : "symco-food",
    moduleIds: workspace.moduleIds.includes("product")
      ? ["product", "quality"]
      : ([] as string[]),
    memberIds: ["mariana"] as string[],
  });
  const [error, setError] = useState("");
  const [customStages, setCustomStages] = useState("");
  const selected = templates.find((item) => item.id === templateId)!;
  const choose = (id: string) => {
    const template = templates.find((item) => item.id === id)!;
    setTemplateId(id);
    setForm((current) => ({
      ...current,
      methodologyId:
        kind === "independent"
          ? "simple"
          : template.methodologyId || "symco-food",
      moduleIds:
        kind === "independent"
          ? []
          : template.moduleIds.filter((moduleId) =>
              workspace.moduleIds.includes(moduleId),
            ),
    }));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Informe o nome do projeto.");
    if (!form.dueDate || form.dueDate < form.startDate)
      return setError("Defina um prazo igual ou posterior à data inicial.");
    if (!form.ownerId) return setError("Escolha um responsável.");
    const method = database.methodologies.find(
      (item) => item.id === form.methodologyId,
    );
    const stages = customStages
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const projectId = create(
      {
        workspaceId: workspace.id,
        kind,
        name: form.name.trim(),
        description: form.description.trim(),
        clientId: form.clientId || undefined,
        ownerId: form.ownerId,
        memberIds: [...new Set([...form.memberIds, form.ownerId])],
        methodologyId: form.methodologyId || undefined,
        moduleIds: form.moduleIds,
        status: "planning",
        health: "on_track",
        currentStageId: method?.stages[0]?.id,
        startDate: form.startDate,
        dueDate: form.dueDate,
        tags: [],
      },
      selected.tasks.map((task) => ({
        ...task,
        stageId: method?.stages.some((stage) => stage.id === task.stageId)
          ? task.stageId
          : method?.stages[0]?.id,
      })),
      stages,
    );
    navigate(`/app/projects/${projectId}`);
  };
  return (
    <form onSubmit={submit} className="os-new-project">
      <div className="os-new-main">
        <section className="os-section">
          <h2>Qual tipo de projeto?</h2>
          <div className="os-choice-grid">
            {(
              [
                {
                  id: "symco",
                  title: "Projeto Symco",
                  description: "Use as metodologias e módulos do ecossistema.",
                },
                {
                  id: "independent",
                  title: "Projeto independente",
                  description: "Planeje com as ferramentas centrais do SymOS.",
                },
              ] as const
            ).map((item) => (
              <button
                type="button"
                key={item.id}
                className={kind === item.id ? "chosen" : ""}
                onClick={() => {
                  setKind(item.id);
                  setForm((current) => ({
                    ...current,
                    moduleIds:
                      item.id === "independent" ? [] : selected.moduleIds,
                    methodologyId:
                      item.id === "independent" ? "simple" : "symco-food",
                  }));
                }}
              >
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="os-section">
          <h2>Escolha um ponto de partida</h2>
          <p className="os-muted">
            Um template sugere etapas, módulos e tarefas iniciais.
          </p>
          <div className="os-template-grid">
            {templates.map((item) => (
              <button
                type="button"
                key={item.id}
                className={templateId === item.id ? "chosen" : ""}
                onClick={() => choose(item.id)}
              >
                <span className="os-template-icon">✦</span>
                <strong>{item.name}</strong>
                <small>{item.description}</small>
                {templateId === item.id && <CheckCircle2 size={17} />}
              </button>
            ))}
          </div>
        </section>
      </div>
      <aside className="os-section os-project-form">
        <h2>Configure o projeto</h2>
        <p className="os-muted">Os dados são salvos neste navegador.</p>
        <label>
          Nome do projeto *
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ex.: Nova linha de produtos"
          />
        </label>
        <label>
          Descrição
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="O que este projeto entregará?"
          />
        </label>
        <label>
          Cliente
          <select
            value={form.clientId}
            onChange={(event) =>
              setForm({ ...form, clientId: event.target.value })
            }
          >
            <option value="">Sem cliente</option>
            {database.clients
              .filter((item) => item.workspaceId === workspace.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Responsável
          <select
            value={form.ownerId}
            onChange={(event) =>
              setForm({ ...form, ownerId: event.target.value })
            }
          >
            {database.users
              .filter((item) => workspace.memberIds.includes(item.id))
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Membros adicionais
          <select
            value=""
            onChange={(event) => {
              if (event.target.value)
                setForm((current) => ({
                  ...current,
                  memberIds: [
                    ...new Set([...current.memberIds, event.target.value]),
                  ],
                }));
            }}
          >
            <option value="">Adicionar membro</option>
            {database.users
              .filter(
                (item) =>
                  workspace.memberIds.includes(item.id) &&
                  !form.memberIds.includes(item.id),
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <small>
          {form.memberIds
            .map((id) => database.users.find((user) => user.id === id)?.name)
            .join(", ")}
        </small>
        <label>
          Metodologia
          <select
            value={form.methodologyId}
            onChange={(event) =>
              setForm({ ...form, methodologyId: event.target.value })
            }
          >
            {database.methodologies
              .filter(
                (item) =>
                  item.workspaceId === workspace.id || item.id === "simple",
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Etapas personalizadas (opcional, separadas por vírgula)
          <input
            value={customStages}
            onChange={(event) => setCustomStages(event.target.value)}
            placeholder="Planejar, Executar, Revisar"
          />
        </label>
        <div className="os-date-pair">
          <label>
            Início
            <input
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm({ ...form, startDate: event.target.value })
              }
            />
          </label>
          <label>
            Prazo *
            <input
              type="date"
              value={form.dueDate}
              min={form.startDate}
              onChange={(event) =>
                setForm({ ...form, dueDate: event.target.value })
              }
            />
          </label>
        </div>
        {kind === "symco" && (
          <fieldset>
            <legend>Módulos</legend>
            {modules
              .filter((item) => workspace.moduleIds.includes(item.id))
              .map((item) => (
                <label className="os-check" key={item.id}>
                  <input
                    type="checkbox"
                    checked={form.moduleIds.includes(item.id)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        moduleIds: event.target.checked
                          ? [...current.moduleIds, item.id]
                          : current.moduleIds.filter((id) => id !== item.id),
                      }))
                    }
                  />
                  {item.name}
                </label>
              ))}
          </fieldset>
        )}
        {error && (
          <p className="os-validation" role="alert">
            {error}
          </p>
        )}
        <button className="os-button primary" type="submit">
          Criar projeto
        </button>
      </aside>
    </form>
  );
}
