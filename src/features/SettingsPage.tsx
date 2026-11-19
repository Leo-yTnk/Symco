import { SegmentedControl, StatusSwitch } from "../components/os/controls";
import { useState } from "react";
import { modules } from "../domain/catalog";
import { type PageProps, Empty } from "./workspaceUi";
import { type usePreferences } from "../application/usePreferences";
import { PreferencesPage, preferencesSafePath } from "./PreferencesPage";

export const settingsPath = "/app/settings";
const tabs = {
  general: "Geral",
  preferences: "Preferências",
  members: "Equipe e membros",
  clients: "Clientes",
  modules: "Módulos",
  methodologies: "Metodologias",
};
type SettingsSection = keyof typeof tabs;

export function settingsSection(path: string): SettingsSection | undefined {
  if (path === settingsPath) return "general";
  if (path === preferencesSafePath) return "preferences";
  return (Object.keys(tabs) as SettingsSection[]).find(
    (option) => path === `${settingsPath}/${option}`,
  );
}
export function SettingsPage({
  database,
  workspaceId,
  actions,
  projects,
  navigate,
  tab,
  safeMode,
  personalPreferences,
}: PageProps & {
  tab: SettingsSection;
  safeMode: boolean;
  personalPreferences: ReturnType<typeof usePreferences>;
}) {
  const workspace = database.workspaces.find((w) => w.id === workspaceId)!;
  const [message, setMessage] = useState("");
  return (
    <>
      <SegmentedControl
        wide
        wrap
        options={tabs}
        label="Configurações"
        value={tab}
        onChange={(option) => {
          if (option === tab) return;
          navigate(
            option === "general" ? settingsPath : `${settingsPath}/${option}`,
          );
          setMessage("");
        }}
      />
      <div className="os-settings-grid">
        {tab === "preferences" ? (
          <PreferencesPage {...personalPreferences} safeMode={safeMode} />
        ) : tab === "general" ? (
          <>
            <section className="os-section">
              <h2>Informações do workspace</h2>
              <form
                className="os-record-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  setMessage(
                    actions.updateWorkspace(workspaceId, {
                      name: String(f.get("name")).trim(),
                    })
                      ? "Configurações salvas."
                      : "Não foi possível salvar.",
                  );
                }}
              >
                <label>
                  Nome do workspace
                  <input name="name" required defaultValue={workspace.name} />
                </label>
                <p className="os-muted">ID: {workspace.id}</p>
                <button className="os-button primary">Salvar alterações</button>
              </form>
              <h2>Membros da equipe</h2>
              <div className="os-records">
                {database.users
                  .filter((u) => workspace.memberIds.includes(u.id))
                  .map((u) => (
                    <div key={u.id}>
                      <strong>{u.name}</strong>
                      <small>{u.email}</small>
                    </div>
                  ))}
              </div>
            </section>
            <section className="os-section">
              <h2>Módulos do workspace</h2>
              <ModuleSettings {...{ workspace, actions }} />
              <h2>Dados e privacidade</h2>
              <p className="os-muted">
                Projetos, arquivos e configurações são salvos neste navegador.
                Esta versão não oferece autenticação, compartilhamento entre
                dispositivos ou permissões de servidor.
              </p>
            </section>
          </>
        ) : tab === "members" ? (
          <section className="os-section">
            <h2>Equipe e membros</h2>
            <div className="os-table-scroll">
              <table className="os-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Projetos</th>
                    <th>Papel nos projetos</th>
                  </tr>
                </thead>
                <tbody>
                  {database.users
                    .filter((u) => workspace.memberIds.includes(u.id))
                    .map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          {
                            projects.filter((p) => p.memberIds.includes(u.id))
                              .length
                          }
                        </td>
                        <td>
                          {[
                            ...new Set(
                              database.members
                                .filter(
                                  (m) =>
                                    projects.some(
                                      (p) => p.id === m.projectId,
                                    ) && m.userId === u.id,
                                )
                                .map((m) => m.role),
                            ),
                          ].join(", ") || "Membro"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="os-muted">
              Convites e controle de acesso aguardam integração com o servidor.
            </p>
          </section>
        ) : tab === "clients" ? (
          <section className="os-section">
            <h2>Clientes</h2>
            <div className="os-records">
              {database.clients
                .filter((c) => c.workspaceId === workspaceId)
                .map((c) => (
                  <div key={c.id}>
                    <strong>{c.name}</strong>
                    <small>
                      {c.contact || "Sem contato"} ·{" "}
                      {projects.filter((p) => p.clientId === c.id).length}{" "}
                      projetos
                    </small>
                  </div>
                ))}
            </div>
            <form
              className="os-record-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                actions.addClient(
                  workspaceId,
                  String(f.get("name")).trim(),
                  String(f.get("contact")).trim(),
                );
              }}
            >
              <label>
                Nome do cliente
                <input name="name" required />
              </label>
              <label>
                Contato
                <input name="contact" />
              </label>
              <button className="os-button primary">Adicionar cliente</button>
            </form>
          </section>
        ) : tab === "modules" ? (
          <section className="os-section">
            <h2>Módulos disponíveis</h2>
            <ModuleSettings {...{ workspace, actions }} />
          </section>
        ) : (
          <section className="os-section">
            <h2>Metodologias do workspace</h2>
            {database.methodologies.filter((m) => m.workspaceId === workspaceId)
              .length ? (
              database.methodologies
                .filter((m) => m.workspaceId === workspaceId)
                .map((m) => (
                  <div key={m.id}>
                    <h3>{m.name}</h3>
                    <div className="os-stage-track">
                      {m.stages.map((s) => (
                        <div key={s.id}>
                          <span>{s.order + 1}</span>
                          <strong>{s.name}</strong>
                          <small>{s.description}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            ) : (
              <Empty text="Sem metodologias" />
            )}
            <p className="os-muted">
              Crie etapas próprias no fluxo de novo projeto.
            </p>
          </section>
        )}
      </div>
      {message && tab === "general" && (
        <p role="status" className="os-save-message">
          {message}
        </p>
      )}
    </>
  );
}
function ModuleSettings({
  workspace,
  actions,
}: {
  workspace: PageProps["database"]["workspaces"][number];
  actions: PageProps["actions"];
}) {
  return (
    <div className="os-module-settings">
      {modules.map((m) => (
        <div key={m.id}>
          <span>
            <strong>{m.name}</strong>
            <small>{m.description}</small>
          </span>
          <StatusSwitch
            checked={workspace.moduleIds.includes(m.id)}
            label={`Ativar ${m.name}`}
            onChange={() =>
              actions.updateWorkspace(workspace.id, {
                moduleIds: workspace.moduleIds.includes(m.id)
                  ? workspace.moduleIds.filter((id) => id !== m.id)
                  : [...workspace.moduleIds, m.id],
              })
            }
          />
        </div>
      ))}
    </div>
  );
}
